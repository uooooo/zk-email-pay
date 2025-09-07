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
  // 実際にメールを送信するAPI実装
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: params.email,
        subject: `[ZK Email] 送金確認 - ${params.amount} ${params.token} to ${params.recipient}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #eab308;">ZK Email 送金確認</h2>
            
            <p>${params.email} 様</p>
            
            <p>以下の送金を実行しますか？</p>
            
            <div style="background: #fffef5; border: 1px solid #eab308; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #eab308;">送金詳細</h3>
              <ul>
                <li><strong>金額:</strong> ${params.amount} ${params.token}</li>
                <li><strong>受信者:</strong> ${params.recipient}</li>
                <li><strong>送金者:</strong> ${params.email}</li>
              </ul>
            </div>
            
            <p><strong>この送金を実行する場合は、このメールに返信してください。</strong></p>
            
            <div style="background: #f3f4f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">返信時の件名:</p>
              <code style="background: white; padding: 5px; border-radius: 4px; display: block; margin-top: 5px;">
                Send ${params.amount} ${params.token} to ${params.recipient}
              </code>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              このメールに返信することで、zk-email技術により安全かつプライベートに送金が実行されます。
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              ZK Email システム<br>
              relayer@zkemail.example.com
            </p>
          </div>
        `
      })
    });

    if (!response.ok) {
      throw new Error(`メール送信に失敗しました: ${response.status}`);
    }

    return `確認メールを ${params.email} に送信しました。メールを確認して返信してください。`;
    
  } catch (error) {
    console.error('メール送信エラー:', error);
    throw new Error('メール送信に失敗しました。しばらくしてからもう一度お試しください。');
  }
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
