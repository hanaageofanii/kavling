package main

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// dummyHash dipakai supaya waktu respons sama untuk email yang tidak ada.
var dummyHash, _ = bcrypt.GenerateFromPassword([]byte("dummy-password"), 12)

type company struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Role string `json:"role"`
}

func userCompanies(r *http.Request, uid int64) ([]company, error) {
	rows, err := db.Query(r.Context(), `
		SELECT c.id, c.name, uc.role::text
		FROM user_companies uc JOIN companies c ON c.id = uc.company_id
		WHERE uc.user_id=$1 AND c.is_active ORDER BY c.name`, uid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := []company{}
	for rows.Next() {
		var c company
		if err := rows.Scan(&c.ID, &c.Name, &c.Role); err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, nil
}

// finishLogin menerbitkan sesi lalu menentukan halaman tujuan berdasarkan jumlah PT.
func finishLogin(w http.ResponseWriter, r *http.Request, uid int64, tv int) {
	list, err := userCompanies(r, uid)
	if err != nil {
		fail(w, 500, "kesalahan server")
		return
	}
	switch len(list) {
	case 0:
		fail(w, 403, "akun ini belum punya akses ke PT mana pun, hubungi admin")
	case 1:
		issue(w, claims{UID: uid, CID: list[0].ID, Role: list[0].Role, TV: tv})
		writeJSON(w, 200, map[string]any{"next": "/dashboard"})
	default:
		issue(w, claims{UID: uid, TV: tv})
		writeJSON(w, 200, map[string]any{"next": "/select-company"})
	}
}

func login(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !decode(r, &in) {
		fail(w, 400, "permintaan tidak valid")
		return
	}
	email := strings.ToLower(strings.TrimSpace(in.Email))

	var (
		uid         int64
		hash        string
		tv, failed  int
		active, mc  bool
		changedAt   time.Time
		lockedUntil *time.Time
	)
	err := db.QueryRow(r.Context(), `
		SELECT id, password_hash, token_version, is_active, must_change, password_changed_at, failed_attempts, locked_until
		FROM users WHERE email=$1`, email).
		Scan(&uid, &hash, &tv, &active, &mc, &changedAt, &failed, &lockedUntil)
	if err != nil {
		bcrypt.CompareHashAndPassword(dummyHash, []byte(in.Password))
		fail(w, 401, "email atau password salah")
		return
	}
	if lockedUntil != nil && lockedUntil.After(time.Now()) {
		fail(w, 429, "akun dikunci sementara karena terlalu banyak percobaan")
		return
	}
	if !active || bcrypt.CompareHashAndPassword([]byte(hash), []byte(in.Password)) != nil {
		db.Exec(r.Context(), `
			UPDATE users SET
			  failed_attempts = CASE WHEN failed_attempts+1 >= $2 THEN 0 ELSE failed_attempts+1 END,
			  locked_until    = CASE WHEN failed_attempts+1 >= $2 THEN now() + $3::interval ELSE locked_until END
			WHERE id=$1`, uid, maxFailed, fmt.Sprintf("%d seconds", int(lockDuration.Seconds())))
		fail(w, 401, "email atau password salah")
		return
	}
	db.Exec(r.Context(), `UPDATE users SET failed_attempts=0, locked_until=NULL WHERE id=$1`, uid)

	if mc || time.Since(changedAt) > passwordMaxAge {
		issue(w, claims{UID: uid, TV: tv, MC: true})
		writeJSON(w, 200, map[string]any{"next": "/change-password"})
		return
	}
	finishLogin(w, r, uid, tv)
}

func logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{Name: "token", Value: "", Path: "/", HttpOnly: true, MaxAge: -1})
	writeJSON(w, 200, map[string]any{"ok": true})
}

func listCompanies(w http.ResponseWriter, r *http.Request) {
	list, err := userCompanies(r, sess(r).UID)
	if err != nil {
		fail(w, 500, "kesalahan server")
		return
	}
	writeJSON(w, 200, map[string]any{"companies": list})
}

func selectCompany(w http.ResponseWriter, r *http.Request) {
	var in struct {
		CompanyID int64 `json:"company_id"`
	}
	if !decode(r, &in) {
		fail(w, 400, "permintaan tidak valid")
		return
	}
	c := sess(r)
	var role string
	err := db.QueryRow(r.Context(), `
		SELECT uc.role::text FROM user_companies uc JOIN companies co ON co.id=uc.company_id
		WHERE uc.user_id=$1 AND uc.company_id=$2 AND co.is_active`, c.UID, in.CompanyID).Scan(&role)
	if err != nil {
		fail(w, 403, "tidak punya akses ke PT ini")
		return
	}
	issue(w, claims{UID: c.UID, CID: in.CompanyID, Role: role, TV: c.TV})
	writeJSON(w, 200, map[string]any{"next": "/dashboard"})
}

