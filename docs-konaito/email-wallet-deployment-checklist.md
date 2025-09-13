# Email Wallet サービス立ち上げ完全チェックリスト

## 🔗 システム依存関係図

### 立ち上げ順序（必須）
```
1. ブロックチェーン基盤 → 2. Internet Computer → 3. スマートコントラクト → 4. リレイヤー → 5. フロントエンド
```

### 外部サービス依存
| コンポーネント | 依存先 | 必須度 | 代替案 |
|--------------|--------|-------|-------|
| **スマートコントラクト** | Ethereum互換チェーン | ◉ 必須 | L2チェーン選択可 |
| **ZK証明検証** | オンチェーンVerifier | ◉ 必須 | なし |
| **DKIM Oracle** | Internet Computer | ◉ 必須 | 手動管理（非推奨） |
| **リレイヤー** | PostgreSQL, SMTP/IMAP | ◉ 必須 | なし |
| **メール処理** | Gmail DKIM鍵 | ◉ 必須 | 他プロバイダー対応 |
| **フロントエンド** | Web3ウォレット | ◉ 必須 | なし |
| **イベント監視** | TheGraph | ○ 推奨 | 直接RPC監視 |

### 🚫 **重要な制約**
- **Internet Computer設定は絶対必須** - OAuth・Ephemeral Transaction機能に不可欠
- **Gmail限定推奨** - カスタムドメインはIC Oracleコスト増
- **ZK証明システム** - プルーバーがオンチェーンのため回避不可
- **リレイヤー必須** - メール処理とブロックチェーン連携に必要

## 概要
Email Walletサービスを新規で立ち上げるために必要なすべてのコンポーネントと手順を整理しました。

## 🏗️ 必要なコンポーネント一覧

### 1. ブロックチェーン基盤
- [ ] **ブロックチェーン選択** (Base Sepolia推奨)
- [ ] **デプロイ用ウォレット** (プライベートキー)
- [ ] **RPC エンドポイント** (Alchemy、Infura等)
- [ ] **ガス代用ETH** (デプロイ・運用費用)

### 2. スマートコントラクト群
- [ ] **EmailWalletCore** (中核コントラクト)
- [ ] **RelayerHandler** (リレイヤー管理)
- [ ] **AccountHandler** (アカウント管理)  
- [ ] **UnclaimsHandler** (未請求資産管理)
- [ ] **ExtensionHandler** (拡張機能管理)
- [ ] **Wallet Implementation** (個人ウォレット雛形)
- [ ] **TokenRegistry** (トークン登録)
- [ ] **DKIM Registry** (DKIM鍵管理)
- [ ] **Verifier contracts** (ZK証明検証)

### 3. ZK証明システム
- [ ] **ZK回路** (packages/circuits)
- [ ] **証明生成器** (packages/prover)
- [ ] **検証器** (オンチェーン)

### 4. Internet Computer (IC) インフラ
- [ ] **IC アカウント作成**
- [ ] **PEM ファイル生成** (認証用秘密鍵)
- [ ] **Wallet Canister デプロイ**
- [ ] **DKIM Oracle Canister** (fxmww-qiaaa-aaaaj-azu7a-cai)
- [ ] **Cycles 購入・入金** (計算リソース)

### 5. リレイヤーサービス (Rust)
- [ ] **PostgreSQL データベース**
- [ ] **SMTP サーバー** (メール送信)
- [ ] **IMAP サービス** (メール受信)
- [ ] **Relayer バイナリ** (メイン処理)

### 6. フロントエンド
- [ ] **Web アプリケーション** (emailwallet.org)
- [ ] **ウォレット接続** (MetaMask等)
- [ ] **API エンドポイント** (リレイヤー連携)

### 7. 外部サービス
- [ ] **TheGraph API キー** (イベント監視)
- [ ] **Price Oracle** (手数料計算)

## 📋 段階別デプロイ手順

### Phase 1: ブロックチェーン基盤準備

#### 1.1 環境設定
```bash
# Node.js 18のインストール確認
node --version  # v18.x.x

# 必要なツールのインストール
npm install -g @foundry-rs/foundry
```

#### 1.2 デプロイ設定
```bash
cd email-wallet/packages/contracts
cp .env.sample .env
```

`.env`設定項目：
```env
# ブロックチェーン設定
PRIVATE_KEY=0x...  # デプロイ用プライベートキー
RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
CHAIN_ID=84532  # Base Sepolia
CHAIN_NAME=base-sepolia

# リレイヤー設定
RELAYER_EMAIL=relayer@yourdomain.com
RELAYER_HOSTNAME=yourdomain.com
```

### Phase 2: スマートコントラクト デプロイ

#### 2.1 コントラクト群の一括デプロイ
```bash
cd email-wallet/packages/contracts

# ビルド
forge build --skip test --skip script

# デプロイ実行
source .env && \
forge script script/DefaultSetupScript.s.sol:Deploy \
--rpc-url $RPC_URL \
--chain-id $CHAIN_ID \
--broadcast \
-vvv
```

#### 2.2 デプロイ結果の保存
デプロイ後に表示されるアドレスを記録：
```
TokenRegistry proxy: 0x...
RelayerHandler proxy: 0x...
EmailWalletCore proxy: 0x...
TestERC20 (USDC): 0x...
```

