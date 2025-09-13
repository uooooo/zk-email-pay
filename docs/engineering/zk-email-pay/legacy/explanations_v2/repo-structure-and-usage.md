# Repo Structure — v2 で何を使っているか

目的
- 上流（email-wallet）と当リポジトリの役割分担を明確化し、どのファイルが“今”使われているかを示す。

## 上流（email-wallet）
- `packages/contracts`: Email Wallet のコア/ハンドラ/レジストリ/検証器 + デプロイスクリプト
  - 当リポのラッパーから直接 `forge script ...` を実行
  - 依存は monorepo 直下 `node_modules` に解決
- `packages/relayer`: 参考実装（Rust）。設計/API/テンプレ/登録フローの準拠に利用
- `packages/circuits`: circuits/keys のビルド・取得手順（snarkjs と連携）

## 当リポ（本体）
- `email-wallet`: 上流の submodule（ソースオブトゥルース）
- `scripts/deploy/*.sh`: 上流の deploy/登録/broadcast を呼び出すラッパー
- `scripts/test/*.sh`: 上流 packages/contracts のテストを呼び出すラッパー
- `contracts/addresses/*.json`: 上流の broadcast から抽出したアドレス出力（Relayer/Frontend が参照）
- `services/prover/`: Hono ベースの Prover サービス（上流 circuits/keys に準拠予定）
- `services/relayer/`: Hono ベースの Relayer サービス（上流セマンティクスに準拠予定）

## Legacy（POC）
- `contracts-legacy-v1/`（この PR で移設）: v1 自前コントラクト/テスト/スクリプト。
  - 現在は参照のみ。v2 では使わない。

## よくある質問
- Q: vendor のどのファイルが使われる？
  - A: packages/contracts のソース/スクリプトを `forge` で直接実行しています。依存は vendor 直下の node_modules に自動インストールされます。
- Q: /contracts 配下の自作コードは？
  - A: legacy に移設しました。v2 は上流の contracts を使用します。
