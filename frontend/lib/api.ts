export type ApiResult = { ok: boolean; status: number; data: any };

export async function api(url: string, body?: unknown, method?: string): Promise<ApiResult> {
  try {
    const res = await fetch(url, {
      method: method ?? (body !== undefined ? "POST" : "GET"),
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: {} };
  }
}

export const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  stok: "Bagian Stok",
  marketing: "Marketing",
  keuangan: "Keuangan",
  legal: "Legal",
  direksi: "Direksi",
};
