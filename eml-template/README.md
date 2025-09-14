# test-mail (mini app)

Email Wallet のメールテンプレートをフルスタック依存なしで確認する最小Rustアプリです。

## 構成
- `src/mail.rs` … テンプレ描画（Handlebars）と簡易送信（標準出力）
- `src/rest_api.rs` … 主要APIのミニ版（DB/チェーン依存なし）
- `src/main.rs` … CLI（`render` / `api` / `event`）

## 前提
- テンプレパスは環境変数 `EMAIL_TEMPLATES_PATH` から取得。
  - 未設定時は `../email-wallet/packages/relayer/eml_templates` を自動利用します。

## 使い方

```
# 1) 依存取得 & ビルド（Rust が必要）
cd test-mail
cargo run -- --help

# 2) 任意テンプレを直接描画
cargo run -- render acknowledgement.html -D userEmailAddr=alice@example.com -D request="Send 10 TEST to bob@example.com"

# 3) API系（新規作成フロー）
cargo run -- api create-new alice@example.com

# 4) API系（既存アカウント案内）
cargo run -- api create-existing alice@example.com

# 5) API系（送金確認）
cargo run -- api send alice@example.com 10 TEST bob@example.com

# 6) API系（リカバリ）
cargo run -- api recover alice@example.com

# 7) イベント系（Ack）
cargo run -- event ack alice@example.com "Send 10 TEST to bob@example.com"
```

出力は標準出力に `subject`, `body_plain`, `body_html` を表示します。

## メモ
- 本ミニアプリはネットワーク送信やDB/チェーン呼び出しを行いません。
- 変数追加・テンプレ変更時は、`render_data` のキーを合わせてください。

## Mailpit（ダミー受信箱）で実送信を試す

DockerでMailpitを同梱しています。`docker compose` を使うとSMTPに投げ、Web UIで内容を確認できます。

```
# 1) 起動（別ターミナルで）
cd test-mail
docker compose up -d mailpit
# Web UI: http://localhost:8025 / SMTP: localhost:1025

# 2) test-mail コンテナで送信（SMTP_HOST=mailpit に設定済み）
docker compose run --rm test-mail api send alice@example.com 10 TEST bob@example.com

# 3) ブラウザで http://localhost:8025 を開き、メールを確認

# 任意テンプレ送信例
docker compose run --rm test-mail render acknowledgement.html -D userEmailAddr=alice@example.com -D request="Send 10 TEST to bob@example.com" | head -n 5

# ローカルで直接SMTPに送る場合（ホスト実行）
SMTP_HOST=127.0.0.1 SMTP_PORT=1025 SMTP_FROM=test@example.com \
  cargo run -- api send alice@example.com 10 TEST bob@example.com
```

備考
- `SMTP_HOST` が設定されている場合のみSMTP送信します（未設定時はstdoutにダンプ）。
- docker-compose 内では `SMTP_HOST=mailpit` で Mailpit コンテナを参照します。
