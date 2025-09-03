# Deploy Script and Addresses Output — Explanation (#15)

目的
- ローカル/テストネットでコントラクト群を一括デプロイし、ネットワーク別に `addresses/<network>.json` を書き出す。ローカルでは E2E テスト用に Core/Handler/Mock Verifier まで揃える。

変更ファイル
- `contracts/script/Deploy.s.sol`
  - Base 共通: `TokenRegistry`, `PriceOracle`, `DKIMRegistry` をデプロイ
  - Local (chainId=31337): 追加で `MockEmailSenderVerifier`, `MockClaimVerifier`, `UnclaimsHandler`, `EmailWalletCore` をデプロイ
  - 出力: `addresses/<network>.json`（`local.json`, `base-sepolia.json` など）
  - ログに `chainId` と各アドレスを表示
- `contracts/README.md`
  - ローカル/本番テストネットの実行手順と出力パスを記載

アドレス JSON（例: `addresses/local.json`）
```json
{
  "TokenRegistry": "0x...",
  "PriceOracle": "0x...",
  "DKIMRegistry": "0x...",
  "MockEmailSenderVerifier": "0x...",
  "MockClaimVerifier": "0x...",
  "UnclaimsHandler": "0x...",
  "EmailWalletCore": "0x..."
}
```

使い方
- Local（anvil）
```sh
anvil
cd contracts
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545
cat addresses/local.json
```
- Base Sepolia
```sh
export PRIVATE_KEY=0x...
export RPC_URL=https://base-sepolia.g.alchemy.com/v2/...
forge script script/Deploy.s.sol \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify --verifier etherscan --verifier-url https://api-sepolia.basescan.org/api
cat addresses/base-sepolia.json
```

注意
- Local の Mock Verifier は E2E テスト/結合用で、本番デプロイには含めない。
- addresses JSON は Relayer/Frontend の `.env` 生成やスクリプト連携の入力として利用できる。
