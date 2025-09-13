# Email Wallet ローカル開発ガイド

upstream email-wallet システムをローカル環境で立ち上げ、テストする**完全な実行可能**ガイドです。

## 🏗️ システム構成

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Relayer     │    │     Prover      │
│                 │───▶│  (Rust + API)   │───▶│ (Python/Modal)  │
│ React/Next.js   │    │  localhost:4500 │    │ localhost:8080  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │ PostgreSQL+SMTP │              │
         └──────────────│   (Docker)      │──────────────┘
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
nvm use 18  # または node --version で 18.x 確認

# Rust (最新安定版)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Python 3.x
python3 --version  # 3.8+ 必須

# Docker & Docker Compose
docker --version
docker compose version

# Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Global npm packages
npm install -g snarkjs@latest
```

### ディレクトリ構成確認

```bash
# プロジェクトルートで確認
ls email-wallet/packages/
# 必須出力: circuits  contracts  prover  relayer
```

### 重要な注意事項

⚠️ **このガイドの実行順序は厳密に守ってください。手順をスキップすると動作しません。**

📁 **すべてのパス指定は絶対パスで行います（相対パスはエラーの原因）。**

## 🚀 セットアップ手順（必須順序）

### **Phase 1: Circuits & Contracts Setup**

#### 1. Circuits ビルド

```bash
cd email-wallet/packages/circuits
yarn install
yarn build

# ✅ 確認: 以下のディレクトリが生成されること
ls build/  # 必須: 複数の .zkey, .vkey ファイル
```

**重要**: circuits ビルドは時間がかかります（5-15分）。エラーが出る場合は Node.js 18 を使用。

#### 2. Smart Contracts デプロイ

**Step 2a: Anvil 起動（別ターミナル）**
```bash
anvil --host 0.0.0.0 --port 8545 --accounts 10 --mnemonic "test test test test test test test test test test test junk"
# ✅ 確認: "Listening on 127.0.0.1:8545" メッセージを確認
```

**Step 2b: Contracts 環境設定**
```bash
cd email-wallet/packages/contracts

# .env ファイル作成
cp .env.sample .env
```

**`.env` ファイル設定**（email-wallet/packages/contracts/.env）:
```bash
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
CHAIN_NAME=local
RELAYER_HANDLER=  # 後で設定
RELAYER_EMAIL=test@localhost
RELAYER_HOSTNAME=localhost
```

**Step 2c: Contracts デプロイ**
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

# ✅ 重要: 以下のアドレスを**必ず**メモしてください:
# - EmailWalletCore proxy deployed at: 0x...
# - TestERC20 deployed at: 0x...  
# - RelayerHandler proxy deployed at: 0x...
```

**Step 2d: Relayer 登録**
```bash
# .env に RelayerHandler アドレスを追加
export RELAYER_HANDLER=0x... # 上記でメモしたアドレス

# Relayer 登録実行
source .env && \
forge script script/RegisterRelayer.s.sol --rpc-url $RPC_URL --broadcast

# ✅ 確認: "Relayer registered successfully" メッセージ確認
```

### **Phase 2: Services Setup**

#### 3. Docker Services 起動（PostgreSQL + SMTP + IMAP）

```bash
cd email-wallet/packages/relayer

# .env ファイル作成
cp .env.example .env
```

**重要**: 以下の `.env` ファイルを**正確に**設定してください（email-wallet/packages/relayer/.env）:

```bash
# Contract addresses (Phase 1 でメモしたアドレスを記入)
CORE_CONTRACT_ADDRESS=0x...  # EmailWalletCore proxy address
ONBOARDING_TOKEN_ADDR=0x...  # TestERC20 address

# Blockchain
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CHAIN_RPC_PROVIDER=http://127.0.0.1:8545
CHAIN_ID=31337

# Database (Docker Compose で自動設定)
DATABASE_URL=postgresql://emailWallet:emailWallet_password@db/emailWallet

# Email (Docker Compose で提供される値)
SMTP_PORT=3000
SMTP_INTERNAL_SERVER_HOST=0.0.0.0
SMTP_INTERNAL_SERVER_PORT=3000
SMTP_DOMAIN_NAME=localhost
SMTP_LOGIN_ID=
SMTP_LOGIN_PASSWORD=
SMTP_MESSAGE_ID_DOMAIN=
SMPT_JSON_LOGGER=true
SMTP_EMAIL_SENDER_NAME=Email Wallet
SMTP_SERVER=http://smtp:3000/api/sendEmail

IMAP_LOGIN_ID=
IMAP_LOGIN_PASSWORD=
IMAP_DOMAIN_NAME=localhost
IMAP_PORT=993
IMAP_AUTH_TYPE=password
IMAP_JSON_LOGGER=true

# Prover (後で設定)
PROVER_LOCATION=local
PROVER_ADDRESS=http://0.0.0.0:8080

# API Server
WEB_SERVER_ADDRESS=0.0.0.0:4500

# Paths (絶対パス必須 - 以下を実際のパスに変更)
CIRCUITS_DIR_PATH=/Users/$(whoami)/Documents/zk-email-pay/email-wallet/packages/circuits
INPUT_FILES_DIR_PATH=/Users/$(whoami)/Documents/zk-email-pay/email-wallet/packages/relayer/input_files
EMAIL_TEMPLATES_PATH=/Users/$(whoami)/Documents/zk-email-pay/email-wallet/packages/relayer/eml_templates/

# Other
RELAYER_EMAIL_ADDR=test@localhost
RELAYER_HOSTNAME=localhost
FEE_PER_GAS=0
JSON_LOGGER=true
```

**Docker Services 起動**:
```bash
# PostgreSQL + SMTP + IMAP を起動
docker compose up --build -d

# ✅ 確認: 以下のサービスが起動していること
docker ps
# 必須出力: db, smtp, imap containers running

# ✅ 確認: サービス健全性チェック
docker compose logs db    # PostgreSQL logs
docker compose logs smtp  # SMTP logs  
docker compose logs imap  # IMAP logs
```

#### 4. Prover Service 起動

**選択肢A: Local Prover（推奨・簡単）**
```bash
cd email-wallet/packages/prover

# Python 依存関係インストール
pip install -r requirements.txt

# セットアップスクリプト実行
chmod +x local_setup.sh
./local_setup.sh

# Prover 起動
python3 local.py

# ✅ 確認: "Flask app running on http://localhost:8080" メッセージ
```

**選択肢B: Modal Prover（プロダクション用）**

⚠️ **Modal 使用には無料アカウント登録が必要です**: https://modal.com

```bash
# Modal CLI インストール
pip install modal

# Modal ログイン
modal token new

# Prover 起動（Modal）
modal run python packages/prover/local.py

# ✅ 確認: Modal URL が表示される
# Relayer .env の PROVER_ADDRESS を Modal URL に変更
```

#### 5. Relayer Service 起動

```bash
cd email-wallet/packages/relayer

# Relayer ビルド（初回のみ・時間がかかる場合あり）
cargo build --release

# Relayer 起動
cargo run --release

# ✅ 確認: "Relayer API running on 0.0.0.0:4500" メッセージ
```

## 🧪 完全動作確認

### **Phase 3: System Health Check**

すべてのサービスが正常に起動していることを確認します:

```bash
# 1. Blockchain (anvil)
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://127.0.0.1:8545
# ✅ 期待値: {"jsonrpc":"2.0","id":1,"result":"0x..."}

# 2. Prover Service
curl http://localhost:8080/
# ✅ 期待値: "Email Wallet Prover"

# 3. Relayer API 
curl http://localhost:4500/api/echo
# ✅ 期待値: "Hello, world!"

# 4. Database
docker exec -it $(docker ps -q -f name=db) \
  psql -U emailWallet -d emailWallet -c "SELECT 1;"
# ✅ 期待値: (1 row)

# 5. Relayer Statistics
curl http://localhost:4500/api/stats
# ✅ 期待値: {"onboarding_token_distributed": 0}

# 6. Docker Services Status
docker compose ps
# ✅ 期待値: All services "Up" status
```

