"use client";
import React, { useState } from "react";
import { AlertBanner } from "@/components/feedback/AlertBanner";
import { claimUnclaim } from "@/lib/api/relayer";

export default function ClaimPage() {
  const [email, setEmail] = useState("");
  const [random, setRandom] = useState("");
  const [txHash, setTxHash] = useState("");
  const [expiry, setExpiry] = useState("");
  const [isFund, setIsFund] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [ok, setOk] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    setOk(undefined);
    try {
      const res = await claimUnclaim({
        email_address: email,
        random,
        expiry_time: Number(expiry || 0),
        is_fund: isFund,
        tx_hash: txHash,
      });
      setOk(res.message || "クレームを受け付けました");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "クレームに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">未請求のクレーム</h1>
      <AlertBanner message={error} />
      <AlertBanner type="success" message={ok} />
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">あなたのメール</label>
          <input className="w-full rounded border px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium">random（0x..）</label>
          <input className="w-full rounded border px-3 py-2 text-sm" value={random} onChange={(e) => setRandom(e.target.value)} placeholder="0x..." />
        </div>
        <div>
          <label className="block text-sm font-medium">tx_hash（0x..）</label>
          <input className="w-full rounded border px-3 py-2 text-sm" value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="0x..." />
        </div>
        <div>
          <label className="block text-sm font-medium">expiry_time（UNIX 秒）</label>
          <input className="w-full rounded border px-3 py-2 text-sm" value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="1700000000" />
        </div>
        <div className="flex gap-4 items-center">
          <label className="text-sm">種別:</label>
          <label className="text-sm flex items-center gap-1"><input type="radio" checked={isFund} onChange={() => setIsFund(true)} /> fund</label>
          <label className="text-sm flex items-center gap-1"><input type="radio" checked={!isFund} onChange={() => setIsFund(false)} /> state</label>
        </div>
        <button disabled={loading} className="rounded bg-black text-white px-4 py-2 disabled:opacity-50">{loading ? "送信中..." : "クレーム送信"}</button>
      </form>
      <p className="text-xs text-gray-500">random は送金時に生成されたコミット乱数です。安全な経路で共有された値を入力してください。</p>
    </div>
  );
}

