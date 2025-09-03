# 実装手順ガイド（詳細版）

本書は zk-email-pay を実装するための詳細な手順書です。フロントエンド（Next.js）、Relayer、Prover、スマートコントラクト（Foundry）の順に、環境構築→最小実装→結合→運用準備までを段階的に解説します。必要な追加情報が未確定の場合は「決定事項/不足情報」に従い、Context7 で外部ドキュメントを参照するか、ユーザーに明示的に依頼してください。

参考ドキュメント（ローカル）
- 設計一式: `docs/product/zk-email-pay/*`
- 学習ハンドブック: `docs/engineering/zk-email-pay/Developer-Handbook.md`
- 詳細開発計画（Engineering）:
  - Contracts: `docs/engineering/zk-email-pay/plans/contracts.md`
  - Prover: `docs/engineering/zk-email-pay/plans/prover.md`
  - Relayer: `docs/engineering/zk-email-pay/plans/relayer.md`
- zk-email 概説: `docs/zkemail/zk-email-overview.md`
- Email Wallet: `docs/zkemail/zkemail-emailwallet/*`
- Personas: `docs/user/persona.md`

---

## 0. 前提と決定事項/不足情報

- 推奨チェーン: Base（MVPは Base Sepolia）。
- 通貨: USDC（テストはUSDCテストトークン）
- 実装方針（v2）: 上流 email-wallet を採用（contracts/relayer/circuits を前提）し、当プロジェクトは UX と差分の Adapter/Wrapper に集中。POC（v1）の計画は Legacy として残置。
- ディレクトリ: `frontend/`, `contracts/`, `services/relayer/`, `services/prover/`, `docs/`, `task/`

決定事項（PoC）
- DKIM 信頼モデル: Trusted Fetcher + キャッシュ
  - Relayer が DNS から DKIM 公開鍵を取得して検証し、結果をキャッシュ。
  - 将来強化: DNSSEC または オンチェーン ECDSA レジストリへの移行を検討。
- メールプロバイダ: Gmail IMAP/SMTP + アプリパスワード
  - セットアップ容易・可用性重視。将来は独自ドメイン + 専用送信基盤（例: SES）へ移行可。
- Relayer の鍵管理: `.env` にホットキー（開発/PoC）
  - まずは速度優先。本番前に KMS/HSM へ移行して漏洩リスクを低減。
- 通知メールの From: 同じ専用 Gmail アカウント
  - 受信側の信頼性を優先。将来は専用ドメイン + DKIM/DMARC/SPF を整備。

不足情報（要確認）
- 本番/検証用チェーン・RPC エンドポイント
- トークンアドレス（USDC）と TokenRegistry の初期登録ポリシー
- DKIM/DNS の本番運用方針（DNSSEC への切替時期、オンチェーン移行方針）
- メール運用の本番要件（専用ドメイン取得・送信基盤/配信レピュテーション）
- 鍵管理の本番移行計画（KMS/HSM 選定・ローテーション）

Context7 / 上流参照
- email-wallet（monorepo: contracts/relayer/circuits）
- OpenZeppelin（ERC20 周り）
- Foundry（forge ユース）
- wagmi/viem（FrontEndのRPC接続）
- Base OnchainKit（UI/UX補助の最新ガイド）

ドキュメント参照ポリシー
- OpenZeppelin の公式ドキュメントは Context7 に加え、MCP Server（OpenZeppelin）からも取得可能。必要に応じて両方を活用し、参照元とバージョンを明記する。
- Serena MCP / gitmcp を併用して上流ドキュメント・コードを取得、バージョンを明記。

---

Contract（Foundry）

目的（v2）: email-wallet の `packages/contracts` を採用し、上流の deploy スクリプトで Core/Handlers/Registries/Verifiers を配置。`addresses/<network>.json` を生成し Relayer/Frontend に共有。

