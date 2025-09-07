import { createClient } from "./client";

export interface EmailWalletUser {
  id: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

// メールアドレス管理のためのユーティリティ関数群
export class UserEmailManager {
  private static instance: UserEmailManager;
  private supabase = createClient();
  private currentEmail: string | null = null;

  static getInstance(): UserEmailManager {
    if (!UserEmailManager.instance) {
      UserEmailManager.instance = new UserEmailManager();
    }
    return UserEmailManager.instance;
  }

  // 現在のセッションを取得（anonymous）
  async getSession() {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    
    if (!session) {
      // Anonymous ログインを実行
      const { data, error: signInError } = await this.supabase.auth.signInAnonymously();
      if (signInError) {
        console.error('Anonymous sign in failed:', signInError);
        throw signInError;
      }
      return data.session;
    }
    
    return session;
  }

  // ユーザー情報をDBから取得または作成
  async getOrCreateUser(): Promise<EmailWalletUser> {
    const session = await this.getSession();
    if (!session) {
      throw new Error('No session available');
    }

    // 既存ユーザー確認
    const { data: existingUser } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (existingUser) {
      return existingUser;
    }

    // 新規ユーザー作成
    const { data: newUser, error } = await this.supabase
      .from('users')
      .insert({
        id: session.user.id,
        email: null, // 初期状態では未設定
      })
      .select()
      .single();

    if (error) {
      console.error('User creation failed:', error);
      throw error;
    }

    return newUser;
  }

  // メールアドレスを設定/更新
  async setEmail(email: string): Promise<void> {
    const session = await this.getSession();
    if (!session) {
      throw new Error('No session available');
    }

    const { error } = await this.supabase
      .from('users')
      .upsert({
        id: session.user.id,
        email: email,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Email update failed:', error);
      throw error;
    }

    this.currentEmail = email;
  }

  // 現在設定されているメールアドレスを取得
  async getEmail(): Promise<string | null> {
    if (this.currentEmail) {
      return this.currentEmail;
    }

    const user = await this.getOrCreateUser();
    this.currentEmail = user.email || null;
    return this.currentEmail;
  }

  // メールアドレスが設定されているかチェック
  async hasEmail(): Promise<boolean> {
    const email = await this.getEmail();
    return !!email;
  }

  // メールアドレスをクリア
  async clearEmail(): Promise<void> {
    const session = await this.getSession();
    if (!session) {
      throw new Error('No session available');
    }

    const { error } = await this.supabase
      .from('users')
      .update({
        email: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id);

    if (error) {
      console.error('Email clear failed:', error);
      throw error;
    }

    this.currentEmail = null;
  }

  // 現在のユーザーIDを取得
  async getUserId(): Promise<string | null> {
    const session = await this.getSession();
    return session?.user.id || null;
  }
}

// 便利な関数として export
export const userEmailManager = UserEmailManager.getInstance();

// React Hook として使用するためのユーティリティ
export async function getCurrentEmail(): Promise<string | null> {
  return userEmailManager.getEmail();
}

export async function setCurrentEmail(email: string): Promise<void> {
  return userEmailManager.setEmail(email);
}

export async function hasCurrentEmail(): Promise<boolean> {
  return userEmailManager.hasEmail();
}