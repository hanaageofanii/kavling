"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { api, ROLE_LABEL } from "@/lib/api";

type Me = { name: string; email: string; company: string; role: string; password_days_left: number };

const STATS = [
  { key: "available", label: "Tersedia" },
  { key: "booking", label: "Booking" },
  { key: "bank", label: "Pengajuan bank" },
  { key: "sold", label: "Sold" },
];

const MODULES = [
  { title: "Siteplan", desc: "Siteplan interaktif dengan status kavling realtime" },
  { title: "SPPR", desc: "SPPR, pembatalan, dan metode pembayaran" },
  { title: "KPR & Legalitas", desc: "KPR, pajak, stok, dan legalitas" },
  { title: "Progres bangunan", desc: "Progres pembangunan per blok dan unit" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    api("/api/me").then((r) => {
      if (r.ok) setMe(r.data);
      else if (r.status === 403 && r.data.next) router.push(r.data.next);
      else router.push("/login");
    });
  }, [router]);

  async function logout() {
    await api("/api/logout", {});
    router.push("/login");
  }

  if (!me) return <p className="page hint">Memuat...</p>;

  return (
    <AppShell
      company={me.company}
      user={`${me.name}, ${ROLE_LABEL[me.role] ?? me.role}`}
      onChangeCompany={() => router.push("/select-company?dari=dashboard")}
      onChangePassword={() => router.push("/change-password")}
      onLogout={logout}
    >
      {me.password_days_left <= 7 && (
        <div className="banner" role="status">
          Password kedaluwarsa dalam {Math.max(me.password_days_left, 0)} hari.{" "}
          <a href="/change-password">Ganti sekarang</a>
        </div>
      )}

      <main className="page">
        <div className="page-head">
          <h1>Ringkasan penjualan</h1>
          <p className="lead">Angka di bawah terisi saat modul kavling dan SPPR selesai dibuat.</p>
        </div>

        <section className="stats" aria-label="Status kavling">
          {STATS.map((s) => (
            <div key={s.key} className={`stat ${s.key}`}>
              <div className="t"><i className="dot" />{s.label}</div>
              <div className="n">–</div>
            </div>
          ))}
        </section>

        <h2 className="section-title">Modul berikutnya</h2>
        <section className="modules">
          {MODULES.map((m, i) => (
            <div key={m.title} className="module">
              <span className="module-no">{i + 1}</span>
              <strong>{m.title}</strong>
              <p>{m.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </AppShell>
  );
}