手順
1) Foundry セットアップ
- `contracts/` 直下で `forge --version` が動くことを確認
- 依存（OpenZeppelin 等）が必要なら `forge install` で導入

2) デプロイ計画（上流準拠）
- 上流 README の DefaultSetupScript を使用。RelayerHandler 登録スクリプトで relayer 情報を on-chain 登録。
- 参考: `docs/zkemail/zkemail-emailwallet/docs.zk.email_email-wallet_contract-architecture.md`

3) デプロイスクリプト
- Base Sepolia の RPC/PRIVATE_KEY を .env に設定
- スクリプト順序（例）: TokenRegistry → Verifiers → DKIMRegistry → Wallet → Handlers → Core → Extensions（任意）

4) 出力の取り込み
- 各アドレスを `services/relayer/.env` と `frontend/.env.local` に反映

5) 定義の凍結
- タグ/メモでコミットし、PR で共有

---

## 2. Prover（services/prover/）

目的（v2）: 上流 circuits（email_sender/claim/account_*）に合わせて snarkjs 連携し、公開入力を上流準拠に整形。Hono サーバで `/prove/email` を提供。

手順
1) 依存準備
- `npm i -g snarkjs`
- `pip install -r requirements.txt`（必要ファイルは各実装に準拠）

2) ローカル起動
- `services/prover/` に `local.py` 相当のエントリ（HTTP 受け）を用意
- Email Wallet の `email_sender.circom`, `claim.circom` 系に合わせた入力生成を実装

3) 構成
- `.env`: PROVERのポート、作業ディレクトリ、証明鍵の配置（zkey/vkey）
- Modal 等のサーバレス運用は後段で対応

4) 動作確認
- ダミーの .eml 風入力に対し、サンプル証明を返す

不足時（Context7 参照）
- circom/snarkjs の最新ガイド、Email Wallet の回路要件

---

## 3. Relayer（services/relayer/）

目的（v2）: API とテンプレ・契約呼出しを上流準拠に整え、Hono サーバで最小構成を提供。DKIM は Trusted Fetcher + キャッシュの PoC を維持しつつ、将来 ECDSA レジストリを検討。

手順
1) API スケルトン
- エンドポイント（参考）: `/api/createAccount`, `/api/isAccountCreated`, `/api/send`, `/api/getWalletAddress`, `/api/nftTransfer`
- 実装は Email Wallet のリレーAPI仕様に準拠: `docs/zkemail/zkemail-emailwallet/docs.zk.email_email-wallet_api-documentation.md`

2) メール連携
- 送信: 招待/完了/失敗通知のテンプレを `services/relayer/email_templates/` に配置
- 受信: IMAP で返信をポーリングし、フィルタ（件名: Claim/accountKey）で取り出す

3) Prover/Contracts 連携
- 返信メールから DKIM/件名/ポインタ抽出 → Prover へ入力
- 取得した証明＋公開入力を Core に送信（ガスは Relayer 持ち）
- Unclaimed 消費→受取者 Wallet に着金

4) DB
- Postgres を Docker で起動（`docker run -p 5432:5432 -e ... postgres`）
- テーブル: accounts, payments, emails, relayer_jobs, limits（`data-models.md` 参照）

5) .env
- `CORE_CONTRACT_ADDRESS`, `CHAIN_ID`, `CHAIN_RPC_PROVIDER`, `PRIVATE_KEY`
- `IMAP_DOMAIN_NAME`, `IMAP_PORT`, `SMTP_DOMAIN_NAME`, `LOGIN_ID`, `LOGIN_PASSWORD`
- `PROVER_ADDRESS`, `DATABASE_URL`, `FEE_PER_GAS`

6) テスト
- フロントから `/api/send` → 招待メール受信 → 返信 → on-chain 反映 → 完了通知の一連をローカルで確認

---

## 4. フロントエンド（frontend/）

目的: Persona1 がメール宛に送金を作成し、進捗/取消を扱える最小UIを構築。Persona2 はメールのみで完了。

