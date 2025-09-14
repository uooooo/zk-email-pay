"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAccount, isAccountCreated } from "@/lib/relayer";
import Link from "next/link";

export default function OtherPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>("");

  async function onCheck() {
    setStatus("確認中...");
    try {
      const ok = await isAccountCreated(email);
      setStatus(ok ? "このメールはウォレット作成済みです" : "未作成です（作成メールを送れます）");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setStatus(`確認エラー: ${message}`);
    }
  }

  async function onInvite() {
    setStatus("作成メール送信中...");
    try {
      // 実際のリレイヤーのcreateAccountを呼び出し
      const requestId = await createAccount(email);
      setStatus(`✅ アカウント作成要求を送信しました。${email} に招待メールが送信されます。リクエストID: ${requestId}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setStatus(`作成エラー: ${message}`);
    }
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Hero */}
      <section className="text-white" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>
        <div className="container-narrow px-4 py-8 sm:py-12">
          <div className="flex items-center gap-8 mb-4">
            <button
              onClick={() => router.push('/send')}
              className="hover:text-white transition-colors duration-200 text-lg font-medium opacity-60 hover:opacity-100"
              style={{ color: 'rgba(255, 255, 255, 0.8)' }}
            >
              送金
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">その他</h1>
          </div>
          <p className="text-lg max-w-md" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>アカウント確認・招待メールの送信</p>
        </div>
      </section>

      {/* Form card */}
      <section className="container-narrow px-4 -mt-6 relative z-10">
        <div className="card shadow-xl" role="region" aria-label="other-actions">
          <div className="card-section space-y-3">
            <label className="block">
              <span className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>メールアドレス</span>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="メールアドレス"
              />
            </label>
          </div>
          <div className="divider"></div>
          <div className="card-section">
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="btn btn-ghost flex-1" onClick={onCheck}>
                🔍 アカウント確認
              </button>
              <button className="btn btn-primary flex-1" onClick={onInvite}>
                🎯 招待メールを受け取る
              </button>
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
                  } : status.includes('送信されました') || status.includes('作成済みです') ? {
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
                      {status.includes('エラー') ? '❌' : status.includes('送信されました') || status.includes('作成済みです') ? '✅' : '⏳'}
                    </span>
                    <span>{status}</span>
                  </div>
                </div>
              </div>
            </>
          )}
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
