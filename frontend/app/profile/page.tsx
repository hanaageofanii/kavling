"use client";
import { useRef, useState } from "react";
import AppFrame, { Me } from "@/components/AppFrame";
import Avatar from "@/components/Avatar";
import SignaturePad, { SignaturePadHandle } from "@/components/SignaturePad";
import { api, ROLE_LABEL } from "@/lib/api";

// potong jadi persegi 256px agar ringan dan seragam di chat
function toSquare(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(img.width, img.height);
      const c = document.createElement("canvas");
      c.width = c.height = size;
      c.getContext("2d")!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("Gambar tidak bisa dibaca."));
    img.src = url;
  });
}

function Profile({ me, reload }: { me: Me; reload: () => void }) {
  const pad = useRef<SignaturePadHandle>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ver, setVer] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [photoMsg, setPhotoMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [sigMsg, setSigMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setPhotoMsg({ ok: false, text: "File harus berupa gambar." });
    if (file.size > 8 * 1024 * 1024) return setPhotoMsg({ ok: false, text: "Ukuran maksimal 8 MB." });
    try {
      setPreview(await toSquare(file));
      setPhotoMsg(null);
    } catch {
      setPhotoMsg({ ok: false, text: "Gambar tidak bisa dibaca." });
    }
  }

  async function savePhoto() {
    if (!preview) return;
    setBusy(true);
    const r = await api("/api/profile/photo", { image: preview });
    setBusy(false);
    if (r.ok) {
      setPreview(null);
      setPhotoMsg({ ok: true, text: "Foto profil tersimpan." });
      reload();
    } else setPhotoMsg({ ok: false, text: r.data.error ?? "Gagal menyimpan foto." });
  }

  async function saveSig() {
    if (!pad.current || pad.current.isEmpty()) return setSigMsg({ ok: false, text: "Tanda tangan masih kosong." });
    setBusy(true);
    const r = await api("/api/profile/signature", { image: pad.current.toDataURL() });
    setBusy(false);
    if (r.ok) {
      pad.current.clear();
      setVer(Date.now());
      setSigMsg({ ok: true, text: "Tanda tangan tersimpan." });
      reload();
    } else setSigMsg({ ok: false, text: r.data.error ?? "Gagal menyimpan tanda tangan." });
  }

  return (
    <main className="page">
      <div className="page-head">
        <h1>Profil saya</h1>
        <p className="lead">
          {me.name} · {me.email} · {ROLE_LABEL[me.role] ?? me.role}
        </p>
      </div>

      <div className="grid-2">
        <section className="card">
          <h2 className="card-title">Foto profil</h2>
          <div className="photo-row">
            <Avatar name={me.name} src={preview ?? me.photo_url} size={96} />
            <div className="photo-actions">
              <label className="btn auto btn-line">
                Pilih foto
                <input type="file" accept="image/*" hidden onChange={onPick} />
              </label>
              {preview && (
                <>
                  <button className="btn auto" onClick={savePhoto} disabled={busy}>
                    {busy ? "Menyimpan..." : "Simpan foto"}
                  </button>
                  <button className="btn auto btn-ghost" onClick={() => setPreview(null)}>Batal</button>
                </>
              )}
            </div>
          </div>
          <p className="hint">Foto dipotong persegi otomatis. Foto ini juga akan tampil di chat.</p>
          {photoMsg && <p className={photoMsg.ok ? "ok" : "error"} role="status">{photoMsg.text}</p>}
        </section>

        <section className="card">
          <h2 className="card-title">Tanda tangan</h2>
          {me.has_signature && (
            <div className="sig-current">
              <small>Tanda tangan tersimpan saat ini</small>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/users/${me.id}/signature?v=${ver}`} alt="Tanda tangan saat ini" />
            </div>
          )}
          <SignaturePad ref={pad} />
          <p className="hint">Tanda tangan di dalam kotak memakai mouse, jari, atau pena. Menyimpan akan menggantikan yang lama.</p>
          <div className="photo-actions">
            <button className="btn auto" onClick={saveSig} disabled={busy}>
              {busy ? "Menyimpan..." : "Simpan tanda tangan"}
            </button>
            <button className="btn auto btn-line" onClick={() => pad.current?.clear()}>Hapus coretan</button>
          </div>
          {sigMsg && <p className={sigMsg.ok ? "ok" : "error"} role="status">{sigMsg.text}</p>}
        </section>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return <AppFrame>{(me, reload) => <Profile me={me} reload={reload} />}</AppFrame>;
}