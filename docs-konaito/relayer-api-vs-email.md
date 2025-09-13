---
title: Email Wallet Relayer — APIでできること vs メールでのみ可能なこと
description: email-wallet（特にRelayer）の機能サマリと、フロントエンド経由のAPI/メール起点の役割分担を整理
updated: 2025-09-06
---

# Email Wallet Relayer — API か メールか

本ドキュメントは `/email-wallet`（特に `packages/relayer`）を対象に、
フロントエンド（Next.js）から叩けるHTTP APIで「できること」と、メール送信（返信）によってのみ最終的に成立する処理を整理します。

- 実装位置: `email-wallet/packages/relayer`
- Webサーバ: Axum（Rust）
- 既定ポート: `.env` の `WEB_SERVER_ADDRESS`（例: `127.0.0.1:4500`）
- 参考ファイル: `src/modules/web_server/server.rs`, `src/modules/web_server/rest_api.rs`, `src/core.rs`, `src/modules/mail.rs`, `src/modules/claimer.rs`

重要な前提: 多くの「資産移動/アカウント作成などの最終アクション」は、ユーザーの「メール返信」をトリガに、Relayer がメールのDKIM等を検証し ZK 証明を生成→チェーンに実行する設計です。フロントエンドのAPI呼び出しは「きっかけ（メールを送る、ステータス取得、コミット計算等）」を担い、最終確定はメール経由になります。

## 用語と概念

- 「メール起点」: ユーザーが受信したメールに「そのまま返信」することで、Relayer が `handle_email` 経由で処理（ZK証明生成→`handle_email_op`/トランザクション送信）を実行する流れ。
- 「API起点」: フロントエンドがHTTPでRelayerに指示。多くは「確認メールの送信」や「情報の問い合わせ」。一部はオンチェーン実行を直接行うAPIもあります（例: エフェメラルトランザクション実行、Unclaimの確定など）。

## フロントエンド API でできること（HTTP）

以下は `server.rs` のルーティングをもとにした一覧です。パスはすべて `/api/*`。

- GET `/relayerEmailAddr`
  - Relayerの送信元メールアドレスを返します。
  - 使い所: UIで「送信元」の明示や署名検証メッセージの組み立て。

- POST `/emailAddrCommit`
  - 入力: `{ email_address, random }`
  - 出力: メールアドレスコミット値（ZK入力に使うコミット）。
  - 使い所: 送付先が「メールアドレス」の場合のコミット計算（UI側事前計算）。

- POST `/isAccountCreated`
  - 入力: `{ email_addr }`
  - 出力: `true | false`
  - 使い所: ウォレット作成済み判定。

- POST `/getWalletAddress`
  - 入力: `{ email_addr, account_code }`
  - 出力: `wallet_addr`（チェックサム付き）
  - 使い所: 表示用や連携用にアドレス解決。

- GET `/genAccountCode`
  - 出力: 新規 `account_code`（16進）
  - 使い所: 初回アカウント作成フローのコード生成（UI側で保持→メールに反映）。

- POST `/createAccount`
  - 入力: `{ email_addr }`
  - 挙動: 「アカウント作成の案内メール」を送信（返信で作成が確定）。
  - 使い所: UIからアカウント作成フローを開始。最終確定は「メール返信」。

- POST `/send`
  - 入力: `{ email_addr, amount, token_id, recipient_addr, is_recipient_email }`
  - 挙動: 「送金確認メール」を送信（返信で送金が確定）。
  - 使い所: UIから送金フローを開始。最終確定は「メール返信」。

- POST `/nftTransfer`
  - 入力: `{ email_addr, nft_id, nft_addr, recipient_addr, is_recipient_email }`
  - 挙動: 「NFT送付確認メール」を送信（返信で転送が確定）。
  - 使い所: UIからNFT送付フローを開始。最終確定は「メール返信」。

- POST `/recoverAccountCode`
  - 入力: `{ email_addr }`
  - 挙動: アカウントコードをメールで通知（情報系。返信不要）。

- POST `/signupOrIn`
  - 入力: `{ email_addr, ephe_addr?, username?, expiry_time?, token_allowances? }`
  - 挙動: サインアップ/サインイン確認メールを送信（返信で確定）。

- POST `/epheAddrStatus`
  - 入力: 署名付き `{ request_id, signature }`
  - 出力: `{ is_activated, wallet_addr?, nonce? }`
  - 使い所: エフェメラルアドレス有効化状況の確認。

- POST `/executeEphemeralTx`
  - 入力: 署名済み `{ wallet_addr, tx_nonce, ephe_addr, ephe_addr_nonce, target, eth_value, data, token_amount, signature }`
  - 挙動: 即時オンチェーン実行。メール返信は不要。
  - 注意: セキュアな署名検証前提。UI実装時は誤送信防止のUXを必ず用意。

- POST `/unclaim`
  - 入力: `{ email_address, random, expiry_time, is_fund, tx_hash }`
  - 挙動: Unclaimed Fund/State のクレームを実行（ZK生成→オンチェーン）。完了後は通知メール送信。
  - 備考: 条件を満たす場合にメール起点なく確定可能。

- GET `/stats`
  - 出力: `{ onboarding_tokens_distributed, onboarding_tokens_left }`

