# 010: Contracts Epic — Core/Handlers/Wallet/Verifiers (Unclaimed→Claim MVP)

- Epic: https://github.com/uooooo/zk-email-pay/issues/10

## 概要
EmailWalletCore/Handlers/Wallet/Verifiers を段階的に実装し、ローカルで Unclaimed→Claim を 1 周可能にする。

## 子タスク（Issues）
- [ ] #11 Core/Wallet + UnclaimsHandler skeleton with Mock Verifiers
- [ ] #12 Verifier interfaces + Mock implementations
- [ ] #13 Unclaimed flow (expiry/nonce/email_commit + events)
- [ ] #14 SafeERC20 transfers + TokenRegistry + fee deduction (PriceOracle)
- [ ] #15 Deploy script expansion + addresses JSON unification
- [x] #8 Contracts MVP (registries/oracle + deploy base)

## 受入基準（DoD）
- `forge test` で Unclaimed→Claim の正常/異常が通る
- Deploy スクリプトでアドレス JSON がネットワーク別に出力
- Docs 更新（contracts.md, engineering plans）

## メモ
- OpenZeppelin は Context7 + MCP Server で参照。バージョンを記録。
- Base 互換性は research メモ参照。
