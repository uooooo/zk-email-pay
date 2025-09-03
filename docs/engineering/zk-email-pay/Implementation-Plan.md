# 実装手順ガイド v2（Upstream-First: email-wallet）

本書は v2 方針（zkemail/email-wallet を前提に採用）で、Contracts/Prover/Relayer を段階導入するための実装計画です。v1（POC/自前実装）の資料は `docs/product/zk-email-pay/` を参照（Legacy）。

参考（上流）
- email-wallet monorepo（contracts/relayer/circuits）
- 参照ノート: `docs/engineering/zk-email-pay/research/*`
- v2 計画詳細: `docs/engineering/zk-email-pay/plans.v2/*`

---

## 0. 前提と決定事項
- 方針: 上流 email-wallet を採用し、当プロジェクトは UX と差分 Adapter/Wrapper に集中。
- 採用範囲: packages/contracts（Foundry）、packages/circuits（circom/snarkjs）、relayer 設計の API/テンプレ/登録フロー。
- サービス基盤: Prover/Relayer は Hono（TS）で最小を提供（将来 Edge/Serverless へ展開容易）。
- DKIM: Trusted Fetcher + キャッシュ（PoC）。将来 ECDSAOwnedDKIMRegistry/DNSSEC を検討。

---

## 1. Contracts（上流準拠）
目的: packages/contracts を採用し、上流の deploy・登録手順に沿って Core/Handlers/Registries/Verifiers を配置。`addresses/<network>.json` を生成し共有。

手順
1) 取り込み
- vendor として monorepo を submodule 追加（`vendor/email-wallet`）。
- Foundry remapping を設定し、上流ソース参照を可能化。
2) デプロイ
- 上流 README の DefaultSetupScript を使用（TokenRegistry/DKIM/AllVerifiers/Handlers/Core）。
- RelayerHandler に relayer 情報を登録。
3) 共有
- `addresses/local.json`, `addresses/base-sepolia.json` を出力し、Relayer/Frontend の .env に反映。

テスト/デプロイ手順（例）
- ローカル（anvil）
  - `anvil` を起動
  - `RPC_URL=http://127.0.0.1:8545 CHAIN_ID=31337 scripts/deploy/email-wallet-local.sh`
  - `CHAIN_ID=31337 NETWORK=local scripts/deploy/export-addresses.sh` で `contracts/addresses/local.json` を生成
- テスト
  - `scripts/test/email-wallet-contracts.sh`（ユニット）
  - `RUN_INTEGRATION=1 scripts/test/email-wallet-contracts.sh`（回路がある場合のみ）


---

## 2. Prover（上流 circuits 準拠）
目的: email_sender/claim/account_* の circuits/keys に準拠して publicInputs を整形し、snarkjs で証明生成。Hono サーバで `/prove/email` 提供。

手順
- circuits/keys を取得（dev-setup, gen-random-proofs 参考）。
- /prove/email の入力スキーマを上流の公開入力に合わせる（domain/selector/email_nullifier/pointers/commits など）。
- 証明/検証時間を timings に記録。

---

## 3. Relayer（上流セマンティクス）
目的: Hono で `/api/send` 等の API を提供し、上流のテンプレ/件名/契約呼出しに準拠。DKIM は PoC 方針を維持。

手順
- API 形状/エラー標準化を上流に揃える。
- SMTP/IMAP のテンプレ/件名・ポインタ抽出のルールを踏襲。
- Prover → Contracts の I/F を上流通りに結線。

---

## 4. 環境/デプロイ
- アドレス: `addresses/<network>.json`（local/base-sepolia）
- .env: CORE_CONTRACT_ADDRESS/ONBOARDING_TOKEN_ADDR/IMAP/SMTP/DB/PROVER/RELAYER 等（上流に準拠）
- CI: 上流追従時の破壊検知（ABI/addresses/テスト）

---

## 5. マイルストーン
- M1: Contracts 上流導入 + デプロイ/登録（local/base-sepolia）
- M2: Prover snarkjs 連携 + 公開入力整形
- M3: Relayer API/テンプレ/Contracts 結線
- M4: e2e（送金→受取）ローカル一周

---

## 6. 参照/ポリシー
- Context7 + gitmcp を用いて上流ドキュメント/コード参照、バージョン明記。
- v1（Legacy）と v2（Upstream）のドキュメントを明確に分離。
