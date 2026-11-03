"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const f = new FormData(e.currentTarget);
    const r = await api("/api/login", { email: f.get("email"), password: f.get("password") });
    setLoading(false);

    if (r.ok) router.push(r.data.next ?? "/dashboard");
    else if (r.status === 0) setError("Tidak bisa terhubung ke server. Pastikan backend Go sudah jalan.");
    else if (r.status === 429) setError("Terlalu banyak percobaan gagal. Akun dikunci 15 menit, coba lagi nanti.");
    else setError(r.data.error === "email atau password salah" ? "Email atau password salah." : r.data.error ?? "Gagal masuk.");
  }

  return (
    <AuthShell title="Masuk" lead="Gunakan akun yang diberikan admin.">
      <form onSubmit={onSubmit}>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" autoComplete="username" required className="input" />
        </label>
        <label className="field">
          <span>Password</span>
          <input name="password" type="password" autoComplete="current-password" required className="input" />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" disabled={loading}>{loading ? "Memproses..." : "Masuk"}</button>
        <p className="link-row"><Link href="/forgot-password">Lupa password?</Link></p>
      </form>
    </AuthShell>
  );
}
