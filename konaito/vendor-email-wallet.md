# vendor/email-wallet 概要まとめ

本ドキュメントは、本リポジトリ同梱のサブディレクトリ `vendor/email-wallet`（Email Wallet モノレポ）の構成と役割、導入ポイントを日本語で要約したものです。元ドキュメントは `README.md` / `DESIGN.md` および各 `packages/*/README.md` を参照してください。

## 何をするプロジェクトか
- メール（DKIM 署名）を ZK 証明により検証し、メールをトリガにコントラクトウォレットを操作する仕組みを提供。
- 送信者/受信者メールアドレス等の PII をオンチェーンで秘匿しつつ、ETH/ERC20 送金・任意コールデータ実行・拡張機能（Uniswap/NFT 等）を実現。
- Relayer がメールを受信→Prover で ZK 証明生成→コントラクトで検証→トランザクション実行、という非対話フロー。

## 主な機能
- ETH/ERC20 をメールアドレスまたは EOA へ送金（例: "Send 1 ETH to alice@example.com"）。
- 任意のコールデータ実行（Execute）。
- 拡張機能（Extensions）の導入/削除（Uniswap でのスワップ、NFT ミント/送付など）。
- カスタム DKIM Registry の設定、ウォレットオーナー移譲。

## セキュリティ観点（抜粋）
- DKIM 署名の ZK 検証により、メールなりすましを抑止しつつメールアドレス自体は秘匿。
- ドメインが改ざんしない限り Safety/Liveness を保証（詳細は DESIGN.md）。
- DoS 的スキャンに対するプライバシ保護。特定額スキャンで受取人特定の可能性など、残余リスクも明記。

## 仕組み（高レベルフロー）
1. ユーザが Relayer のメールアドレス宛にコマンドを含むメール送信。
2. Relayer が DKIM を検証し、Prover に入力を渡して ZK 証明を生成。
3. ZK 回路が件名・タイムスタンプ・受取メール等を抽出し、証明で正当性を担保。
4. Relayer がコントラクトに証明と抽出データを送信。オンチェーンで検証・実行。
5. 取引結果をメールで通知（送信者/受取人）。

## リポジトリ構成（要点）
- `packages/circuits` Circom 回路とテスト、鍵/証明生成補助。
- `packages/contracts` Solidity コントラクト群（`EmailWalletCore` 本体、`Wallet`、各 Handler、拡張、Verifier、ユーティリティ）。
- `packages/relayer` Relayer サービス（IMAP/SMTP 連携、Prover 連携、チェーン書き込み、DB）。
- `packages/prover` Prover サービス（メール由来データの ZK 証明生成）。
- `packages/subgraph` 主要イベントのインデックス（Relayer の PSI 通信等に利用）。
- `packages/scripts` レジストリ関連スクリプト（TokenRegistry など）。
- `docs/` mdBook によるドキュメント。

## コントラクト構成（抜粋）
- `EmailWalletCore.sol` 本体。`handleEmailOp` 等の中核機能。
- Handlers: `RelayerHandler`（Relayer 登録/更新）、`AccountHandler`（アカウント作成/初期化/移送）、`UnclaimsHandler`、`ExtensionHandler`。
- `Wallet.sol` 各ユーザ用ウォレット（オーナは既定で Core）。
- Interfaces/Libraries: `Types.sol` `Commands.sol` `Events.sol` `SubjectUtils.sol` `DecimalUtils.sol` 等。
- Utils: `TokenRegistry` `UniswapTWAPOracle` `ECDSAOwnedDKIMRegistry`。
- Extensions: `NFTExtension` `UniswapExtension`。
- Verifiers: 各回路用 Verifier（`EmailSender` ほか）。

## Circom 回路（主なもの）
- `account_creation` アカウント作成検証（メール/リレーヤ乱数/アカウントコード）。
- `account_init` 初期化（DKIM/RSA 署名検証、各種オフセット抽出）。
- `account_transport` アカウント移送（旧/新リレーヤ乱数、AK コミット移行）。
- `claim` 未請求資産/状態のクレーム。
- `email_sender` メールコマンド送信用検証（件名/受取人抽出、秘匿件名照合）。
- `announcement` 第三者用のメールアドレスコミット登録向け。

## Relayer の設計と実行
- 依存: Node.js、Python、Docker、Rust/Cargo 等。
- `.env` 設定例（抜粋）: `CORE_CONTRACT_ADDRESS` `PRIVATE_KEY` `CHAIN_*` `RELAYER_EMAIL_ADDR` `RELAYER_HOSTNAME` `PROVER_ADDRESS` `DATABASE_URL` `SUBGRAPH_URL` など。
- ローカル動作: `docker compose up -d` で DB/SMTP/IMAP を起動可能（`.env` 参照）。
- 実行: `cargo run --release -- setup`（チェーン上登録）→ `cargo run --release`（常駐）。
- フィーモデル: Relayer はガス単価（wei）を `.env` で設定。契約側で消費ガス + 返金/受取アドレス検知分の上乗せを計算して送信者負担（上限はコントラクト側 `maxFeePerGas`）。

## デプロイ手順（概要）
1. `packages/contracts` で一括デプロイ推奨（Foundry）。`.env` に `PRIVATE_KEY` `RPC_URL` `CHAIN_ID` 等を設定し `forge script ...`。
2. 出力された各アドレス（`RelayerHandler`/`EmailWalletCore` 等）を控える。
3. Relayer の `.env` を上記アドレスで更新し、`RegisterRelayer.s.sol` で Relayer 情報を登録。
4. `packages/relayer` を起動（ローカル Docker or 単体実行）。
5. フロントエンドは別リポジトリ（emailwallet.org）にあり、手動 E2E 検証に利用可能。

## zk-email-pay への取り込み指針
- 本プロジェクトのアーキテクチャ（「メール→ZK→コントラクト」）は zk-email-pay のコア要件に整合。以下を基準に統合：
  - 送付対象: メールアドレス宛ステーブルコイン送金は `EmailSender` 回路 + コアコントラクトの ERC20 送金機能を活用。
  - アドレス/環境分離: dev/stg/prod ごとに `CORE_CONTRACT_ADDRESS` 等を分離管理（Vercel 環境変数＋Relayer 側 `.env`）。
  - PII 取扱い: 受信メール/ログ/DB はマスキング or コミットのみ保存（本リポ方針に従う）。
  - 監視/メトリクス: Relayer の Tx 成功率・証明時間・メール失敗率を計測しアラート化。
- 既存 `frontend/`（Next.js）からは、送金状況ポーリング/トランザクション参照、Relayer API ステータス表示を実装対象に。

## 補足
- Node 18 を想定（contracts README より）。
- 一部ドキュメントは「Deprecated/Outdated」注記あり。実装は実レポの `README.md` とコード優先で整合確認。
- mdBook ドキュメント生成は `docs/` で `cargo install mdbook && mdbook serve`。

---
出典: `vendor/email-wallet/README.md` `vendor/email-wallet/DESIGN.md` および `packages/*/README.md`（contracts/relayer/circuits/scripts/safe_tracker）。
