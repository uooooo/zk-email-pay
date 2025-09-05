# Frontend 統合ガイド - Email Wallet API

upstream email-wallet の REST API とフロントエンドアプリケーション（React/Next.js等）を統合するための完全ガイド。

## 🌐 API エンドポイント概要

Relayer Service は `localhost:4500` で以下の REST API を提供：

```
http://localhost:4500/api/
├── echo (GET)                    # Health check
├── stats (GET)                   # System statistics  
├── relayerEmailAddr (GET)        # Relayer email address
├── createAccount (POST)          # Account creation
├── isAccountCreated (POST)       # Account status check
├── getWalletAddress (POST)       # Get wallet address
├── send (POST)                   # Token transfer
├── nftTransfer (POST)            # NFT transfer
├── executeEphemeralTx (POST)     # Ephemeral transactions
├── signupOrIn (POST)             # OAuth integration
└── epheAddrStatus (POST)         # Ephemeral address status
```

## 🔧 基本設定

### API Client セットアップ

```typescript
// lib/emailWalletApi.ts
const API_BASE_URL = 'http://localhost:4500/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class EmailWalletAPI {
  private baseUrl: string;

  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('API request error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<string>> {
    return this.request<string>('/echo');
  }

  // Get relayer email address
  async getRelayerEmail(): Promise<ApiResponse<string>> {
    return this.request<string>('/relayerEmailAddr');
  }

  // Get system statistics
  async getStats(): Promise<ApiResponse<StatResponse>> {
    return this.request<StatResponse>('/stats');
  }
}

export const emailWalletApi = new EmailWalletAPI();
```

### TypeScript 型定義

```typescript
// types/emailWallet.ts

// Account Management
export interface CreateAccountRequest {
  email_addr: string;
}

export interface IsAccountCreatedRequest {
  email_addr: string;
}

export interface GetWalletAddressRequest {
  email_addr: string;
  account_code: string;
}

// Transactions
export interface SendRequest {
  email_addr: string;
  amount: string;
  token_id: string;
  recipient_addr: string;
  is_recipient_email: boolean;
}

export interface NFTTransferRequest {
  email_addr: string;
  nft_id: string;
  nft_addr: string;
  recipient_addr: string;
  is_recipient_email: boolean;
}

// OAuth Integration
export interface SignupOrInRequest {
  // OAuth-specific fields
}

export interface EpheAddrStatusRequest {
  request_id: string;
  signature: string;
}

export interface EpheAddrStatusResponse {
  is_activated: boolean;
  wallet_addr?: string;
  nonce?: number;
}

// System
export interface StatResponse {
  onboarding_token_distributed: number;
}

export interface ExecuteEphemeralTxRequest {
  wallet_addr: string;
  tx_nonce: number;
  ephe_addr: string;
  ephe_addr_nonce: number;
  target: string;
  eth_value: string;
  data: string;
  token_amount?: string;
  signature: string;
}
```

## 💼 主要機能の実装

### 1. アカウント管理

```typescript
// Account creation flow
export class AccountManager {
  async createAccount(email: string): Promise<ApiResponse<string>> {
    return emailWalletApi.request<string>('/createAccount', {
      method: 'POST',
      body: JSON.stringify({ email_addr: email }),
    });
  }

  async checkAccountExists(email: string): Promise<ApiResponse<boolean>> {
    return emailWalletApi.request<boolean>('/isAccountCreated', {
      method: 'POST',
      body: JSON.stringify({ email_addr: email }),
    });
  }

  async getWalletAddress(
    email: string, 
    accountCode: string
  ): Promise<ApiResponse<string>> {
    return emailWalletApi.request<string>('/getWalletAddress', {
      method: 'POST',
      body: JSON.stringify({ 
        email_addr: email, 
        account_code: accountCode 
      }),
    });
  }
}

export const accountManager = new AccountManager();
```

### 2. トランザクション処理

```typescript
// Transaction management
export class TransactionManager {
  async sendTokens(request: SendRequest): Promise<ApiResponse<string>> {
    return emailWalletApi.request<string>('/send', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async transferNFT(request: NFTTransferRequest): Promise<ApiResponse<string>> {
    return emailWalletApi.request<string>('/nftTransfer', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async executeEphemeralTransaction(
    request: ExecuteEphemeralTxRequest
  ): Promise<ApiResponse<string>> {
    return emailWalletApi.request<string>('/executeEphemeralTx', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

export const transactionManager = new TransactionManager();
```

### 3. OAuth 統合

```typescript
// OAuth integration for advanced features
export class OAuthManager {
  async signupOrSignIn(request: SignupOrInRequest): Promise<ApiResponse<string>> {
    return emailWalletApi.request<string>('/signupOrIn', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async checkEphemeralAddressStatus(
    requestId: string,
    signature: string
  ): Promise<ApiResponse<EpheAddrStatusResponse>> {
    return emailWalletApi.request<EpheAddrStatusResponse>('/epheAddrStatus', {
      method: 'POST',
      body: JSON.stringify({ 
        request_id: requestId, 
        signature: signature 
      }),
    });
  }

  // Polling for ephemeral address activation
  async waitForEphemeralAddressActivation(
    requestId: string,
    signature: string,
    maxAttempts = 30,
    intervalMs = 2000
  ): Promise<EpheAddrStatusResponse | null> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await this.checkEphemeralAddressStatus(requestId, signature);
      
      if (response.success && response.data?.is_activated) {
        return response.data;
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    return null;
  }
}

export const oauthManager = new OAuthManager();
```

## ⚛️ React Hooks の実装

### カスタムフック

