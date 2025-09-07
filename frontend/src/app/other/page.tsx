"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAccount, isAccountCreated } from "@/lib/relayer";

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
      await createAccount(email);
      setStatus("招待メールが送信されました。そのまま返信してください。");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setStatus(`作成エラー: ${message}`);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-red-600 to-red-500 text-white">
        <div className="container-narrow px-4 py-8 sm:py-12">
          <div className="flex items-center gap-8 mb-4">
            <button
              onClick={() => router.push('/send')}
              className="text-red-200 hover:text-white transition-colors duration-200 text-lg font-medium opacity-60 hover:opacity-100"
            >
              送金
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">その他</h1>
          </div>
          <p className="text-red-100 text-lg max-w-md">アカウント確認・招待メールの送信</p>
        </div>
      </section>

      {/* Form card */}
      <section className="container-narrow px-4 -mt-6 relative z-10">
        <div className="card shadow-xl" role="region" aria-label="other-actions">
          <div className="card-section space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-gray-700 mb-2 block">メールアドレス</span>
              <input
                className="input text-gray-900 placeholder-gray-400"
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
                <div className={`p-4 rounded-lg border text-sm font-medium ${
                  status.includes('エラー') 
                    ? 'bg-red-50 border-red-200 text-red-800' 
                    : status.includes('送信されました') || status.includes('作成済みです')
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}>
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
    </main>
  );
}
