"use client";
import AppFrame from "@/components/AppFrame";

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
  return (
    <AppFrame>
      {() => (
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
      )}
    </AppFrame>
  );
}