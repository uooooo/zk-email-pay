# Hybrid Testing Guide (Local Relayer+DB, Modal Prover, Gmail SMTP/IMAP)

本ガイドは、以下のハイブリッド構成で Email Wallet をエンドツーエンド検証する手順です。

- Chain: ローカル（Anvil）または Testnet（例: Base Sepolia）
- Relayer & DB: ローカル（cargo run, PostgresはDocker）
- Prover: Modal（サーバレス）
- SMTP/IMAP: Gmail（アプリパスワード推奨）
- DKIM: IC DKIM Oracle + ECDSAOwnedDKIMRegistry（本番相当）

## 0. 前提
- Node 18 / Rust / Python3 / Docker / Foundry / Modal CLI
- Gmail（または Workspace）で2FA有効化 + アプリパスワード作成
- IC 関連（DKIM Oracle 用）: `.ic.pem`, `CANISTER_ID`, `WALLET_CANISTER_ID`, `IC_REPLICA_URL`
- contracts をデプロイ済（ローカル or Testnet）

## 1. Contracts（ローカル or Testnet）
- ローカル: Anvil 起動 → `packages/contracts` の DefaultSetupScript を実行 → 出力アドレスを記録
- Testnet: RPCに合わせて同様にデプロイし、アドレスを記録
- 記録する主なアドレス
  - EmailWalletCore (proxy)
  - RelayerHandler (proxy)
  - TestERC20 (ONBOARDING_TOKEN_ADDR)

## 2. DB（Docker）
```
cd email-wallet
docker compose up -d db
```
- 接続文字列（ローカル実行の Relayer 用）:
  - `DATABASE_URL=postgresql://emailWallet:emailWallet_password@127.0.0.1:5432/emailWallet`

## 3. Prover（Modal）
```
pip install modal
modal token new
modal run email-wallet/packages/prover/modal_server.py
```
- 実行ログに表示される Modal のURLを控える（例: `https://<modal-app>.modal.run`）
- Relayer の `.env` の `PROVER_ADDRESS` に設定（例: `PROVER_ADDRESS=https://<modal-app>.modal.run`）

## 4. Gmail（SMTP/IMAP）
### 送信（SMTP）
- 方式A: relayer-smtp を Gmail に中継
  - `email-wallet/docker-compose.yaml` の `smtp` サービスを使用
  - `email-wallet/.env`（compose読み込み）例:
    ```
    SMTP_INTERNAL_SERVER_HOST=0.0.0.0
    SMTP_INTERNAL_SERVER_PORT=3000
    SMTP_PORT=3000
    SMTP_EMAIL_SENDER_NAME=Email Wallet
    SMTP_DOMAIN_NAME=smtp.gmail.com
    SMTP_LOGIN_ID=<your@gmail.com>
    SMTP_LOGIN_PASSWORD=<app-password>
    SMTP_MESSAGE_ID_DOMAIN=your-domain.com
    ```
  - 起動: `docker compose up -d smtp`
  - Relayer 側 `.env`: `SMTP_SERVER=http://127.0.0.1:3000/api/sendEmail`

- 方式B: 自前HTTP→SMTPアダプタ（Gmail向け）
  - 既存のローカルHTTPブリッジ（Mailpit-Setup.md参照）を Gmail 向けに変更

### 受信（IMAP）
- `email-wallet/docker-compose.yaml` の `imap` サービスを使用
- `email-wallet/packages/relayer/.env` 例:
  ```
  IMAP_DOMAIN_NAME=imap.gmail.com
  IMAP_PORT=993
  IMAP_AUTH_TYPE=password
  IMAP_LOGIN_ID=<your@gmail.com>
  IMAP_LOGIN_PASSWORD=<app-password>
  RELAYER_ENDPOINT=http://127.0.0.1:4500/api/receiveEmail
  ```
- 起動: `docker compose up -d imap`
- 代替: Gmail inbound webhook → 独自アダプタで `/api/receiveEmail` にPOST

## 5. Relayer（ローカル）
`email-wallet/packages/relayer/.env` 主な値:
```
CORE_CONTRACT_ADDRESS=<from deployment>
PRIVATE_KEY=0x...
CHAIN_RPC_PROVIDER=http://127.0.0.1:8545           # or testnet RPC
CHAIN_ID=31337                                      # or testnet
PROVER_ADDRESS=https://<modal-app>.modal.run
DATABASE_URL=postgresql://emailWallet:...@127.0.0.1:5432/emailWallet
RELAYER_EMAIL_ADDR=test@your-domain.com
RELAYER_HOSTNAME=your-domain.com
WEB_SERVER_ADDRESS=0.0.0.0:4500
CIRCUITS_DIR_PATH=/absolute/path/email-wallet/packages/circuits
INPUT_FILES_DIR_PATH=/absolute/path/email-wallet/packages/relayer/input_files
EMAIL_TEMPLATES_PATH=/absolute/path/email-wallet/packages/relayer/eml_templates/
ONBOARDING_TOKEN_ADDR=<TestERC20>
FEE_PER_GAS=0
# IC / DKIM Oracle
CANISTER_ID=<dkim_canister_id>
WALLET_CANISTER_ID=<wallet_canister_id>
IC_REPLICA_URL=<https://...>
PEM_PATH=./.ic.pem
```
起動:
```
cd email-wallet/packages/relayer
cargo run --release
```

## 6. 動作確認フロー
1) Health
```
curl http://127.0.0.1:4500/api/echo
curl http://127.0.0.1:4500/api/relayerEmailAddr
```
2) 送信（アカウント作成開始）
```
curl -X POST http://127.0.0.1:4500/api/createAccount \
  -H "Content-Type: application/json" \
  -d '{"email_addr":"<your@gmail.com>"}'
```
3) 受信（返信メール → IMAP 取り込み → /api/receiveEmail）
- Gmailで届いたメールにそのまま「返信」
- IMAP ブリッジが定期ポーリングし、Relayer に転送

4) チェーン反映確認
- `isAccountCreated` / stats / RPC エクスプローラ

## 7. よくある問題
- `/api/receiveEmail` が失敗/接続切断:
  - DKIM Oracle/Registry 未設定（`.ic.pem`, `CANISTER_ID`, `WALLET_CANISTER_ID`, `IC_REPLICA_URL` を確認）
- SMTP 送信失敗:
  - Gmailのアプリパスワード/2FA/TLS可否を確認
- Testnet移行時:
  - アドレス/CHAIN_ID/RPC/サブグラフURLの差し替え漏れ

## 8. どのチェーンで進めるべきか
- 早期はローカルチェーン（Anvil）で反復を高速化。DKIM & Gmail 連携はそのまま動作
- 受信→Prover→チェーンの目処が立ったら Testnet（Base Sepolia 等）へ移行し、実運用に近い挙動を確認（到達性/レート/手数料）

以上。
