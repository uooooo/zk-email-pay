# Email Wallet リレイヤー立ち上げガイド

## 概要
Email Walletリレイヤーは、メールとブロックチェーン間の橋渡しを行うRustベースのサービスです。SMTP/IMAPメール処理、ZK証明検証、ブロックチェーン連携を担当します。

## 前提条件

### 必要なソフトウェア
- **Docker** & **Docker Compose**: コンテナ実行環境
- **Rust & Cargo**: リレイヤー本体の実行（ローカル開発時）
- **PostgreSQL**: データベース（Docker Composeで自動構築）
- **Node.js**: フロントエンド実行時

### 事前準備
1. **スマートコントラクトのデプロイ完了**
   - `packages/contracts`でコントラクト群をデプロイ済み
   - デプロイされたアドレスを記録しておく

2. **Internet Computer (IC) アカウント設定** 【必須】
   - PEMファイルの準備
   - Wallet Canister IDの取得
   - **注意**: DKIM公開鍵の自動更新機能で必須。設定なしではリレイヤーが停止します

## セットアップ手順

### 1. 環境変数設定

`.env.sample`を`.env`にコピーして編集：

```bash
cd vendor/email-wallet/packages/relayer
cp .env.sample .env
```

#### 必須設定項目

**ブロックチェーン関連**
```env
CORE_CONTRACT_ADDRESS=0x... # デプロイしたEmailWalletCoreアドレス
PRIVATE_KEY=0x... # リレイヤー用プライベートキー
CHAIN_RPC_PROVIDER=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
CHAIN_RPC_EXPLORER=https://sepolia.basescan.org
CHAIN_ID=84532  # Base Sepolia
```

**メール関連**
```env
ERROR_EMAIL_ADDRESSES=admin@yourdomain.com
RELAYER_EMAIL_ADDR=relayer@yourdomain.com
RELAYER_HOSTNAME=yourdomain.com
```

**外部サービス**
```env
ONBOARDING_TOKEN_ADDR=0x... # テスト用ERC20トークンアドレス
```

**Internet Computer (IC) 設定** 【必須】
```env
PEM_PATH=./.ic.pem  # ICアカウントのPEMファイル
WALLET_CANISTER_ID=your-wallet-canister-id
CANISTER_ID=fxmww-qiaaa-aaaaj-azu7a-cai  # DKIM Oracle Canister ID
IC_REPLICA_URL=https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=fxmww-qiaaa-aaaaj-azu7a-cai
```

#### ローカル開発用設定
```env
DATABASE_URL=postgres://emailWallet:emailWallet_password@localhost:5432/emailWallet
SMTP_SERVER=localhost:3000/api/sendEmail

# SMTP/IMAP設定（ローカルテスト用）
SMTP_DOMAIN_NAME=localhost
SMTP_LOGIN_ID=test@localhost
SMTP_LOGIN_PASSWORD=testpassword
IMAP_LOGIN_ID=test@localhost
IMAP_LOGIN_PASSWORD=testpassword
IMAP_DOMAIN_NAME=localhost
IMAP_PORT=993
```

### 2. IC PEMファイルの配置【必須】

Internet Computer用のPEMファイルを配置：
```bash
# .ic.pemファイルをrelayerディレクトリに配置
cp /path/to/your/.ic.pem vendor/email-wallet/packages/relayer/.ic.pem
```

**重要**: このPEMファイルは以下の目的で使用されます：
- **DKIM公開鍵の自動更新**: メールプロバイダーが鍵を更新した際の自動対応
- **Internet Computer上のDKIM Oracleとの通信**
- **設定がない場合、リレイヤーは停止します**

### 3. Docker Compose起動

ルートディレクトリから：
```bash
cd vendor/email-wallet
docker compose up --build -d
```

### 4. サービス確認

全てのサービスが起動したことを確認：
```bash
docker ps
```

期待される出力：
```
CONTAINER ID   IMAGE                  COMMAND                  CREATED         STATUS                   PORTS                    NAMES
d0bb20274135   email-wallet-imap      "/app/relayer-imap"      7 seconds ago   Up 1 second                                       email-wallet-imap-1
7672fc31b4f4   email-wallet-relayer   "/app/relayer"           7 seconds ago   Up 1 second              0.0.0.0:4500->4500/tcp   email-wallet-relayer-1
27c9f2b26382   postgres:15            "docker-entrypoint.s…"   7 seconds ago   Up 7 seconds (healthy)   0.0.0.0:5432->5432/tcp   email-wallet-db-1
9ccccc1dd244   email-wallet-smtp      "/app/relayer-smtp"      7 seconds ago   Up 7 seconds (healthy)   0.0.0.0:3000->3000/tcp   email-wallet-smtp-1
```

