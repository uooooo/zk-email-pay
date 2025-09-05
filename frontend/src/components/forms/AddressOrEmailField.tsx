"use client";
import React from "react";
import { isEmail, isHexAddress } from "@/lib/validators";

export function AddressOrEmailField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const valid = isEmail(value) || isHexAddress(value) || value.length === 0;
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="alice@example.com or 0x..."
        className={`w-full rounded border px-3 py-2 text-sm outline-none focus:ring ${valid ? "border-gray-300" : "border-red-400"}`}
      />
      {!valid && <p className="text-xs text-red-600">有効なメールまたは 0x アドレスを入力してください。</p>}
    </div>
  );
}

