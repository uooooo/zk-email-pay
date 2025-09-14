"use client";
import React from "react";

export function AddressOrEmailField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const isEmail = (input: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
  };
  
  const isHexAddress = (input: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(input.trim());
  };
  
  const valid = isEmail(value) || isHexAddress(value) || value.length === 0;
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="alice@example.com or 0x..."
        className="input"
        style={!valid ? { borderColor: '#f87171' } : {}}
      />
      {!valid && <p className="text-xs" style={{ color: '#dc2626' }}>有効なメールまたは 0x アドレスを入力してください。</p>}
    </div>
  );
}

