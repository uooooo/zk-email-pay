# Email Wallet - 実装制限事項と技術的制約

## 🔒 システム全体の制約

### 1. DKIM署名依存
**制約**: 全ての操作はメール認証（DKIM署名）に依存
```text
✅ サポートするメールプロバイダー:
- Gmail (推奨・最安定)
- Outlook/Hotmail
- Yahoo Mail
- カスタムドメイン (コスト増)

❌ サポートしないプロバイダー:
- DKIM署名なしメール
- 署名検証に失敗するプロバイダー
- 非標準のDKIM実装
```

**影響**: 
- メールプロバイダー変更時は新しいウォレット作成が必要
- DKIM鍵ローテーション時はIC Oracleが自動更新（数時間～数日のラグ）

### 2. Internet Computer依存
**制約**: DKIM鍵管理とOAuth機能にIC必須
```text
必須機能:
- DKIM公開鍵の検証・更新
- OAuth Ephemeral Transaction
- PSI（Private Set Intersection）機能

コスト:
- Gmail: ¥10-19/年（非常に低コスト）
- カスタムドメイン: 頻繁な鍵更新により大幅コスト増
```

### 3. ZK証明システム制約
**制約**: 外部Prover（Modal）への依存
```text
Prover要件:
- 高性能計算リソース（GPU推奨）
- 証明生成時間: 10-30秒
- 同時処理制限あり

回路の種類:
- account_creation: アカウント作成用
- email_sender: メール送信者認証用
```

## 📧 メール文法の制限事項

### 1. コマンド構文制限
```typescript
// 利用可能なコマンド
const VALID_COMMANDS = [
  "Send",      // トークン送金
  "Execute",   // 直接実行
  "Install",   // 拡張機能インストール  
  "Uninstall", // 拡張機能削除
  "Exit",      // ウォレット移譲
  "DKIM",      // DKIM設定変更
  "Safe"       // Safe操作
];

// パラメータ制約
const PARAMETER_LIMITS = {
  tokenAmount: "最大18桁精度（wei単位）",
  recipient: "メールアドレスまたは42文字Ethereumアドレス",
  string: "UTF-8文字列、改行含まず",
  address: "0x + 40文字16進数",
  uint: "最大2^256-1",
  amount: "小数点以下最大18桁"
};
```

### 2. 件名長制限
```text
制限:
- 最大長: 998文字（RFC 2822準拠）
- 推奨長: 78文字以下（表示互換性）
- エンコード: UTF-8（日本語対応）

例外処理:
- 長すぎる件名 → エラー返信
- 無効な文字 → エラー返信  
- 空の件名 → デフォルト処理
```

### 3. メール形式制約
```text
必須ヘッダー:
- From: 送信者アドレス（DKIM署名対象）
- To: リレイヤーアドレス
- Date: 送信日時
- Message-ID: 一意識別子

任意ヘッダー:
- Subject: コマンド指定
- Reply-To: 返信先指定
- In-Reply-To: リプライチェーン
```

## 🔌 REST API制限事項

### 1. レート制限
```typescript
const RATE_LIMITS = {
  create_account: "1回/分/IPアドレス",
  send: "10回/分/メールアドレス", 
  nft_transfer: "5回/分/メールアドレス",
  unclaim: "3回/分/メールアドレス",
  signup_or_in: "1回/5分/メールアドレス"
};
```

### 2. ペイロードサイズ制限
```typescript
const PAYLOAD_LIMITS = {
  max_json_size: "10KB",
  max_email_size: "25MB（標準メールサイズ）",
  max_attachment_size: "無制限（メール添付ファイル）",
  max_concurrent_requests: "100/リレイヤーインスタンス"
};
```

### 3. データ形式制約
```typescript
// 文字列検証パターン
const VALIDATION_PATTERNS = {
  email: /[a-zA-Z0-9!#$%&'*+-/=?^_`{|}~.]+@[a-zA-Z0-9]+\.[a-zA-Z0-9.-]+/,
  eth_address: /0x[0-9a-fA-F]{40}/,
  tx_hash: /0x[0-9a-fA-F]{64}/,
  amount: /[0-9]+(\.[0-9]+)?/,
  token_name: /[A-Z]+/
};
```

## ⛓️ ブロックチェーン制約

### 1. ガス制限
```solidity
// コントラクト別ガス消費量目安
contract GasEstimates {
    uint256 constant ACCOUNT_CREATION = 500_000;    // アカウント作成
    uint256 constant SEND_TRANSACTION = 200_000;    // 送金
    uint256 constant CLAIM_FUNDS = 300_000;         // 未請求資産請求
    uint256 constant INSTALL_EXTENSION = 400_000;   // 拡張機能インストール
    uint256 constant EXECUTE_CALL = 100_000;        // 直接実行（ベース）
}
```

### 2. トランザクション制限
```text
制限事項:
- ブロックガス制限: チェーン依存（通常30M gas）
- 最大データサイズ: ~128KB/トランザクション
- 同時実行: Nonceによる順次実行のみ
- 有効期限: 設定可能（デフォルト24時間）
```

### 3. 対応チェーン
```typescript
const SUPPORTED_CHAINS = {
  "mainnet": {
    chainId: 1,
    status: "production_ready",
    gas_price: "variable"
  },
  "base": {
    chainId: 8453,  
    status: "production_ready",
    gas_price: "low"
  },
  "base-sepolia": {
    chainId: 84532,
    status: "testnet",
    gas_price: "free"
  }
  // その他L2チェーンも対応可能
};
```

## 💾 データベース制約

### 1. PostgreSQL制限
```sql
-- テーブル行数制限（実用上の目安）
-- users: ~10M レコード
-- credentials: ~50M レコード  
-- email_logs: ~100M レコード（ローテーション推奨）

