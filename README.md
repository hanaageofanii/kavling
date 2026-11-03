# Manajemen Kavling

Next.js (TypeScript) + Go + PostgreSQL. Tahap 1: login, lupa password, ganti password tiap 60 hari, pilih PT.

## Struktur
- backend/   API Go (port 8080)
- frontend/  Next.js (port 3000)
- db/migrations/  file SQL berurutan
- docs/siteplan/  taruh JPG/DWG siteplan di sini

## Cara menjalankan (Windows, CMD)

1. Buat database (sekali saja):
   psql -U postgres -c "CREATE DATABASE kavling;"
   psql -U postgres -d kavling -f db\migrations\001_init.sql

2. Backend:
   cd backend
   copy .env.example .env      (lalu edit .env: isi password postgres dan JWT_SECRET)
   go mod tidy
   go run .

3. Frontend (terminal baru):
   cd frontend
   npm install
   npm run dev

4. Buka http://localhost:3000
   Email: admin@kavling.local
   Password: Admin12345  (wajib diganti saat login pertama)

Link reset password saat development dicetak di terminal backend (karena SMTP belum diisi).
"# kavling" 
