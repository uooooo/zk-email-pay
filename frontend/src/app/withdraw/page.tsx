"use client";
import React, { useState } from "react";
import { AmountField } from "@/components/forms/AmountField";
import { AlertBanner } from "@/components/feedback/AlertBanner";
import { isHexAddress } from "@/lib/validators";
import { sendRequest } from "@/lib/api/relayer";
import { useRouter } from "next/navigation";
import { ERROR_MESSAGES } from "@/lib/constants";

export default function WithdrawPage() {
  const [email, setEmail] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("USDC");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const canSubmit = !!email && isHexAddress(to) && !!amount;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(undefined);
    try {
      const { requestId } = await sendRequest({
        email_addr: email,
        amount,
        token_id: token,
        recipient_addr: to,
        is_recipient_email: false,
      });
      router.push(`/status/${requestId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.FORM.SEND_FAILED);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">引き出し（外部アドレスへ送金）</h1>
      <AlertBanner message={error} />
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">あなたのメール</label>
          <input className="w-full rounded border px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium">外部アドレス（0x…）</label>
          <input className="w-full rounded border px-3 py-2 text-sm" value={to} onChange={(e) => setTo(e.target.value)} placeholder="0x..." />
        </div>
        <AmountField label="金額" value={amount} onChange={setAmount} />
        <div className="space-y-1">
          <label className="block text-sm font-medium">トークン</label>
          <select className="w-full rounded border px-3 py-2 text-sm" value={token} onChange={(e) => setToken(e.target.value)}>
            <option value="USDC">USDC</option>
            <option value="ETH">ETH</option>
          </select>
        </div>
        <button disabled={!canSubmit || loading} className="rounded bg-black text-white px-4 py-2 disabled:opacity-50">{loading ? "送信中..." : "送信メールを作成"}</button>
      </form>
      <p className="text-xs text-gray-500">Relayer から届くメールに返信するとオンチェーン実行されます。</p>
    </div>
  );
}