#### 2.3 リレイヤー登録
```bash
# 環境変数設定
export RELAYER_HANDLER=0x...  # RelayerHandlerアドレス

# リレイヤー情報を登録
source .env && \
forge script script/RegisterRelayer.s.sol --rpc-url $RPC_URL --broadcast
```

### Phase 3: Internet Computer セットアップ

#### 3.1 IC SDK インストール
```bash
sh -ci "$(curl -fsSL https://smartcontracts.org/install.sh)"
```

#### 3.2 IC アカウント作成
```bash
# 新しいアカウント作成
dfx identity new email-wallet-relayer

# PEMファイルの取得
dfx identity export email-wallet-relayer > ~/.ic.pem
```

#### 3.3 Cycles 購入
```bash
# ICPトークンでCycles購入 (約$10-20分)
dfx ledger create-canister <principal> --amount <icp_amount>
```

### Phase 4: リレイヤーサービス構築

#### 4.1 Docker環境構築
```bash
cd email-wallet/packages/relayer

# 環境変数設定
cp .env.sample .env
```

#### 4.2 .env 設定
```env
# コントラクト設定
CORE_CONTRACT_ADDRESS=0x...  # Phase 2で取得
ONBOARDING_TOKEN_ADDR=0x...  # TestERC20アドレス

# ブロックチェーン設定
PRIVATE_KEY=0x...  # リレイヤー用キー
CHAIN_RPC_PROVIDER=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
CHAIN_ID=84532

# IC設定
PEM_PATH=./.ic.pem
CANISTER_ID=fxmww-qiaaa-aaaaj-azu7a-cai
WALLET_CANISTER_ID=your-wallet-canister-id
IC_REPLICA_URL=https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=fxmww-qiaaa-aaaaj-azu7a-cai

# メール設定
RELAYER_EMAIL_ADDR=relayer@yourdomain.com
RELAYER_HOSTNAME=yourdomain.com
ERROR_EMAIL_ADDRESSES=admin@yourdomain.com

# 外部サービス
SUBGRAPH_URL=https://gateway-arbitrum.network.thegraph.com/api/[API_KEY]/subgraphs/id/AFNg1WfLo4dv1tfixaKCvWTVnFGEsVhVKx2Kef1dbt9G
PROVER_ADDRESS=https://zkemail--email-wallet-relayer-v1-2-0-flask-app.modal.run/
```

#### 4.3 サービス起動
```bash
# PEMファイル配置
cp ~/.ic.pem ./.ic.pem

# Docker Compose起動
docker compose up --build -d

# サービス確認
docker ps
```

### Phase 5: フロントエンド デプロイ

#### 5.1 フロントエンド取得
```bash
git clone https://github.com/zkemail/emailwallet.org.git -b refactor/v1.1
cd emailwallet.org
```

#### 5.2 設定・デプロイ
```bash
# 環境設定
cp .env.example .env.local
# コントラクトアドレス等を設定

# ビルド・起動
npm install
npm run build
npm run start
```

## 🔍 動作確認チェックリスト

### システム全体
- [ ] **コントラクト デプロイ完了** (全アドレス記録済み)
- [ ] **リレイヤー サービス起動** (Docker コンテナ4つ)
- [ ] **フロントエンド アクセス可能**
- [ ] **IC Oracle 接続成功**

### メール処理テスト
- [ ] **テストメール送信** → リレイヤー受信
- [ ] **DKIM検証成功** → ZK証明生成
- [ ] **オンチェーン実行** → トランザクション確認
- [ ] **フロントエンド反映** → 結果表示

### 基本機能テスト
- [ ] **アカウント作成** (Gmail→招待メール)
- [ ] **ETH送金** (メールアドレス宛)
- [ ] **ERC20送金** (USDC等)
- [ ] **未請求資産** (クレーム機能)

## 💰 必要コスト見積もり

### 初期設定費用
| 項目 | 費用 |
|------|------|
| コントラクト デプロイ | $50-100 |
| IC Cycles 購入 | $10-20 |
| RPC サービス | $0-50/月 |
| サーバー費用 | $20-100/月 |

### 運用費用
| 項目 | 月額費用 |
|------|---------|
| IC Oracle (Gmail) | ¥0-50円 |
| RPC 利用料 | $10-50 |
| サーバー運用 | $20-100 |

## ⚠️ 注意事項・制限

### セキュリティ
- **プライベートキー管理**: 安全な保管・バックアップ
- **HTTPS必須**: 本番環境では全通信をHTTPS化
- **監視体制**: ログ・メトリクス・アラートの設定

### 制限事項
- **Gmail依存**: 現状はGmail限定が推奨
- **Base Sepolia**: テストネット環境
- **スケーラビリティ**: 同時接続数・メール処理量の制限

### トラブルシューティング
- **IC接続エラー**: PEMファイル・Canister ID確認
- **DKIM検証失敗**: Gmail鍵更新・IC Oracle確認
- **トランザクション失敗**: ガス代・RPC接続確認

## 🚀 本格運用への移行

### メインネット対応
1. **コントラクトの再デプロイ** (Base Mainnet)
2. **セキュリティ監査** (スマートコントラクト)
3. **負荷テスト** (大量トランザクション)
4. **監視システム** (Prometheus/Grafana)

### スケーラビリティ対応
1. **マルチリレイヤー構成**
2. **データベース最適化**  
3. **CDN・ロードバランサー導入**
4. **自動スケーリング設定**

このチェックリストに従えば、Email Walletサービスを完全に立ち上げることができます。