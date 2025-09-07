"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createAccount, isAccountCreated, send } from "@/lib/relayer";

export default function SendPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("10");
  const tokenOptions = [
    { symbol: "ETH", address: "native" },
    { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
    { symbol: "JPYC", address: "0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB" },
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

  // 入力された email をデバウンスして自動判定
  useEffect(() => {
    if (!email) {
      setCreated(undefined);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setChecking(true);
        const ok = await isAccountCreated(email);
        setCreated(ok);
        setStatus("");
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        setStatus(`確認エラー: ${message}`);
      } finally {
        setChecking(false);
      }
    }, 500);
    return () => clearTimeout(t);
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
    setStatus("送金メール送信中...");
    try {
      await send({ email, amount, token, recipient, isRecipientEmail });
      setStatus("確認メールを送信しました。メールに返信して確定してください。");
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
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-red-600 to-red-500 text-white">
        <div className="container-narrow px-4 py-8 sm:py-12">
          <div className="flex items-center gap-8 mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">送金</h1>
            <button
              onClick={() => router.push('/other')}
              className="text-red-200 hover:text-white transition-colors duration-200 text-lg font-medium opacity-60 hover:opacity-100"
            >
              その他
            </button>
          </div>
          <p className="text-red-100 text-lg max-w-md">メールで送金。返信で確定。シンプル&スマート。</p>
        </div>
      </section>

      {/* Form card */}
      <section className="container-narrow px-4 -mt-6 relative z-10">
        <div className="card shadow-xl" role="region" aria-label="send-form">
          {/* Email row */}
          <div className="card-section space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-gray-700 mb-2 block">あなたのメール</span>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="あなたのメールアドレス"
              />
            </label>
            {checking && <div className="text-sm text-blue-600 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              確認中...
            </div>}
            {!checking && created === true && <div className="text-sm text-green-600 font-medium">✓ 作成済み</div>}
            {!checking && created === false && <div className="text-sm text-amber-600 font-medium">! 未作成（作成メールを送れます）</div>}
          </div>
          <div className="divider"></div>

          {/* Amount + Token row */}
          <div className="card-section space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <label className="flex-1">
                <span className="text-sm font-medium text-gray-700 mb-2 block">金額</span>
                <input
                  className="input text-2xl sm:text-3xl font-bold tracking-wide text-gray-900 placeholder-gray-400"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10"
                  inputMode="decimal"
                  aria-label="金額"
                />
              </label>
              <div className="sm:ml-4">
                <span className="text-sm font-medium text-gray-700 mb-2 block">トークン</span>
                <div className="flex gap-2" aria-label="トークン選択">
                  {tokenOptions.map((t) => (
                    <button
                      key={t.symbol}
                      type="button"
                      onClick={() => setToken(t.symbol)}
                      className={`pill transition-all duration-200 hover:scale-105 ${token === t.symbol ? "pill-active" : "hover:border-red-300"}`}
                      aria-pressed={token === t.symbol}
                    >
                      {t.symbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="divider"></div>

          {/* Recipient row */}
          <div className="card-section space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-700 mb-3 block">送付先</span>
              <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden bg-gray-50" role="tablist" aria-label="送付先の種類">
                <button
                  type="button"
                  onClick={() => setIsRecipientEmail(true)}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isRecipientEmail 
                      ? "bg-red-600 text-white shadow-md" 
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  role="tab"
                  aria-selected={isRecipientEmail}
                >
                  📧 メール
                </button>
                <button
                  type="button"
                  onClick={() => setIsRecipientEmail(false)}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    !isRecipientEmail 
                      ? "bg-red-600 text-white shadow-md" 
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  role="tab"
                  aria-selected={!isRecipientEmail}
                >
                  🏦 0xアドレス
                </button>
              </div>
            </div>
            <input
              className={`input text-gray-900 placeholder-gray-400 ${
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
                <div className={`p-4 rounded-lg border text-sm font-medium ${
                  status.includes('エラー') 
                    ? 'bg-red-50 border-red-200 text-red-800' 
                    : status.includes('送信しました') || status.includes('送信されました')
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}>
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
                {canSend ? '💸 メールで送る（返信で確定）' : '入力を完了してください'}
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