### **Phase 4: End-to-End Test**

#### 実際のメール送金テスト

**Option A: API 直接テスト（推奨・確実）**
```bash
# Account 作成テスト
curl -X POST http://localhost:4500/api/createAccount \
  -H "Content-Type: application/json" \
  -d '{"email_addr": "test@example.com"}'
# ✅ 期待値: request_id が返される

# Account 存在確認
curl -X POST http://localhost:4500/api/isAccountCreated \
  -H "Content-Type: application/json" \
  -d '{"email_addr": "test@example.com"}'
# ✅ 期待値: true/false

# Relayer Email Address 取得
curl http://localhost:4500/api/relayerEmailAddr
# ✅ 期待値: "test@localhost"
```

**Option B: メールクライアントテスト（高度）**

SMTP/IMAP 設定:
- **SMTP Server**: localhost:3000 
- **IMAP Server**: localhost:993
- **認証**: なし（ローカル）

**テストメール送信**:
```bash
# Docker SMTP コンテナに直接送信テスト
curl -X POST http://localhost:3000/api/sendEmail \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@localhost",
    "subject": "Send 1 USDC to recipient@example.com", 
    "body": "Test email for zk-email-pay"
  }'
# ✅ 期待値: Email sent successfully
```

補足:
- ローカルで実送信まで確認したい場合は `Mailpit-Setup.md` を参照（HTTPブリッジ方式）
- 本番/テストネットで Gmail/Workspace を使う運用は `Gmail-Email-Setup.md` と `IMAP-Setup.md` を参照

#### ログ監視

各サービスのログを別ターミナルで監視:
```bash
# Terminal 1: Relayer ログ
cd email-wallet/packages/relayer && RUST_LOG=info cargo run --release

# Terminal 2: Prover ログ  
cd email-wallet/packages/prover && python3 local.py

# Terminal 3: Docker サービスログ
cd email-wallet/packages/relayer && docker compose logs -f
```

## 🔧 トラブルシューティング

### **緊急度別: よくある問題と解決方法**

#### 🚨 **Critical Issues (システム起動不能)**

**1. Contract deployment fails**
```bash
# 症状: forge script でエラー
# 解決手順:
ps aux | grep anvil  # anvil プロセス確認
kill -9 $(ps aux | grep anvil | awk '{print $2}')  # anvil 強制終了
anvil --host 0.0.0.0 --port 8545  # anvil 再起動
cd email-wallet/packages/contracts
forge clean && forge build --skip test --skip script
```

**2. Docker services won't start**
```bash
# 症状: docker compose up でエラー
# 解決手順:
docker compose down -v  # 全サービス・ボリューム削除
docker system prune -f  # Docker キャッシュクリア
docker compose up --build -d --force-recreate
```

**3. Port conflicts**
```bash
# 症状: "Port already in use" エラー
# 解決手順:
lsof -ti:4500 | xargs kill -9  # Port 4500
lsof -ti:8080 | xargs kill -9  # Port 8080  
lsof -ti:8545 | xargs kill -9  # Port 8545
lsof -ti:5432 | xargs kill -9  # Port 5432
```

#### ⚠️ **Warning Issues (動作不安定)**

**4. Relayer can't connect to contracts**
```bash
# 症状: "Contract call failed" 
# 解決手順:
cd email-wallet/packages/contracts
cast call $CORE_CONTRACT_ADDRESS "owner()" --rpc-url http://127.0.0.1:8545
# ✅ 期待値: 正常なアドレス返却

# .env ファイルのアドレス再確認
grep CORE_CONTRACT_ADDRESS email-wallet/packages/relayer/.env
```