func me(w http.ResponseWriter, r *http.Request) {
	c := sess(r)
	if c.CID == 0 {
		writeJSON(w, 403, map[string]any{"error": "pilih PT dulu", "next": "/select-company"})
		return
	}
	var name, email, co string
	var changedAt time.Time
	err := db.QueryRow(r.Context(), `
		SELECT u.name, u.email, u.password_changed_at, co.name
		FROM users u, companies co WHERE u.id=$1 AND co.id=$2`, c.UID, c.CID).Scan(&name, &email, &changedAt, &co)
	if err != nil {
		fail(w, 500, "kesalahan server")
		return
	}
	daysLeft := int((passwordMaxAge - time.Since(changedAt)).Hours() / 24)
	writeJSON(w, 200, map[string]any{
		"name": name, "email": email, "company": co, "role": c.Role, "password_days_left": daysLeft,
	})
}

func changePassword(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Current  string `json:"current"`
		Password string `json:"password"`
	}
	if !decode(r, &in) {
		fail(w, 400, "permintaan tidak valid")
		return
	}
	c := sess(r)

	var cur string
	if db.QueryRow(r.Context(), `SELECT password_hash FROM users WHERE id=$1`, c.UID).Scan(&cur) != nil ||
		bcrypt.CompareHashAndPassword([]byte(cur), []byte(in.Current)) != nil {
		fail(w, 400, "Password saat ini salah.")
		return
	}
	if msg := validatePassword(in.Password); msg != "" {
		fail(w, 400, msg)
		return
	}
	if reusedPassword(r.Context(), c.UID, in.Password) {
		fail(w, 400, "Password baru tidak boleh sama dengan 5 password terakhir.")
		return
	}
	h, err := hashPassword(in.Password)
	if err != nil {
		fail(w, 500, "kesalahan server")
		return
	}
	var newTV int
	tx, err := db.Begin(r.Context())
	if err != nil {
		fail(w, 500, "kesalahan server")
		return
	}
	defer tx.Rollback(r.Context())
	err = tx.QueryRow(r.Context(), `
		UPDATE users SET password_hash=$2, password_changed_at=now(), must_change=false, token_version=token_version+1
		WHERE id=$1 RETURNING token_version`, c.UID, h).Scan(&newTV)
	if err == nil {
		_, err = tx.Exec(r.Context(), `INSERT INTO password_history (user_id,hash) VALUES ($1,$2)`, c.UID, h)
	}
	if err == nil {
		err = tx.Commit(r.Context())
	}
	if err != nil {
		fail(w, 500, "gagal menyimpan password")
		return
	}
	// sesi lain otomatis tercabut (token_version naik); sesi ini diterbitkan ulang
	finishLogin(w, r, c.UID, newTV)
}

func forgotPassword(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Email string `json:"email"`
	}
	decode(r, &in)
	email := strings.ToLower(strings.TrimSpace(in.Email))

	var uid int64
	if db.QueryRow(r.Context(), `SELECT id FROM users WHERE email=$1 AND is_active`, email).Scan(&uid) == nil {
		raw, hashed := randomToken()
		db.Exec(r.Context(), `DELETE FROM password_resets WHERE user_id=$1 AND used_at IS NULL`, uid)
		db.Exec(r.Context(), `INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1,$2,$3)`,
			uid, hashed, time.Now().Add(resetTokenValid))
		link := env("APP_URL", "http://localhost:3000") + "/reset-password?token=" + raw
		go sendMail(email, "Atur ulang password",
			"Klik link berikut untuk mengatur ulang password (berlaku 30 menit):\n\n"+link+
				"\n\nAbaikan email ini jika kamu tidak memintanya.")
	}
	// respons selalu sama supaya email terdaftar tidak bisa ditebak
	writeJSON(w, 200, map[string]any{"ok": true})
}

func resetPassword(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}
	if !decode(r, &in) {
		fail(w, 400, "permintaan tidak valid")
		return
	}
	var rid, uid int64
	err := db.QueryRow(r.Context(), `
		SELECT id, user_id FROM password_resets
		WHERE token_hash=$1 AND used_at IS NULL AND expires_at > now()`, sha(in.Token)).Scan(&rid, &uid)
	if err != nil {
		fail(w, 400, "Link tidak valid atau sudah kedaluwarsa.")
		return
	}
	if msg := validatePassword(in.Password); msg != "" {
		fail(w, 400, msg)
		return
	}
	if reusedPassword(r.Context(), uid, in.Password) {
		fail(w, 400, "Password baru tidak boleh sama dengan 5 password terakhir.")
		return
	}
	h, err := hashPassword(in.Password)
	if err != nil {
		fail(w, 500, "kesalahan server")
		return
	}
	tx, err := db.Begin(r.Context())
	if err != nil {
		fail(w, 500, "kesalahan server")
		return
	}
	defer tx.Rollback(r.Context())
	_, err = tx.Exec(r.Context(), `
		UPDATE users SET password_hash=$2, password_changed_at=now(), must_change=false,
		  failed_attempts=0, locked_until=NULL, token_version=token_version+1 WHERE id=$1`, uid, h)
	if err == nil {
		_, err = tx.Exec(r.Context(), `INSERT INTO password_history (user_id,hash) VALUES ($1,$2)`, uid, h)
	}
	if err == nil {
		_, err = tx.Exec(r.Context(), `UPDATE password_resets SET used_at=now() WHERE id=$1`, rid)
	}
	if err == nil {
		err = tx.Commit(r.Context())
	}
	if err != nil {
		fail(w, 500, "gagal menyimpan password")
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}
