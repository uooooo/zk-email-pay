"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createAccount, send } from "@/lib/relayer";
import { saveEmail, getSavedEmail } from "@/lib/localStorage";

function SendPageContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("10");
  const tokenOptions = [
    { symbol: "USDC", address: "0x3CA50b9B421646D0B485852A14168Aa8494D2877", name: "USD Coin" },
    { symbol: "JPYC", address: "0x36e3495B2AeC55647bEF00968507366f1f7572C6", name: "JPYC" },
  ] as const;
  
  // Get token from query params, fallback to USDC
  const getInitialToken = () => {
    const tokenParam = searchParams.get("token");
    if (tokenParam && tokenOptions.some(option => option.symbol === tokenParam)) {
      return tokenParam as (typeof tokenOptions)[number]["symbol"];
    }
    return "USDC";
  };
  
  const [token, setToken] = useState<(typeof tokenOptions)[number]["symbol"]>(getInitialToken());
  const [recipient, setRecipient] = useState("");
  const [isRecipientEmail, setIsRecipientEmail] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [checking, setChecking] = useState(false);
  const [created, setCreated] = useState<undefined | boolean>(undefined);
  // Removed explicit guidance to relayer email (email app button hidden)

  // Load saved email on component mount
  useEffect(() => {
    const savedEmail = getSavedEmail();
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);


  const canSend = useMemo(() => {
    if (!email || !amount || !recipient) return false;
    const n = Number(amount);
    return Number.isFinite(n) && n > 0;
  }, [email, amount, recipient]);

  // Account creation check (using relayer API)
  useEffect(() => {
    if (!email) {
      setCreated(undefined);
      return;
    }
    
    setChecking(true);
    import('@/lib/relayer').then(({ isAccountCreated }) => {
      isAccountCreated(email)
        .then((exists) => {
          setCreated(exists);
          setChecking(false);
          setStatus("");
        })
        .catch((error) => {
          console.warn('Account check failed:', error);
          // Treat as created in case of error (fallback)
          setCreated(true);
          setChecking(false);
          setStatus("");
        });
    });
  }, [email]);

  const onCreate = useCallback(async () => {
    setStatus("Sending creation email...");
    try {
      await createAccount(email);
      setStatus("Invitation email sent. Please reply to continue.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setStatus(`Creation error: ${message}`);
    }
  }, [email]);

  const onSend = useCallback(async () => {
    setStatus("Sending confirmation email...");
    try {
      const requestId = await send({ email, amount, token, recipient, isRecipientEmail });
      // Save email address on successful send
      saveEmail(email);
      const recipientType = isRecipientEmail ? 'email address' : 'wallet address';
      setStatus(`✅ Confirmation email sent to ${email}.\nRecipient: ${recipient} (${recipientType})\nAmount: ${amount} ${token}\nRequest ID: ${requestId}\n\nReply to the email to confirm the transaction.`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setStatus(`❌ Send error: ${message}`);
      console.error('Send error:', e);
    }
  }, [email, amount, token, recipient, isRecipientEmail]);

  // Email app guidance removed as unnecessary

  // Simple auto-detection of whether recipient is email or EOA
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
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Send</h1>
          </div>
          <p className="text-lg max-w-md" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Send via email. Confirm by reply. Simple & smart.</p>
        </div>
      </section>

      {/* Form card */}
      <section className="container-narrow px-4 -mt-6 relative z-10">
        <div className="card shadow-xl" role="region" aria-label="send-form">
          {/* Email row */}
          <div className="card-section space-y-3">
            <label className="block">
              <span className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Your Email</span>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Your email address"
              />
            </label>
            {checking && <div className="text-sm flex items-center gap-2" style={{ color: 'var(--primary)' }}>
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div>
              Checking...
            </div>}
            {!checking && created === true && <div className="text-sm font-medium" style={{ color: '#059669' }}>✓ Already created</div>}
            {!checking && created === false && <div className="text-sm font-medium" style={{ color: '#d97706' }}>! Not created (can send creation email)</div>}
          </div>
          <div className="divider"></div>

          {/* Amount + Token row */}
          <div className="card-section space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <label className="flex-1">
                <span className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Amount</span>
                <input
                  className="input text-2xl sm:text-3xl font-bold tracking-wide"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10"
                  inputMode="decimal"
                  aria-label="Amount"
                />
              </label>
              <div className="sm:ml-4">
                <span className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Token</span>
                <div className="flex gap-2" aria-label="Token selection">
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
            {tokenOptions.find(t => t.symbol === token) && (
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
                    title="View on BaseSepolia Scan"
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
              <span className="text-sm font-medium mb-3 block" style={{ color: 'var(--foreground)' }}>Recipient</span>
              <div className="inline-flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-soft)', background: 'var(--accent-light)' }} role="tablist" aria-label="Recipient type">
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
                  📧 Email
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
                  🏦 0x Address
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
              aria-label="Recipient"
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
                    <span className="text-lg flex-shrink-0 mt-1">
                      {status.includes('❌') ? '❌' : status.includes('✅') ? '✅' : status.includes('送信') ? '✅' : '⏳'}
                    </span>
                    <div className="whitespace-pre-line">{status}</div>
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
                🎯 Receive Invitation Email
              </button>
            ) : (
              <button 
                className="btn btn-primary w-full py-4 text-base font-semibold" 
                onClick={onSend} 
                disabled={!canSend}
              >
                {canSend ? '💸 Confirm' : 'Please complete the form'}
              </button>
            )}
          </div>
        </div>
      </section>
      
      {/* navigation links are centralized in the hamburger menu */}
    </main>
  );
}

export default function SendPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SendPageContent />
    </Suspense>
  );
}
