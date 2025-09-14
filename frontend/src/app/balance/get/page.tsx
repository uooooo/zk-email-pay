"use client";

import { useCallback, useState, useEffect } from "react";
import { recoverAccountCode } from "@/lib/relayer";
import { saveEmail, getSavedEmail } from "@/lib/localStorage";

export default function BalanceGetPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Load saved email on component mount
  useEffect(() => {
    const savedEmail = getSavedEmail();
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);


  const handleSendBalanceCheckEmail = useCallback(async () => {
    if (!email) {
      setStatus("メールアドレスを入力してください");
      return;
    }

    setLoading(true);
    setStatus("残高確認メール送信中...");

    try {
      await recoverAccountCode(email);
      setStatus(`✅ ${email} に残高確認メールを送信しました。メールのリンクから残高を確認できます。`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`❌ エラー: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [email]);

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Hero */}
      <section className="text-white" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
        <div className="container-narrow px-4 py-8 sm:py-12">
          <div className="flex items-center gap-8 mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">📧 残高確認メール送信</h1>
          </div>
          <p className="text-lg max-w-md" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            EmailWalletの残高確認メールを送信します。メール内のリンクから資産状況を確認できます。
          </p>
        </div>
      </section>

      {/* Form card */}
      <section className="container-narrow px-4 -mt-6 relative z-10">
        <div className="card shadow-xl" role="region" aria-label="balance-get">
          {/* Email Input */}
          <div className="card-section space-y-4">
            <div>
              <label className="block">
                <span className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>メールアドレス</span>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </label>
            </div>
          </div>

          <div className="divider"></div>

          {/* Action Button */}
          <div className="card-section">
            <button 
              className="btn btn-primary w-full py-4 text-base font-semibold" 
              onClick={handleSendBalanceCheckEmail}
              disabled={loading || !email}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2"
                    style={{ borderColor: '#fff', borderTopColor: 'transparent' }}>
                  </div>
                  処理中...
                </>
              ) : (
                "📧 残高確認メールを送る"
              )}
            </button>
            <div className="text-xs mt-2 text-center" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
              メールに記載されたリンクから資産状況を確認できます
            </div>
          </div>

          {/* Status */}
          {status && (
            <>
              <div className="divider"></div>
              <div className="card-section">
                <div className={`p-4 rounded-lg border text-sm font-medium`}
                  style={status.includes('❌') ? {
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    color: '#dc2626'
                  } : status.includes('✅') ? {
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
                      {status.includes('❌') ? '❌' : status.includes('✅') ? '✅' : '⏳'}
                    </span>
                    <div className="whitespace-pre-line">{status}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
      
      {/* navigation links are centralized in the hamburger menu */}
    </main>
  );
}
