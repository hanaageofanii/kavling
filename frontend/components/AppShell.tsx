"use client";
import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "@/components/Avatar";

const ICONS: Record<string, string> = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  map: "M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  bank: "M3 10l9-6 9 6M5 10v8M10 10v8M14 10v8M19 10v8M3 21h18",
  box: "M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  build: "M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6",
  tax: "M19 5L5 19M8 8h.01M16 16h.01",
  wallet: "M3 7h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l2-3h12v3M16 14h2",
  swap: "M7 7h13l-3-3M17 17H4l3 3",
  key: "M14 10a4 4 0 1 1-3 6.7L4 17v-3l7-1 1-1a4 4 0 0 1 2-2zM17 7h.01",
  out: "M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h10",
  menu: "M4 6h16M4 12h16M4 18h16",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  users: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.5M18 14.5a6 6 0 0 1 3 5.5",
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
  { label: "KPR", icon: "bank" },
  { label: "Legalitas", icon: "shield" },
  { label: "Pajak", icon: "tax" },
  { label: "Keuangan", icon: "wallet" },
  { label: "Stok", icon: "box" },
  { label: "Progres bangunan", icon: "build" },
  { label: "Pengguna", href: "/users", icon: "users", admin: true },
] as { label: string; href?: string; icon: string; admin?: boolean }[];

export default function AppShell({
  company,
  user,
  userName,
  photoUrl,
  isAdmin,
  onChangeCompany,
  onChangePassword,
  onLogout,
  children,
}: {
  company: string;
  user: string;
  userName: string;
  photoUrl?: string | null;
  isAdmin?: boolean;
  onChangeCompany: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // tutup dropdown saat klik di luar atau tekan Escape
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  function run(fn: () => void) {
    setMenu(false);
    setOpen(false);
    fn();
  }

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
          <div className="sb-label">Menu</div>
          {NAV.filter((n) => !n.admin).map((n) =>
            n.href ? (
              <Link key={n.label} href={n.href}
                className={`sb-item${path === n.href ? " active" : ""}`}
                onClick={() => setOpen(false)}>
                <Icon name={n.icon} />
                <span className="sb-text">{n.label}</span>
              </Link>
            ) : (
              <span key={n.label} className="sb-item disabled" aria-disabled="true" title="Segera hadir">
                <Icon name={n.icon} />
                <span className="sb-text">{n.label}</span>
                <em>Segera</em>
              </span>
            )
          )}

          {isAdmin && (
            <>
              <div className="sb-label">Admin</div>
              {NAV.filter((n) => n.admin).map((n) => (
                <Link key={n.label} href={n.href!}
                  className={`sb-item${path === n.href ? " active" : ""}`}
                  onClick={() => setOpen(false)}>
                  <Icon name={n.icon} />
                  <span className="sb-text">{n.label}</span>
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="sb-foot" ref={menuRef}>
          {menu && (
            <div className="sb-pop" role="menu">
              <Link href="/profile" role="menuitem" className="pop-item"
                onClick={() => run(() => {})}>
                <Icon name="user" />Profil saya
              </Link>
              <button role="menuitem" className="pop-item" onClick={() => run(onChangeCompany)}>
                <Icon name="swap" />Ganti PT
              </button>
              <button role="menuitem" className="pop-item" onClick={() => run(onChangePassword)}>
                <Icon name="key" />Ganti password
              </button>
              <div className="pop-sep" />
              <button role="menuitem" className="pop-item danger" onClick={() => run(onLogout)}>
                <Icon name="out" />Keluar
              </button>
            </div>
          )}

          <button className={`sb-user${menu ? " on" : ""}`} onClick={() => setMenu((v) => !v)}
            aria-haspopup="menu" aria-expanded={menu}>
            <Avatar name={userName} src={photoUrl} size={34} />
            <span className="sb-user-text">
              <strong>{userName}</strong>
              <small>{user.split(", ").slice(1).join(", ") || company}</small>
            </span>
            <svg className="sb-chev" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
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
          <Link href="/profile" aria-label="Profil saya">
            <Avatar name={userName} src={photoUrl} />
          </Link>
        </header>
        {children}
      </div>
    </div>
  );
}