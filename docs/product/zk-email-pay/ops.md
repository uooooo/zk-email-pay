# 運用/テレメトリ/設定

## 設定（例）
- チェーン: `CHAIN_ID`, `CHAIN_RPC_PROVIDER`
- コアアドレス: `CORE_CONTRACT_ADDRESS`, `TOKEN_REGISTRY`, `DKIM_REGISTRY`, `PRICE_ORACLE`
- リレーヤー: `PRIVATE_KEY`, `RELAYER_EMAIL_ADDR`, `RELAYER_HOSTNAME`
- Prover: `PROVER_LOCATION`, `PROVER_ADDRESS`
- メール: `IMAP_*`, `SMTP_*`, `LOGIN_ID`, `LOGIN_PASSWORD`
- DB: `DATABASE_URL`
- 料金: `FEE_PER_GAS`, `ONBOARDING_*`

## 監視/メトリクス
- メール: 送信成功率、受信遅延、DKIM失敗率、再試行回数
- 証明: 証明生成時間、失敗率、キュー滞留
- チェーン: Tx 成功率、確定遅延、ガス単価
- ビジネス: 送金完了率、取消率、期限切れ率

## ログ/トレース
- 相関IDでメール→ジョブ→証明→TXを紐付け
- 個人情報はマスキング/ハッシュ

## 運用フロー（例）
- インシデント検知→影響評価→ロールバックorキュー停止→告知（ステータスページ）
- DKIM鍵更新時はカナリアテスト→段階展開

## MCP/Context7（開発体制）
- Serena MCP server を用いて設計/実装コンテキストを共有（仕様/決定のトレーサビリティ）。
- Context7 を用いて外部ドキュメント（ERC-4337、DKIM、Email Wallet）を参照し、仕様差分を早期検出。

