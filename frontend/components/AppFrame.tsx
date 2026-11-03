"use client";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { api, ROLE_LABEL } from "@/lib/api";

export type Me = {
  id: number;
  name: string;
  email: string;
  company: string;
  role: string;
  password_days_left: number;
  photo_url?: string | null;
  has_signature?: boolean;
};

export default function AppFrame({
  children,
}: {
  children: (me: Me, reload: () => void) => ReactNode;
}) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  const load = useCallback(() => {
    api("/api/me").then((r) => {
      if (r.ok) setMe(r.data);
      else if (r.status === 403 && r.data.next) router.push(r.data.next);
      else router.push("/login");
    });
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    await api("/api/logout", {});
    router.push("/login");
  }

  if (!me) return <p className="page hint">Memuat...</p>;

  return (
    <AppShell
      company={me.company}
      userName={me.name}
      user={`${me.name}, ${ROLE_LABEL[me.role] ?? me.role}`}
      photoUrl={me.photo_url}
      isAdmin={me.role === "admin"}
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
      {children(me, load)}
    </AppShell>
  );
}