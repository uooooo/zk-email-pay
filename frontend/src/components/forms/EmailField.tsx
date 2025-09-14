"use client";

import React from "react";

interface EmailFieldProps {
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  value: string;
  onChange: (value: string) => void;
}

export function EmailField({ 
  label = "あなたのメール", 
  placeholder = "you@example.com",
  required = false,
  className = "input",
  value,
  onChange
}: EmailFieldProps) {
  const isValid = value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
        {label}
        {required && <span className="ml-1" style={{ color: '#dc2626' }}>*</span>}
      </label>
      <input 
        className={className}
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder}
        required={required}
        type="email"
        style={!isValid ? { borderColor: '#f87171' } : {}}
      />
      {!isValid && (
        <p className="text-xs" style={{ color: '#dc2626' }}>有効なメールアドレスを入力してください</p>
      )}
    </div>
  );
}