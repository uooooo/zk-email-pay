## zk-email-pay 運営向けアーキテクチャコンポーネント

本書は、運営（SRE/プラットフォーム/セキュリティ/開発支援）が構築・運用すべきコンポーネントを体系化したものです。`vendor/email-wallet` の設計（Relayer/Prover/Contracts）と本プロジェクトの方針（docs/task ほか）に基づき、dev/stg/prod を前提に記述します。

### 全体像（論理アーキテクチャ）
ユーザのメール → SMTP/IMAP → Relayer → Prover（ZK 証明生成）→ L1/L2 RPC → Email Wallet Contracts → 結果通知メール／フロントエンド参照（Subgraph 経由）。

- 外部境界: DNS/MX/SPF/DKIM/DMARC、RPC プロバイダ、The Graph、オブジェクトストレージ、監視基盤。
- 信頼境界: Relayer キーと DKIM 秘密鍵は KMS/HSM 管理。PII は DB やログでマスキング/コミット化。

### コアコンポーネント
1) フロントエンド（Next.js, Vercel）
- 役割: 送金 UI、履歴/ステータス表示、Relayer/API ヘルス可視化。
- 管理: `frontend/`、`NEXT_PUBLIC_*` のみ公開。各環境に独立デプロイ（Vercel Project 分離）。

2) スマートコントラクト（Foundry）
- 役割: `EmailWalletCore`/`Wallet`/Handlers/Extensions/Verifiers。環境別にアドレス固定管理。
- 運用: 一括デプロイ推奨、`RelayerHandler` 登録、`TokenRegistry` 初期化（scripts）。アップグレードの手順/承認フロー整備。

3) Relayer サービス（Rust + Node 資産）
- 役割: メール受信、DKIM 検証、Prover 連携、オンチェーン実行、通知。
- 実装参照: `vendor/email-wallet/packages/relayer`。
- 運用: `.env` にコアアドレス/RPC/メール/DB/Prover/料金設定。水平スケール（1 受信箱＝1 アクティブワーカー原則）、rate-limit、idempotent 処理、キュー導入可。

4) Prover サービス（ZK 証明生成）
- 役割: Circom 回路に対する証明生成。vkey/zkey キャッシュ、ジョブキュー化。
- 実装参照: `packages/prover`。Modal など FaaS も可。
- 運用: ワーカー自動スケール、再実行/タイムアウト/リトライ、成果物の短期保存（オブジェクトストレージ）。

5) データベース（PostgreSQL）
- 役割: アカウント・ジョブ・イベント状態管理（PII はコミット/ポインタ保存）。
- 運用: 監視/バックアップ（PITR）、暗号化（At-Rest/TLS）、マイグレーション管理、環境分離。

6) サブグラフ（The Graph）
- 役割: Contract イベントのクエリ/集約。Relayer の PSI 通信や UI 表示に活用。
- 運用: API Key 管理、バージョン/スキーマのロールアウト手順。

7) RPC プロバイダ（Alchemy/Infura など）
- 役割: トランザクション送信/読み取り。フェイルオーバー設定（プライマリ/セカンダリ）。
- 運用: レート/コスト監視、チェーン別に URL/CHAIN_ID 管理、緊急切替手順。

8) メール基盤（SMTP/IMAP）
- 役割: 入力チャネル。専用ドメイン/受信箱、SMTP 送信での結果通知。
- 運用: DNS（MX/ SPF/ DKIM/ DMARC）整備、レピュテーション/スパム対策、バウンス処理、受信レート制限、TLS 強制、監査ログ。

9) シークレット/鍵管理（KMS/HSM + Vault）
- 対象: Relayer 送信用 EOA 秘密鍵、DKIM 秘密鍵、SMTP/IMAP 資格情報、RPC/Graph API Keys、Modal Tokens。
- 運用: ローテーション計画、最小権限、監査ログ、ブレークグラス手順、`.env` 自動注入（CI/CD と統合）。

10) オブザーバビリティ（ログ/メトリクス/アラート）
- ログ: 構造化 JSON、PII マスキング、相関 ID。保存期間/検索性。
- メトリクス: 証明レイテンシ、受信→投稿までの時間、Tx 成功率、ガス単価乖離、メール受信率、失敗原因分布。
- アラート: SLO/SLA 違反、連続失敗、キュー滞留、RPC/SMTP 障害、ブロック進行停止。