```typescript
// hooks/useEmailWallet.ts
import { useState, useEffect } from 'react';
import { accountManager, transactionManager } from '../lib/emailWalletApi';

export function useAccount(email?: string) {
  const [account, setAccount] = useState<{
    exists: boolean;
    walletAddress?: string;
    loading: boolean;
    error?: string;
  }>({
    exists: false,
    loading: false,
  });

  useEffect(() => {
    if (!email) return;

    const checkAccount = async () => {
      setAccount(prev => ({ ...prev, loading: true }));
      
      const response = await accountManager.checkAccountExists(email);
      
      if (response.success) {
        setAccount({
          exists: response.data || false,
          loading: false,
        });
      } else {
        setAccount({
          exists: false,
          loading: false,
          error: response.error,
        });
      }
    };

    checkAccount();
  }, [email]);

  const createAccount = async () => {
    if (!email) return;
    
    setAccount(prev => ({ ...prev, loading: true }));
    const response = await accountManager.createAccount(email);
    
    if (response.success) {
      // Account creation initiated, user will receive email
      setAccount(prev => ({ ...prev, loading: false }));
      return response.data; // request_id
    } else {
      setAccount(prev => ({ 
        ...prev, 
        loading: false, 
        error: response.error 
      }));
    }
  };

  return {
    ...account,
    createAccount,
  };
}

export function useTransaction() {
  const [transaction, setTransaction] = useState<{
    loading: boolean;
    error?: string;
    requestId?: string;
  }>({
    loading: false,
  });

  const sendTokens = async (request: SendRequest) => {
    setTransaction({ loading: true });
    
    const response = await transactionManager.sendTokens(request);
    
    if (response.success) {
      setTransaction({
        loading: false,
        requestId: response.data,
      });
      return response.data;
    } else {
      setTransaction({
        loading: false,
        error: response.error,
      });
    }
  };

  return {
    ...transaction,
    sendTokens,
  };
}
```

## 📱 React コンポーネント例

### 送金フォーム

```tsx
// components/SendTokenForm.tsx
import React, { useState } from 'react';
import { useTransaction } from '../hooks/useEmailWallet';

export function SendTokenForm() {
  const [formData, setFormData] = useState({
    senderEmail: '',
    recipientEmail: '',
    amount: '',
    tokenId: 'USDC',
  });

  const { loading, error, requestId, sendTokens } = useTransaction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const request = {
      email_addr: formData.senderEmail,
      amount: formData.amount,
      token_id: formData.tokenId,
      recipient_addr: formData.recipientEmail,
      is_recipient_email: true,
    };

    const result = await sendTokens(request);
    if (result) {
      alert(`送金リクエストが作成されました。Request ID: ${result}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>送信者メールアドレス</label>
        <input
          type="email"
          value={formData.senderEmail}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            senderEmail: e.target.value
          }))}
          required
        />
      </div>

      <div>
        <label>受信者メールアドレス</label>
        <input
          type="email"
          value={formData.recipientEmail}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            recipientEmail: e.target.value
          }))}
          required
        />
      </div>

      <div>
        <label>金額</label>
        <input
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            amount: e.target.value
          }))}
          required
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? '送信中...' : '送金する'}
      </button>

      {error && <p className="text-red-500">エラー: {error}</p>}
      {requestId && (
        <p className="text-green-500">
          送金リクエストが作成されました！<br />
          メールをご確認ください。Request ID: {requestId}
        </p>
      )}
    </form>
  );
}
```

## 🔐 認証フロー

Email Wallet は主にメールベースの認証を使用：

1. **アカウント作成**:
   - `/api/createAccount` を呼び出し
   - ユーザーにメールが送信される
   - メール返信でアカウント確認

2. **トランザクション承認**:
   - `/api/send` を呼び出し
   - ユーザーにメールが送信される  
   - メール返信でトランザクション実行

3. **OAuth（高度な機能）**:
   - Ephemeral Address を使用
   - 署名ベースの認証

## 🎯 開発のベストプラクティス

### エラーハンドリング

```typescript
// utils/errorHandler.ts
export class EmailWalletError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'EmailWalletError';
  }
}

export function handleApiError(error: unknown): EmailWalletError {
  if (error instanceof EmailWalletError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new EmailWalletError(
      `API Error: ${error.message}`,
      'API_ERROR',
      error
    );
  }
  
  return new EmailWalletError(
    'Unknown API error occurred',
    'UNKNOWN_ERROR',
    error
  );
}
```

### ローディング状態管理

```typescript
// hooks/useAsyncOperation.ts
import { useState } from 'react';

export function useAsyncOperation<T>() {
  const [state, setState] = useState<{
    data?: T;
    loading: boolean;
    error?: string;
  }>({
    loading: false,
  });

  const execute = async (operation: () => Promise<T>) => {
    setState({ loading: true });
    
    try {
      const data = await operation();
      setState({ data, loading: false });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState({ loading: false, error: message });
      throw error;
    }
  };

  return { ...state, execute };
}
```

## 📊 デバッグ・監視

### API 呼び出しの監視

```typescript
// middleware/apiLogger.ts
export function withLogging<T extends (...args: any[]) => any>(fn: T): T {
  return ((...args: any[]) => {
    console.log(`API Call: ${fn.name}`, args);
    const start = Date.now();
    
    const result = fn(...args);
    
    if (result instanceof Promise) {
      return result
        .then((data) => {
          console.log(`API Success: ${fn.name} (${Date.now() - start}ms)`, data);
          return data;
        })
        .catch((error) => {
          console.error(`API Error: ${fn.name} (${Date.now() - start}ms)`, error);
          throw error;
        });
    }
    
    console.log(`API Success: ${fn.name} (${Date.now() - start}ms)`, result);
    return result;
  }) as T;
}
```

これで完全なフロントエンド統合が可能になります。メールベースの認証フローを理解し、適切なエラーハンドリングを実装することが重要です。