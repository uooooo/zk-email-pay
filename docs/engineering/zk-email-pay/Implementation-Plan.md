# 実装手順ガイド v2（Upstream Direct Adoption: email-wallet）

本書は v2 方針（zkemail/email-wallet を**直接採用**）で、完全なシステムをそのまま活用する実装計画です。v1（POC/自前実装）の資料は `docs/product/zk-email-pay/` を参照（Legacy）。

参考（上流）
- email-wallet monorepo（contracts/relayer/circuits）
- 上流ドキュメント: https://docs.zk.email/email-wallet/
- 参照ノート: `docs/engineering/zk-email-pay/research/*`

---

## 0. 前提と決定事項
- **方針変更**: 上流 email-wallet システム（contracts/relayer/prover）を**直接使用**。再実装せず既存システムを活用。
- **採用範囲**: email-wallet の全コンポーネント（packages/contracts, packages/relayer, packages/prover）
- **差別化領域**: UX改善（フロントエンド、メールテンプレート、ユーザーフロー）に集中
- **運用基盤**: Docker（relayer）+ Modal（prover）+ PostgreSQL（DB）

---

## 1. システム構成（upstream 完全採用）
目的: email-wallet の完全なシステムをそのままデプロイし、プロダクション環境で運用。

### システム構成要素
- **Smart Contracts**: EmailWalletCore, Handler群, Extensions, Verifiers
- **Relayer Service**: Rust製、SMTP/IMAP監視、ZK証明検証、トランザクション実行
- **Prover Service**: Python製、Modal serverless、ZK証明生成
- **Infrastructure**: PostgreSQL DB、SMTP/IMAPサーバ

### デプロイ手順
1) **Contracts デプロイ**
- `email-wallet/packages/contracts/` で `DefaultSetupScript.s.sol` 実行
- 全コントラクト（Core/Handlers/Registries/Verifiers）を一括デプロイ
- アドレスを `addresses/<network>.json` に記録

2) **Relayer デプロイ**
- Docker イメージビルド・起動
- `.env` 設定（contract addresses, SMTP/IMAP, DB接続）
- Relayer 登録（on-chain）

3) **Prover セットアップ**
- Modal tokens設定
- Circuit keys ダウンロード
- Modal serverless 起動

---

## 2. 開発・運用環境
- **ローカル開発**: anvil + Docker Compose（PostgreSQL/SMTP/IMAP）
- **テスト環境**: Base Sepolia testnet 
- **プロダクション**: Base mainnet
- **設定管理**: `addresses/<network>.json`、`.env` ファイル

---

## 3. マイルストーン（簡素化）
- **M1**: upstream システム完全デプロイ（local環境）
- **M2**: ローカル e2e テスト（メール送信→受取）完了
- **M3**: Base Sepolia testnet デプロイ・テスト
- **M4**: フロントエンド統合・UX改善
- **M5**: Base mainnet プロダクション運用開始

---

## 4. 差別化・付加価値領域
- **UX改善**: 直感的なフロントエンドUI/UX
- **メールテンプレート**: 日本語対応、分かりやすい文面
- **ユーザーフロー**: オンボーディング、エラーハンドリング最適化
- **運用監視**: メトリクス、ログ、アラート
- **サポート**: ドキュメント、FAQ、トラブルシューティング

**重要**: システム再実装ではなく、UX・運用面での差別化に注力することで開発リスクを大幅削減し、ユーザー価値向上に集中。
