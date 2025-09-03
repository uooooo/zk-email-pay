# Plans v2 — Upstream‑First (email-wallet)

目的
- 自前実装（POC）よりも、zkemail/email-wallet の最新設計/実装を前提に据え、当プロジェクトの開発コストとリスクを下げる。
- 当面の差分は Adapter/Wrapper と運用（デプロイ/アドレス/ENV）で吸収し、UX と製品価値に集中。

構成
- `contracts-upstream.md` — 上流 contracts の採用計画（Foundry remap/submodule）
- `prover-upstream.md` — circuits/keys/snarkjs 連携と公開入力整形の整合
- `relayer-upstream.md` — API/IMAP/SMTP/Prover/Contracts の上流準拠
