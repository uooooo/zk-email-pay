# Prover — Align With email-wallet Circuits

方針
- Hono サーバは維持。公開入力と証明生成は email-wallet の circuits/keys に合わせる。

手順（案）
- circuits/keys 取得: 上流 `packages/circuits` の README に沿って鍵生成/取得（dev-setup, gen-random-proofs）
- snarkjs 連携: `/prove/email` で zkey/vkey をロードし、入力整形→prove→返却
- 入力整形: email_sender / claim の公開入力（domain, selector, email_nullifier, pointer, commits 等）を準拠
- timings/metrics: proveMs/totalMs をレスポンスに含め、ログ/メトリクス集計

注意
- Trusted Fetcher + キャッシュの PoC 方針は維持（DKIM 鍵の最終解決は Relayer 側）
- SDK は拡張時のみ（現段階では不要）
