# なぜInternet Computer (IC) 設定が必須なのか

## 結論
Email Walletリレイヤーでは、**Internet Computer (IC) 設定は必須**です。これは**DKIM公開鍵の自動更新機能**のために不可欠な要素だからです。

## 技術的な理由

### 1. DKIM公開鍵管理の課題

Email Walletは、メールの真正性をDKIMシグネチャのZK証明で検証しています。しかし、メールプロバイダー（Gmail、Outlook等）は定期的にDKIM公開鍵を更新します。

```
メールプロバイダー → DKIM鍵更新 → 古い鍵で検証失敗 → システム停止
```

### 2. 自動鍵更新システムの必要性

リレイヤーは新しいメールを受信するたびに `check_and_update_dkim()` を実行：

```rust
// email-wallet/packages/relayer/src/core.rs:25
check_and_update_dkim(&email, &parsed_email).await?;
```

この関数では：
1. **現在のDKIM鍵が有効かチェック**
2. **無効な場合、新しい鍵を取得・登録**

### 3. Internet ComputerのDKIM Oracle

新しいDKIM鍵の検証・署名のために、Internet Computer上のDKIM Oracleを使用：

```rust
// email-wallet/packages/relayer/src/core.rs:517-536
let pem_path = env::var(PEM_PATH_KEY).unwrap_or_else(|_| ".ic.pem".to_string());
let ic_replica_url = env::var(IC_REPLICA_URL_KEY).map_err(|e| anyhow!("Failed to read IC_REPLICA_URL_KEY: {}", e))?;
let ic_agent = DkimOracleClient::gen_agent(&pem_path, &ic_replica_url)?;
let canister_id = env::var(CANISTER_ID_KEY).map_err(|e| anyhow!("Failed to read CANISTER_ID_KEY: {}", e))?;
let wallet_canister_id = env::var(WALLET_CANISTER_ID_KEY).map_err(|e| anyhow!("Failed to read WALLET_CANISTER_ID_KEY: {}", e))?;
let oracle_client = DkimOracleClient::new(&canister_id, &wallet_canister_id, &ic_agent).await?;
let oracle_result = oracle_client.request_signature(&selector, &domain).await?;
```

## 必須設定項目

### 1. PEM_PATH (.ic.pem)
- **目的**: Internet Computerでの認証用秘密鍵
- **形式**: Secp256k1秘密鍵のPEMファイル
- **エラー**: 無いとIC Agentが生成できない

### 2. WALLET_CANISTER_ID
- **目的**: IC上のWallet Canisterとの通信
- **形式**: `xxxxx-xxxxx-xxxxx-xxxxx-xxx`
- **エラー**: `Failed to read WALLET_CANISTER_ID_KEY` で停止

### 3. CANISTER_ID
- **目的**: DKIM Oracle CanisterのID
- **デフォルト**: `fxmww-qiaaa-aaaaj-azu7a-cai`
- **エラー**: `Failed to read CANISTER_ID_KEY` で停止

### 4. IC_REPLICA_URL
- **目的**: Internet ComputerのReplica URL
- **デフォルト**: `https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=fxmww-qiaaa-aaaaj-azu7a-cai`
- **エラー**: `Failed to read IC_REPLICA_URL_KEY` で停止

## 回避方法とそのリスク

### 技術的には回避可能だが...

1. **`check_and_update_dkim()`関数を無効化**
2. **手動DKIM鍵管理に切り替え**
3. **IC関連コードをコメントアウト**

### 回避した場合のリスク

1. **DKIM鍵更新時にシステム停止**
   - Gmail、Outlookなどが鍵を更新すると検証失敗
   - 手動でコントラクトに新しい鍵を登録する必要

2. **運用コストの増加**
   - 24/7でDKIM鍵の監視が必要
   - 緊急時の手動対応が必須

3. **セキュリティリスク**
   - 古い鍵での攻撃に脆弱
   - 鍵更新の遅延による可用性低下

## DKIM Oracleの仕組み

### 1. Internet Computer上での実行
```
リレイヤー → IC Agent → DKIM Oracle Canister → DNS TXT問い合わせ → 鍵検証・署名
```

### 2. 分散化された鍵検証
- **複数ノードでの合意**による信頼性
- **DNS問い合わせの透明性**
- **改ざん不可能な記録**

### 3. 自動署名プロセス
```rust
pub const SIGN_CHARGED_CYCLE: u128 = 45_000_000_000; // IC上での計算コスト
```

## 代替案とその問題

### 1. 中央集権的なDKIM Oracle
- **問題**: 単一障害点
- **問題**: 検閲リスク
- **問題**: 信頼性の課題

### 2. 手動鍵管理
- **問題**: 運用負荷
- **問題**: ヒューマンエラー
- **問題**: ダウンタイム

### 3. 他のブロックチェーンでのOracle
- **問題**: ガス代の高騰
- **問題**: スピードの問題
- **問題**: 既存実装との互換性

## 結論

Internet Computer設定は、Email Walletの**安定稼働のために必須**です。DKIM鍵の自動更新により、メールプロバイダーの鍵更新に自動対応し、システムの可用性を保証します。

IC設定を省略すると、DKIM鍵更新時にシステムが停止し、手動復旧が必要になるため、**本番運用では絶対に設定が必要**です。

## 参考情報

- **Internet Computer DKIM Oracle**: 分散化されたDKIM鍵検証システム
- **Cycles消費**: 1回の署名リクエストで約45B Cycles
- **PEMファイル生成**: `dfx identity new` コマンドで作成可能
- **Wallet Canister**: ICPトークンでCyclesを管理