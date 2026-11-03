-- Jalankan: psql -U postgres -d kavling -f db\migrations\001_init.sql

CREATE TYPE user_role AS ENUM ('admin', 'stok', 'marketing', 'keuangan', 'legal', 'direksi');
CREATE TYPE lot_status AS ENUM ('available', 'booking', 'bank', 'sold');

CREATE TABLE companies (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id                  BIGSERIAL PRIMARY KEY,
  name                TEXT NOT NULL,
  email               TEXT NOT NULL UNIQUE,
  password_hash       TEXT NOT NULL,
  password_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  must_change         BOOLEAN NOT NULL DEFAULT false,  -- paksa ganti password di login berikutnya
  failed_attempts     INT NOT NULL DEFAULT 0,
  locked_until        TIMESTAMPTZ,
  token_version       INT NOT NULL DEFAULT 1,          -- dinaikkan untuk mencabut semua sesi
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_companies (
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role       user_role NOT NULL,
  PRIMARY KEY (user_id, company_id)
);

CREATE TABLE password_history (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hash       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE password_resets (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,   -- yang disimpan hash-nya, bukan token asli
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ
);


INSERT INTO companies (name) VALUES
  ('PT Agung Purnama Bakti'),
  ('PT Purnama Karya Bersama'),
  ('PT Langgeng Pertiwi Development');
