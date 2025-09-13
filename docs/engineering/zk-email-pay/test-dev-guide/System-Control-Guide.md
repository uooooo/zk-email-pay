# Email Wallet システム制御ガイド

email-wallet ローカル開発環境の停止・再起動・状態確認の完全手順です。

## 🔍 **システム状態確認**

### 現在のサービス状況確認

```bash
echo "=== Email Wallet System Status ==="

# 実行場所の確認
cd /Users/uooooo/Documents/zk-email-pay/email-wallet/packages/relayer

# Docker Services 状況
echo "--- Docker Services ---"
docker compose -f ../../docker-compose.yaml ps

# Process 状況  
echo "--- Running Processes ---"
ps aux | grep -E "anvil|cargo.*relayer|python3.*local.py" | grep -v grep

# Port 使用状況
echo "--- Port Usage ---"
lsof -i :4500,8080,8545,5432,3000 || echo "No services using email-wallet ports"

# API Health Check
echo "--- API Health Check ---"
curl -s -o /dev/null -w "Anvil: %{http_code}\n" -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://127.0.0.1:8545 || echo "Anvil: DOWN"
curl -s -o /dev/null -w "Relayer: %{http_code}\n" http://localhost:4500/api/echo || echo "Relayer: DOWN"
curl -s -o /dev/null -w "Prover: %{http_code}\n" http://localhost:8080/ || echo "Prover: DOWN"
```

## 🛑 **完全システム停止**

### すべてのemail-walletサービスを停止

```bash
echo "=== Stopping All Email Wallet Services ==="

# 1. Relayer Service 停止
echo "Stopping Relayer..."
pkill -f "cargo.*relayer" || echo "No relayer process found"
pkill -f "cargo.*run.*release" || echo "No cargo run process found"

# 2. Prover Service 停止
echo "Stopping Prover..."
pkill -f "python3.*local.py" || echo "No prover process found"

# 3. Anvil (Blockchain) 停止
echo "Stopping Anvil..."
pkill -f anvil || echo "No anvil process found"

# 4. Docker Services 停止（重要: 正しいパスでdocker-compose.yamlを指定）
echo "Stopping Docker Services..."
cd /Users/uooooo/Documents/zk-email-pay/email-wallet/packages/relayer
docker compose -f ../../docker-compose.yaml down -v

# 5. 確認: すべて停止済み
echo "--- Verification ---"
ps aux | grep -E "anvil|cargo.*relayer|python3.*local.py" | grep -v grep || echo "✅ All processes stopped"
lsof -i :4500,8080,8545,5432,3000 || echo "✅ All ports free"

echo "✅ Complete system shutdown finished"
```

## 🚀 **完全システム再起動**

### 正しい順序ですべてのサービスを起動

```bash
echo "=== Starting Complete Email Wallet System ==="

# Phase 1: Infrastructure Services（Docker）
echo "Phase 1: Starting Infrastructure..."
cd /Users/uooooo/Documents/zk-email-pay/email-wallet/packages/relayer
docker compose -f ../../docker-compose.yaml up --build -d
echo "Waiting for Docker services..."
sleep 15

# Phase 2: Blockchain（Anvil）
echo "Phase 2: Starting Blockchain..."
cd ../contracts
anvil --host 0.0.0.0 --port 8545 > /dev/null 2>&1 &
echo "Waiting for Anvil..."
sleep 5

# Phase 3: Prover Service  
echo "Phase 3: Starting Prover..."
cd ../prover
python3 -u local.py > /dev/null 2>&1 &
echo "Waiting for Prover..."
sleep 5

# Phase 4: Relayer Service
echo "Phase 4: Starting Relayer..."
cd ../relayer
cargo run --release > /dev/null 2>&1 &
echo "Waiting for Relayer..."
sleep 10

# Verification
echo "=== Final System Health Check ==="
curl -s http://127.0.0.1:8545 > /dev/null && echo "✅ Anvil: Running" || echo "❌ Anvil: Failed"
curl -s http://localhost:8080/ > /dev/null && echo "✅ Prover: Running" || echo "❌ Prover: Failed" 
curl -s http://localhost:4500/api/echo > /dev/null && echo "✅ Relayer: Running" || echo "❌ Relayer: Failed"
docker compose -f ../../docker-compose.yaml ps --format "table {{.Names}}\t{{.Status}}"

echo "🎉 System startup complete!"
```

## 🧪 **開発用テストコマンド**

### 基本API機能テスト

