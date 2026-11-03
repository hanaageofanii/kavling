package main

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	"os"
	"strings"
	"time"
	"unicode"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

const (
	passwordMaxAge  = 60 * 24 * time.Hour // wajib ganti tiap 60 hari
	historyDepth    = 5                   // password baru tidak boleh sama dengan 5 terakhir
	maxFailed       = 5
	lockDuration    = 15 * time.Minute
	resetTokenValid = 30 * time.Minute
	sessionDuration = 12 * time.Hour
)

type claims struct {
	UID  int64  `json:"uid"`
	CID  int64  `json:"cid"` // PT yang sedang dipilih, 0 = belum memilih
	Role string `json:"role"`
	MC   bool   `json:"mc"` // must change: password kedaluwarsa
	TV   int    `json:"tv"` // token_version
	jwt.RegisteredClaims
}

type ctxKey struct{}

func sess(r *http.Request) claims { return r.Context().Value(ctxKey{}).(claims) }

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func fail(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]any{"error": msg})
}

func issue(w http.ResponseWriter, c claims) {
	c.RegisteredClaims = jwt.RegisteredClaims{ExpiresAt: jwt.NewNumericDate(time.Now().Add(sessionDuration))}
	token, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, c).SignedString(secret)
	http.SetCookie(w, &http.Cookie{
		Name: "token", Value: token, Path: "/", HttpOnly: true,
		Secure:   os.Getenv("COOKIE_SECURE") == "true",
		SameSite: http.SameSiteLaxMode, MaxAge: int(sessionDuration.Seconds()),
	})
}

// auth memeriksa cookie, lalu memastikan akun masih aktif dan sesi belum dicabut.
func auth(allowMustChange bool, h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ck, err := r.Cookie("token")
		if err != nil {
			fail(w, 401, "belum login")
			return
		}
		var c claims
		t, err := jwt.ParseWithClaims(ck.Value, &c, func(*jwt.Token) (any, error) { return secret, nil },
			jwt.WithValidMethods([]string{"HS256"}))
		if err != nil || !t.Valid {
			fail(w, 401, "sesi tidak valid")
			return
		}
		var tv int
		var active bool
		err = db.QueryRow(r.Context(), `SELECT token_version, is_active FROM users WHERE id=$1`, c.UID).Scan(&tv, &active)
		if err != nil || !active || tv != c.TV {
			fail(w, 401, "sesi berakhir, silakan login lagi")
			return
		}
		if c.MC && !allowMustChange {
			writeJSON(w, 403, map[string]any{"error": "password kedaluwarsa", "next": "/change-password"})
			return
		}
		h(w, r.WithContext(context.WithValue(r.Context(), ctxKey{}, c)))
	}
}

func decode(r *http.Request, v any) bool {
	r.Body = http.MaxBytesReader(nil, r.Body, 1<<16)
	return json.NewDecoder(r.Body).Decode(v) == nil
}

func validatePassword(pw string) string {
	if len(pw) < 8 {
		return "Password minimal 8 karakter."
	}
	var letter, digit bool
	for _, ch := range pw {
		if unicode.IsLetter(ch) {
			letter = true
		}
		if unicode.IsDigit(ch) {
			digit = true
		}
	}
	if !letter || !digit {
		return "Password harus mengandung huruf dan angka."
	}
	return ""
}

// reusedPassword true kalau pw sama dengan password sekarang atau 5 password terakhir.
func reusedPassword(ctx context.Context, uid int64, pw string) bool {
	hashes := []string{}
	var cur string
	if db.QueryRow(ctx, `SELECT password_hash FROM users WHERE id=$1`, uid).Scan(&cur) == nil {
		hashes = append(hashes, cur)
	}
	rows, err := db.Query(ctx, `SELECT hash FROM password_history WHERE user_id=$1 ORDER BY id DESC LIMIT $2`, uid, historyDepth)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var h string
			if rows.Scan(&h) == nil {
				hashes = append(hashes, h)
			}
		}
	}
	for _, h := range hashes {
		if bcrypt.CompareHashAndPassword([]byte(h), []byte(pw)) == nil {
			return true
		}
	}
	return false
}

func hashPassword(pw string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(pw), 12)
	return string(b), err
}

func randomToken() (raw, hashed string) {
	b := make([]byte, 32)
	rand.Read(b)
	raw = hex.EncodeToString(b)
	sum := sha256.Sum256([]byte(raw))
	return raw, hex.EncodeToString(sum[:])
}

func sha(s string) string {
	sum := sha256.Sum256([]byte(s))
	return hex.EncodeToString(sum[:])
}

// sendMail memakai SMTP kalau dikonfigurasi; kalau tidak, isi email dicetak di terminal (mode development).
func sendMail(to, subject, body string) {
	host := os.Getenv("SMTP_HOST")
	if host == "" {
		log.Printf("[DEV] Email ke %s\nSubjek: %s\n%s\n", to, subject, body)
		return
	}
	from := env("SMTP_FROM", os.Getenv("SMTP_USER"))
	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s",
		from, to, subject, body)
	a := smtp.PlainAuth("", os.Getenv("SMTP_USER"), os.Getenv("SMTP_PASS"), host)
	if err := smtp.SendMail(host+":"+env("SMTP_PORT", "587"), a, from, []string{to}, []byte(msg)); err != nil {
		log.Println("gagal kirim email:", err)
	}
}

// seedAdmin membuat admin pertama dan memberinya akses ke semua PT.
func seedAdmin(ctx context.Context) {
	var n int
	if db.QueryRow(ctx, `SELECT count(*) FROM users`).Scan(&n) != nil || n > 0 {
		return
	}
	email := strings.ToLower(env("ADMIN_EMAIL", "admin@kavling.local"))
	pw := env("ADMIN_PASSWORD", "Admin12345")
	h, err := hashPassword(pw)
	if err != nil {
		log.Fatal(err)
	}
	var uid int64
	err = db.QueryRow(ctx, `INSERT INTO users (name,email,password_hash,must_change) VALUES ('Admin',$1,$2,true) RETURNING id`, email, h).Scan(&uid)
	if err != nil {
		log.Fatal("gagal membuat admin: ", err)
	}
	db.Exec(ctx, `INSERT INTO password_history (user_id,hash) VALUES ($1,$2)`, uid, h)
	db.Exec(ctx, `INSERT INTO user_companies (user_id,company_id,role) SELECT $1,id,'admin' FROM companies`, uid)
	log.Printf("Admin pertama dibuat: %s (password dari ADMIN_PASSWORD, wajib diganti saat login pertama)", email)
}
