# 032: System Integration (email-wallet upstream)

- Parent Epic: System Migration to Upstream
- Branch: `feat/26-v2-contracts-upstream`
- **Status**: IN_PROGRESS

## 概要
upstream zkemail/email-wallet を直接採用し、完全なシステム（contracts/relayer/prover）をローカル・testnet・mainnet で運用する。従来の再実装方針から転換し、UX改善に注力する。

## 背景・方針転換の経緯
### 旧方針の問題点
- **再実装リスク**: 動作済みシステムを Hono で再実装 
- **複雑性**: 上流追従、バージョン管理、テスト体系構築
- **開発時間**: 実装・デバッグ・テストに多大な時間

### 新方針の利点  
- **即座の利用**: 実証済み contracts/relayer/prover 完全システム
- **プロダクション対応**: Docker、環境設定、インセンティブ設計完備
- **要件適合**: メール送金、ガスレス、非保有者対応を完全実装
- **UX集中**: システム実装でなく、ユーザー体験向上に注力

## 実装タスク

### Phase 1: Infrastructure Setup
- [x] **Submodule Integration**: `vendor/email-wallet` 追加完了
- [x] **Documentation Overhaul**: 新方針反映
  - [x] Implementation-Plan.md 更新
  - [x] Local-Development-Guide.md 作成 
  - [x] Frontend-Integration-Guide.md 作成

### Phase 2: Local Environment (現在)
- [ ] **Local Deployment**: 
  - [ ] anvil + circuits build + contracts deploy
  - [ ] relayer + prover service 起動
  - [ ] e2e email test（送金→受取）
- [ ] **Environment Config**:
  - [ ] .env templates 作成
  - [ ] addresses/local.json 出力
  - [ ] health check endpoints 確認

### Phase 3: Testnet Deployment  
- [ ] **Base Sepolia**:
  - [ ] contracts deployment（DefaultSetupScript.s.sol）
  - [ ] relayer service Docker deployment
  - [ ] Modal prover setup
  - [ ] production .env configuration
- [ ] **Integration Testing**:
  - [ ] end-to-end email flow
  - [ ] frontend API integration
  - [ ] error handling validation

### Phase 4: UX Enhancement
- [ ] **Frontend Polish**:
  - [ ] メールテンプレート日本語化
  - [ ] UI/UX 改善（既存フロントエンド基盤活用）
  - [ ] onboarding flow 最適化
- [ ] **Monitoring & Support**:
  - [ ] metrics collection
  - [ ] logging system
  - [ ] user documentation

## Legacy Task Migration

### Deprecated (完了扱い)
- ~~#27: v2 Prover Hono実装~~ → upstream prover 直接使用
- ~~#28: v2 Relayer Hono実装~~ → upstream relayer 直接使用  
- ~~contracts 自社実装~~ → upstream packages/contracts 使用

### Updated
- #26: v2 Contracts → upstream contracts deployment
- #8: Contracts MVP → upstream system deployment
- #10: Contracts Epic → system integration epic

## 受入基準（DoD）

### M1: Local Environment
- [ ] vendor/email-wallet でローカル完全動作
- [ ] メール送信→受取の e2e 成功
- [ ] health check & debugging 可能

### M2: Testnet Production  
- [ ] Base Sepolia で安定動作
- [ ] frontend 統合完了
- [ ] monitoring & alerting 設定

### M3: User Experience
- [ ] 直感的なユーザーフロー
- [ ] 日本語対応・分かりやすい文面
- [ ] エラーハンドリング・サポート体制

## 参考
- **Implementation Plan**: `docs/engineering/zk-email-pay/Implementation-Plan.md`
- **Local Setup**: `docs/engineering/zk-email-pay/Local-Development-Guide.md`  
- **Frontend Integration**: `docs/engineering/zk-email-pay/Frontend-Integration-Guide.md`
- **Upstream Docs**: https://docs.zk.email/email-wallet/