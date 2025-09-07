
import { API_CONFIG } from '../constants';

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
      "content-type": API_CONFIG.DEFAULT_CONTENT_TYPE,
      ...(init?.headers ?? {}),
    },
    cache: API_CONFIG.CACHE_POLICY,
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

// 🔄 メール生成API（実際の処理はユーザーのメール返信が必要）
export async function createAccountRequest(email_addr: string): Promise<{ 
  accountCode: string; 
  message: string;
  requiresEmailReply: true;
}> {
  const body = JSON.stringify({ email_addr });
  const accountCode = await http<string>("createAccount", { method: "POST", body });
  return { 
    accountCode, 
    message: "確認メールを送信しました。メールに返信してアカウントを作成してください。",
    requiresEmailReply: true 
  };
}

// ✅ 完結API（即座に結果を返す）
export async function isAccountCreated(email_addr: string): Promise<{ created: boolean }> {
  const body = JSON.stringify({ email_addr });
  const created = await http<boolean>("isAccountCreated", { method: "POST", body });
  return { created };
}

// 🔄 メール生成API（実際の送金はユーザーのメール返信が必要）
export async function sendRequest(params: {
  email_addr: string;
  amount: string | number;
  token_id: string;
  recipient_addr: string;
  is_recipient_email: boolean;
}): Promise<{ 
  requestId: number;
  message: string;
  requiresEmailReply: true;
}> {
  const body = JSON.stringify({ 
    ...params, 
    amount: typeof params.amount === "string" ? Number(params.amount) : params.amount 
  });
  const id = await http<number>("send", { method: "POST", body });
  return { 
    requestId: id,
    message: "確認メールを送信しました。メールに返信して送金を実行してください。",
    requiresEmailReply: true
  };
}

// ⚠️ セキュリティリスクAPI（DKIM認証をバイパス - 使用注意）
export async function claimUnclaim(payload: {
  email_address: string;
  random: string;
  expiry_time: number;
  is_fund: boolean;
  tx_hash: string;
}): Promise<{ 
  ok: boolean; 
  message: string;
  warning: string;
}> {
  const body = JSON.stringify(payload);
  const text = await http<string>("unclaim", { method: "POST", body });
  return { 
    ok: true, 
    message: text,
    warning: "⚠️ この機能はDKIM認証をバイパスしています。randomの値を正しく管理してください。"
  };
}

// 🔄 メール生成API（NFT転送の確認メール送信）
export async function nftTransferRequest(params: {
  email_addr: string;
  nft_id: number;
  nft_addr: string;
  recipient_addr: string;
  is_recipient_email: boolean;
}): Promise<{ 
  requestId: number;
  message: string;
  requiresEmailReply: true;
}> {
  const body = JSON.stringify(params);
  const id = await http<number>("nftTransfer", { method: "POST", body });
  return { 
    requestId: id,
    message: "NFT転送の確認メールを送信しました。メールに返信して転送を実行してください。",
    requiresEmailReply: true
  };
}

// ✅ 完結API（ephemeral address登録 + メール送信）
export async function signupOrSignIn(params: {
  email_addr: string;
  ephe_addr?: string;
  username?: string;
  expiry_time?: number;
  token_allowances?: Array<[number, string]>;
}): Promise<{ 
  requestId: number;
  message: string;
  onChainRegistration: boolean;
  requiresEmailReply: boolean;
}> {
  const body = JSON.stringify(params);
  const id = await http<number>("signupOrIn", { method: "POST", body });
  return { 
    requestId: id,
    message: params.ephe_addr ? 
      "Ephemeral addressをオンチェーン登録し、確認メールを送信しました。" :
      "確認メールを送信しました。",
    onChainRegistration: !!params.ephe_addr,
    requiresEmailReply: true
  };
}

// ✅ 完結API（直接トランザクション実行）
export async function executeEphemeralTx(params: {
  wallet_addr: string;
  tx_nonce: string;
  ephe_addr: string;
  ephe_addr_nonce: string;
  target: string;
  eth_value: string;
  data: string;
  token_amount: string;
  signature: string;
}): Promise<{ 
  txHash: string;
  message: string;
}> {
  const body = JSON.stringify(params);
  const txHash = await http<string>("executeEphemeralTx", { method: "POST", body });
  return { 
    txHash,
    message: "Ephemeral transactionを実行しました。"
  };
}

// ✅ 完結API（DB操作のみ）
export async function addSafeOwner(params: {
  wallet_addr: string;
  safe_addr: string;
}): Promise<{ message: string }> {
  const body = JSON.stringify(params);
  await http<void>("addSafeOwner", { method: "POST", body });
  return { message: "Safe ownerを追加しました。" };
}

// ✅ 完結API（統計情報取得）
export async function getStats(): Promise<{
  onboarding_tokens_distributed: number;
  onboarding_tokens_left: number;
}> {
  return await http<{
    onboarding_tokens_distributed: number;
    onboarding_tokens_left: number;
  }>("stats", { method: "GET" });
}