```bash
# 実行場所を確認
cd /Users/uooooo/Documents/zk-email-pay/email-wallet/packages/relayer

echo "=== Basic API Tests ==="

# 1. System Health
curl http://localhost:4500/api/echo
curl http://localhost:4500/api/stats

# 2. Account Operations（SMTP不要）
curl -X POST http://localhost:4500/api/isAccountCreated \
  -H "Content-Type: application/json" \
  -d '{"email_addr": "test@example.com"}'

# 3. System Information
curl http://localhost:4500/api/relayerEmailAddr

# 4. Prover Endpoints（正しいエンドポイント）
curl -X POST http://localhost:8080/prove/email_sender \
  -H "Content-Type: application/json" \
  -d '{"input": {"dummy": "test"}}' || echo "Expected: Input validation error"

# 5. Docker Services
docker compose -f ../../docker-compose.yaml ps
```

### 詳細デバッグモード

```bash
# Relayer 詳細ログ（フォアグラウンド実行）
cd /Users/uooooo/Documents/zk-email-pay/email-wallet/packages/relayer
RUST_LOG=debug cargo run --release

# Prover 詳細ログ（フォアグラウンド実行）
cd /Users/uooooo/Documents/zk-email-pay/email-wallet/packages/prover
python3 -u local.py

# Docker Services ログ
cd /Users/uooooo/Documents/zk-email-pay/email-wallet/packages/relayer
docker compose -f ../../docker-compose.yaml logs -f
```

## 🎯 **開発ワークフロー**

### 日常的な開発サイクル

```bash
# 1. システム状態確認
cd /Users/uooooo/Documents/zk-email-pay/email-wallet/packages/relayer
docker compose -f ../../docker-compose.yaml ps
curl -s http://localhost:4500/api/echo && echo " ✅ System Ready"

# 2. 変更時の再起動（必要な部分のみ）
# Contracts 変更時
cd ../contracts && forge script script/DefaultSetupScript.s.sol:Deploy --broadcast

# Relayer 変更時  
cd ../relayer && cargo build --release && pkill -f "cargo.*relayer" && cargo run --release &

# Prover 変更時
cd ../prover && pkill -f "python3.*local.py" && python3 -u local.py &

# 3. テスト実行
curl http://localhost:4500/api/stats
```

## ⚠️ **重要な注意事項**

### Docker Compose 実行時の注意

- **実行場所**: `packages/relayer` ディレクトリから実行
- **ファイル指定**: `-f ../../docker-compose.yaml` で親ディレクトリのファイルを指定
- **環境変数**: `packages/relayer/.env` が自動的に読み込まれる

### よくあるエラーと解決法

```bash
# "no configuration file provided" エラー
# 解決: 正しいパスで実行
docker compose -f ../../docker-compose.yaml [command]

# "Port already in use" エラー
# 解決: 該当プロセスを停止
lsof -ti :[port] | xargs kill -9

# "curl: option -H: requires parameter" エラー  
# 解決: 改行を除去、1行で実行
curl -X POST http://localhost:8080/prove/email_sender -H "Content-Type: application/json" -d '{"input": {}}'
```

これで完全なシステム制御が可能になります。

## 🧭 現在のローカル構成（Anvil / Hybrid テスト）

- 注意: `email-wallet/packages/relayer/.env` の `CORE_CONTRACT_ADDRESS` は EmailWalletCore の「proxy」アドレスを指定すること。

契約アドレス（最新 / anvil 再デプロイ 2025-09-07）

- Core proxy (EmailWalletCore): `0x3Aa5ebB10DC797CAC828524e59A333d0A371443c`
- RelayerHandler proxy: `0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e`
- DKIM Registry (ECDSAOwnedDKIMRegistry): `0x0165878A594ca255338adfa4d48449f69242Eb8F`
- DKIM Registry signer (EVM addr): `0xF39fd6e51aad88F6F4Ce6ab8827279cffFb92266`（anvil 既定の #0）
- Onboarding token (TEST): `0x4A679253410272dd5232B3Ff7cF5dbB88f295319`

Relayer 実行時設定（抜粋）

- `CORE_CONTRACT_ADDRESS=0x3Aa5ebB10DC797CAC828524e59A333d0A371443c`（proxy 指定）
- `PROVER_ADDRESS=http://127.0.0.1:8080`（ローカル prover を使用）
- DKIM ローカル回避（IC Oracle 経由を使わない）
  - `DKIM_BYPASS_LOCAL_SIGN=true`
  - `DKIM_LOCAL_SIGNER_PK=<ECDSAOwnedDKIMRegistry.singer の秘密鍵（未指定時は PRIVATE_KEY と同一）>`
  - 本回避では relayer がメッセージ `SET:selector=…;domain=…;public_key_hash=0x…;` をローカル EOA で署名し、`setDKIMPublicKeyHash` を呼び出します。

DKIM デバッグ / 検証

- `/tmp/relayer.log` に `DKIM DEBUG (bypass) signer=… signed_msg=SET:…` が出力されます。
- 反映確認（例）:
  - `cast call <DKIM_REGISTRY> "isDKIMPublicKeyHashValid(string,bytes32)(bool)" gmail.com 0x<hash>` → `true`

更新日: 2025-09-07
