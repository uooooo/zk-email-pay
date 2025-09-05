"use client";
import React from "react";
import { parseAmount } from "@/lib/validators";

export function AmountField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const ok = value === "" || parseAmount(value) !== null;
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        inputMode="decimal"
        className={`w-full rounded border px-3 py-2 text-sm outline-none focus:ring ${ok ? "border-gray-300" : "border-red-400"}`}
      />
      {!ok && <p className="text-xs text-red-600">正しい数値を入力してください。</p>}
    </div>
  );
}

