"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { api } from "@/lib/api";

function Form() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const pw = String(f.get("password"));
    if (pw !== f.get("confirm")) return setError("Konfirmasi password tidak sama.");
    setError("");
    setLoading(true);
    const r = await api("/api/reset-password", { token, password: pw });
    setLoading(false);
    if (r.ok) router.push("/login");
    else setError(r.data.error ?? "Link tidak valid atau sudah kedaluwarsa.");
  }

  return (
    <form onSubmit={onSubmit}>
      <label className="field">
        <span>Password baru</span>
        <input name="password" type="password" autoComplete="new-password" required className="input" />
      </label>
      <label className="field">
        <span>Ulangi password baru</span>
        <input name="confirm" type="password" autoComplete="new-password" required className="input" />
      </label>
      <p className="hint">Minimal 8 karakter, berisi huruf dan angka.</p>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn" disabled={loading}>{loading ? "Menyimpan..." : "Simpan password"}</button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Atur ulang password"
      back={{ href: "/login", label: "Kembali ke halaman masuk" }}
    >
      <Suspense>
        <Form />
      </Suspense>
    </AuthShell>
  );
}