# Gmail Email Setup (SMTP & IMAP)

このドキュメントは、Gmail/Google Workspace を送受信基盤として Email Wallet Relayer と連携させる際の運用手順と注意点をまとめたものです。

## 前提
- 送信: Gmail SMTP（アプリ パスワード推奨）または Workspace ドメインの SMTP（DKIM/DMARC 設定済み）
- 受信: Gmail IMAP（アプリ パスワード推奨）
- DKIM: Workspace で独自ドメインを使用する場合は、必ず SPF/DKIM/DMARC を有効化
- レート/到達性: Gmail 個人アカウントは制限が厳しいため、テスト以上の用途は Workspace を推奨

## 送信（SMTP）

### アプリ パスワードの作成（個人/Workspace 共通）
1. Google アカウントで 2 段階認証を有効化
2. セキュリティ > アプリ パスワード から新規発行
3. 発行された 16 桁のパスワードを保管

### relayer-smtp（HTTP→SMTPブリッジ）を利用する場合
Relayer 側は HTTP `SMTP_SERVER` に POST するだけなので、送信アダプタとして relayer-smtp で Gmail SMTP を中継します。

- 必須環境変数（コンテナ側）
```
SMTP_DOMAIN_NAME=smtp.gmail.com
SMTP_LOGIN_ID=<your@gmail.com>
SMTP_LOGIN_PASSWORD=<app-password>
SMTP_EMAIL_SENDER_NAME=Email Wallet
SERVER_HOST=0.0.0.0
SERVER_PORT=3000
```
- Relayer 側 `.env`
```
SMTP_SERVER=http://<host>:3000/api/sendEmail
```
- 動作確認
```
curl -X POST http://<host>:3000/api/sendEmail \
  -H "Content-Type: application/json" \
  -d '{"to":"you@example.com","subject":"Hello","body_plain":"Hi","body_html":"<b>Hi</b>"}'
```

### 直接 Gmail SMTP を叩く自前アダプタ（HTTP→SMTP）
- プロバイダ API（SendGrid/SES等）に将来置換しやすい。今回のローカル手順（Mailpit-Setup.md の HTTP ブリッジ）と同じ構成を Gmail に向けるだけでOK。

## 受信（IMAP）
- 設定例（Relayer IMAP）
```
IMAP_DOMAIN_NAME=imap.gmail.com
IMAP_PORT=993
IMAP_AUTH_TYPE=password
IMAP_LOGIN_ID=<your@gmail.com>
IMAP_LOGIN_PASSWORD=<app-password>
RELAYER_ENDPOINT=http://<relayer-host>:4500/api/receiveEmail
```
- 起動（compose の imap サービスを使用）
```
cd email-wallet
docker compose up -d imap
```

## DKIM / Oracle / Registry（重要）
受信時、Relayer は DKIM 公開鍵ハッシュを検証し、未登録なら DKIM Oracle（IC）経由で署名を得て Registry に登録します。Gmail 差出人でも同様です。

- Relayer 側の必須 env
```
CANISTER_ID=...
WALLET_CANISTER_ID=...
IC_REPLICA_URL=...
PEM_PATH=./.ic.pem
```
- Workspace の独自ドメインで配信する場合
  - 管理コンソールで SPF/DKIM/DMARC を構成
  - DKIM 鍵の selector（例: 20230601）と public key が公開されていることを確認

## 運用上の注意
- 送信レート/到達性
  - 個人 Gmail は低レート・スパム検知厳格。Workspace を推奨
  - バウンス/レート超過は Retries / DLQ を用意
- セキュリティ
  - アプリ パスワードや OAuth クレデンシャルは Vault/KMS 管理
  - PII（メールアドレス）はハッシュ/マスキングで保存
- ログ/監視
  - 送受信数・失敗率・DKIM 登録時間・チェーンTx 成否をメトリクス化

## トラブルシュート
- `/api/receiveEmail` が失敗/接続切断
  - DKIM Oracle/Registry が未設定・エラー（.ic.pem / canister IDs / cycles）
- SMTP 送信が失敗
  - アプリ パスワード/2FA を確認、`smtp.gmail.com:587` で STARTTLS が通るか確認
- 到達性が悪い
  - Workspace + 独自ドメイン + SPF/DKIM/DMARC を必須化、送信量を緩やかに増加

以上。
