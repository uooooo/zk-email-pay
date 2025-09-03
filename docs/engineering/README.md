# Engineering Docs

This directory hosts engineering-focused documentation that supports day-to-day development for zk-email-pay.

- Audience: contributors/maintainers and AI coding agents.
- Scope: development handbooks, detailed component plans, operational playbooks.
- Separation: product-facing specs remain under `docs/product/zk-email-pay/*`.

Structure
- `zk-email-pay/Developer-Handbook.md` — consolidated developer handbook
- `zk-email-pay/plans/contracts.md` — contracts (Foundry) development plan
- `zk-email-pay/plans/prover.md` — prover service development plan
- `zk-email-pay/plans/relayer.md` — relayer service development plan
- `zk-email-pay/research/` — investigations and compatibility notes
 - `zk-email-pay/plans.v2/` — upstream-first plans (email-wallet adoption)
 - `zk-email-pay/migration/` — v1 (POC) → v2 (upstream) migration notes

# zk-email-pay v2 — Upstream‑First (email-wallet)

方針
- 上流 zkemail/email-wallet（monorepo: contracts/relayer/circuits）を採用し、当プロジェクトは UX と差分 Adapter/Wrapper に集中する。
- v1（POC/自前実装）のドキュメントは `docs/product/zk-email-pay/`（Legacy）に残し、v2 は本ディレクトリを起点に参照。

参照
- エンジニアリング計画（v2）: `docs/engineering/zk-email-pay/plans.v2/*`
- 研究ノート: `docs/engineering/zk-email-pay/research/*`
- 移行ガイド: `docs/engineering/zk-email-pay/migration/v1-to-v2.md`

概要
- Contracts: 上流 packages/contracts の deploy スクリプトを利用、RelayerHandler 登録。
- Prover: 上流 circuits に準拠した publicInputs + snarkjs、Hono サーバで API を提供。
- Relayer: 上流 API/テンプレ/契約呼出しに準拠（Hono 実装）。
