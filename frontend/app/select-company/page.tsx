"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { api, ROLE_LABEL } from "@/lib/api";

type Company = { id: number; name: string; role: string };

function Content() {
  const router = useRouter();
  const fromDashboard = useSearchParams().get("dari") === "dashboard";
  const [list, setList] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/companies").then((r) => {
      if (r.status === 401) router.push("/login");
      else if (r.status === 403 && r.data.next) router.push(r.data.next);
      else setList(r.data.companies ?? []);
      setLoading(false);
    });
  }, [router]);

  async function pick(id: number) {
    const r = await api("/api/select-company", { company_id: id });
    if (r.ok) router.push("/dashboard");
  }

  return (
    <AuthShell
      title="Pilih PT"
      lead="Pilih PT yang ingin kamu kelola. Bisa diganti kapan saja."
      back={fromDashboard ? { href: "/dashboard", label: "Kembali ke dashboard" } : undefined}
    >
      {loading && <p className="hint">Memuat...</p>}
      <div className="co-list">
        {list.map((c) => (
          <button key={c.id} className="co-item" onClick={() => pick(c.id)}>
            <strong>{c.name}</strong>
            <small>{ROLE_LABEL[c.role] ?? c.role}</small>
          </button>
        ))}
      </div>
    </AuthShell>
  );
}

export default function SelectCompanyPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}