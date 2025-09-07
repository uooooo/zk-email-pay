"use client";

import React, { useState } from "react";
import { useEmail } from "@/lib/contexts/EmailContext";

interface EmailFieldProps {
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function EmailField({ 
  label = "あなたのメール", 
  placeholder = "you@example.com",
  required = false,
  className = "w-full rounded border px-3 py-2 text-sm"
}: EmailFieldProps) {
  const [localEmail, setLocalEmail] = useState("");
  const { email: savedEmail, setEmail: setSavedEmail, isLoading: emailLoading, error } = useEmail();
  
  // 保存されたメールアドレスがある場合は初期化
  React.useEffect(() => {
    if (savedEmail && !localEmail) {
      setLocalEmail(savedEmail);
    }
  }, [savedEmail, localEmail]);

  // 現在入力されているメールアドレス（保存済みまたはローカル入力）
  const currentEmail = localEmail || savedEmail || "";

  // フィールドからフォーカスが離れたときに保存
  const handleBlur = async () => {
    if (localEmail && localEmail !== savedEmail) {
      try {
        await setSavedEmail(localEmail);
      } catch (err) {
        console.error('Failed to save email:', err);
      }
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input 
        className={className}
        value={currentEmail} 
        onChange={(e) => setLocalEmail(e.target.value)} 
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={emailLoading}
        required={required}
        type="email"
      />
      {savedEmail && savedEmail !== localEmail && (
        <p className="text-xs text-gray-500">保存済み: {savedEmail}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">エラー: {error}</p>
      )}
    </div>
  );
}

// メールアドレスの値を取得するためのフック
export function useCurrentEmail() {
  const { email: savedEmail } = useEmail();
  const [localEmail, setLocalEmail] = useState("");
  
  React.useEffect(() => {
    if (savedEmail && !localEmail) {
      setLocalEmail(savedEmail);
    }
  }, [savedEmail, localEmail]);

  const currentEmail = localEmail || savedEmail || "";
  
  return {
    email: currentEmail,
    setEmail: setLocalEmail,
    hasEmail: !!currentEmail
  };
}