# Mailpit-based Email Setup (Local)

本メモは、vendor の SMTP/IMAP ブリッジを変更せずに、ローカルで「送信成功まで」確認するための最短手順です。Mailpit を SMTP 受け皿兼 UI として使います。

## 方針と構成

- 送信: Relayer → HTTP (`SMTP_SERVER`) → vendor の `relayer-smtp` → (SMTP) → Mailpit
- 受信: 今回は省略（IMAP 連携なしでも API/E2E の大半は確認可能）
- DKIM: ローカル検証はスキップ（本番は DKIMRegistry/Oracle 連携）

```
Relayer (cargo) --POST /api/sendEmail--> relayer-smtp (docker) --SMTP--> Mailpit (docker)
```

## 前提

- Relayer はローカルで `cargo run --release` で起動
- `vendor/email-wallet` を vendor としてそのまま利用（コード変更なし）
- Anvil, Contracts, Prover は Local-Development-Guide に従って起動済み

## 1) Mailpit を起動

Mailpit は SMTP を 1025 で待ち受けます。`relayer-smtp` から見て標準の 587 に見せるため、ホストの 587 にフォワードします。

```bash
# ホストで実行（UI: http://localhost:8025, SMTP: host:587）
docker run --rm --name mailpit -p 587:1025 -p 8025:8025 axllent/mailpit
```

## 2) relayer-smtp を Mailpit に中継する

`vendor/email-wallet/docker-compose.yaml` の `smtp` サービスを使います。compose は `vendor/email-wallet/.env` を読み込みます。

`vendor/email-wallet/.env` に最低限の値を設定:

```dotenv
# relayer-smtp (HTTPサーバ) 自身の待受
SMTP_INTERNAL_SERVER_HOST=0.0.0.0
SMTP_INTERNAL_SERVER_PORT=3000
SMTP_PORT=3000
SMPT_JSON_LOGGER=true
SMTP_EMAIL_SENDER_NAME=Email Wallet

# 中継先 SMTP（Mailpit をホストの587ポートで公開）
SMTP_DOMAIN_NAME=host.docker.internal
SMTP_LOGIN_ID=test@localhost   # 必要ならダミー
SMTP_LOGIN_PASSWORD=           # 空可（Mailpitは認証不要）
SMTP_MESSAGE_ID_DOMAIN=localhost
```

起動（smtp のみ）:

```bash
cd vendor/email-wallet
# DBは別で必要なら: docker compose up -d db
# SMTPブリッジのみ起動
docker compose up -d smtp

# 健全性確認
curl -s http://127.0.0.1:3000/api/ping
```

メモ:
- `host.docker.internal:587` は Docker コンテナからホストの Mailpit に到達するための経路です。
- relayer-smtp が認証必須の設定になっている場合は、上記 `SMTP_LOGIN_*` をダミーで埋めるか、実SMTPに差し替えてください。

## 3) Relayer 側の `SMTP_SERVER` を設定

Relayer（ローカルで `cargo run` する方）の `.env` を設定:

`vendor/email-wallet/packages/relayer/.env`:

```dotenv
# …既存設定に加え…
SMTP_SERVER=http://127.0.0.1:3000/api/sendEmail
```

Relayer を再起動して反映。

## 4) 動作確認

```bash
# 送信を伴わないヘルス
curl http://127.0.0.1:4500/api/echo
curl http://127.0.0.1:4500/api/relayerEmailAddr

# 送信を伴う createAccount（成功すれば Mailpit UI に表示）
curl -X POST http://127.0.0.1:4500/api/createAccount \
  -H "Content-Type: application/json" \
  -d '{"email_addr":"test@example.com"}'

# Mailpit UI で確認: http://localhost:8025
```

期待値:
- createAccount が 200系で応答し、Mailpit にメールが届く
- 500 が返る場合は relayer-smtp のログを確認（`docker compose logs smtp`）

## よくあるハマり

- `Empty reply from server`（Relayer から）：
  - `SMTP_SERVER` の先（relayer-smtp）が 500 を返すと、ハンドラが `.unwrap()` で落ちて接続が途切れる。
  - relayer-smtp の接続先（Mailpit）に到達できているか、認証必須になっていないか確認。
- `Missing domain or user`（relayer-smtp）：
  - `SMTP_DOMAIN_NAME` / `SMTP_LOGIN_ID` が空。上記 dotenv を参照して最低限埋める。
