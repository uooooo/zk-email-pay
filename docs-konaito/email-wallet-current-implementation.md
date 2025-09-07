# Email Wallet 現在の実装機能

## 概要
Email Walletは、メールを使ってコントロールできるEthereumスマートコントラクトウォレットシステムです。DKIMシグネチャのZK証明を利用してメールの真正性を検証し、メールアドレスをオンチェーンにリークすることなく操作を可能にします。

## アーキテクチャ構成

### スマートコントラクト（packages/contracts）

#### 1. EmailWalletCore.sol
- **役割**: システムの中核となるコントラクト
- **主要機能**:
  - ZK証明の検証
  - メール操作（EmailOp）の実行
  - 各種ハンドラーとの連携
- **主要コンポーネント**:
  - `IVerifier verifier`: ZK証明検証器
  - `RelayerHandler`: リレイヤー管理
  - `AccountHandler`: アカウント管理
  - `UnclaimsHandler`: 未請求資産管理
  - `ExtensionHandler`: 拡張機能管理

#### 2. Wallet.sol
- **役割**: 個別ユーザーのウォレット実装
- **主要機能**:
  - ETH受信時の自動WETH変換
  - トークン処理
  - OAuth連携機能
- **特徴**: UUPSUpgradeableでアップグレード可能

#### 3. ハンドラーコントラクト群

##### UnclaimsHandler.sol
- **未請求資産管理機能**:
  - `registerUnclaimedFund()`: 未請求資金の登録
  - `claimUnclaimedFund()`: 未請求資金のクレーム
  - `registerUnclaimedState()`: 未請求状態の登録  
  - `claimUnclaimedState()`: 未請求状態のクレーム
  - `voidUnclaimedFund()`: 未請求資金の無効化

##### その他ハンドラー
- `RelayerHandler`: リレイヤー設定管理
- `AccountHandler`: アカウント作成・初期化
- `ExtensionHandler`: 拡張機能の追加・削除

### リレイヤーサービス（packages/relayer）

#### 主要機能
1. **SMTP/IMAPメール処理**
   - メール受信・監視
   - メールコマンド解析
   - 返信メール生成

2. **ZK証明処理**
   - Proverサービスとの連携
   - DKIM署名の検証
   - ZK証明生成・検証

3. **ブロックチェーン連携**
   - トランザクション作成・送信
   - ガス管理
   - 手数料処理

#### 技術スタック
- **言語**: Rust
- **データベース**: PostgreSQL
- **外部連携**: 
  - Internet Computer (IC) for proof generation
  - TheGraph for subgraph queries
  - Price Oracle for fee conversion

## 実装済みメールコマンド

### 1. 送金機能
```
Send 1 ETH to friend@domain.com
Send 1.5 DAI to friend@skiff.com
Send 21.14 DAI to 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
```

### 2. 任意コントラクト実行
```
Execute 0xba7676a8.....
```

### 3. 拡張機能管理
```
Install extension Uniswap
Remove extension Uniswap
```

### 4. DeFi操作（拡張機能）
```
Swap 1 ETH to DAI
Swap 1 DAI to ETH
```

### 5. NFT操作（拡張機能）
```
NFT Send 1337 of Punks to recipient@domain.com
```

### 6. ウォレット管理
```
DKIM registry set to 0x1ababab111...
Exit Email Wallet. Set owner to 0x1ababab111...
```

## 未請求資産システム

### 機能概要
- メールアドレス宛の送金時、受信者がウォレットを持たない場合は「未請求状態」として一時保管
- 受信者が後からクレーム可能
- 期限切れの場合は送金者が回収可能

### 主要データ構造
- `emailAddrCommit`: メールアドレスのコミットハッシュ
- `expiryTime`: 有効期限
- `amount`: 金額
- `tokenAddr`: トークンアドレス
- `sender`: 送信者アドレス

## セキュリティ機能

### ZK証明ベース認証
- DKIMシグネチャの検証
- メールアドレスの秘匿化
- リプレイ攻撃防止（nullifier使用）

### アクセス制御
- オーナー限定操作
- リレイヤー認証
- ガス制限・手数料管理

## デプロイ・運用

### 必要コンポーネント
1. **スマートコントラクト群**
   - EmailWalletCore
   - 各種Handler
   - Token Registry
   - Price Oracle

2. **インフラストラクチャ**
   - PostgreSQL データベース
   - SMTP/IMAPサーバー
   - Proverサービス (Internet Computer)
   - リレイヤーサービス

### 設定項目
- チェーン設定（RPC、Explorer、Chain ID）
- プライベートキー（リレイヤー用）
- メールサーバー設定
- TheGraph API設定
- 手数料・ガス制限設定

## 現在の制限事項

1. **EOA直接送金不可**: 通常のウォレット（MetaMaskなど）からメールアドレスへの直接送金は不可
2. **リレイヤー依存**: すべてのトランザクションはリレイヤー経由
3. **メール遅延**: メール送受信による処理遅延
4. **ガス代負担**: リレイヤーがガス代を立て替え（後で回収）

## zk-email-payプロジェクトでの活用

このemail-wallet実装を基盤として、EOAユーザーでもメールアドレス宛送金を可能にするインターフェースを提供。未請求資産システムを活用して、ウォレット未保有者でもメールのみで資産受取を実現。