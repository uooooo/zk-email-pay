# 010: Contracts Epic — Core/Handlers/Wallet/Verifiers (Unclaimed→Claim MVP)

- Epic: https://github.com/uooooo/zk-email-pay/issues/10

## 概要
EmailWalletCore/Handlers/Wallet/Verifiers を段階的に実装し、ローカルで Unclaimed→Claim を 1 周可能にする。

## 子タスク（Issues）
- [x] #11 Core/Wallet + UnclaimsHandler skeleton with Mock Verifiers
- [x] #12 Verifier interfaces + Mock implementations
- [x] #13 Unclaimed flow (expiry/nonce/email_commit + events)
- [x] #14 SafeERC20 transfers + TokenRegistry + fee deduction (PriceOracle)
- [ ] #15 Deploy script expansion + addresses JSON unification (PR #20 open)
- [x] #8 Contracts MVP (registries/oracle + deploy base)

## 受入基準（DoD）
- `forge test` で Unclaimed→Claim の正常/異常が通る（達成）
- Deploy スクリプトでアドレス JSON がネットワーク別に出力（達成 / PR #20）
- Docs 更新（contracts.md, engineering plans, explanations）（達成）

## メモ
- OpenZeppelin は Context7 + MCP Server で参照。バージョンを記録。
- Base 互換性は research メモ参照。
