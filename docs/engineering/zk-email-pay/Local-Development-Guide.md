# Email Wallet ローカル開発ガイド

upstream email-wallet システムをローカル環境で立ち上げ、テストする完全なガイドです。

## 🏗️ システム構成

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Relayer     │    │     Prover      │
│                 │───▶│  (Rust + API)   │───▶│   (Python)      │
│ React/Next.js   │    │  localhost:4500 │    │ localhost:8080  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   PostgreSQL    │              │
         └──────────────│   localhost:5432│──────────────┘
                        └─────────────────┘
                               │
                    ┌─────────────────────┐
                    │ Smart Contracts     │
                    │ (anvil localhost)   │
                    │ localhost:8545      │
                    └─────────────────────┘
```

## 📋 前提条件

### 必要なソフトウェア

```bash
# Node.js 18
nvm use 18

# Rust (最新安定版)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Python 3.x
python3 --version

# Docker
docker --version

# Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Global npm packages
npm install -g snarkjs@latest
```

### ディレクトリ構成確認

```bash
# プロジェクトルートで確認
ls vendor/email-wallet/packages/
# 出力: circuits  contracts  prover  relayer
```

## 🚀 セットアップ手順

### 1. Circuits ビルド

```bash
cd vendor/email-wallet/packages/circuits
yarn && yarn build
```

**Integration テスト用パラメータ（オプション）**:
```bash
# packages/circuits/README.md の指示に従い
# build ディレクトリを作成し、テストパラメータをダウンロード
```

### 2. Smart Contracts デプロイ

#### 環境設定

```bash
cd vendor/email-wallet/packages/contracts

# .env ファイル作成
cp .env.sample .env
```

**.env ファイル設定**:
```bash
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80  # anvil default
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
CHAIN_NAME=local
```

#### Anvil 起動（別ターミナル）

```bash
anvil
```

#### コントラクトビルド・デプロイ

```bash
# コントラクトビルド
forge build --skip test --skip script

# 一括デプロイ
source .env && \
forge script script/DefaultSetupScript.s.sol:Deploy \
--rpc-url $RPC_URL \
--chain-id $CHAIN_ID \
--broadcast \
-vvv
```

#### 重要なアドレス保存

デプロイ完了後、以下をメモ:
- `EmailWalletCore proxy deployed at: 0x...` → **CORE_CONTRACT_ADDRESS**
- `TestERC20 deployed at: 0x...` → **ONBOARDING_TOKEN_ADDR**

#### Relayer 登録

```bash
# 環境変数設定
export RELAYER_HANDLER=0x... # RelayerHandler address
export RELAYER_EMAIL=your-relayer@example.com
export RELAYER_HOSTNAME=localhost

# Relayer 登録
source .env && \
forge script script/RegisterRelayer.s.sol --rpc-url $RPC_URL --broadcast
```

### 3. Relayer 設定

```bash
cd vendor/email-wallet/packages/relayer

# .env ファイル作成
cp .env.example .env
```

**.env ファイル設定**:
```bash
# Contract addresses (step 2で取得)
CORE_CONTRACT_ADDRESS=0x...  
ONBOARDING_TOKEN_ADDR=0x...

# Blockchain
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CHAIN_RPC_PROVIDER=http://127.0.0.1:8545
CHAIN_ID=31337

# Database
DATABASE_URL=postgresql://emailwallet:p@ssw0rd@localhost:5432/emailwallet

# Email (Docker Compose で提供)
SMTP_DOMAIN_NAME=localhost
SMTP_PORT=1025
IMAP_DOMAIN_NAME=localhost
IMAP_PORT=1143
LOGIN_ID=test@localhost
LOGIN_PASSWORD=password

# Prover
PROVER_LOCATION=local
PROVER_ADDRESS=http://localhost:8080

# API Server
WEB_SERVER_ADDRESS=127.0.0.1:4500

# Paths (絶対パス必須)
CIRCUITS_DIR_PATH=/path/to/vendor/email-wallet/packages/circuits
INPUT_FILES_DIR_PATH=/path/to/vendor/email-wallet/packages/relayer/input_files
EMAIL_TEMPLATES_PATH=/path/to/vendor/email-wallet/packages/relayer/eml_templates/

# Other
RELAYER_EMAIL_ADDR=your-relayer@example.com
RELAYER_HOSTNAME=localhost
FEE_PER_GAS=0
JSON_LOGGER=false
```

### 4. インフラサービス起動

```bash
cd vendor/email-wallet/packages/relayer

# PostgreSQL, SMTP, IMAP 起動
docker compose up --build -d

# サービス確認
docker ps
# 出力: email-wallet-db-1, email-wallet-smtp-1, email-wallet-imap-1
```

### 5. Prover Service 起動

```bash
cd vendor/email-wallet/packages/prover

# Python依存関係インストール
pip install -r requirements.txt

# セットアップスクリプト実行
chmod +x local_setup.sh
./local_setup.sh

# Prover 起動
python3 local.py
```

**確認**: `http://localhost:8080` で Prover が動作中

### 6. Relayer Service 起動

```bash
cd vendor/email-wallet/packages/relayer

# Relayer ビルド
cargo build --release

# Relayer 起動
cargo run --release
```

**確認**: `http://localhost:4500` で Relayer API が動作中

## 🧪 動作テスト

### Health Check

```bash
# Relayer API
curl http://localhost:4500/api/echo
# 出力: "Hello, world!"

# Prover Service  
curl http://localhost:8080/health

# Database
psql postgresql://emailwallet:p@ssw0rd@localhost:5432/emailwallet -c "SELECT 1;"

# Relayer statistics
curl http://localhost:4500/api/stats
```

### E2E メールテスト

1. **メールクライアント設定**:
   - SMTP: localhost:1025
   - IMAP: localhost:1143
   - ユーザー: test@localhost
   - パスワード: password

2. **テストメール送信**:
   - 宛先: your-relayer@example.com
   - 件名: `Send 1 ETH to recipient@example.com`

3. **ログ確認**:
   ```bash
   # Relayer ログ監視
   cd vendor/email-wallet/packages/relayer
   cargo run --release
   ```

## 🔧 トラブルシューティング

### よくある問題

**Contract deployment fails**:
- anvil が起動しているか確認
- PRIVATE_KEY に十分な残高があるか確認

**Relayer can't connect to DB**:
```bash
docker compose logs email-wallet-db-1
```

**Prover service errors**:
```bash
cd vendor/email-wallet/packages/prover
pip install -r requirements.txt
python3 --version  # 3.x required
```

**SMTP/IMAP connection fails**:
```bash
docker compose logs email-wallet-smtp-1
docker compose logs email-wallet-imap-1
```

**Circuit build failures**:
```bash
node --version  # Should be 18.x
cd vendor/email-wallet/packages/circuits
yarn clean && yarn && yarn build
```

### デバッグコマンド

```bash
# すべてのサービス状態確認
docker compose ps

# Relayer詳細ログ
RUST_LOG=debug cargo run --release

# Prover詳細ログ  
python3 local.py --verbose

# Contract イベントログ
cast logs --rpc-url http://127.0.0.1:8545
```

## 📊 開発フロー

1. **契約変更時**: `forge script` で再デプロイ → Relayer `.env` 更新
2. **回路変更時**: `packages/circuits` で `yarn build` → Prover 再起動
3. **Relayer 変更時**: `cargo build --release` → `cargo run --release`
4. **フロントエンド開発**: `http://localhost:4500/api/*` に API calls

これで完全なローカル開発環境が整います。次はフロントエンド統合を進めてください。