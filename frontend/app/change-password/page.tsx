"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { api } from "@/lib/api";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const pw = String(f.get("password"));
    if (pw !== f.get("confirm")) return setError("Konfirmasi password tidak sama.");
    setError("");
    setLoading(true);
    const r = await api("/api/change-password", { current: f.get("current"), password: pw });
    setLoading(false);
    if (r.ok) router.push(r.data.next ?? "/dashboard");
    else if (r.status === 401) router.push("/login");
    else setError(r.data.error ?? "Gagal mengganti password.");
  }

  return (
    <AuthShell
      title="Ganti password"
      lead="Password harus diganti tiap 60 hari. Ganti sekarang untuk melanjutkan."
      back={{ href: "/dashboard", label: "Kembali ke dashboard" }}
    >
      <form onSubmit={onSubmit}>
        <label className="field">
          <span>Password saat ini</span>
          <input name="current" type="password" autoComplete="current-password" required className="input" />
        </label>
        <label className="field">
          <span>Password baru</span>
          <input name="password" type="password" autoComplete="new-password" required className="input" />
        </label>
        <label className="field">
          <span>Ulangi password baru</span>
          <input name="confirm" type="password" autoComplete="new-password" required className="input" />
        </label>
        <p className="hint">Minimal 8 karakter, berisi huruf dan angka, dan tidak sama dengan 5 password terakhir.</p>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" disabled={loading}>{loading ? "Menyimpan..." : "Simpan password"}</button>
      </form>
    </AuthShell>
  );
}