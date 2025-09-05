# Relayer — Upstream Semantics

方針
- 独自実装（Hono）だが、上流 relayer と API/テンプレ/コントラクト連携を極力合わせる。

手順（案）
- API: `/api/send` 等の I/F を上流準拠で設計。エラー標準化。
- メール: 上流のテンプレート/件名の作法を踏襲（DKIM/件名/ポインタ抽出）。
- Prover: /prove/email を呼び出し（stub→実証明へ）。
- Contracts: RelayerHandler 登録、Core 呼び出し（addresses/<network>.json を使用）。
- DKIM: 当面は Trusted Fetcher + キャッシュ。将来 ECDSAOwnedDKIMRegistry も選択肢。

注意
- 上流の Docker compose（DB/IMAP/SMTP）構成は参考に。必要に応じ最小構成へ調整。
