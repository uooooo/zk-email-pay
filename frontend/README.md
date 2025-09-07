Email Wallet Frontend — 超シンプル実装計画

目的
- mailto文法を活用し、ユーザーがメールアプリで「送信」を押すだけで完了するUXを最終目標にする。
- 初期スコープでは以下のRelayer APIをフロントから呼び出せる状態にする。

対象エンドポイント（Relayer）
- POST `/api/createAccount`（招待メールを送付→ユーザーはそのまま返信して確定）
- POST `/api/isAccountCreated`（メールアドレス入力→作成済み確認）
- POST `/api/send`（送金フロー開始：確認メール送付→ユーザーは返信で確定）

構成（最小）
- env
  - `NEXT_PUBLIC_RELAYER_BASE_URL`（例: `http://127.0.0.1:4500`）
- ライブラリ
  - `src/lib/relayer.ts`
    - `createAccount(email: string): Promise<string /*requestId*/>`
    - `isAccountCreated(email: string): Promise<boolean>`
    - `send(params: { email: string; amount: string; token: string; recipient: string; isRecipientEmail: boolean }): Promise<string /*requestId*/>`
- ページ/コンポーネント（仮）
  - `src/app/send/page.tsx`
    - フォーム: `email`, `amount`, `token`, `recipient`, `isRecipientEmail`
    - ボタン:
      - 「アカウント確認」→ `/isAccountCreated`
      - 「アカウント作成メールを受け取る」→ `/createAccount` 実行→ 成功時に「招待メールが送信されました。そのまま返信してください」を表示
      - 「送金メールを受け取る」→ `/send` 実行→ 成功時に「確認メールを送信しました」表示

mailto方針（段階導入）
- Phase 1: 上記API実装優先。`/send`でRelayerから確認メールを送る（返信で確定）。
- Phase 2: 直接メール作成の導線を追加（例: `mailto:user@example.com?subject=Send%2010%20TEST%20to%20alice@example.com`）。
  - 併せて `GET /api/relayerEmailAddr` を使い、起点をRelayerアドレスに変更する案も検討。
  - 詳細仕様は `docs-konaito/mailto.md` に集約（別途）

エラーハンドリング（最小）
- API失敗時はトースト/バナーで文言統一（ネットワーク/バリデーション）。
- 送金開始後は「メール返信が必要」である旨を明示。

タスク分割（初回）
1. env/ユーティリティ作成（`src/lib/relayer.ts`）
2. `send`ページのフォームとAPI連携
3. UX文言/バリデーション最小実装
4. mailto導線の試験実装（Phase 2）