- POST `/serveCheck`, `/serveReveal`
  - 用途: PSI（プライベート集合演算）関連のチェック/リビール処理（拡張向け）。

- POST `/addSafeOwner`, `/removeSafeOwner`
  - 入力: `{ wallet_addr, safe_addr }`
  - 挙動: ユーザーウォレットとSafeの関連づけ/解除（DB更新）。必要に応じてRelayerがSafeトランザクションの承認依頼メールを送付。

- POST `/receiveEmail`
  - 入力: 原文メール文字列
  - 挙動: SMTP/IMAP 連携用の受信フック（Ackメール送信→本文解析→ZK→実行→結果通知）。通常はSMTP/IMAPサービスが内部連携で叩きます。

## メール送信でのみ最終的に行えること（ユーザー返信が必須）

以下は「APIで開始（確認メール送信）」し、ユーザーがそのメールに返信することで最終確定する処理です。返信メールは `core.rs::handle_email` で解析され、DKIM/署名検証→ZK証明生成→コントラクト呼び出し（`chain.rs`）が行われます。

- アカウント作成（Create Account）
  - 開始: `/createAccount`
  - 確定: 返信メール→`create_account` 実行。完了メール送信（`AccountCreated`）。

- 送金（Send ERC20/ETH 等）
  - 開始: `/send`
  - 確定: 返信メール→`handle_email_op(SEND)` 実行。完了メール送信（`EmailHandled`）。

- NFT 転送（ERC-721）
  - 開始: `/nftTransfer`
  - 確定: 返信メール→`handle_email_op(EXECUTE/NFT)` 実行。完了メール送信。

- サインアップ/サインイン（Signup/Signin）
  - 開始: `/signupOrIn`
  - 確定: 返信メール→権限/アローワンスに応じた設定を反映。完了メール送信。

- Safe トランザクション承認
  - 開始: Relayerが外部Safe APIをポーリングし、必要時にユーザーへ「承認依頼メール」を送付。
  - 確定: 返信メール→承認処理。完了メール送信。

注意: ユーザーがメールを「返信」する点が本質です。件名テンプレート（例: `Send 10 TEST to alice@example.com`）に基づき、本文のDKIM署名や件名トークンからZK入力を構成します。UIは「開始」まで、確定は「メール返信」で行われます。

## APIだけで完結できる（メール不要）代表例

- アドレス/状態の取得系: `/relayerEmailAddr`, `/isAccountCreated`, `/getWalletAddress`, `/stats`, `/emailAddrCommit`, `/epheAddrStatus`
- エフェメラルトランザクションの実行: `/executeEphemeralTx`（署名済みペイロード前提）
- Unclaim のクレーム確定: `/unclaim`（条件を満たすと即時実行し、完了後に通知メール）
- Safe 関連の関連付けメタ更新: `/addSafeOwner`, `/removeSafeOwner`
- 受信注入（内部連携）: `/receiveEmail`（SMTP/IMAPサービス用）

## 典型フロー（例）

1) UI: `/createAccount` をPOST → ユーザーへ「作成確認メール」
2) ユーザー: メールにそのまま返信
3) Relayer: 受信→DKIM検証→ZK生成→`create_account` 実行→完了メール

同様に `/send` や `/nftTransfer`、`/signupOrIn` も「開始はAPI、確定はメール返信」です。

## 実装メモ（開発者向け）

- 送信用テンプレ: `packages/relayer/eml_templates/`
- 主要ロジック:
  - ルーティング: `src/modules/web_server/server.rs`
  - API実装: `src/modules/web_server/rest_api.rs`
  - メール受信処理: `src/core.rs::handle_email`
  - メール送信/通知: `src/modules/mail.rs`
  - Unclaim処理: `src/modules/claimer.rs`
- ENV: `.env.example` を `packages/relayer/.env` にコピーして編集（RPC, PRIVATE_KEY, PROVER_ADDRESS, SMTP/IMAP, SUBGRAPH_URL 等）。

## フロントエンド実装の指針

- API呼び出しの結果が「即時成功=オンチェーン確定」ではないケースが多い。UI上は「確認メールを送信しました」→「返信後に処理が自動実行されます」を明示。
- メール未返信でタイムアウト/失敗時の再試行導線（再送 or キャンセル）を用意。
- 受信確認ステータスの取得は、必要に応じて `/epheAddrStatus` や通知メール内リンク/Explorer参照で補助。
- 送付先がメールアドレスの場合は `/emailAddrCommit` を活用し、UIで事前検証やコミットの可視化を検討。

## 付録: エンドポイント早見表

- 情報取得系: `GET /relayerEmailAddr`, `GET /genAccountCode`, `POST /isAccountCreated`, `POST /getWalletAddress`, `GET /stats`, `POST /epheAddrStatus`, `POST /emailAddrCommit`
- メール開始→返信で確定: `POST /createAccount`, `POST /send`, `POST /nftTransfer`, `POST /signupOrIn`
- 直接実行系: `POST /executeEphemeralTx`, `POST /unclaim`, `POST /serveCheck`, `POST /serveReveal`, `POST /receiveEmail`, `POST /addSafeOwner`, `POST /removeSafeOwner`

以上。