**5. Prover connection timeouts**
```bash
# 症状: "Prover not responding"
# 解決手順:
cd email-wallet/packages/prover
python3 -c "import flask; print('Flask OK')"  # Flask 確認
curl -v http://localhost:8080/  # 詳細接続テスト
```

**6. Database connection issues**
```bash
# 症状: "Database connection refused"
# 解決手順:
docker exec -it $(docker ps -q -f name=db) pg_isready -U emailWallet
docker compose logs db | tail -20  # DB ログ確認
```

#### 💡 **Info Issues (設定問題)**

**7. Circuit build slow/failures**
```bash
# 症状: yarn build が遅い/失敗
# 解決手順:
node --version  # 必須: v18.x
cd email-wallet/packages/circuits
yarn cache clean && yarn install --frozen-lockfile
yarn build --verbose  # 詳細ログ付きビルド
```

**8. Path resolution errors**
```bash
# 症状: "File not found" in .env paths
# 解決手順:
# 絶対パス確認・修正
export ZK_EMAIL_ROOT="/Users/$(whoami)/Documents/zk-email-pay"
echo "CIRCUITS_DIR_PATH=$ZK_EMAIL_ROOT/email-wallet/packages/circuits"
echo "INPUT_FILES_DIR_PATH=$ZK_EMAIL_ROOT/email-wallet/packages/relayer/input_files"  
echo "EMAIL_TEMPLATES_PATH=$ZK_EMAIL_ROOT/email-wallet/packages/relayer/eml_templates/"
```

### **デバッグコマンド集**

```bash
# 🔍 詳細システム状態確認
echo "=== System Status ===" 
docker compose ps
curl -s http://localhost:4500/api/echo || echo "Relayer DOWN"
curl -s http://localhost:8080/ || echo "Prover DOWN"
cast block-number --rpc-url http://127.0.0.1:8545 || echo "Anvil DOWN"

# 🔍 詳細ログ表示
echo "=== Detailed Logs ==="
RUST_LOG=debug cargo run --release  # Relayer 詳細ログ
python3 local.py --verbose          # Prover 詳細ログ  
docker compose logs --tail=50       # Docker サービスログ

# 🔍 Network/Port 診断
echo "=== Network Diagnosis ==="
netstat -tulnp | grep -E ":4500|:8080|:8545|:5432|:3000|:993"
```

### **システム完全リセット**

問題が解決しない場合の最終手段:
```bash
# ⚠️ 警告: 全データが削除されます
echo "Stopping all services..."
cd email-wallet/packages/relayer
docker compose down -v
cd email-wallet/packages/contracts  
forge clean

echo "Killing all processes..."
pkill -f anvil
pkill -f "python3 local.py"
pkill -f "cargo run"

echo "Clearing caches..."
docker system prune -af
yarn cache clean

echo "Restart from Phase 1..."
```

## 📋 **成功確認チェックリスト**

このガイド完了時、以下がすべて ✅ になれば成功:

- [ ] anvil が 127.0.0.1:8545 で応答  
- [ ] Contracts が正常デプロイ (3つのアドレス取得)
- [ ] Docker services (db, smtp, imap) が "Up" 状態
- [ ] Prover が localhost:8080 で応答
- [ ] Relayer が localhost:4500 で API 提供
- [ ] Health check が全て正常値を返す
- [ ] API テストでアカウント作成が成功

✅ **全項目クリア = 完全なローカル開発環境構築完了**

---

## 🎯 **次のステップ: フロントエンド統合**

完全なシステム構築後は:
1. **`Frontend-Integration-Guide.md`** でAPI統合
2. **既存フロントエンド** との接続テスト  
3. **UX改善** (日本語化・ユーザーフロー)

**この環境があれば、本格的なzkメール送金アプリの開発を開始できます。**
