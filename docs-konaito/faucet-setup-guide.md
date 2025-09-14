# EmailWallet USDC Faucet セットアップガイド

EmailWalletユーザーが運営から無料でテスト用USDCを受け取ることができるFaucet機能の実装と設定方法について説明します。

## 📋 概要

### 実装したもの
1. **フロントエンド**: `/faucet` ページでメールアドレス入力フォーム
2. **バックエンドAPI**: `/api/faucet` エンドポイントで運営からのUSDC送金処理
3. **環境設定**: 運営秘密鍵とUSDCアドレスの管理
4. **リレイヤー連携**: registerUnclaimedFund APIとの自動連携

### フロー
1. ユーザーがフロントエンドでメールアドレスを入力
2. バックエンドが運営ウォレットから指定メールアドレス宛にUSDC送金をリレイヤーに依頼
3. リレイヤーがUnclaimedFundとして登録し、招待メールを送信
4. ユーザーがメールに返信してUSDCをクレーム

## 🔧 環境設定

### 1. 環境変数設定

`.env.local` ファイルを作成し、以下を設定：

```bash
# 既存の設定（フロントエンド公開）
NEXT_PUBLIC_RELAYER_API_URL=http://localhost:8080
NEXT_PUBLIC_RELAYER_EMAIL=zkemailpay@gmail.com
NEXT_PUBLIC_CORE_CONTRACT_ADDRESS=0xF60Ce6F85eebF6279784A7F1acB7653dDFEF86a3
NEXT_PUBLIC_CHAIN_ID=84532

# Gmail SMTP設定（バックエンドのみ）
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Faucet運営者設定（バックエンドのみ - 重要: 絶対に公開しないでください）
ADMIN_PRIVATE_KEY=0x1234567890abcdef...  # 運営者の秘密鍵
RPC_URL=https://sepolia.base.org  # Base Sepolia RPC URL
```

### 2. 運営ウォレットの準備

#### 2.1 専用ウォレットの作成
```bash
# 新しいウォレットを作成（推奨）
# MetaMaskまたはその他のウォレットで新しいアカウントを作成
# 秘密鍵をADMIN_PRIVATE_KEYとして設定
```

#### 2.2 USDCの準備
```bash
# Base Sepolia USDCアドレス
USDC_ADDRESS=0x3CA50b9B421646D0B485852A14168Aa8494D2877

# 運営ウォレットにUSDCを送金
# faucet配布用に十分な量（例：1000 USDC）を保持
```

### 3. セキュリティ設定

#### 3.1 秘密鍵の管理
- `ADMIN_PRIVATE_KEY` は絶対にGitにコミットしない
- 本番環境では環境変数またはシークレット管理システムを使用
- 定期的にウォレット残高を監視

#### 3.2 アクセス制限（推奨）
```typescript
// rate limiting追加例（将来の改善）
const DAILY_LIMIT_PER_EMAIL = 1; // 1日1回まで
const MAX_AMOUNT_PER_DAY = 100; // 1日最大100 USDC
```

## 🚀 使用方法

### ユーザー側の操作
1. `http://localhost:3000/faucet` にアクセス
2. メールアドレスを入力
3. 「USDCをクレームする」ボタンをクリック
4. 送信されるメールに返信してUSDCをクレーム

### 管理者側の監視
```bash
# 運営ウォレット残高確認
cast balance 0xYourAdminAddress --rpc-url https://sepolia.base.org

# USDC残高確認
cast call 0x3CA50b9B421646D0B485852A14168Aa8494D2877 \
  "balanceOf(address)" 0xYourAdminAddress \
  --rpc-url https://sepolia.base.org
```

## 📁 ファイル構成

```
frontend/
├── src/app/
│   ├── faucet/
│   │   └── page.tsx              # Faucetページ UI
│   ├── api/faucet/
│   │   └── route.ts              # Faucet APIエンドポイント
│   └── page.tsx                  # ホームページ（ナビゲーション）
├── .env.example                  # 環境変数テンプレート
└── .env.local                    # 実際の設定（Gitignore対象）
```

## 🔄 フロー詳細

### 1. フロントエンド処理 (`/faucet/page.tsx`)
```typescript
// メールアドレス入力
// バリデーション
// /api/faucetへPOSTリクエスト
// ステータス表示
```

### 2. バックエンド処理 (`/api/faucet/route.ts`)
```typescript
// 入力バリデーション
// 運営ウォレット残高確認
// リレイヤーAPIへregisterUnclaimedFund要求
// 成功/失敗レスポンス
```

### 3. リレイヤー処理 (既存システム)
```rust
// UnclaimedFund登録
// 招待メール送信
// クレーム処理待機
```

## ⚠️ 注意点

### セキュリティ
- 運営秘密鍵は厳重に管理
- rate limitingの実装を推奨
- 残高監視アラートの設定

### 運用
- 定期的な残高補充
- ユーザーサポート体制
- ログ監視とエラー対応

### スケーラビリティ
- 大量アクセス時の負荷分散
- データベースでのリクエスト履歴管理
- 自動化されたウォレット管理

## 🐛 トラブルシューティング

### よくある問題

#### 1. ADMIN_PRIVATE_KEY設定エラー
```bash
Error: 運営秘密鍵が設定されていません
→ .env.localでADMIN_PRIVATE_KEYを設定
```

#### 2. USDC残高不足
```bash
Error: 運営のUSDC残高が不足しています
→ 運営ウォレットにUSDCを追加送金
```

#### 3. リレイヤーAPI接続エラー
```bash
Error: リレイヤーでのUnclaimedFund登録に失敗
→ NEXT_PUBLIC_RELAYER_API_URLを確認
→ リレイヤーサーバーの稼働状況を確認
```

## 📈 今後の改善案

1. **rate limiting**: 同一メールアドレスからの連続リクエスト制限
2. **管理者ダッシュボード**: 配布状況の可視化
3. **自動残高管理**: 残高低下時のアラート
4. **複数トークン対応**: USDC以外のトークンFaucet
5. **KYC連携**: アカウント認証との連携

## 📞 サポート

問題が発生した場合は、以下を確認してください：
- 環境変数の設定
- 運営ウォレット残高
- リレイヤーサーバーの稼働状況
- ネットワーク接続

それでも解決しない場合は、ログファイルと共にサポートまでお問い合わせください。