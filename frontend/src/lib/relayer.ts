// Minimal client for Email Wallet Relayer
// Uses NEXT_PUBLIC_RELAYER_BASE_URL (e.g. http://127.0.0.1:4500)

type SendParams = {
  email: string;
  amount: string; // number-like string
  token: string; // token symbol or id
  recipient: string; // email or 0x address
  isRecipientEmail: boolean;
};

const base = process.env.NEXT_PUBLIC_RELAYER_BASE_URL || "";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Relayer ${path} failed: ${res.status}`);
  // Many relayer routes return plain text (requestId) not JSON
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

export async function createAccount(email: string): Promise<string> {
  // server expects { email_addr }
  return postJson<string>("/api/createAccount", { email_addr: email });
}

export async function isAccountCreated(email: string): Promise<boolean> {
  // server expects { email_addr }
  const textOrBool = await postJson<string | boolean>(
    "/api/isAccountCreated",
    { email_addr: email }
  );
  if (typeof textOrBool === "boolean") return textOrBool;
  return textOrBool === "true";
}

export async function send(params: SendParams): Promise<string> {
  // server expects { email_addr, amount, token_id, recipient_addr, is_recipient_email }
  const payload = {
    email_addr: params.email,
    amount: params.amount,
    token_id: params.token,
    recipient_addr: params.recipient,
    is_recipient_email: params.isRecipientEmail,
  };
  return postJson<string>("/api/send", payload);
}

export async function getRelayerEmailAddr(): Promise<string> {
  const res = await fetch(`${base}/api/relayerEmailAddr`);
  if (!res.ok) throw new Error(`Relayer /api/relayerEmailAddr failed: ${res.status}`);
  return res.text();
}

export function buildMailto(to: string, subject: string): string {
  const q = new URLSearchParams({ subject }).toString();
  return `mailto:${encodeURIComponent(to)}?${q}`;
}
