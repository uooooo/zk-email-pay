# 008: Contracts MVP (Base Sepolia)

- Issue: https://github.com/uooooo/zk-email-pay/issues/8
- Branch: `feat/8-contracts-mvp`

## 概要
Email Wallet を見据えた MVP コントラクト群の初期実装・配置を Base Sepolia に行う。PoC 段階では TokenRegistry/PriceOracle/DKIMRegistry(Stub) を用意し、後続の Core/Handlers/Wallet/Verifier 追加に備える。デプロイスクリプトでアドレスを JSON 出力し、Relayer/Frontend の .env に反映可能な状態を作る。

## 背景
- 推奨チェーン: Base（MVP は Base Sepolia）。
- 互換性: `docs/engineering/zk-email-pay/research/base-compatibility.md` 参照。
- PoC: DKIM は Trusted Fetcher + キャッシュ（Relayer 側）。将来は DNSSEC/オンチェーン Registry を想定。

## やること（Tasks）
- [x] Foundry セットアップ確認（solc ^0.8.24 近辺）
- [x] OpenZeppelin 導入（`forge install OpenZeppelin/openzeppelin-contracts`）
- [x] TokenRegistry 実装
  - [ ] `addToken(address token)`/`removeToken(address token)`（Ownable）
  - [ ] `isAllowed(address token) view returns (bool)`
  - [ ] 変更イベント: `TokenAdded`, `TokenRemoved`
- [x] PriceOracle（固定/簡易）実装
  - [ ] `setFeePerGas(uint256 weiPerGas)`（Ownable）
  - [ ] `getFeePerGas() view returns (uint256)`
- [x] DKIMRegistry（Stub）実装
  - [ ] `setDKIMPublicKey(string domain, bytes key)`（Ownable）
  - [ ] `getDKIMPublicKey(string domain) view returns (bytes)`
  - [ ] 変更イベント: `DKIMKeySet`
- [x] デプロイスクリプト `script/Deploy.s.sol`
  - [ ] Base Sepolia 用に 3 つのコントラクトをデプロイ
  - [x] `contracts/addresses/base-sepolia.json` にアドレスを出力（`vm.serializeAddress` + `vm.writeJson`）
- [x] 最小ユニットテスト
  - [ ] TokenRegistry: add/remove/isAllowed, onlyOwner 制御
  - [ ] PriceOracle: set/get, onlyOwner 制御
  - [ ] DKIMRegistry: set/get, onlyOwner 制御
- [x] README 更新（deploy 実行方法、出力パス、依存）
- [ ] CI/Lint（任意）: `forge fmt` と `forge test`
  
追記
- [x] `vm.writeJson` 書込エラー修正（`foundry.toml` の `fs_permissions` 設定 + 出力パス修正）

## 受入基準（DoD）
- Base Sepolia で 3 契約がデプロイ可能
- `contracts/addresses/base-sepolia.json` にアドレスが出力される
- `forge test` がローカルで成功
- `contracts/README.md` にデプロイ・検証・出力の手順が追記されている

## 参考
- 計画: `docs/engineering/zk-email-pay/plans/contracts.md`
- 互換性: `docs/engineering/zk-email-pay/research/base-compatibility.md`
- 実装手順: `docs/product/zk-email-pay/Implementation-Plan.md`
- OpenZeppelin（Context7/MCP 参照可）
