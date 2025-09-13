# Deploy/Test Wrappers — 解説（v2）

本書では、v2 で追加したラッパースクリプトの使い方とコード（Bash）の文法ポイントを説明します。

対象
- `scripts/deploy/email-wallet-local.sh`
- `scripts/deploy/export-addresses.sh`
- `scripts/test/email-wallet-contracts.sh`

## 1) scripts/deploy/email-wallet-local.sh
目的: email-wallet（上流 monorepo）の packages/contracts で DefaultSetupScript を実行できるようにする。上流が `../../node_modules` に依存するため、monorepo 直下で `node_modules` を自動インストールします。

主要処理
- `set -euo pipefail`: エラー/未定義変数/パイプ失敗で停止
- `UPSTREAM_ROOT=email-wallet` / `UPSTREAM_DIR=.../packages/contracts`
- node_modules が無ければ `pnpm i` / `yarn install` / `npm install` を選択実行
- `forge script script/DefaultSetupScript.s.sol:Deploy --rpc-url ... --chain-id ... --broadcast` を呼び出し

使い方
```sh
anvil  # 別ターミナル
RPC_URL=http://127.0.0.1:8545 CHAIN_ID=31337 scripts/deploy/email-wallet-local.sh
```

## 2) scripts/deploy/export-addresses.sh
目的: 上流 Forge の broadcast JSON（run-latest.json）から リポジトリ直下 `addresses/<network>.json` を生成

主要処理
- 引数/環境変数から `CHAIN_ID` と `NETWORK` を決定（例: 31337→local, 84532→base-sepolia）
- `jq` の `reduce` 機能で `{ ContractName: address }` 形式のオブジェクトを構築

該当コード（要点）
```bash
jq 'reduce ( .transactions[]
 | select(.transactionType=="CREATE" and .contractAddress != null and .contractName != null)
 | { (.contractName): .contractAddress } ) as $i ({}; . * $i)'
```

使い方
```sh
CHAIN_ID=31337 NETWORK=local scripts/deploy/export-addresses.sh
# → addresses/local.json が生成（ルート直下）
```

## 3) scripts/test/email-wallet-contracts.sh
目的: 上流 packages/contracts のテストをこのリポジトリから実行

主要処理
- email-wallet の `node_modules` を自動インストール
- `forge build --skip test --skip script`
- ユニットテスト: `forge test --no-match-test "testIntegration"`
- 統合テスト（回路+FFI が必要）: `RUN_INTEGRATION=1` で `forge test --match-test 'testIntegration_' --ffi`

使い方
```sh
scripts/test/email-wallet-contracts.sh
RUN_INTEGRATION=1 scripts/test/email-wallet-contracts.sh  # circuits がある場合のみ
```