## サービス構成

### 1. PostgreSQL Database (Port: 5432)
- **目的**: アカウント情報、トランザクション履歴の保存
- **認証**: `emailWallet:emailWallet_password`
- **データベース名**: `emailWallet`

### 2. SMTP Service (Port: 3000)
- **目的**: ユーザーへのメール送信
- **エンドポイント**: `/api/sendEmail`
- **ヘルスチェック**: `/api/ping`

### 3. IMAP Service
- **目的**: ユーザーからのメール受信・監視
- **連携先**: Relayer `/api/receiveEmail`

### 4. Relayer Service (Port: 4500)
- **目的**: メイン処理（ZK証明検証、ブロックチェーン連携）
- **API**: RESTful API提供
- **言語**: Rust

## API エンドポイント

### Relayer API (Port: 4500)

**メール受信**
```
POST /api/receiveEmail
Content-Type: application/json
```

**送金リクエスト**
```
POST /api/send
Content-Type: application/json

{
  "email_addr": "sender@example.com",
  "recipient_addr": "recipient@example.com",
  "amount": "1.5",
  "token_id": "USDC",
  "is_recipient_email": true
}
```

**未請求資産クレーム**
```
POST /api/claim
Content-Type: application/json

{
  "email_address": "user@example.com",
  "random": "0x...",
  "tx_hash": "0x...",
  "expiry_time": 1700000000,
  "is_fund": true
}
```

## トラブルシューティング

### 1. コンテナが起動しない

**症状**: `docker compose up`でエラー
**解決法**:
```bash
# ログ確認
docker compose logs relayer
docker compose logs smtp
docker compose logs imap

# 設定ファイル確認
cat .env | grep -v "^#" | grep -v "^$"
```

### 2. Database接続エラー

**症状**: `connection refused` エラー
**解決法**:
```bash
# PostgreSQLコンテナ確認
docker compose ps db
docker compose logs db

# DATABASE_URL確認
echo $DATABASE_URL
```

### 3. SMTP/IMAP認証エラー

**症状**: メール送受信に失敗
**解決法**:
```bash
# メール関連設定確認
grep -E "SMTP_|IMAP_" .env

# SMTPサービス確認
curl http://localhost:3000/api/ping
```

### 4. ZK証明生成エラー

**症状**: プルーフ生成に失敗
**解決法**:
```bash
# Proverサービス確認
curl https://zkemail--email-wallet-relayer-v1-2-0-flask-app.modal.run/

# IC設定確認
ls -la .ic.pem
grep CANISTER_ID .env
```

### 5. ブロックチェーン接続エラー

**症状**: トランザクション送信に失敗
**解決法**:
```bash
# RPC接続確認
curl -X POST $CHAIN_RPC_PROVIDER \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# 秘密鍵の残高確認
# コントラクトアドレス確認
```

## 本番環境への注意事項

### セキュリティ
1. **環境変数の管理**: `.env`ファイルはGitに含めない
2. **プライベートキー**: 安全な場所に保管、定期ローテーション
3. **データベース**: 本番環境では外部管理のPostgreSQLを使用
4. **HTTPS**: 本番環境では全てHTTPS通信

### スケーラビリティ
1. **ロードバランサー**: 複数リレイヤーインスタンス間の負荷分散
2. **データベース**: 読み取り専用レプリカの設置
3. **監視**: Prometheus/Grafanaによるメトリクス監視

### バックアップ
1. **データベース**: 定期的なフルバックアップ
2. **設定ファイル**: 暗号化して保存
3. **ログ**: ローテーション設定

## 次のステップ

リレイヤー起動後:
1. **フロントエンド起動**: emailwallet.orgリポジトリから
2. **テスト実行**: メール送受信のE2Eテスト
3. **監視設定**: ログとメトリクスの監視体制構築

## 参考リンク

- [Email Wallet Contracts](../packages/contracts/README.md)
- [Internet Computer Setup](https://proofofemail.notion.site/How-to-setup-ICP-account-for-relayer-cf80ad6187e94219b25152fb875309db)
- [Base Sepolia Testnet](https://docs.base.org/network-information/#base-sepolia-testnet)