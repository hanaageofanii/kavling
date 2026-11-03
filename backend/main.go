package main

import (
	"bufio"
	"context"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	db     *pgxpool.Pool
	secret []byte
)

// loadEnv membaca file .env sederhana (KEY=VALUE).
func loadEnv(path string) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		k, v, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		k = strings.TrimSpace(k)
		v = strings.Trim(strings.TrimSpace(v), `"'`)
		if os.Getenv(k) == "" {
			os.Setenv(k, v)
		}
	}
}

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func main() {
	loadEnv(".env")
	secret = []byte(os.Getenv("JWT_SECRET"))
	if len(secret) < 16 {
		log.Fatal("JWT_SECRET kosong atau terlalu pendek. Isi di backend/.env (minimal 16 karakter)")
	}

	ctx := context.Background()
	var err error
	db, err = pgxpool.New(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal("DATABASE_URL tidak valid: ", err)
	}
	if err = db.Ping(ctx); err != nil {
		log.Fatal("tidak bisa terhubung ke database: ", err)
	}
	seedAdmin(ctx)

	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/login", login)
	mux.HandleFunc("POST /api/logout", logout)
	mux.HandleFunc("POST /api/forgot-password", forgotPassword)
	mux.HandleFunc("POST /api/reset-password", resetPassword)

	mux.HandleFunc("POST /api/change-password", auth(true, changePassword)) // boleh saat password kedaluwarsa
	mux.HandleFunc("GET /api/companies", auth(false, listCompanies))
	mux.HandleFunc("POST /api/select-company", auth(false, selectCompany))
	mux.HandleFunc("GET /api/me", auth(false, me))

	log.Println("API jalan di http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
