import Link from "next/dist/client/link";

import { ReactNode } from "react";

const css = `
.as-root {
  min-height: 100dvh; display: grid; place-items: center; padding: 24px 20px; box-sizing: border-box;
  background: #2f6fe4; color: #1a1a18;
}
.as-card {
  width: 100%; max-width: 880px; display: grid; grid-template-columns: 1.05fr 1fr;
  background: #fff; border-radius: 18px; overflow: hidden;
  box-shadow: 0 24px 60px rgba(10, 30, 90, 0.3);
}

/* ---- panel kiri ---- */
.as-side { position: relative; overflow: hidden; color: #fff; min-height: 480px; background: #2f6fe4; }
.as-circle { position: absolute; border-radius: 50%; background: #4a82ea; }
.as-circle.c1 { width: 220px; height: 220px; top: 28%; left: -70px; }
.as-circle.c2 { width: 120px; height: 120px; top: 8%; right: -30px; }

.as-top { position: relative; z-index: 2; padding: 36px 36px 0; }
.as-brand { font-size: 15px; font-weight: 600; margin-bottom: 44px; }
.as-welcome { font-size: 30px; line-height: 1.2; font-weight: 600; margin: 0 0 10px; }
.as-welcome-sub { margin: 0; font-size: 15px; color: #dce8ff; max-width: 22em; }

.as-wave { position: absolute; left: 0; bottom: -1px; width: 100%; height: 38%; display: block; z-index: 1; }
.as-foot { position: absolute; z-index: 2; left: 36px; bottom: 22px; font-size: 13px; font-weight: 600; color: #2f6fe4; }

/* ---- panel kanan ---- */
.as-main { padding: 44px 48px; display: flex; flex-direction: column; justify-content: center; }
.as-main h1 { font-size: 22px; font-weight: 600; margin: 0 0 6px; }
.as-lead { margin: 0 0 24px; color: #6b6b7a; font-size: 14px; }

.as-main .as-back {
  display: inline-flex; align-items: center; gap: 6px;
  align-self: flex-start; margin-bottom: 20px;
  font-size: 14px; font-weight: 500; color: #6b6b7a; text-decoration: none;
}
.as-main .as-back:hover { color: #2f6fe4; text-decoration: none; }
.as-main .as-back svg { transition: transform 0.15s; }
.as-main .as-back:hover svg { transform: translateX(-3px); }

.as-main .field { margin-bottom: 16px; }
.as-main .field > span { font-size: 13px; font-weight: 500; margin-bottom: 4px; color: #4a4a5a; }
.as-main .input {
  padding: 9px 2px; border: 0; border-bottom: 1.5px solid #d9dfeb; border-radius: 0;
  background: transparent; box-shadow: none; font-size: 15px;
}
.as-main .input:focus { border-bottom-color: #2f6fe4; box-shadow: none; }
.as-main .btn {
  margin-top: 6px; padding: 12px; border-radius: 8px; font-weight: 600; letter-spacing: 0.02em;
  background: #2f6fe4; box-shadow: none;
}
.as-main .btn:hover { background: #2559c0; opacity: 1; }
.as-main .error { color: #c0392b; }
.as-main .hint { color: #6b6b7a; margin: 0 0 12px; }
.as-main .link-row { margin-top: 16px; color: #6b6b7a; }
.as-main a { color: #2f6fe4; text-decoration: none; }
.as-main a:hover { text-decoration: underline; color: #2559c0; }

.as-main .co-item { padding: 12px 14px; border: 1px solid #e1e7f2; border-radius: 10px; }
.as-main .co-item:hover { border-color: #2f6fe4; background: #f5f8ff; }
.as-main .co-item strong { font-weight: 600; }
.as-main .co-item small { color: #6b6b7a; }

.as-main .notice { background: #f0f5ff; border-color: #d3e1fb; color: #1a1a18; }
.as-main .field > span { display: block; }
.as-main .input::placeholder { color: #a3abbb; }

.as-main .co-list { gap: 12px; }
.as-main .co-item { border-radius: 10px; padding: 14px 16px; }

@media (max-width: 760px) {
  .as-card { grid-template-columns: 1fr; max-width: 420px; }
  .as-side { display: none; }
  .as-main { padding: 32px 26px; }
}
`;

export default function AuthShell({
  title,
  lead,
  back,
  children,
}: {
  title: string;
  lead?: string;
  back?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <main className="as-root">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="as-card">
        <aside className="as-side" aria-hidden="true">
          <span className="as-circle c1" />
          <span className="as-circle c2" />

          <div className="as-top">
            <div className="as-brand">AMIN GROUP</div>
            <h2 className="as-welcome">Selamat datang</h2>
            <p className="as-welcome-sub">
              Booking, SPPR, KPR, stok, Legalitas, dan progres bangunan dalam satu tempat.
            </p>
          </div>

          <svg className="as-wave" viewBox="0 0 400 150" preserveAspectRatio="none">
            <path d="M0 62 C 80 14, 150 104, 230 62 S 350 22, 400 52 L400 150 L0 150 Z" fill="#7aa3f2" />
            <path d="M0 92 C 90 52, 160 128, 245 92 S 355 66, 400 84 L400 150 L0 150 Z" fill="#fff" />
          </svg>
          <div className="as-foot">Manajemen Data Properti dan Kontruksi</div>
        </aside>

        <section className="as-main">
          {back && (
            <Link href={back.href} className="as-back">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {back.label}
            </Link>
          )}
          <h1>{title}</h1>
          {lead && <p className="as-lead">{lead}</p>}
          {children}
        </section>
      </div>
    </main>
  );
}