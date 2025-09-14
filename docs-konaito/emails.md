# Email Wallet メールテンプレート一覧とユースケース

本ドキュメントは、`email-wallet/packages/relayer/eml_templates/` 配下の 18 個の HTML テンプレートの用途・トリガー・主なプレースホルダ（テンプレ内の変数）を簡潔にまとめたものです。

- 配置: `email-wallet/packages/relayer/eml_templates/`
- ローダ: Rust Relayer（`email-wallet/packages/relayer`）
  - 読み込み: `src/modules/mail.rs` の `render_html()`（Handlebars でレンダリング）
  - 参照パス: 環境変数 `EMAIL_TEMPLATES_PATH`（例: `./eml_templates/`）

## 実装で使用されているテンプレート

- `account_created.html`
  - 目的: アカウント作成完了の通知＋ログイン導線。
  - トリガー: `EmailWalletEvent::AccountCreated`（`src/modules/mail.rs`）。
  - 主な変数: `userEmailAddr`, `accountCode`, `walletAddr`, `chainRPCExplorer`。

- `email_handled.html`
  - 目的: メール由来のトランザクション処理完了の通知（元件名と Tx ハッシュを含む）。
  - トリガー: `EmailWalletEvent::EmailHandled`（`src/modules/mail.rs`）。
  - 主な変数: `userEmailAddr`, `originalSubject`, `transactionHash`, `walletAddr`, `chainRPCExplorer`。

- `invitation.html`
  - 目的: 初回セットアップ招待（返信でアクティベーション）。資産リストも差し込み。
  - トリガー: `EmailWalletEvent::Invitation`（`src/modules/mail.rs`）。
  - 主な変数: `userEmailAddr`, `walletAddr`, `assetsList`, `chainRPCExplorer`。（`assetsList` は `{{#each}}` で繰り返し）

- `claimed.html`
  - 目的: 受取完了（資産または拡張データ）通知。
  - トリガー: `EmailWalletEvent::Claimed`（`src/modules/mail.rs`）。
  - 主な変数: `userEmailAddr`, `accountCode`, `walletAddr`, `transactionHash`, `chainRPCExplorer`。

- `voided.html`
  - 目的: 未請求の送金／拡張データが無効化（voided）された通知。
  - トリガー: `EmailWalletEvent::Voided`（`src/modules/mail.rs`）。
  - 主な変数: `userEmailAddr`, `walletAddr`, `transactionHash`, `chainRPCExplorer`。

- `error.html`
  - 目的: ユーザ向けエラー通知（口座未作成・入力不備など）。
  - トリガー: REST API バリデーション失敗や `EmailWalletEvent::Error`（`src/modules/web_server/rest_api.rs`, `src/modules/mail.rs`）。
  - 主な変数: `userEmailAddr`, `chainRPCExplorer`（テンプレ内には `walletAddr` のリンクもあるため、未設定時は空になる点に注意）。

- `error_alert.html`
  - 目的: 運用者（チーム）向けのエラー詳細通知。
  - トリガー: `EmailWalletEvent::Error` 内の運用者通知ループ（`src/modules/mail.rs`）。
  - 主な変数: `userEmailAddr`（受信者側）、`emailAddr`（エラー発生ユーザ）、`subject`, `error`, `chainRPCExplorer`。

- `acknowledgement.html`
  - 目的: 受信確認（自動応答）。ユーザのメール件名を差し込み。
  - トリガー: `EmailWalletEvent::Ack`（`src/modules/mail.rs`）。
  - 主な変数: `userEmailAddr`, `request`（元の件名）。

- `send_request.html`
  - 目的: 送金 API リクエストに対する「返信で確認」メール（送信前の Confirm ステップ）。
  - トリガー: `send_api_fn`（`src/modules/web_server/rest_api.rs`）。
  - 主な変数: `userEmailAddr`, `originalSubject`, `walletAddr`, `chainRPCExplorer`。

