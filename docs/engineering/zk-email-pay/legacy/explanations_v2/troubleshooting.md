# Troubleshooting — Upstream Deploy/Test (v2)

症状: `yarn install` が Node エンジン違反で止まる / 進まない
- 原因: upstream `email-wallet` は Node 18 を想定。yarn は engine を厳格にチェック。
- 対処（自動）: ラッパーは npm を使って `engine-strict=false` でインストールします。
- 対処（手動）: `cd email-wallet && nvm use 18 && yarn install`

症状: `permission denied: scripts/...sh`
- `chmod +x scripts/deploy/*.sh scripts/test/*.sh`

症状: `jq: command not found`（addresses の出力で失敗）
- `brew install jq`（macOS）/ `apt-get install jq`（Linux）

Tips
- インストールを飛ばしてデプロイだけ試す: `SKIP_NPM_INSTALL=1 RPC_URL=... CHAIN_ID=... scripts/deploy/email-wallet-local.sh`
- Node 18 を強制したい: `FORCE_NODE18=1 RPC_URL=... CHAIN_ID=... scripts/deploy/email-wallet-local.sh`
