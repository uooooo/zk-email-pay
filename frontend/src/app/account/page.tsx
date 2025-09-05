"use client";
import React, { useState } from "react";
import { AlertBanner } from "@/components/feedback/AlertBanner";
import { createAccount, isAccountCreated } from "@/lib/api/relayer";
import { ProgressSteps } from "@/components/status/ProgressSteps";
import { ERROR_MESSAGES } from "@/lib/constants";

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [, setCreated] = useState<boolean | undefined>(undefined);
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function onCheck() {
    setError(undefined);
    setMessage(undefined);
    try {
      const res = await isAccountCreated(email);
      setCreated(res.created);
      setMessage(res.created ? "このメールは既にウォレット作成済みです" : "未作成です。作成できます。");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.FORM.ACCOUNT_CHECK_FAILED);
    }
  }

  async function onCreate() {
    setLoading(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const { requestId } = await createAccount(email);
      setMessage(`招待メールを送信しました（Request: ${requestId}）。メールに返信してください。`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.FORM.ACCOUNT_CREATE_FAILED);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">アカウント</h1>
      <AlertBanner message={error} />
      {message && <AlertBanner type="success" message={message} />}
      <div className="space-y-3">
        <label className="block text-sm font-medium">あなたのメール</label>
        <input className="w-full rounded border px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <div className="flex gap-2">
          <button onClick={onCheck} className="rounded bg-gray-900 text-white px-4 py-2">作成状況を確認</button>
          <button disabled={loading} onClick={onCreate} className="rounded bg-black text-white px-4 py-2 disabled:opacity-50">{loading ? "送信中..." : "招待メールを送る"}</button>
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="font-medium">進捗ガイド</h2>
        <ProgressSteps steps={["招待メール送付", "メール返信", "オンチェーン初期化"]} current={0} />
        <p className="text-xs text-gray-500">メールに返信すると、DKIM + ZK 検証ののちウォレットが作成されます。</p>
      </div>
    </div>
  );
}