-- インデックスパフォーマンス
CREATE INDEX idx_users_email ON users(email_addr);
CREATE INDEX idx_credentials_account_code ON credentials(account_code);
```

### 2. ストレージ要件
```text
推定ストレージ使用量（10万ユーザー規模）:
- ユーザーデータ: ~100MB
- メールログ: ~10GB/年
- ZK証明データ: ~1GB/月（一時的）
- バックアップ: ~20GB/年

推奨構成:
- SSD: 最低100GB
- RAM: 8GB以上
- CPU: 4コア以上
```

## 🔐 セキュリティ制約

### 1. 暗号学的制限
```text
使用アルゴリズム:
- DKIM: RSA-2048, RSA-4096
- ZK-SNARKs: BN254曲線
- Poseidon Hash: 254bit フィールド要素

制約:
- RSA鍵長: 最小2048bit
- 楕円曲線: BN254のみサポート
- ハッシュ: Poseidon（zkSNARK最適化）
```

### 2. プライバシー制限
```text
秘匿可能な情報:
✅ メールアドレス（ZK証明内で秘匿）
✅ 送金金額の一部（拡張機能次第）
✅ 内部状態の詳細

公開される情報:
❌ ウォレットアドレス（オンチェーン）
❌ トランザクション存在（オンチェーン）
❌ タイムスタンプ（オンチェーン）
❌ 使用トークンとおおよその金額
```

## 🚀 スケーラビリティ制約

### 1. 処理能力上限
```text
単一リレイヤーインスタンスの限界:
- 同時接続: 1,000接続
- メール処理: 100通/分
- ZK証明生成: 20証明/分（Prover依存）
- データベース: 1,000 TPS

水平スケーリング:
- 複数リレイヤー: 可能（状態共有必要）
- 地理的分散: 困難（IC Oracle依存）
- ロードバランサー: セッション管理必要
```

### 2. 成長制約
```text
想定ユーザー規模別要件:
- 1K ユーザー: 単一インスタンス
- 10K ユーザー: DB分離、Prover専用化
- 100K ユーザー: 水平分散、CDN導入
- 1M ユーザー: マイクロサービス化必須
```

## 🛠️ 実装時の推奨事項

### 1. エラーハンドリング
```typescript
// 必須実装パターン
const ERROR_TYPES = {
  DKIM_VERIFICATION_FAILED: "DKIM署名検証失敗",
  INSUFFICIENT_BALANCE: "残高不足", 
  INVALID_RECIPIENT: "無効な宛先",
  RATE_LIMIT_EXCEEDED: "レート制限超過",
  PROOF_GENERATION_FAILED: "ZK証明生成失敗",
  CHAIN_CONGESTION: "チェーン混雑",
  IC_ORACLE_UNAVAILABLE: "IC Oracle接続失敗"
};
```

### 2. 監視・ロギング
```typescript
// 必須メトリクス
const REQUIRED_METRICS = [
  "email_processing_latency",
  "proof_generation_time", 
  "transaction_success_rate",
  "dkim_verification_rate",
  "ic_oracle_response_time",
  "database_connection_pool",
  "memory_usage",
  "cpu_utilization"
];
```

### 3. 運用制約
```text
必要な外部サービス:
✅ Internet Computer (fxmww-qiaaa-aaaaj-azu7a-cai)
✅ ZK Prover (Modal: zkemail--email-wallet-relayer-v1-2-0-flask-app)  
✅ RPC Provider (Alchemy, Infura等)
✅ SMTP Server (メール送信用)
✅ IMAP Server (メール受信用)

オプションサービス:
- TheGraph (イベント監視、PSI機能用)
- メトリクス収集 (Prometheus/Grafana)
- エラー報告 (Sentry)
```

このドキュメントを参考に、実装計画を立て、適切なリソース配分と制約事項の考慮を行ってください。