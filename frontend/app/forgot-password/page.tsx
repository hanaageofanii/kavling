"use client";
import { useState } from "react";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const f = new FormData(e.currentTarget);
    await api("/api/forgot-password", { email: f.get("email") });
    setLoading(false);
    setSent(true);
  }

  return (
    <AuthShell title="Lupa password" lead="Masukkan email akunmu. Kami kirim link untuk mengatur ulang.">
      {sent ? (
        <div className="notice" role="status">
          Jika email terdaftar, link reset sudah dikirim. Link berlaku 30 menit.
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="nama@perusahaan.com"
              className="input"
            />
          </label>
          <button className="btn" disabled={loading}>
            {loading ? "Mengirim..." : "Kirim link reset"}
          </button>
        </form>
      )}
      <p className="link-row">
        <Link href="/login">← Kembali ke halaman masuk</Link>
      </p>
    </AuthShell>
  );
}