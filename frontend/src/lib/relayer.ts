// Simple Relayer API Client
// Uses NEXT_PUBLIC_RELAYER_API_URL (e.g. http://localhost:8080)

type SendParams = {
  email: string;
  amount: string;
  token: string;
  recipient: string;
  isRecipientEmail: boolean;
};

const RELAYER_BASE_URL = process.env.NEXT_PUBLIC_RELAYER_API_URL || "";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${RELAYER_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    throw new Error(`Relayer ${path} failed: ${res.status} ${res.statusText}`);
  }
  
  // リレイヤーは多くの場合テキストレスポンスを返す
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

// アカウント作成
export async function createAccount(email: string): Promise<string> {
  return postJson<string>("/api/createAccount", { email_addr: email });
}

// アカウント作成状況確認
export async function isAccountCreated(email: string): Promise<boolean> {
  const result = await postJson<string | boolean>("/api/isAccountCreated", { 
    email_addr: email 
  });
  
  if (typeof result === "boolean") return result;
  return result === "true";
}

// EmailWallet送金（リレイヤー経由）
export async function send(params: SendParams): Promise<string> {
  return postJson<string>("/api/send", {
    email_addr: params.email,
    amount: parseFloat(params.amount),
    token_id: params.token,
    recipient_addr: params.recipient,
    is_recipient_email: params.isRecipientEmail
  });
}

// リレイヤーメールアドレス取得
export async function getRelayerEmailAddr(): Promise<string> {
  try {
    return await postJson<string>("/api/relayerEmailAddr", {});
  } catch {
    // フォールバック
    return 'zkemailpay@gmail.com';
  }
}

// ウォレットアドレス取得
export async function getWalletAddress(email: string, accountCode: string): Promise<string> {
  return postJson<string>("/api/getWalletAddress", {
    email_addr: email,
    account_code: accountCode
  });
}

// アカウントコード復旧メール送信
export async function recoverAccountCode(email: string): Promise<string> {
  return postJson<string>("/api/recoverAccountCode", {
    email_addr: email
  });
}

// mailto URLビルダー
export function buildMailto(to: string, subject: string): string {
  const params = new URLSearchParams({ subject });
  return `mailto:${encodeURIComponent(to)}?${params.toString()}`;
}
