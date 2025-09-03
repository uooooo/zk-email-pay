# Prover MVP — Scaffold and Stub `/prove/email` (#22)

目的
- Prover サービスの最小実装。入力検証とスタブ応答で Relayer 結合前に形を作る。

変更ファイル
- `services/prover/`
  - `src/server.ts`: Express サーバ（`/healthz`, `/prove/email`）
  - `src/types.ts`: Zod スキーマ定義（headers/body/claim）
  - `.env.example`: `PORT`, `CIRCUITS_DIR`, `CONCURRENCY`
  - `package.json`, `tsconfig.json`, `Dockerfile`, `README.md`

API（MVP）
- `GET /healthz` → `{ status, version, uptimeSec }`
- `POST /prove/email` → `{ proof, publicSignals, vkeyHash, circuit, timings }`
  - 現時点はスタブ（後日 snarkjs 連携）

今後
- `snarkjs` 連携と circuits/keys 配置
- タイミング計測/メトリクスの拡充
- 入力整形の Email Wallet 互換性を docs/zkemail に合わせて厳密化

