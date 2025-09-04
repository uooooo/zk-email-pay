
function normalize(path: string): string {
  // Accept inputs like "/api/relayerEmailAddr" or "relayerEmailAddr"
  let p = path.trim();
  if (p.startsWith("/api/")) p = p.slice(5);
  if (p.startsWith("/")) p = p.slice(1);
  return p;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  // Call our Next.js proxy to avoid CORS in the browser
  const base = "/api/relayer";
  const res = await fetch(`${base}/${normalize(path)}`.replace(/\/+$/, ""), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Relayer API ${path} failed: ${res.status} ${text}`);
  }
  // Some endpoints return raw strings; try json then text
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

export async function createAccount(email_addr: string): Promise<{ requestId: string }> {
  const body = JSON.stringify({ email_addr });
  const text = await http<string>("createAccount", { method: "POST", body });
  return { requestId: text };
}

export async function isAccountCreated(email_addr: string): Promise<{ created: boolean }> {
  const body = JSON.stringify({ email_addr });
  const created = await http<boolean>("isAccountCreated", { method: "POST", body });
  return { created };
}

export async function sendRequest(params: {
  email_addr: string;
  amount: string | number; // decimal string or number
  token_id: string; // symbol or address as expected by server
  recipient_addr: string; // email or 0x
  is_recipient_email: boolean;
}): Promise<{ requestId: number }> {
  const body = JSON.stringify({ ...params, amount: typeof params.amount === "string" ? Number(params.amount) : params.amount });
  const id = await http<number>("send", { method: "POST", body });
  return { requestId: id };
}

export async function claimUnclaim(payload: {
  email_address: string;
  random: string; // 0x...
  expiry_time: number;
  is_fund: boolean;
  tx_hash: string;
}): Promise<{ ok: boolean; message: string }> {
  const body = JSON.stringify(payload);
  const text = await http<string>("unclaim", { method: "POST", body });
  return { ok: true, message: text };
}
