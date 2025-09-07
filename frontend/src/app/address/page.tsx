"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { send } from "@/lib/relayer";
import Link from "next/link";

export default function AddressPage() {
  const router = useRouter();
  const [senderEmail, setSenderEmail] = useState("");
  const [recipients, setRecipients] = useState<string[]>([""]);
  const [amount, setAmount] = useState("10");
  const tokenOptions = [
    { symbol: "ETH", address: "native", name: "Ethereum" },
    { symbol: "USDC", address: "0x3CA50b9B421646D0B485852A14168Aa8494D2877", name: "USD Coin" },
    { symbol: "JPYC", address: "0x36e3495B2AeC55647bEF00968507366f1f7572C6", name: "JPYC" },
  ] as const;
  const [token, setToken] = useState<(typeof tokenOptions)[number]["symbol"]>("ETH");
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const addRecipient = () => {
    setRecipients([...recipients, ""]);
  };

  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const updateRecipient = (index: number, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const canSend = () => {
    if (!senderEmail || !amount || recipients.length === 0) return false;
    if (!isValidEmail(senderEmail)) return false;
    
    const validRecipients = recipients.filter(email => email.trim() !== "" && isValidEmail(email.trim()));
    if (validRecipients.length === 0) return false;
    
    const n = Number(amount);
    return Number.isFinite(n) && n > 0;
  };

  const onBulkSend = useCallback(async () => {
    if (!canSend()) return;
    
    setIsLoading(true);
    setStatus("一括送信中...");
    
    try {
      const validRecipients = recipients.filter(email => email.trim() !== "" && isValidEmail(email.trim()));
      const promises = validRecipients.map(recipient => 
        send({ 
          email: senderEmail, 
          amount, 
          token, 
          recipient: recipient.trim(), 
          isRecipientEmail: true 
        })
      );
      
      await Promise.all(promises);
      setStatus(`${validRecipients.length}件のメールが送信されました。各メールに返信して確定してください。`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setStatus(`一括送信エラー: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [senderEmail, amount, token, recipients]);

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Hero */}
      <section className="text-white" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>
        <div className="container-narrow px-4 py-8 sm:py-12">
          <div className="flex items-center gap-8 mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">一括送金</h1>
            <button
              onClick={() => router.push('/other')}
              className="hover:text-white transition-colors duration-200 text-lg font-medium opacity-60 hover:opacity-100"
              style={{ color: 'rgba(255, 255, 255, 0.8)' }}
            >
              その他
            </button>
          </div>
          <p className="text-lg max-w-md" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            複数のメールアドレスに同時に送金。効率的な一括処理。
          </p>
        </div>
      </section>

      {/* Form card */}
      <section className="container-narrow px-4 -mt-6 relative z-10">
        <div className="card shadow-xl" role="region" aria-label="bulk-send-form">
          {/* Sender Email row */}
          <div className="card-section space-y-3">
            <label className="block">
              <span className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>あなたのメール</span>
              <input
                className="input"
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="あなたのメールアドレス"
              />
            </label>
          </div>
          <div className="divider"></div>

          {/* Amount + Token row */}
          <div className="card-section space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <label className="flex-1">
                <span className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>金額（各宛先共通）</span>
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

          {/* Recipients row */}
          <div className="card-section space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>送信先メールアドレス</span>
              <button
                onClick={addRecipient}
                className="text-sm px-3 py-1 rounded transition-all hover:scale-105"
                style={{
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none'
                }}
              >
                + 追加
              </button>
            </div>
            
            <div className="space-y-3">
              {recipients.map((recipient, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <input
                      className="input"
                      type="email"
                      value={recipient}
                      onChange={(e) => updateRecipient(index, e.target.value)}
                      placeholder={`recipient${index + 1}@example.com`}
                      aria-label={`送信先 ${index + 1}`}
                    />
                    {recipient && !isValidEmail(recipient) && (
                      <p className="text-xs mt-1" style={{ color: '#dc2626' }}>
                        有効なメールアドレスを入力してください
                      </p>
                    )}
                  </div>
                  {recipients.length > 1 && (
                    <button
                      onClick={() => removeRecipient(index)}
                      className="p-2 rounded-full transition-colors hover:scale-110"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#dc2626'
                      }}
                      title="削除"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
              有効な送信先: {recipients.filter(email => email.trim() !== "" && isValidEmail(email.trim())).length}件
            </div>
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
                  } : status.includes('送信されました') ? {
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
                      {status.includes('エラー') ? '❌' : status.includes('送信されました') ? '✅' : '⏳'}
                    </span>
                    <span>{status}</span>
                  </div>
                </div>
              </div>
            </>
          )}
          
          <div className="divider"></div>
          <div className="card-section">
            <button 
              className="btn btn-primary w-full py-4 text-base font-semibold" 
              onClick={onBulkSend} 
              disabled={!canSend() || isLoading}
            >
              {isLoading ? '送信中...' : canSend() ? '📧 一括送信（各メールに返信で確定）' : '入力を完了してください'}
            </button>
          </div>
        </div>
      </section>
      
      {/* Link back */}
      <section className="container-narrow px-4 mt-6">
        <div className="text-center space-y-3">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
            style={{
              background: 'var(--card-bg)',
              border: '2px solid var(--border-soft)',
              color: 'var(--foreground)',
              textDecoration: 'none'
            }}
          >
            戻る
          </Link>
        </div>
      </section>
    </main>
  );
}