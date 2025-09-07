"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createAccount, send } from "@/lib/relayer";
import Link from "next/link";

export default function SendPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("10");
  const tokenOptions = [
    { symbol: "ETH", address: "native", name: "Ethereum" },
    { symbol: "USDC", address: "0x3CA50b9B421646D0B485852A14168Aa8494D2877", name: "USD Coin" },
    { symbol: "JPYC", address: "0x36e3495B2AeC55647bEF00968507366f1f7572C6", name: "JPYC" },
  ] as const;
  const [token, setToken] = useState<(typeof tokenOptions)[number]["symbol"]>("ETH");
  const [recipient, setRecipient] = useState("");
  const [isRecipientEmail, setIsRecipientEmail] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [checking, setChecking] = useState(false);
  const [created, setCreated] = useState<undefined | boolean>(undefined);
  // Relayerメールへの明示誘導は廃止（メールアプリボタン非表示）

  const canSend = useMemo(() => {
    if (!email || !amount || !recipient) return false;
    const n = Number(amount);
    return Number.isFinite(n) && n > 0;
  }, [email, amount, recipient]);

  // アカウント作成確認は無効化（リレイヤーサーバー未実装のため）
  useEffect(() => {
    if (!email) {
      setCreated(undefined);
      return;
    }
    // モック実装：常にアカウント作成済みとして扱う
    setCreated(true);
    setChecking(false);
    setStatus("");
  }, [email]);

  const onCreate = useCallback(async () => {
    setStatus("作成メール送信中...");
    try {
      await createAccount(email);
      setStatus("招待メールが送信されました。そのまま返信してください。");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setStatus(`作成エラー: ${message}`);
    }
  }, [email]);

  const onSend = useCallback(async () => {
    setStatus("確認メール送信中...");
    try {
      await send({ email, amount, token, recipient, isRecipientEmail });
      setStatus(`確認メールを ${email} に送信しました。返信することでトランザクションを確定できます。`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setStatus(`送金エラー: ${message}`);
    }
  }, [email, amount, token, recipient, isRecipientEmail]);

  // メールアプリ誘導は不要にしたため削除

  // 送付先がメールかEOAかを簡易自動判定
  useEffect(() => {
    if (!recipient) return;
    if (recipient.includes("@")) setIsRecipientEmail(true);
    else if (recipient.startsWith("0x")) setIsRecipientEmail(false);
  }, [recipient]);

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Hero */}
      <section className="text-white" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>
        <div className="container-narrow px-4 py-8 sm:py-12">
          <div className="flex items-center gap-8 mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">送金</h1>
            <button
              onClick={() => router.push('/other')}
              className="hover:text-white transition-colors duration-200 text-lg font-medium opacity-60 hover:opacity-100"
              style={{ color: 'rgba(255, 255, 255, 0.8)' }}
            >
              その他
            </button>
          </div>
          <p className="text-lg max-w-md" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>メールで送金。返信で確定。シンプル&スマート。</p>
        </div>
      </section>

      {/* Form card */}
      <section className="container-narrow px-4 -mt-6 relative z-10">
        <div className="card shadow-xl" role="region" aria-label="send-form">
          {/* Email row */}
          <div className="card-section space-y-3">
            <label className="block">
              <span className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>あなたのメール</span>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="あなたのメールアドレス"
              />
            </label>
            {/* {checking && <div className="text-sm flex items-center gap-2" style={{ color: 'var(--primary)' }}>
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div>
              確認中...
            </div>}
            {!checking && created === true && <div className="text-sm font-medium" style={{ color: '#059669' }}>✓ 作成済み</div>}
            {!checking && created === false && <div className="text-sm font-medium" style={{ color: '#d97706' }}>! 未作成（作成メールを送れます）</div>} */}
          </div>
          <div className="divider"></div>

          {/* Amount + Token row */}
          <div className="card-section space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <label className="flex-1">
                <span className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>金額</span>
                <input
                  className="input text-2xl sm:text-3xl font-bold tracking-wide"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10"
                  inputMode="decimal"
                  aria-label="金額"
                />
              </label>
              <div className="sm:ml-4">
                <span className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>トークン</span>
                <div className="flex gap-2" aria-label="トークン選択">
                  {tokenOptions.map((t) => (
                    <button
                      key={t.symbol}
                      type="button"
                      onClick={() => setToken(t.symbol)}
                      className={`pill transition-all duration-200 hover:scale-105 ${token === t.symbol ? "pill-active" : ""}`}
                      style={token !== t.symbol ? { borderColor: 'var(--border-soft)' } : {}}
                      aria-pressed={token === t.symbol}
                    >
                      {t.symbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Token Address Display */}
            {token !== "ETH" && (
              <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--accent-light)', border: '1px solid var(--border-soft)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-medium mb-1" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                      {tokenOptions.find(t => t.symbol === token)?.name} Contract Address
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                        {`${tokenOptions.find(t => t.symbol === token)?.address.slice(0, 6)}...${tokenOptions.find(t => t.symbol === token)?.address.slice(-4)}`}
                      </code>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const address = tokenOptions.find(t => t.symbol === token)?.address;
                      if (address) {
                        window.open(`https://sepolia.basescan.org/token/${address}`, '_blank');
                      }
                    }}
                    className="ml-3 p-2 rounded-full transition-colors hover:scale-110"
                    style={{ 
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-soft)',
                      color: 'var(--primary)'
                    }}
                    title="BaseSepolia Scanで確認"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="divider"></div>

          {/* Recipient row */}
          <div className="card-section space-y-4">
            <div>
              <span className="text-sm font-medium mb-3 block" style={{ color: 'var(--foreground)' }}>送付先</span>
              <div className="inline-flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-soft)', background: 'var(--accent-light)' }} role="tablist" aria-label="送付先の種類">
                <button
                  type="button"
                  onClick={() => setIsRecipientEmail(true)}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-200`}
                  style={isRecipientEmail ? {
                    background: 'var(--primary)',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3)'
                  } : {
                    background: 'var(--card-bg)',
                    color: 'var(--foreground)'
                  }}
                  role="tab"
                  aria-selected={isRecipientEmail}
                >
                  📧 メール
                </button>
                <button
                  type="button"
                  onClick={() => setIsRecipientEmail(false)}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-200`}
                  style={!isRecipientEmail ? {
                    background: 'var(--primary)',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3)'
                  } : {
                    background: 'var(--card-bg)',
                    color: 'var(--foreground)'
                  }}
                  role="tab"
                  aria-selected={!isRecipientEmail}
                >
                  🏦 0xアドレス
                </button>
              </div>
            </div>
            <input
              className={`input ${
                !isRecipientEmail ? "font-mono" : ""
              }`}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={isRecipientEmail ? "alice@example.com" : "0x1234...abcd"}
              aria-label="送付先"
            />
          </div>
          {status && (
            <>
              <div className="divider"></div>
              <div className="card-section">
                <div className={`p-4 rounded-lg border text-sm font-medium`}
                  style={status.includes('エラー') ? {
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    color: '#dc2626'
                  } : status.includes('送信しました') || status.includes('送信されました') ? {
                    background: 'rgba(34, 197, 94, 0.1)',
                    borderColor: 'rgba(34, 197, 94, 0.3)',
                    color: '#059669'
                  } : {
                    background: 'var(--accent-light)',
                    borderColor: 'var(--primary)',
                    color: 'var(--foreground)'
                  }}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">
                      {status.includes('エラー') ? '❌' : status.includes('送信') ? '✅' : '⏳'}
                    </span>
                    <span>{status}</span>
                  </div>
                </div>
              </div>
            </>
          )}
          <div className="divider"></div>
          <div className="card-section">
            {created === false ? (
              <button 
                className="btn btn-primary w-full py-4 text-base font-semibold" 
                onClick={onCreate}
              >
                🎯 招待メールを受け取る
              </button>
            ) : (
              <button 
                className="btn btn-primary w-full py-4 text-base font-semibold" 
                onClick={onSend} 
                disabled={!canSend}
              >
                {canSend ? '💸 確定' : '入力を完了してください'}
              </button>
            )}
          </div>
        </div>
      </section>
      
      {/* Link to home */}
      <section className="container-narrow px-4 mt-6">
        <div className="text-center">
          <Link 
            href="/address"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
            style={{
              background: 'var(--card-bg)',
              border: '2px solid var(--border-soft)',
              color: 'var(--foreground)',
              textDecoration: 'none'
            }}
          >
            アドレスをお持ちの方はこちらへ
          </Link>
        </div>
      </section>
    </main>
  );
}
