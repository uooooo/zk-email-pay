"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { userEmailManager } from "@/lib/supabase/user";

interface EmailContextType {
  email: string | null;
  setEmail: (email: string) => Promise<void>;
  clearEmail: () => Promise<void>;
  hasEmail: boolean;
  isLoading: boolean;
  error: string | null;
}

const EmailContext = createContext<EmailContextType | null>(null);

export function EmailProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmailState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初期化時にメールアドレスを読み込み
  useEffect(() => {
    async function initializeEmail() {
      try {
        setIsLoading(true);
        setError(null);
        const currentEmail = await userEmailManager.getEmail();
        setEmailState(currentEmail);
      } catch (err) {
        console.error('Failed to initialize email:', err);
        setError(err instanceof Error ? err.message : 'メールアドレスの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    }

    initializeEmail();
  }, []);

  const setEmail = async (newEmail: string) => {
    try {
      setError(null);
      await userEmailManager.setEmail(newEmail);
      setEmailState(newEmail);
    } catch (err) {
      console.error('Failed to set email:', err);
      setError(err instanceof Error ? err.message : 'メールアドレスの保存に失敗しました');
      throw err;
    }
  };

  const clearEmail = async () => {
    try {
      setError(null);
      await userEmailManager.clearEmail();
      setEmailState(null);
    } catch (err) {
      console.error('Failed to clear email:', err);
      setError(err instanceof Error ? err.message : 'メールアドレスの削除に失敗しました');
      throw err;
    }
  };

  const value: EmailContextType = {
    email,
    setEmail,
    clearEmail,
    hasEmail: !!email,
    isLoading,
    error,
  };

  return <EmailContext.Provider value={value}>{children}</EmailContext.Provider>;
}

export function useEmail() {
  const context = useContext(EmailContext);
  if (!context) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
}