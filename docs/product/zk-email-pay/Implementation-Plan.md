# 実装手順ガイド（詳細版）

本書は zk-email-pay を実装するための詳細な手順書です。フロントエンド（Next.js）、Relayer、Prover、スマートコントラクト（Foundry）の順に、環境構築→最小実装→結合→運用準備までを段階的に解説します。必要な追加情報が未確定の場合は「決定事項/不足情報」に従い、Context7 で外部ドキュメントを参照するか、ユーザーに明示的に依頼してください。

参考ドキュメント（ローカル）
- 設計一式: `docs/product/zk-email-pay/*`
- 学習ハンドブック: `docs/product/zk-email-pay/Developer-Handbook.md`
- zk-email 概説: `docs/zkemail/zk-email-overview.md`
- Email Wallet: `docs/zkemail/zkemail-emailwallet/*`
- Personas: `docs/user/persona.md`

---

## 0. 前提と決定事項/不足情報

- 推奨チェーン: Base（MVPは Base Sepolia）。
- 通貨: USDC（テストはUSDCテストトークン）
- 実装方針: Email Wallet（回路/コントラクト/Relayer/Prover）の設計を活用し、Unclaimed→Claim パターンで受取。
- ディレクトリ: `frontend/`, `contracts/`, `services/relayer/`, `services/prover/`, `docs/`, `task/`

不足情報（要確認）
- 本番/検証用チェーン・RPC エンドポイント
- トークンアドレス（USDC）と TokenRegistry の初期登録ポリシー
- DKIM 公開鍵の信頼モデル（信頼済みフェッチャ/DNSSEC/独自Registry）
- メールプロバイダと IMAP/SMTP 認証（ドメイン、アカウント、App Password）
- Relayer 用ウォレットのデプロイ・秘密鍵管理（KMS/HSM）
- ドメイン/送信用Fromアドレス（招待・完了通知）

Context7 推奨参照（不足時）
- OpenZeppelin（ERC20 周り）
- Foundry（forge ユース）
- wagmi/viem（FEのRPC接続）
- Base OnchainKit（UI/UX補助の最新ガイド）

---

## 1. 契約（Foundry）

目的: Email Wallet のコントラクト群（Core/Handlers/Wallet/Verifiers/Registry/Oracle）を前提に、MVPで必要なアドレス群を把握し、Base Sepolia に配置する。

手順
1) Foundry セットアップ
- `contracts/` 直下で `forge --version` が動くことを確認
- 依存（OpenZeppelin 等）が必要なら `forge install` で導入

2) デプロイ計画（MVP最小）
- 必須: `TokenRegistry`, `AllVerifiers`（または個別 Verifier）, `DKIMRegistry`（信頼モデルに依存）, `Wallet`, `Handlers`, `EmailWalletCore`, `PriceOracle`（固定/簡易で可）
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

目的: DKIM 検証/抽出付きの証明を生成。Email Wallet の回路インタフェースに合わせ、ローカルで最小の証明が通る状態を作る。

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

目的: API（/api/send 等）とメール受送信（IMAP/SMTP）、Prover/Contracts 連携を実装。Unclaimed の作成、返信メールでの Claim 完了までを自動化する。

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
  - OpenZeppelin（ERC20/安全な転送）
  - Foundry（スクリプト/テスト/デプロイ）
  - wagmi/viem（RPC・ウォレット連携）
  - Base OnchainKit（UI・組込み）
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
