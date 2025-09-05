# Migration — v1 (POC) → v2 (Upstream-First)

概要
- v1 は自前実装による最小検証（contracts/prover/relayer）。
- v2 は zkemail/email-wallet を前提に据え、当面は Adapter/Wrapper と運用差分に限定しつつ置換。

方針
- v1 のコードは参照用途（削除せず）。新規は v2 のディレクトリ/計画に従う。
- ドキュメントは v1（Legacy）と v2（Upstream）で明確に分離。

関連ドキュメント
- Legacy（POC）: `plans/contracts.md`（タイトルに Legacy 表記）
- Upstream: `plans.v2/*`, `research/email-wallet-usage-plan.md`, `research/email-wallet-integration.md`

移行ステップ（概要）
1) Contracts: 上流 contracts 導入→アドレス出力整備→RelayerHandler 登録
2) Prover: circuits/keys 取得→snarkjs 連携→公開入力整形を上流準拠へ
3) Relayer: API/テンプレ/契約呼出しを上流準拠で実装（Hono）
4) CI/運用: アドレス/ABI 固定化、上流差分の追従手順化
