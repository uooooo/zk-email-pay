Mailto 文法（最小ガイド）

目的
- メールアプリで「送信」押下のみでフローを完了できる導線を用意する。

基本形
- `mailto:<to>?subject=<encoded>`
  - 例: `mailto:you@example.com?subject=Send%2010%20TEST%20to%20alice@example.com`

件名テンプレ（例）
- 送金: `Send <amount> <TOKEN> to <recipient>`
  - `<recipient>` は `alice@example.com`（メール）または `0x...`（アドレス）

Relayer連携の考え方
- Phase 1: フロントから `/api/send` を叩いて「確認メール」をRelayerに送らせ、ユーザーはその返信で確定（既定）
- Phase 2: 直接 `mailto:` でユーザーのメールクライアントを開き、件名にコマンドを埋め込むオプションを追加
  - 送信先はユーザー自身のメール or Relayerの公開メール（`GET /api/relayerEmailAddr`）を採用する設計を検討

注意
- URLエンコードは必須（空白は `%20`）。
- 端末により既定メールアプリが無い場合あり。フォールバック（API方式）を残す。

