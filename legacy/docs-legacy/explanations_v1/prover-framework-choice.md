# Prover Framework Choice — Hono vs Express

結論（MVP方針）
- Hono で進めてOK。Bun/Node 同時対応、軽量、型の相性が良く、将来 Cloudflare Workers などサーバレスにも展開しやすい。
- 既に Express → Hono にリファクタして PR #25 に反映済み（`services/prover/src/server.ts`）。

比較メモ
- 速度/軽量: Hono は fetch ベースでミドルウェアのオーバーヘッドが小さい。Express は豊富なミドルウェア資産が強み。
- ランタイム: Hono は Bun/Node/Deno/Cloudflare に跨る。Express は Node に最適化。
- DX: Hono は `hono/cors` 等の公式ミドルウェア、型定義が素直。Express も実績十分だが ESM/TS での型補完は一工夫必要。
- 本件要件: シンプルな REST + JSON 検証 + 将来サーバレス可 ⇒ Hono の利点が活きる。

移行影響
- 依存: `hono`, `@hono/node-server`, `@hono/cors` を追加。`express`, `cors` は不要。
- コード: `app.get/post` のハンドラが `c`（Context）を返す形に変更。応答は `c.json(...)`。

今後
- メトリクス/ロギング: Hono ミドルウェア or OpenTelemetry を検討。
- サーバレス展開: Cloudflare Workers / Vercel Edge に載せる場合は node-server 依存を外すだけ。
