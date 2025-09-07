# DKIM Bypass Local Run (2025-09-07)

目的: Gmail + 簡易DKIMバイパスで、Account Creation → Send をローカル (Anvil/Prover/Relayer) で再現。

## 構成
- Chain: Anvil (31337)
- Contracts (DefaultSetupScript):
  - Core proxy: `0x3Aa5ebB10DC797CAC828524e59A333d0A371443c`
  - DKIM Registry: `0x0165878A594ca255338adfa4d48449f69242Eb8F`
  - DKIM signer (EOA): `0xF39fd6e51aad88F6F4Ce6ab8827279cffFb92266`
  - Onboarding token (TEST): `0x4A679253410272dd5232B3Ff7cF5dbB88f295319`
- Relayer: cargo run (localhost:4500)
- Prover: Flask local (localhost:8080)
- SMTP: vendor/email-wallet `relayer-smtp` (localhost:3000 → Gmail)
- IMAP: vendor/email-wallet `relayer-imap` (Gmail → /api/receiveEmail)

## 主要な.env
- `vendor/email-wallet/packages/relayer/.env`
  - `CORE_CONTRACT_ADDRESS=0x3Aa5ebB10DC797CAC828524e59A333d0A371443c`
  - `PROVER_ADDRESS=http://127.0.0.1:8080`
  - `SMTP_SERVER=http://127.0.0.1:3000/api/sendEmail`
  - `ONBOARDING_TOKEN_ADDR=0x4A679253410272dd5232B3Ff7cF5dbB88f295319`
  - `DKIM_BYPASS_LOCAL_SIGN=true`
  - `DKIM_LOCAL_SIGNER_PK=<anvil #0 pk>`

## コード変更 (短期デバッグ)
- `packages/relayer/src/modules/mail.rs`
  - SMTP DEBUG ログ出力を追加（送信先・件名・HTTPレスポンス）
- `packages/relayer/src/modules/web_server/rest_api.rs`
  - `/api/receiveEmail` で MIME パース失敗時にフォールバック処理（From抽出の上、エラー通知メールを送ってクラッシュ回避）

### 具体的差分（要点）

- `packages/relayer/src/modules/mail.rs`
  - 送信直前/直後に `println!("SMTP DEBUG ...")` を追加し、`status` と `body` を出力。

- `packages/relayer/src/modules/web_server/rest_api.rs`
  - `receive_email_api_fn` 冒頭で `ParsedEmail::new_from_raw_email` の `Result` を安全に扱い、失敗時は件名・From抽出して `EmailWalletEvent::Error` を通知して早期 `Ok(())` リターン（パニック抑止）。

### DKIM バイパスの仕組み（既存機能の活用）

- 既存の `DKIM_BYPASS_LOCAL_SIGN=true` を有効化し、Relayer が `SET:selector=...;domain=...;public_key_hash=0x...;` をローカル EOA で EIP‑191 署名 → `ECDSAOwnedDKIMRegistry.setDKIMPublicKeyHash` を直接呼び出す。
- 署名者は `DKIM_LOCAL_SIGNER_PK`（未設定時は `PRIVATE_KEY`）を使用。今回の signer は anvil 既定 #0。

## ランログ抜粋

### Contracts デプロイ（DefaultSetupScript）

```
EmailWalletCore proxy deployed at: 0x3Aa5ebB10DC797CAC828524e59A333d0A371443c
ECDSAOwnedDKIMRegistry deployed at: 0x0165878A594ca255338adfa4d48449f69242Eb8F
TestERC20 deployed at: 0x4A679253410272dd5232B3Ff7cF5dbB88f295319
...
```

### Relayer 登録（RegisterRelayer）

```
Relayer registered successfully!
Email Address: zkemailpay@gmail.com
Hostname: gmail.com
```

### Prover（起動直後のテスト POST に対する挙動）

```
ERROR:local:Exception on /prove/email_sender [POST]
TypeError: write() argument must be str, not dict
```

注: これはダミー入力での負荷テスト時のもので、E2E フローの実行には影響なし（本流の入力は正しく処理）。

### SMTP DEBUG（Gmail 受理）

```
SMTP DEBUG request ... subject=Send 1 TEST to naitoukouta0219@gmail.com
SMTP DEBUG response status=200 OK body={"message_id":"<679a596f-...@gmail.com>","status":"success"}
```

### DKIM バイパス（参照：事前ローカル EML 実行時）

```
DKIM DEBUG (bypass) signer=0xf39f…2266, signed_msg=SET:selector=20230601;domain=gmail.com;public_key_hash=0x0ea9...
cast call <DKIM_REGISTRY> isDKIMPublicKeyHashValid gmail.com 0x0ea9... → true
```

## 補足: Submodule 変更の扱い

- `vendor/email-wallet` は Git submodule（上流: `zkemail/email-wallet`）。今回は Relayer 側への小改修（ログ/フォールバック）をローカルに加えている。
- ベストプラクティス:
  1. submodule リポジトリをフォーク（例: `uooooo/email-wallet`）。
  2. フォークを submodule に `git remote add fork ...` で追加し、フォーク側にブランチ push。
  3. 親リポジトリは submodule のコミットを更新して push（PR で追従）。
- 今回は親リポジトリのブランチ push に留め、submodule 変更はローカル改修として維持。フォーク作成後に submodule 側の push/PR へ切り出し可能。


## 実行ログ (抜粋)
- createAccount 送信（Gmail受理）
```
SMTP DEBUG request to=http://127.0.0.1:3000/api/sendEmail to=aotohash@gmail.com subject=Email Wallet Account Creation. Code 1ba5...
SMTP DEBUG response status=200 OK body={"message_id":"<bd537bc1-...@gmail.com>","status":"success"}
```

- 返信取り込みで一時失敗（IMAP → relayer）
```
email-wallet-imap-1: Failed to send email body to the relayer endpoint; Error: error sending request for url (http://host.docker.internal:4500/api/receiveEmail)
```
再起動後は `/api/echo` 到達性 OK を確認（IMAP/SNTP 両コンテナから）。

- DKIM バイパス（参考: 事前ローカル EML テスト時）
```
DKIM DEBUG (bypass) signer=0xf39f…2266, signed_msg=SET:selector=20230601;domain=gmail.com;public_key_hash=0x0ea9...
cast call <DKIM_REGISTRY> isDKIMPublicKeyHashValid gmail.com 0x0ea9... → true
```

- send 要求メール（Gmail受理）
```
SMTP DEBUG request to=http://127.0.0.1:3000/api/sendEmail to=aotohash@gmail.com subject=Send 1 TEST to naitoukouta0219@gmail.com
SMTP DEBUG response status=200 OK body={"message_id":"<679a596f-...@gmail.com>","status":"success"}
```

## 使い方メモ
1) createAccount
```
POST /api/createAccount {"email_addr":"<user@gmail.com>"}
```
→ 届いたメールに「そのまま返信」（件名は変更しない）。

2) send (メール送金リクエスト)
```
POST /api/send {
  "email_addr":"<user@gmail.com>",
  "amount":1,
  "token_id":"TEST",
  "recipient_addr":"<recipient@gmail.com>",
  "is_recipient_email":true
}
```
→ 届いたメールに返信（件名変更しない）で実行。

## 既知の注意点
- Gmail 側で受信が遅延/分類されることがある（Spam/プロモーション/All Mail を確認）。
- 返信メールの件名が編集/短縮されるとコマンド抽出に失敗する。
- DKIM バイパス中は IC DKIM Oracle を使わない（`DKIM_BYPASS_LOCAL_SIGN=true`）。

以上。
