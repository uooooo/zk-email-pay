# Wallet-to-Email (Unclaimed) Test

目的: 既存ウォレット（送信者）から、まだウォレット未作成のメールアドレス（受信者）へテストトークンを送り、未請求（Unclaimed）→ Claim までの流れを確認する。

## 前提
- Chain: Anvil（ローカル）または Testnet
- Relayer: ローカル（:4500）
- Prover: ローカル（:8080）または Modal
- SMTP/IMAP: Gmail（アプリパスワード）など、送受信が機能していること
- DKIM/IC: `.ic.pem`, `CANISTER_ID`, `WALLET_CANISTER_ID`, `IC_REPLICA_URL` を設定済（受信処理で必須）

重要: Relayer の送金APIは「送信者のメールアドレス」をキーとします。送信者ウォレットがすでに存在する前提でも、そのウォレットに紐づく送信者メール（DBの account_code 登録）が必要です（ダイレクトに wallet_addr を渡すAPIは現状ありません）。

## 手順

### 1) 送信者アカウントの作成（既にある場合はスキップ）
```
POST /api/createAccount { "email_addr": "<sender_email>" }
# -> メールが届くので、そのまま返信
# -> IMAP ブリッジが /api/receiveEmail にPOST → DKIM/Prover/チェーン
POST /api/isAccountCreated { "email_addr": "<sender_email>" } # true
```

### 2) 送信者ウォレットの残高準備（必要に応じて）
- 送信者の account_code は createAccount 応答で 0x.. が返る
- ウォレットアドレス取得
```
POST /api/getWalletAddress { "email_addr": "<sender_email>", "account_code": "0x<code>" }
```
- テストトークン freeMint（Anvil）
```
cast send <ONBOARDING_TOKEN_ADDR> "freeMint(address,uint256)" <SENDER_WALLET> 1000000000000000000 \
  --private-key <ANVIL_PK> --rpc-url http://127.0.0.1:8545
```

### 3) 未登録の受信者メールへ送信リクエスト
```
POST /api/send {
  "email_addr": "<sender_email>",
  "amount": 1,
  "token_id": "USDC",
  "recipient_addr": "<recipient_email_not_created>",
  "is_recipient_email": true
}
# -> 送信者に「送金確認」メール届く → そのまま返信
```

### 4) Unclaimed 登録 → 受信者に Claim メール
- 送信者の返信を IMAP が /api/receiveEmail にPOST
- Prover → チェーンで未請求トークンが登録
- 受信者に Claim メールが届く

### 5) 受信者側のアカウント作成 → Claim 成功
- 受信者メールでアカウント作成（createAccount→返信）
- その後に Claim 処理が走り、受信者ウォレットへ着金

## 検証ポイント
- 送信者/受信者双方のメール到達
- チェーン上の Unclaimed ステート/イベント
- Claim 後の残高反映

## 既知の制約・注意
- 送信者は「メール→ウォレット」に紐づくDB登録が必要です（wallet_addrを直接指定するAPIは未提供）
- DKIM/IC 未整備だと /api/receiveEmail が途中で落ちます
- amount は数値で指定（"1" はエラー）
- DB 接続プール過負荷時、ログに `pool timed out` が出ることがあります（DB/composeを再起動して安定化）

## 実行ログ（regist@akafuda.xyz → something@akafuda.xyz）
- 送信者 createAccount 再発行: OK（account_code 0x… 返却）
- isAccountCreated(regist@akafuda.xyz): false（返信未実施のため）
- /api/send（sender=regist@akafuda.xyz, recipient=something@akafuda.xyz）: 200 + request_id 返却
  - 注: 送信者未登録のため、送信者宛に「アカウント未作成」エラーメールが送信される挙動（未請求の作成は行われない）
- 次ステップ: 送信者メールの「アカウント作成」メールにそのまま返信 → isAccountCreated=true → /api/send 再実行で未請求生成 → 受信者に Claim メール
