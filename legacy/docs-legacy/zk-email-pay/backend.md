# バックエンド/リレーヤー/メール連携/ガスレス

## 概要
- リレーヤーはメール（IMAP/SMTP）とブロックチェーンの橋渡し。Prover と連携しZK証明を生成、コントラクトへトランザクション送信（ガス肩代わり）。
- 参考: `docs/zkemail/zkemail-emailwallet/docs.zk.email_email-wallet_relayer-infrastructure_overview.md` および API ドキュメント。

## コンポーネント
- IMAP/SMTP 連携:
  - 受信: 受取/返信メールの取得（特定件名/キーワードトリガ）。
  - 送信: 招待/完了/失敗通知メールの配信。
- API サーバ:
  - Webフロントからの `/api/send`, `/api/createAccount`, `/api/isAccountCreated`, `/api/getWalletAddress`, `/api/nftTransfer` 等を提供（Email Wallet 準拠）。
- Prover 連携:
  - ローカル/Modal 等。`email_sender.circom`, `claim.circom`, `account_*` の証明生成。
- チェーン接続:
  - RPC Provider, コントラクトアドレス群, Price Oracle。
- DB（PostgreSQL）:
  - アカウント作成状態、Unclaimedのオフチェーンメタ、メール配信ログ、レート制限情報。

## ガスレス/料金
- `FEE_PER_GAS`（環境値）と `IPriceOracle` に基づく見積。MVPは固定手数料でも可。
- 料金回収:
  - 送金作成時に差引、または送金元Walletから別途徴収。
  - 上限/キャンペーンは `.env`（ONBOARDING_TOKEN_*）で配布可能（Email Wallet 仕様に準拠）。

## メールテンプレ/パーサ
- 招待メール: 受取手順、`accountKey`、期限、サポート導線。
- 返信メール: 件名に `Claim` もしくは `accountKey` を含めるテンプレ。本文は任意（最小化）。
- パーサは `sender_pointer`, `subject_idx`, `recipient_email_idx`, `timestamp_idx` 等の回路入力を抽出できること。

## 障害対応/再試行
- IMAP/SMTP 障害: バックオフ/フェイルオーバー。未処理メールはキュー化。
- Prover 失敗: 入力縮退/再キュー。閾値超過で人手確認。
- チェーン混雑: 料金再見積/遅延通知/期限延長提案（送金者合意前提）。

## 運用環境
- ローカル: Docker Compose で DB/Relayer/Prover を起動可能。
- ステージング/本番: x86/arm64ビルド、Secrets管理（DKIM/SMTP、RPCキー、Modalトークン）。