11) CI/CD
- コード: GitHub Actions（lint/test/build）。
- コンテナ: Docker Buildx、レジストリ（GHCR/ECR/GCR）。
- 配置: Vercel（FE）、Kubernetes or Compose（Relayer/Prover/DB/SMTP/IMAP）。`vendor/email-wallet/kubernetes` 参照。
- リリース: バージョンタグ `vX.Y.Z`、環境プロモーション、ロールバック指針。

12) セキュリティコントロール
- ネットワーク: WAF、IP allowlist、Egress 制御、メール受信ポートの DDoS 緩和。
- アプリ: 入力検証、リプレイ防止、署名/証明のキャッシュ不一致検知、レート制限。
- データ: PII 最小化、暗号化、監査証跡、削除/匿名化の手順。

13) 運用ユーティリティ
- レジストリ管理: `packages/scripts` のトークンリスト投入など。
- 手動オペ: ジョブ再投入、証明再試行、ペイロード検査、メール再送。
- ツール: 監視ダッシュボード、インシデントテンプレ、Runbook。

### 推奨デプロイトポロジー
- Small（開発/PoC）:
  - `docker compose` で Postgres/SMTP/IMAP/Relayer/Prover を同一ホストに。Vercel で FE。外部 RPC と The Graph。
- Production（本番）:
  - K8s（Relayer/Prover/SMTP/IMAP は Stateful/Deployment 分離、HPA/PodDisruptionBudget）、マネージド Postgres、オブジェクトストレージ（zkey/証明キャッシュ）、Secrets は KMS + External Secrets、複数 AZ、CDN/Anycast。
  - フェイルオーバー: 受信箱の冗長化、二次 RPC、二次 Prover プール。

### ネットワーク/信頼境界
- Public: DNS/MX、SMTP/IMAP、HTTP(S) API、RPC/Graph。
- Private: Relayer⇄Prover、Relayer⇄DB、Secrets、KMS/HSM。
- ポリシー: 最小到達性（SG/NSG）、TLS/MTLS、監査ログ（誰が何にアクセスしたか）。

### ストレージ/バックアップ
- DB: PITR、暗号化、リージョン間バックアップ、演習（リストア DR テスト）。
- zkey/vkey/証明成果物: バージョニングと整合性ハッシュ、短期保存、リーク防止。
- ログ: ライフサイクル（ホット→ウォーム→コールド→削除）。

### SLO と主要メトリクス（例）
- p95 証明レイテンシ: ≤ 60s（email_sender）
- 受信→オンチェーン確定 p95: ≤ 120s（L2 前提）
- Tx 成功率（検証通過後）: ≥ 99.5%
- 失敗メール比率（1h 移動平均）: ≤ 1.0%
- アラート初動: ≤ 10 分、回復: ≤ 30 分

### ランブック（概要）
- 連続失敗: 直近ロールアウト/依存（RPC/SMTP）を確認→キュー停止→サーキットブレーカ発動→原因別にロールバック/切替。
- キー漏えい疑義: Relayer EOA 廃止→KMS キー無効化→Contracts の fee 設定/Relayer 再登録→監査。
- DKIM ローテーション: DNS 公開鍵切替→新旧鍵の重複受付期間→Relayer 設定更新。
- チェーン障害: 代替 RPC/代替 L2 へフェイルオーバー（必要時は「メール受付のみ維持」モード）。

### 環境変数チェックリスト（抜粋）
- チェーン: `RPC_URL`/`CHAIN_ID`、`CORE_CONTRACT_ADDRESS`、`RELAYER_HANDLER`、`ONBOARDING_TOKEN_ADDR`
- メール: `IMAP_*`/`SMTP_*`、`RELAYER_EMAIL_ADDR`、`RELAYER_HOSTNAME`
- Prover: `PROVER_ADDRESS`、`CIRCUITS_DIR_PATH`、`INPUT_FILES_DIR_PATH`
- 料金: `FEE_PER_GAS`、上限はコントラクト `maxFeePerGas`
- 外部: `SUBGRAPH_URL`、`MODAL_TOKEN_*`、RPC/Graph API Keys
- 運用: `JSON_LOGGER`、`WEB_SERVER_ADDRESS`、`DATABASE_URL`

### 将来拡張
- マルチチェーン/マルチリレーヤ構成、証明のバッチ化、AA 連携、Proof 生成の GPU 最適化、料金ダイナミクス自動化。

参考：`vendor/email-wallet/README.md` `DESIGN.md` `packages/{relayer,prover,contracts}/README.md`
