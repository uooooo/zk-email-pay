---
marp: true
paginate: true
title: Email Wallet メールテンプレート一覧とユースケース
description: eml_templates の18テンプレートの役割・送信トリガー・差し込み変数を解説
---

# Email Wallet メールテンプレート一覧とユースケース

- 対象: `email-wallet/packages/relayer/eml_templates/`（18件）
- レンダラ: Rust Relayer の `render_html()`（Handlebars）
- パス: 環境変数 `EMAIL_TEMPLATES_PATH`（例: `./eml_templates/`）
- 目的: どのタイミングで、どのメールが、どんな内容で送られるかを把握

---

## 共通事項（技術）

- テンプレ言語: Handlebars（`{{var}}`, `{{#each}} ... {{/each}}`）
- ロード元: `email-wallet/packages/relayer/src/modules/mail.rs` の `render_html()`
- 送信: `send_email()` が SMTP リレーへ POST
- 変数供給: 各フローで `render_data` を JSON 生成
- エクスプローラURL: `{{chainRPCExplorer}}` を組み立てに使用

---

## メール送信の発火点（2系統）

- 発火点1: イベント駆動（`handle_email_event`）
  - きっかけ: 受信メールの解析、オンチェーン/オフチェーンの状態変化、内部処理結果
  - 実装: `src/modules/mail.rs` の `handle_email_event(event)` が分岐しテンプレを選択→`send_email()` で送信
  - 主に使うテンプレ: `account_created.html`, `email_handled.html`, `invitation.html`, `claimed.html`, `voided.html`, `error.html`, `error_alert.html`, `acknowledgement.html`

- 発火点2: REST API 駆動（`rest_api.rs`）
  - きっかけ: フロントや外部サービスからの HTTP リクエスト
  - 実装: `src/modules/web_server/rest_api.rs` の各 API が `render_html()` で本文を生成し `EmailMessage` を返す（呼び出し側で送信）
  - 主に使うテンプレ: `account_creation.html`, `account_already_exist.html`, `send_request.html`, `account_recovery.html`, `nft_transfer.html`, `error.html`

---

## 発火点1 詳細（イベント駆動）

- エントリ: `receive_email_api_fn` で受信メールを解析→`handle_email(...)`→`EmailWalletEvent` を生成→`handle_email_event`
- 分岐例:
  - `AccountCreated` → `account_created.html`
  - `EmailHandled` → `email_handled.html`
  - `Invitation` → `invitation.html`
  - `Claimed` → `claimed.html`
  - `Voided` → `voided.html`
  - `Error` → `error.html`（＋運用向け `error_alert.html`）
  - `Ack` → `acknowledgement.html`
- 備考: Safe 監視（`src/modules/safe.rs` の `safe_fn`）もイベント系に含め、`safe_txn.html` を送信

---

## 発火点2 詳細（REST API 駆動）

- エントリ: `rest_api.rs` の各 API が直接テンプレを選び `EmailMessage` を構築
- 主な API とテンプレ対応:
  - `create_account_api_fn`（未登録）→ `account_creation.html`
  - `create_account_api_fn`（既登録）→ `account_already_exist.html`
  - `send_api_fn` → `send_request.html`
  - `recover_account_code_api_fn` → `account_recovery.html`
  - `nft_transfer_api_fn` → `nft_transfer.html`
  - バリデーション失敗など → `error.html`
- 備考: これらはユーザ操作（Web/App/ツール）に対する同期待ちの案内・確認メールが中心

## account_creation.html（新規作成開始）

- 送信トリガー: `create_account_api_fn`（未登録時）
- ユースケース: 新規アカウント作成の開始。返信で続行（アクティベーション）
- 主な変数: `userEmailAddr`
- 要点: 件名に発行コードを含め、本文で「このメールに返信」を案内
- 参照: `src/modules/web_server/rest_api.rs`

---

## account_already_exist.html（既存アカウント案内）

- 送信トリガー: `create_account_api_fn`（既登録時）
- ユースケース: 既にアカウントがある場合、ログイン手順を案内
- 主な変数: `userEmailAddr`, `accountCode`, `walletAddr`, `chainRPCExplorer`
- 要点: ログイン導線、アカウント情報リンクを提示
- 参照: `src/modules/web_server/rest_api.rs`

---

## account_recovery.html（アカウント復旧）

- 送信トリガー: `recover_account_code_api_fn`
- ユースケース: アカウントコードの再送、ウォレット情報の再提示
- 主な変数: `userEmailAddr`, `accountCode`, `walletAddr`, `chainRPCExplorer`
- 要点: アカウントコードの取り扱い注意喚起＋エクスプローラリンク
- 参照: `src/modules/web_server/rest_api.rs`

---

## account_created.html（作成完了）

- 送信トリガー: `EmailWalletEvent::AccountCreated`
- ユースケース: アカウント生成完了の通知と初期トークン配布の案内
- 主な変数: `userEmailAddr`, `accountCode`, `walletAddr`, `chainRPCExplorer`
- 要点: ログインボタン、残高/トランザクション参照、初期利用チュートリアル
- 参照: `src/modules/mail.rs`

---

## acknowledgement.html（受信確認）

- 送信トリガー: `EmailWalletEvent::Ack`
- ユースケース: ユーザからのメール受領を即時に自動応答
- 主な変数: `userEmailAddr`, `request`（元件名）
- 要点: 受領したリクエスト内容をエコー表示
- 参照: `src/modules/mail.rs`

