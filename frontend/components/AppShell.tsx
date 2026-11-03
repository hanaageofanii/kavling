"use client";
import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS: Record<string, string> = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  map: "M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  bank: "M3 10l9-6 9 6M5 10v8M10 10v8M14 10v8M19 10v8M3 21h18",
  box: "M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  build: "M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6",
  swap: "M7 7h13l-3-3M17 17H4l3 3",
  key: "M14 10a4 4 0 1 1-3 6.7L4 17v-3l7-1 1-1a4 4 0 0 1 2-2zM17 7h.01",
  out: "M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h10",
  menu: "M4 6h16M4 12h16M4 18h16",
};

function Icon({ name }: { name: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: "home" },
  { label: "Siteplan", icon: "map" },
  { label: "SPPR", icon: "doc" },
  { label: "KPR & Pajak", icon: "bank" },
  { label: "Stok", icon: "box" },
  { label: "Legalitas", icon: "shield" },
  { label: "Progres bangunan", icon: "build" },
] as { label: string; href?: string; icon: string }[];

export default function AppShell({
  company,
  user,
  onChangeCompany,
  onChangePassword,
  onLogout,
  children,
}: {
  company: string;
  user: string;
  onChangeCompany: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="app">
      {open && <div className="app-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="sb-brand">
          <span className="sb-logo">A</span>
          <div>
            <strong>AMIN GROUP</strong>
            <small>Manajemen Kavling</small>
          </div>
        </div>

        <nav className="sb-nav" aria-label="Menu utama">
          {NAV.map((n) =>
            n.href ? (
              <Link key={n.label} href={n.href}
                className={`sb-item${path === n.href ? " active" : ""}`}
                onClick={() => setOpen(false)}>
                <Icon name={n.icon} />
                {n.label}
              </Link>
            ) : (
              <span key={n.label} className="sb-item disabled" aria-disabled="true">
                <Icon name={n.icon} />
                {n.label}
                <em>Segera</em>
              </span>
            )
          )}
        </nav>

        <div className="sb-foot">
          <button className="sb-item" onClick={onChangeCompany}><Icon name="swap" />Ganti PT</button>
          <button className="sb-item" onClick={onChangePassword}><Icon name="key" />Ganti password</button>
          <button className="sb-item" onClick={onLogout}><Icon name="out" />Keluar</button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setOpen(true)} aria-label="Buka menu">
            <Icon name="menu" />
          </button>
          <div className="who">
            <strong>{company}</strong>
            <small>{user}</small>
          </div>
          <span className="avatar" aria-hidden="true">{user.trim().charAt(0).toUpperCase()}</span>
        </header>
        {children}
      </div>
    </div>
  );
}