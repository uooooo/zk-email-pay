## 我々が「実装・ホスティング」すべきもの（環境別の整理）

本プロジェクト（zk-email-pay + vendor/email-wallet）において、開発者が環境ごとに「自分が作るもの」と「公開デプロイを使えるもの」を明確化します。公式が提供するテストネット用の公開デプロイ/ホステッド API は、開発〜検証での利用を前提とし、本番は自前運用を基本とします。

---

## 開発/検証（dev/stg）

### 僕が作るもの
- フロントエンド（`frontend/` Next.js）
  - 送金 UI、状態表示、エラー/トースト統一。
  - 公開 Relayer API へのクライアント実装（必要なら薄い API アダプタ）。
- ドキュメント/設定
  - `.env.local`（公開値は `NEXT_PUBLIC_*`）、`textbook/` の利用手順、補助スクリプト（CSV 招待など任意）。

### 公開デプロイを使えるもの
- テストネットにデプロイ済みの Email Wallet コントラクト。
- ホステッド Relayer API（`/api/createAccount` `/api/isAccountCreated` `/api/send` `/api/unclaim` など）。
- 公開の zkey/vkey／The Graph／RPC（API Key で利用）。

### `.env.local` 例
```
NEXT_PUBLIC_RELAYER_API_URL=<提供APIのベースURL>
NEXT_PUBLIC_CORE_CONTRACT_ADDRESS=<公開済みコントラクトアドレス>
NEXT_PUBLIC_CHAIN_ID=<テストネットのChain ID>
```

### 注意
- レート制限・保持方針・SLA は提供側ポリシーに従う。
- コントラクトアドレス/エンドポイントは公式ドキュメントの最新を参照（本ファイルには固定値を記載しない）。

---

## 本番（prod）

### 僕が作るもの
- Relayer（`vendor/email-wallet/packages/relayer`）
  - メール受信→ZK 入力生成→Prover 呼び出し→オンチェーン投稿→通知メール。
  - レート制限、手数料ポリシー、テンプレ/ドメイン運用、監視/アラート。
- Prover（`packages/prover`）
  - 証明生成ワーカー群（自前 or FaaS でも鍵/トークンは自社管理）。
- データベース（PostgreSQL）
  - 暗号化（At-Rest/TLS）・PITR・監視・マイグレーション。
- メール基盤
  - 専用ドメインの DKIM/DMARC、受信箱、送信（バウンス/スパム対策）。
- Secrets/鍵管理
  - KMS/HSM + Vault（Relayer EOA、DKIM、SMTP/IMAP、RPC/Graph、Modal など）。
- コントラクト
  - 選定チェーンへの自社デプロイ、アドレス/ABI/回路のバージョン固定、CI/CD と監視。
- フロントエンド
  - Vercel などでホストしつつ、自社 Relayer/API を参照。

### 公開デプロイを使えるもの（本番で許容）
- RPC プロバイダ（Infura/Alchemy 等）
- The Graph（API Key）
- オブジェクトストレージ（zkey/vkey/一時成果物）

### 公開デプロイの本番利用が非推奨なもの
- ホステッド Relayer API（鍵・PII・SLA・バージョン統制の観点）
- 公開テストネット用コントラクト（アドレス変更/仕様差分/スループット制約）

### 最小本番構成（例）
- K8s: Relayer/Prover 分離、HPA、PDB、複数 AZ。
- マネージド Postgres（PITR/自動バックアップ）。
- KMS/HSM + External Secrets（DKIM/EOA キー）。
- 専用メールドメイン、フェイルオーバー（二次 RPC/Prover/受信箱）。
- ダッシュボード（証明 p95、受信→確定時間、失敗率）。

---

## 運用境界と責任
- 自社責務: メール→証明→オンチェーンの信頼境界（Relayer/Prover/DB/Secrets/メール）。
- 外部依存: Vercel/RPC/Graph/S3 等の可用性・SLA 管理と安全な鍵利用。

---

## 公式デプロイ/API の参照
- 最新の「公開コントラクトアドレス」「Relayer API ベース URL」は公式ドキュメントの最新を参照（テストネット/バージョンで更新あり）。
- 本番移行時は、検証用の公開環境から自前デプロイへ切替え、アドレスと API エンドポイントを環境変数で分離管理します。

更新: 2025-09-04
