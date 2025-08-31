# Prover Development Plan

目的
- DKIM 検証/抽出付きの ZK 証明生成インフラ（PoC → 将来強化）。
- Email Wallet の回路インタフェースに合わせ、`email_sender` + `claim` 証明の最小稼働。
- Relayer と HTTP 経由で連携し、公開入力と証明を返す。

前提
- PoC DKIM 信頼: Trusted Fetcher + キャッシュは Relayer 側。Prover は与えられたヘッダ断片/署名を回路に供給。
- Circuit: circom 系（email_wallet の回路構成に準拠）。
- ランタイム: Node or Python。PoC は Node（Express/Bun）中心、重い前処理は Python 併用も可。
- 外部ドキュメント: circom/snarkjs と Email Wallet 回路を Context7 で参照。

ディレクトリ構成（予定）
```
services/prover/
  src/
    server.ts        # HTTP エントリ（/prove/email 等）
    adapters/
    circuits/
    prover/
  circuits/
    email_sender.circom
    claim.circom
    keys/
      email_sender.zkey
      email_sender.vkey.json
      claim.zkey
      claim.vkey.json
  package.json (or bunfig.toml)
  Dockerfile
  .env
```

API 設計（暫定）
- `POST /prove/email`
  - 入力(JSON):
    - headers: { d, s, bh, b, from, to, subject, date, messageId, rawHeaderChunks }
    - body: { maxLen, hHash, excerpt? }
    - claim: { amount, token, unclaimedId, expiry, nullifier }
  - 出力(JSON): { proof, publicSignals, vkeyHash, circuit: 'email_sender+claim', timings }
- `GET /healthz`: { status, circuitsLoaded, version }

セットアップ手順
1) 依存準備
- Node: `bun install` or `npm i`
- circom/snarkjs: `npm i -g snarkjs`（ローカル生成用）
- Python 併用時: `pip install -r requirements.txt`

2) 鍵/回路の準備
- `circuits/` に `*.circom` と `*.zkey`/`*.vkey.json` を配置（初期はダミー可）
- CI: 大きい鍵は LFS or 外部配布。ローカルは `make fetch-keys` で取得できるようにする（後日）

3) サーバ実装
- Express or Hono（Bun）で HTTP 実装
- 起動時に zkey/vkey をロードしウォームアップ
- `/prove/email` で入力整形→snarkjs 呼び出し→結果を返却
- ロギング/タイミング計測を実装（平均/分位をメトリクス化）

4) 構成
- `.env`: `PORT=8080`, `CIRCUITS_DIR=./circuits`, `CONCURRENCY=2`
- Docker: シンプルなランタイム（Bun or Node）

5) 動作確認
- ダミー .eml から抽出した JSON を使い `POST /prove/email`
- 200/400/500 の代表ケースを手動テスト

結合
- Relayer は IMAP で受信→ヘッダ/本文/ポインタ抽出→本 API に投入
- 返却された `proof`/`publicSignals` を Contracts の Verifier に提出

Deliverables（DoD）
- `services/prover/` の最小サーバ起動
- ダミー入力での証明生成（またはスタブ）
- `GET /healthz` が 200 を返す
- 証明時間のログ（平均/分位）

将来強化
- DNSSEC/オンチェーンレジストリ前提の DKIM 鍵検証を回路に統合
- Modal/Serverless 実行、キュー連携、GPU/分散化
- キー配布のセキュア化（暗号化/アクセス制御）

チェックリスト
- [ ] HTTP サーバ雛形
- [ ] circom/snarkjs の呼び出し
- [ ] zkey/vkey のロードと検証
- [ ] `/prove/email` 入出力スキーマ
- [ ] healthz/metrics
- [ ] Docker 化
