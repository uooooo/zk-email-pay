# API 仕様（Web ↔ Relayer）

Email Wallet の API（`docs/zkemail/zkemail-emailwallet/docs.zk.email_email-wallet_api-documentation.md`）に準拠しつつ、本プロダクトに必要な制約/拡張を明記します。

環境変数例:
```
RELAYER_API_URL=https://<relayer-host>/
```

## Core Endpoints

1) Create Account
- `POST /api/createAccount`
- Body: `{ "email_addr": "user@example.com" }`
- Res: `0x...`（Walletアドレス。未生成時は空/予約）

2) Is Account Created
- `POST /api/isAccountCreated`
- Body: `{ "email_addr": "user@example.com" }`
- Res: `"true" | "false"`

3) Send (メール宛/アドレス宛)
- `POST /api/send`
- Body:
```
{
  "email_addr": "sender@example.com",     // 送信者のメール（ログイン主体）
  "amount": 10.5,                          // 10.5 (USDC)
  "token_id": "USDC",                     // TokenRegistry 参照名
  "recipient_addr": "friend@example.com", // メール or 0xアドレス
  "is_recipient_email": true,
  "expiry": 172800,                        // 任意: 秒(例: 2日)
  "memo": "gift"                           // 任意
}
```
- Res: `"ok" | エラー文字列`

4) Get Wallet Address
- `POST /api/getWalletAddress`
- Body: `{ "email_addr": "user@example.com", "account_code": "0x..." }`
- Res: `0x...`（Walletアドレス）

5) NFT Transfer（将来）
- `POST /api/nftTransfer`（Email Wallet 仕様に準拠）

## Webhook/内部API（任意、運用向け）
- `POST /internal/email/inbound` 受信メールイベント（IMAPを補助/監査用）
- `POST /internal/payments/:id/cancel` Unclaimed取消（期限内/未受領）

## エラー/レート制限
- 代表例: `ACCOUNT_NOT_FOUND`, `INVALID_TOKEN`, `EXCEEDS_LIMIT`, `EXPIRED`, `ALREADY_CLAIMED`, `DKIM_VERIFY_FAILED`, `PROOF_FAILED`, `CHAIN_TX_FAILED`。
- IP/Email/送信量のレート制御（DB＋Redis等）。

