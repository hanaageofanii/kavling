"use client";
import { useCallback, useEffect, useState } from "react";
import AppFrame, { Me } from "@/components/AppFrame";
import Avatar from "@/components/Avatar";
import { api, ROLE_LABEL } from "@/lib/api";

type U = {
  id: number;
  name: string;
  email: string;
  role: string;
  photo_url?: string | null;
  has_signature: boolean;
};

function Users({ me }: { me: Me }) {
  const [list, setList] = useState<U[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api("/api/users").then((r) => {
      if (r.ok) setList(r.data.users ?? []);
      else setError(r.data.error ?? "Gagal memuat pengguna.");
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (me.role === "admin") load();
    else setLoading(false);
  }, [me.role, load]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setSaving(true);
    setError("");
    const r = await api("/api/users", {
      name: f.get("name"),
      email: f.get("email"),
      role: f.get("role"),
      password: f.get("password"),
    });
    setSaving(false);
    if (r.ok) {
      form.reset();
      load();
    } else setError(r.data.error ?? "Gagal menambah pengguna.");
  }

  if (me.role !== "admin") {
    return (
      <main className="page">
        <div className="notice">Halaman ini hanya untuk admin.</div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page-head">
        <h1>Manajemen pengguna</h1>
        <p className="lead">Tambah pengguna dan lihat kelengkapan foto serta tanda tangan.</p>
      </div>

      <section className="card">
        <h2 className="card-title">Tambah pengguna</h2>
        <form className="user-form" onSubmit={onSubmit}>
          <label className="field">
            <span>Nama</span>
            <input name="name" required className="input" />
          </label>
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" required className="input" />
          </label>
          <label className="field">
            <span>Peran</span>
            <select name="role" required className="input" defaultValue="">
              <option value="" disabled>Pilih peran</option>
              {Object.entries(ROLE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Password sementara</span>
            <input name="password" type="password" autoComplete="new-password" required minLength={8} className="input" />
          </label>
          <button className="btn auto" disabled={saving}>{saving ? "Menyimpan..." : "Tambah"}</button>
        </form>
        {error && <p className="error" role="alert">{error}</p>}
      </section>

      <section className="card table-card">
        {loading ? (
          <p className="hint" style={{ padding: 20 }}>Memuat...</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Pengguna</th>
                  <th>Peran</th>
                  <th>Foto</th>
                  <th>Tanda tangan</th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="u-cell">
                        <Avatar name={u.name} src={u.photo_url} size={36} />
                        <div>
                          <strong>{u.name}</strong>
                          <small>{u.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>{ROLE_LABEL[u.role] ?? u.role}</td>
                    <td><span className={`tag ${u.photo_url ? "yes" : "no"}`}>{u.photo_url ? "Ada" : "Belum"}</span></td>
                    <td><span className={`tag ${u.has_signature ? "yes" : "no"}`}>{u.has_signature ? "Ada" : "Belum"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default function UsersPage() {
  return <AppFrame>{(me) => <Users me={me} />}</AppFrame>;
}