---

## send_request.html（送金リクエスト確認）

- 送信トリガー: `send_api_fn`
- ユースケース: メール件名から生成された送金内容を「返信で確定」させる
- 主な変数: `userEmailAddr`, `originalSubject`, `walletAddr`, `chainRPCExplorer`
- 要点: 「このメールに confirm で返信」→確定実行の 2 段階認証的 UX
- 参照: `src/modules/web_server/rest_api.rs`

---

## email_handled.html（処理完了）

- 送信トリガー: `EmailWalletEvent::EmailHandled`
- ユースケース: 依頼済みトランザクションが実行され、Tx ハッシュを通知
- 主な変数: `userEmailAddr`, `originalSubject`, `transactionHash`, `walletAddr`, `chainRPCExplorer`
- 要点: 元メールに返信スレッドで完了報告し、エクスプローラを案内
- 参照: `src/modules/mail.rs`

---

## error.html（ユーザ向けエラー）

- 送信トリガー: バリデーション失敗、口座未作成、処理例外など
- ユースケース: ユーザが次に何をすべきか（作成/サインイン等）を明示
- 主な変数: `userEmailAddr`, `chainRPCExplorer`（`walletAddr` が無い場合はリンク空）
- 要点: 具体的な原因メッセージはプレーン本文側で補足されることあり
- 参照: `src/modules/web_server/rest_api.rs`, `src/modules/mail.rs`

---

## error_alert.html（運用者向けエラー）

- 送信トリガー: `EmailWalletEvent::Error` 内のチーム通知
- ユースケース: 運用チームが障害内容（ユーザ、件名、詳細）を把握
- 主な変数: `userEmailAddr`（送信先＝チーム）, `emailAddr`（当該ユーザ）, `subject`, `error`
- 要点: 影響把握と一次対応（問い合わせ返信・再試行）に利用
- 参照: `src/modules/mail.rs`

---

## account_related（Voided/Claimed）

### claimed.html（受取完了）
- 送信トリガー: `EmailWalletEvent::Claimed`
- ユースケース: 資産/拡張データの受領完了通知
- 主な変数: `userEmailAddr`, `accountCode`, `walletAddr`, `transactionHash`, `chainRPCExplorer`
- 要点: 受領結果と Tx 確認リンク、二次アクション（Transfer など）

### voided.html（無効化）
- 送信トリガー: `EmailWalletEvent::Voided`
- ユースケース: 未請求送金/拡張データが期限等で無効になった通知
- 主な変数: `userEmailAddr`, `walletAddr`, `transactionHash`, `chainRPCExplorer`
- 要点: 失効の周知と再送/再実行の検討材料提供

---

## nft_transfer.html（NFT 送付確認）

- 送信トリガー: `nft_transfer_api_fn`
- ユースケース: NFT 送付（宛先アドレス/メール）をユーザに確認
- 主な変数: `userEmailAddr`, `nftName`, `nftID`, `recipient`, `walletAddr`, `img`, `chainRPCExplorer`
- 要点: メタデータ（画像URL等）を含め、実行前に内容を再確認
- 参照: `src/modules/web_server/rest_api.rs`

---

## safe_txn.html（Safe 承認依頼）

- 送信トリガー: `safe_fn`（Safe API 監視）
- ユースケース: マルチシグで承認が必要なトランザクションを所有者に通知
- 主な変数: `userEmailAddr`, `safeTransactionHash`, `walletAddr`, `chainRPCExplorer`
- 要点: 署名者の承認アクションを促すワークフローの起点
- 参照: `src/modules/safe.rs`

---

## 予備/拡張テンプレ（現時点で未参照）

### claimed_fund.html（資金受取詳細）
- 想定: 送信者・トークン名・数量まで詳細に案内
- 変数例: `senderAddr`, `tokenName`, `tokenAmount`, `transactionHash` ほか

### claimed_nft.html（NFT 受取詳細）
- 想定: NFT 名・ID・画像・送信者を通知
- 変数例: `nftName`, `nftId`, `img`, `senderAddr`, `transactionHash` ほか

### claimed_extension.html（拡張データ受取詳細）
- 想定: 拡張コントラクト/送信者/Tx を明示
- 変数例: `extensionAddr`, `senderAddr`, `transactionHash` ほか

### invitation_nft.html（NFT 付き招待）
- 想定: 初回招待に NFT 表示を含める
- 変数例: `msg`, `img`

---

## 設定と変更時の注意

- `.env` などで `EMAIL_TEMPLATES_PATH` をテンプレ配置に合わせて設定
- テンプレ内の変数を変更/追加したら、対応する `render_data` 生成箇所（`mail.rs` / `rest_api.rs` / `safe.rs`）も更新
- 画像は `img` URL もしくは `cid:` でインライン添付に対応する設計

---

## 参考（実装ファイル）

- `email-wallet/packages/relayer/src/modules/mail.rs`
- `email-wallet/packages/relayer/src/modules/web_server/rest_api.rs`
- `email-wallet/packages/relayer/src/modules/safe.rs`
- `email-wallet/packages/relayer/src/lib.rs`（`EMAIL_TEMPLATES` セットアップ）
- `email-wallet/packages/relayer/src/config.rs`（`EMAIL_TEMPLATES_PATH` 読み込み）
- `.env.sample`, `kubernetes/relayer.yml`, `Relayer.Dockerfile`