- `account_creation.html`
  - 目的: 新規アカウント作成フローの開始（ユーザに返信を促す）。
  - トリガー: `create_account_api_fn` 分岐（未登録時, `src/modules/web_server/rest_api.rs`）。
  - 主な変数: `userEmailAddr`。

- `account_already_exist.html`
  - 目的: 既にアカウントが存在する場合の案内（ログイン導線など）。
  - トリガー: `create_account_api_fn` 分岐（既登録時, `src/modules/web_server/rest_api.rs`）。
  - 主な変数: `userEmailAddr`, `accountCode`, `walletAddr`, `chainRPCExplorer`。

- `account_recovery.html`
  - 目的: アカウントコード再送／ログイン情報の案内。
  - トリガー: `recover_account_code_api_fn`（`src/modules/web_server/rest_api.rs`）。
  - 主な変数: `userEmailAddr`, `accountCode`, `walletAddr`, `chainRPCExplorer`。

- `nft_transfer.html`
  - 目的: NFT 送付リクエストの確認メール（画像/メタ情報含む）。
  - トリガー: `nft_transfer_api_fn`（`src/modules/web_server/rest_api.rs`）。
  - 主な変数: `userEmailAddr`, `nftName`, `nftID`, `recipient`, `walletAddr`, `img`, `chainRPCExplorer`。

- `safe_txn.html`
  - 目的: Safe マルチシグの承認依頼通知（承認が必要なトランザクションの検知時）。
  - トリガー: `safe_fn`（Safe API 監視ループ, `src/modules/safe.rs`）。
  - 主な変数: `userEmailAddr`, `safeTransactionHash`, `walletAddr`, `chainRPCExplorer`。

## 現時点でコード参照が見当たらないテンプレート（予備/拡張用）

実装からの直接参照は見つかりませんでしたが、用途が明確な拡張テンプレートです（将来の詳細通知に利用想定）。

- `claimed_extension.html`
  - 想定: 拡張データ受取の詳細通知（拡張コントラクト/送信者/Tx を明示）。
  - 変数: `userEmailAddr`, `walletAddr`, `extensionAddr`, `senderAddr`, `transactionHash`, `chainRPCExplorer`。

- `claimed_fund.html`
  - 想定: 資金受取の詳細通知（送信者・トークン名・数量）。
  - 変数: `userEmailAddr`, `accountCode`, `walletAddr`, `senderAddr`, `tokenName`, `tokenAmount`, `transactionHash`, `chainRPCExplorer`。

- `claimed_nft.html`
  - 想定: NFT 受取の詳細通知（NFT 名称・ID・画像・送信者）。
  - 変数: `userEmailAddr`, `accountCode`, `walletAddr`, `nftName`, `nftId`, `img`, `senderAddr`, `transactionHash`, `chainRPCExplorer`。

- `invitation_nft.html`
  - 想定: NFT を含む初回招待（画像付きの案内）。
  - 変数: `userEmailAddr`, `msg`, `img`。

## 使い方メモ

- パス設定: `.env` などで `EMAIL_TEMPLATES_PATH` をテンプレ配置に合わせて設定
  - 例: `EMAIL_TEMPLATES_PATH=/Users/<you>/Documents/zk-email-pay/email-wallet/packages/relayer/eml_templates/`
- 画像差し込み: 一部テンプレートは `cid:` 画像や `img` URL を想定（`nft_transfer.html` など）。
- 変更時の注意: 変数名（`{{...}}`）を追加・変更した場合は、対応する `render_data`（`mail.rs` / `rest_api.rs` / `safe.rs`）も更新すること。

## 参照（実装ファイル）

- `email-wallet/packages/relayer/src/modules/mail.rs`
- `email-wallet/packages/relayer/src/modules/web_server/rest_api.rs`
- `email-wallet/packages/relayer/src/modules/safe.rs`
- `email-wallet/packages/relayer/src/lib.rs`（`EMAIL_TEMPLATES` セットアップ）
- `email-wallet/packages/relayer/src/config.rs`（`EMAIL_TEMPLATES_PATH` 読み込み）
- `.env.sample`, `kubernetes/relayer.yml`, `Relayer.Dockerfile`

