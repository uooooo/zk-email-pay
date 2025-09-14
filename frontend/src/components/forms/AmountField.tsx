"use client";
import React from "react";

export function AmountField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const parseAmount = (input: string): number | null => {
    const v = input.trim();
    if (!/^\d+(?:\.\d+)?$/.test(v)) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  
  const ok = value === "" || parseAmount(value) !== null;
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        inputMode="decimal"
        className="input"
        style={!ok ? { borderColor: '#f87171' } : {}}
      />
      {!ok && <p className="text-xs" style={{ color: '#dc2626' }}>正しい数値を入力してください。</p>}
    </div>
  );
}

