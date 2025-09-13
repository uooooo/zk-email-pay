# Contracts — Upstream Adoption Plan

方針
- zkemail/email-wallet monorepo の `packages/contracts` を採用。Foundry の remapping か submodule で取り込み、上流のデプロイスクリプトを使用。
- 当面の差分は addresses 出力（`addresses/<network>.json`）と .env 連携に限定。

手順（案）
1) 追加方法の選択
- A: submodule `email-wallet` → `packages/contracts` を参照
- B: `forge install zkemail/email-wallet`（monorepo構成のため A 推奨）
2) remappings 設定
- `foundry.toml` に remappings を追加し、import を上流に合わせる
3) デプロイ
- 上流 README に従い DefaultSetupScript を実行 → コア/ハンドラ/レジストリ/検証器の配置
- 当プロジェクトの `scripts` で `addresses/<network>.json` を生成・同期
4) RelayerHandler 設定
- relayer 登録スクリプトを実行して on-chain で設定

注意
- email-wallet-contracts（単体レポジトリ）は古い。monorepo を採用。
