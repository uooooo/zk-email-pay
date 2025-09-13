# IMAP Setup (Local & Testnet)

本ドキュメントは、Email Wallet Relayer の受信経路（IMAP→Relayer `/api/receiveEmail`）をローカル／テスト環境で構築・検証するための手順をまとめたものです。

## 概要
- 受信経路は大きく2通り
  - IMAP ポーリング → 受信メール（raw MIME）を Relayer に POST
  - メールプロバイダの Inbound Webhook → 独自アダプタで Relayer に POST
- Relayer は受信時に DKIM を検証し（必要ならレジストリ更新）、その後 Prover→チェーン書き込みを行います。
  - 本番/テストネットでは DKIM Oracle/Registry の設定が必須です（下記の「DKIM 前提条件」参照）

## 推奨構成

### A. テストネット（実運用想定）
- IMAP: Gmail/Workspace, Outlook, Mailgun/SendGrid IMAP 等
- 認証: アプリパスワード or OAuth2
- Relayer IMAP ブリッジ: `relayer-imap` コンテナ（vendor/email-wallet/docker-compose.yaml）
- Relayer API: `WEB_SERVER_ADDRESS=0.0.0.0:4500`
- DKIM: Oracle/Registry 設定（canister/レジストリ）

例: Gmail（アプリパスワード）
- `IMAP_DOMAIN_NAME=imap.gmail.com`
- `IMAP_PORT=993`
- `IMAP_AUTH_TYPE=password`
- `IMAP_LOGIN_ID=<your@gmail.com>`
- `IMAP_LOGIN_PASSWORD=<app password>`
- `RELAYER_ENDPOINT=http://<relayer-host>:4500/api/receiveEmail`

起動（compose を使う場合）
```
cd vendor/email-wallet
# .env に上記を反映
# relayer は別途起動（cargo or compose）
docker compose up -d imap
```

注意
- DKIM の登録が未整備だと受信時にエラー終了します（`check_and_update_dkim()` 内で Oracle/chain 呼び出し）。
- IC 関連の env を必ず設定すること（Relayer 側）
  - `CANISTER_ID`, `WALLET_CANISTER_ID`, `IC_REPLICA_URL`, `PEM_PATH=./.ic.pem`

### B. ローカル検証（簡易）
- GreenMail を IMAP/SMTP サーバとして使用し、開発用のメールボックスにリプライ相当のメールを投入
- 簡易ポーラで INBOX を走査し、raw MIME を Relayer に POST

手順
1) GreenMail 起動（Docker）
```
docker run -d --name greenmail \
  -p 3025:3025 -p 3143:3143 -p 8080:8080 \
  greenmail/standalone:1.6.14 \
  -Dgreenmail.setup.test.imap \
  -Dgreenmail.users=test@localhost:password
```

2) 返信メール風のメッセージを投入（例: SMTPに投函）
```
python3 - <<'PY'
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
smtp_host='127.0.0.1'; smtp_port=3025
frm='from@example.com'; to='test@localhost'
subj='Re: Email Wallet Account Creation. Code <YOUR_CODE>'
msg=MIMEMultipart('alternative'); msg['From']=frm; msg['To']=to; msg['Subject']=subj
msg.attach(MIMEText('reply body','plain'))
with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as s:
    s.sendmail(frm,[to], msg.as_string())
print('sent')
PY
```

3) ポーラで受信 → Relayer に POST（raw MIME）
```
# scripts/imap_poller.py を同梱
IMAP_HOST=127.0.0.1 IMAP_PORT=3143 \
IMAP_USER=test@localhost IMAP_PASS=password \
RELAYER_ENDPOINT=http://127.0.0.1:4500/api/receiveEmail \
python3 scripts/imap_poller.py
```

既知の事象
- `relayer-imap` コンテナの実行環境によっては GLIBC バージョン不整合（`GLIBC_2.39 not found`）が出るケースあり
  - 回避: 公式 Dockerfile で再ビルド or 適合するランタイムに切替
  - 代替: 本ドキュメントの GreenMail + `imap_poller.py` を使用
- `/api/receiveEmail` へ POST 時に接続が途中で切れる
  - ほぼ必ず DKIM 登録未整備が原因。IC/DKIM Registry の前提を満たすこと

## DKIM 前提条件（重要）
Relayer は受信時に DKIM public key hash をレジストリで検証し、未登録の場合は Oracle 経由で署名を取得してセットします。
- Relayer 側の env が必要
  - `CANISTER_ID`, `WALLET_CANISTER_ID`, `IC_REPLICA_URL`, `PEM_PATH=./.ic.pem`
- 運用ドメイン（例: gmail.com / 独自ドメイン）に対して DKIM が有効
- 代替（ローカル限定）
  - DKIM Registry をローカルチェーンに再デプロイし、事前に `setDKIMPublicKeyHash` を実行しておく（要ハッシュ計算と署名）

## Testnet での進め方（概要）
1) チェーンを選定（例: Base Sepolia）
   - `CHAIN_RPC_PROVIDER`, `CHAIN_ID`, `CHAIN_RPC_EXPLORER`, `SAFE_API_ENDPOINT` を設定
2) Contracts を testnet にデプロイ（Foundry）
   - `forge script ...DefaultSetupScript.s.sol:Deploy --rpc-url <RPC> --chain-id <ID> --broadcast`
   - アドレスを `packages/relayer/.env` に反映（`CORE_CONTRACT_ADDRESS`, `ONBOARDING_TOKEN_ADDR` 等）
3) Relayer を testnet 向けに起動
   - Prover は Modal などの安定環境を推奨（`PROVER_ADDRESS` を Modal URL に）
4) 送信（SMTP）/受信（IMAP）
   - 送信: SES/SendGrid 等のSMTPまたはHTTP API
   - 受信: Gmail/Workspace IMAP か、プロバイダの inbound をアダプタで `/api/receiveEmail` に接続
5) DKIM Oracle/Registry を有効化
   - `.ic.pem`/Wallet Canister/Canister ID を設定

---

トラブルシュート
- DKIM 関連
  - `invalid DKIM public key` / 接続が切れる: Oracle/Registry 未設定
- IMAP 接続
  - 認証失敗/証明書エラー: 993/TLS での設定見直し、アプリパスワード使用
- 受信しても動かない
  - 件名テンプレート（Re: XXX Code <…>）と本文形式を見直し

以上。
