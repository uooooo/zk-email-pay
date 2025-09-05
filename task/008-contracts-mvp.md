# 008: Contracts Deployment (email-wallet upstream)

- Issue: https://github.com/uooooo/zk-email-pay/issues/8
- Branch: `feat/8-contracts-mvp` (completed)
- **Status**: COMPLETED - Migrated to upstream email-wallet direct adoption

## 概要
**方針変更**: upstream zkemail/email-wallet のコントラクト群を直接採用・デプロイ。DefaultSetupScript.s.sol で完全なシステム（Core/Handlers/Registries/Verifiers）を一括デプロイし、Base Sepolia/Local で動作させる。

## 新方針（v2）: Upstream Direct Adoption

### 背景
- **決定事項**: 自社実装を中止し、upstream email-wallet を直接使用
- **理由**: 開発リスク削減、実証済みシステムの活用、UX改善への集中
- **対象**: packages/contracts の完全なシステム（Core/Handlers/Registries/Verifiers）

### 新実装タスク
- [x] **Submodule 追加**: `vendor/email-wallet` として upstream を追加
- [x] **ドキュメント更新**: Implementation-Plan.md を新方針に変更  
- [ ] **デプロイ実行**: `DefaultSetupScript.s.sol` でシステム全体をデプロイ
- [ ] **設定出力**: `addresses/<network>.json` でアドレス管理
- [ ] **Relayer 登録**: RelayerHandler への relayer 情報登録

### 完了済み（Legacy）
- [x] 基本的な TokenRegistry/PriceOracle/DKIMRegistry 実装
- [x] デプロイスクリプト基盤構築
- [x] Base Sepolia デプロイ・検証

## 新受入基準（DoD）
- [x] **方針転換**: Legacy実装の deprecate、upstream 採用決定
- [ ] **Local デプロイ**: vendor/email-wallet で anvil 環境構築
- [ ] **Base Sepolia**: upstream システムの testnet デプロイ  
- [ ] **ドキュメント**: Local-Development-Guide.md での手順整備

## 参考
- **新実装手順**: `docs/engineering/zk-email-pay/Implementation-Plan.md`（updated）
- **ローカル環境**: `docs/engineering/zk-email-pay/Local-Development-Guide.md`
- **上流ドキュメント**: https://docs.zk.email/email-wallet/