- Mailpit に届かない：
  - Mailpit を 587 で公開し忘れ（`-p 587:1025`）、もしくは `SMTP_DOMAIN_NAME` が誤り。

## 本番の想定（概要）

- 送信: SendGrid/SES/Mailgun などの SMTP か HTTP API を使用。独自ドメインで SPF/DKIM/DMARC を設定。
- 受信: IMAP ブリッジ（`relayer-imap`）で取り込むか、プロバイダの Inbound Webhook を `/api/receiveEmail` に接続。
- DKIM: 受信メールの DKIM 公開鍵ハッシュをレジストリ/Oracle（`ECDSAOwnedDKIMRegistry` 等）で検証。
- 機密情報は Vault/KMS、監視・レート制限・リトライ設計を導入。

## 付録：最小スタブでAPIだけ通したい場合

実送信が不要で API フローだけを通したい場合、`SMTP_SERVER` をローカルのダミーHTTP（`/api/sendEmail` に 200 を返すだけ）に向けると、Relayer は正常応答します（メールは送られません）。

```bash
# 例: Python 超簡易スタブ
python3 - <<'PY'
from http.server import BaseHTTPRequestHandler, HTTPServer
class H(BaseHTTPRequestHandler):
  def do_POST(self):
    if self.path == '/api/sendEmail':
      self.send_response(200); self.end_headers(); self.wfile.write(b'ok')
    else:
      self.send_response(404); self.end_headers()
HTTPServer(('127.0.0.1',3001), H).serve_forever()
PY
# Relayer の .env
# SMTP_SERVER=http://127.0.0.1:3001/api/sendEmail
```

以上。

---

## 追加メモ：HTTPブリッジ方式（実送信OK、vendor改変なし）

`relayer-smtp` のSMTP接続先ポート/TLSハンドリングをローカルのMailpitに合わせるのが難しい場合、Relayer→HTTP→ローカルHTTPブリッジ→SMTP(Mailpit)という構成で確実に実送信できます。vendor のコードは変更せず、環境変数のみ更新します。

構成:

```
Relayer --POST /api/sendEmail--> HTTPブリッジ (127.0.0.1:3002) --SMTP(25)--> Mailpit
```

1) Mailpit を起動（25/8025公開）

```bash
docker rm -f mailpit25 >/dev/null 2>&1 || true
docker run -d --name mailpit25 -p 25:1025 -p 8025:8025 axllent/mailpit
```

2) HTTPブリッジを起動（ホスト上）

```bash
python3 - <<'PY'
from http.server import BaseHTTPRequestHandler, HTTPServer
import json, smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_HOST='127.0.0.1'  # Mailpit (host)
SMTP_PORT=25           # Mailpit SMTP (exposed)
FROM_ADDR='Email Wallet <test@localhost>'

class H(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/api/sendEmail':
            self.send_response(404); self.end_headers(); return
        length = int(self.headers.get('Content-Length','0'))
        data = json.loads(self.rfile.read(length))
        msg = MIMEMultipart('alternative')
        msg['From'] = FROM_ADDR
        msg['To'] = data['to']
        msg['Subject'] = data.get('subject','')
        msg.attach(MIMEText(data.get('body_plain',''), 'plain'))
        msg.attach(MIMEText(data.get('body_html',''), 'html'))
        try:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as s:
                s.sendmail('test@localhost',[data['to']], msg.as_string())
            self.send_response(200); self.end_headers(); self.wfile.write(b'{"status":"success"}')
        except Exception as e:
            self.send_response(500); self.end_headers(); self.wfile.write(f'{{"status":"error","message":"{e}"}}'.encode())

HTTPServer(('127.0.0.1',3002), H).serve_forever()
PY
```

3) Relayer の `.env` を更新

```dotenv
SMTP_SERVER=http://127.0.0.1:3002/api/sendEmail
```

4) 動作確認

```bash
curl -X POST http://127.0.0.1:4500/api/createAccount \
  -H "Content-Type: application/json" \
  -d '{"email_addr":"test@example.com"}'
curl http://127.0.0.1:8025/api/v1/messages  # 件数が増えていること
```

この方式は vendor の `relayer-smtp` を使わずに、実配信をMailpitへ確実に到達させるためのローカル限定手段です。本番では SMTP/HTTP API（SES/SendGrid等）に切り替えてください。