手順
1) セットアップ
- `bun install`
- `.env.local` に `RELAYER_API_URL` を設定

2) 画面
- 送金フォーム: メール/金額/トークン/期限/メモ
- 確認画面: 手数料・取消条件・期限の表示
- ステータス: Created/Notified/Claimed/Expired/Cancelled の表示

3) API 呼び出し
- `/api/send` を実行。レスポンスとエラー表示を標準化

4) 任意
- 取消ボタン（期限内のみ）
- 履歴ビュー（Relayer API or サブグラフ経由）

---

## 5. 結合とE2E

- シーケンス図（`architecture.md`, `flows.md`）に沿ってローカルで1周
- 代表的な異常系: DKIM失敗、期限切れ、重複請求（再放送拒否）
- Playwright などで E2E スモーク（送金→受取→完了通知）

---

## 6. 運用準備（Metrics/Alert/Keys）

- メール: 配信成功率/遅延/DKIM失敗率
- 証明: 生成時間/失敗率/キュー滞留
- チェーン: Tx成功率/確定遅延/ガス単価
- セキュリティ: レート制御、PRレビュー、鍵はKMS/HSM、ローテーション

---

## 7. Context7 / 追加ドキュメントの取り込み

不足が出たら、以下の優先度で参照/依頼してください。
- Context7 でライブラリ公式ドキュメント取得（例）
  - OpenZeppelin（ERC20/安全な転送）— Context7 に加え、MCP Server（OpenZeppelin）でも参照可能
  - Foundry（スクリプト/テスト/デプロイ）
  - wagmi/viem（RPC・ウォレット連携）
  - Base OnchainKit（UI・組込み）
  - 取得時は参照元とバージョンをメモし、PR/Issue にリンク
- Serena MCP を活用して Context7/MCP サーバからの情報取得・要点要約を行う（取得ログを残す）。
- 必要に応じ、次の資料提供をユーザーに依頼
  - 使用チェーン/トークンアドレスの確定
  - DKIM信頼モデルの選択と鍵管理方針
  - メールドメイン/IMAP/SMTP 資格情報
  - リレーアーカイブ/ログの保管方針

---

## 8. マイルストーンと DoD（Definition of Done）

- M1: 契約アドレス確定（Testnet）
  - DoD: TokenRegistry/DKIMRegistry/Core/Handlers 配置、アドレス共有
- M2: Prover ローカル稼働
  - DoD: ダミー .eml で email_sender+claim の証明が生成される
- M3: Relayer → Contracts 結線
  - DoD: 招待/返信で Unclaimed→Claim がチェーン反映
- M4: Frontend から `/api/send` で送金作成
  - DoD: 送金→受取の1周がローカルで安定
- M5: 運用準備（メトリクス/鍵/CI）
  - DoD: 最低限の監視とCIが有効

---

## 9. 付録：最小 .env サンプル

services/relayer/.env（例）
```
CORE_CONTRACT_ADDRESS=0x...
CHAIN_ID=84532
CHAIN_RPC_PROVIDER=https://base-sepolia.g.alchemy.com/v2/...
PRIVATE_KEY=0x...
IMAP_DOMAIN_NAME=imap.gmail.com
IMAP_PORT=993
SMTP_DOMAIN_NAME=smtp.gmail.com
LOGIN_ID=relayer@example.com
LOGIN_PASSWORD=app-password
PROVER_ADDRESS=http://127.0.0.1:8080
DATABASE_URL=postgresql://emailwallet:p@ssw0rd@localhost:5432/emailwallet
FEE_PER_GAS=0
```

frontend/.env.local（例）
```
RELAYER_API_URL=http://localhost:4500
```

---

この手順に従えば、MVP を段階的に立ち上げられます。未確定項目は本書の「不足情報」に沿って早めに固め、Context7 を使って必要な技術ドキュメントを補完してください。
