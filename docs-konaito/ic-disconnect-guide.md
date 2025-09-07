# 一旦IC離れ - MVP向けシンプル化ガイド

## 概要

Email Wallet リレイヤーからInternet Computer (IC) 依存を一時的に削除し、MVP開発を簡素化する方法を説明します。

## ⚠️ IC Oracleが必要な根本的理由

### ZK証明システムの仕組み

Email WalletはZK証明でメール真正性を検証しますが、**プルーバー（ZK回路）がオンチェーンにあるため、DKIM公開鍵もオンチェーンから参照する必要があります**。

```solidity
// EmailWalletCore.sol - オンチェーンでの検証
require(
    accountHandler.isDKIMPublicKeyHashValid(
        emailOp.accountSalt,
        emailOp.emailDomain,
        emailOp.dkimPublicKeyHash  // ← DKIM鍵ハッシュをオンチェーン参照
    ),
    "invalid DKIM public key"
);

// Verifier.sol - ZK証明検証
require(
    verifier.verifyEmailOpProof(
        emailOp.emailDomain,
        emailOp.dkimPublicKeyHash,  // ← ZK回路がDKIM鍵ハッシュを必要とする
        emailOp.emailProof
    ),
    "invalid email proof"
);
```

### IC Oracleの役割

**信頼性のあるDKIM鍵取得のため**にIC Oracleが使用されます：

1. **分散検証**: 複数ICノードでDNS問い合わせを実行
2. **改ざん防止**: 分散合意による信頼性担保
3. **透明性**: オンチェーンで検証可能
4. **自動更新**: Gmail等のプロバイダー鍵更新に自動対応

### 💰 **IC Oracleの計算コスト**

#### コスト詳細
```rust
pub const SIGN_CHARGED_CYCLE: u128 = 45_000_000_000; // 45B Cycles per request
```

#### 料金換算（2024年時点）
- **1回のDKIM署名リクエスト**: 45B Cycles
- **XDR換算**: 0.045 XDR ≈ **$0.063 USD** ≈ **¥9.5円**
- **発生頻度**: Gmail鍵更新時のみ（数ヶ月〜年単位）

#### 実際のコスト（キャッシュ機構考慮）
```rust
// 既にDKIM鍵が登録済みの場合は早期リターン
if CLIENT.check_if_dkim_public_key_hash_valid(domain, public_key_hash).await? {
    return Ok(());  // ← IC Oracle呼び出しなし（0円）
}
// 未登録の場合のみIC Oracleを呼び出し
let oracle_result = oracle_client.request_signature(&selector, &domain).await?;
```

| シナリオ | 発生頻度 | 年間コスト |
|---------|----------|-----------|
| 通常運用（既存鍵使用） | 0回 | **¥0円** |
| Gmail鍵更新時 | 1-2回/年 | **¥10-19円** |
| 新セレクター遭遇時 | 不定期 | **¥10円/回** |

**結論**: IC Oracleは**キャッシュ付きオラクル**として動作し、**通常運用では完全無料**

### IC離れのリスク

- **信頼性の低下**: 単一ソースのDNS問い合わせ
- **改ざんリスク**: 中央集権的な鍵取得・検証
- **セキュリティホール**: 攻撃者によるDNS応答偽装の可能性

## 前提条件

- **Gmail限定MVP**: 送信者は`@gmail.com`アドレスのみ
- **固定DKIM鍵管理**: Gmail の単一セレクターを手動管理
- **短期運用**: プロトタイプ・検証段階での一時的な簡素化

## IC離れのメリット

### ✅ **開発効率の向上**
- PEMファイル、Canister ID設定が不要
- Internet Computer への依存削除
- セットアップ手順の大幅簡素化

### ✅ **デバッグの簡易化**
- IC関連のエラーポイント削除
- ローカル環境での完全動作
- ネットワーク依存の削減

### ✅ **MVP検証に集中**
- 核となる機能（メール→トランザクション）に集中
- インフラ複雑性の排除
- 迅速なプロトタイピング

## 実装手順

### 1. DKIM鍵の事前取得

#### Gmail の現在のDKIM鍵を取得
```bash
# 現在有効なセレクターを確認
dig TXT 20230601._domainkey.gmail.com

# 結果から公開鍵（p=...部分）を抽出
# v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
```

#### 鍵ハッシュの計算
```javascript
// Gmail DKIM公開鍵からハッシュを計算
const crypto = require('crypto');
const publicKeyHex = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...";
const publicKeyBytes = Buffer.from(publicKeyHex, 'base64');
const hash = crypto.createHash('sha256').update(publicKeyBytes).digest('hex');
console.log(`0x${hash}`);
```

### 2. ソースコード修正

#### core.rs の修正
```rust
// vendor/email-wallet/packages/relayer/src/core.rs

#[named]
pub async fn handle_email(email: String) -> Result<(EmailWalletEvent, bool)> {
    // DKIM自動更新機能を無効化
    // check_and_update_dkim(&email, &parsed_email).await?; // コメントアウト
    
    // 固定Gmail DKIM鍵ハッシュを使用
    let gmail_dkim_hash = env::var("GMAIL_DKIM_KEY_HASH")
        .expect("GMAIL_DKIM_KEY_HASH not set");
    
    // ... 以下は既存コード
}
```

#### config.rs の修正
```rust
// vendor/email-wallet/packages/relayer/src/config.rs

#[derive(Debug, Clone)]
pub struct Config {
    // IC関連フィールドを削除
    // pub canister_id: String,
    // pub pem_path: String, 
    // pub wallet_canister_id: String,
    
    // Gmail固定設定を追加
    pub gmail_dkim_key_hash: String,
}

impl Config {
    pub fn new() -> Self {
        Self {
            gmail_dkim_key_hash: env::var("GMAIL_DKIM_KEY_HASH")
                .expect("GMAIL_DKIM_KEY_HASH is required"),
            // ... その他の設定
        }
    }
}
```

#### 依存関係の削除
```toml
# vendor/email-wallet/packages/relayer/Cargo.toml

[dependencies]
# IC関連依存を削除
# ic-agent = "0.x.x"
# ic-utils = "0.x.x"
# candid = "0.x.x"
```

### 3. 環境変数設定

#### 新しい .env 設定
```env
# IC関連設定を削除
# CANISTER_ID=
# PEM_PATH=
# IC_REPLICA_URL=
# WALLET_CANISTER_ID=

# Gmail固定DKIM設定
GMAIL_DKIM_KEY_HASH=0x1234567890abcdef... # 事前に計算したハッシュ
GMAIL_SELECTOR=20230601 # 現在のセレクター

# その他の設定は既存のまま
CORE_CONTRACT_ADDRESS=0x...
PRIVATE_KEY=0x...
# ...
```

### 4. Docker Compose修正

#### IC関連の削除
```yaml
# docker-compose.yaml

services:
  relayer:
    environment:
      # IC関連環境変数を削除
      # - CANISTER_ID=${CANISTER_ID}
      # - PEM_PATH=/app/.ic.pem
      # - WALLET_CANISTER_ID=${WALLET_CANISTER_ID}
      
      # Gmail固定設定を追加
      - GMAIL_DKIM_KEY_HASH=${GMAIL_DKIM_KEY_HASH}
      - GMAIL_SELECTOR=${GMAIL_SELECTOR}
    
    # volumes:
      # IC PEMファイルマウントを削除
      # - ${PWD}/.ic.pem:/app/.ic.pem:ro
```

## 運用上の注意点

### 1. DKIM鍵のリアルタイム検知【推奨】

#### メール受信時の自動チェック
```rust
// vendor/email-wallet/packages/relayer/src/core.rs

#[named]
pub async fn handle_email(email: String) -> Result<(EmailWalletEvent, bool)> {
    let parsed_email = ParsedEmail::new_from_raw_email(&email).await?;
    
    // メール受信のたびにDKIM鍵をチェック
    check_gmail_dkim_key(&parsed_email).await?;
    
    // ... 既存の処理
}

async fn check_gmail_dkim_key(parsed_email: &ParsedEmail) -> Result<()> {
    let current_selector = extract_dkim_selector(&parsed_email.canonicalized_header)?;
    let stored_hash = env::var("GMAIL_DKIM_KEY_HASH")?;
    
    // 現在のセレクターから鍵取得
    let current_key = fetch_dkim_key("gmail.com", &current_selector).await?;
    let current_hash = calculate_key_hash(&current_key);
    
    if current_hash != stored_hash {
        warn!(LOG, "Gmail DKIM key changed! Old: {}, New: {}", stored_hash, current_hash);
        
        // 1. アラート送信
        send_alert(&format!("Gmail DKIM key updated: {}", current_hash)).await?;
        
        // 2. 自動更新（オプション）
        update_dkim_key_in_contract("gmail.com", &current_hash).await?;
        
        // 3. 環境変数更新指示
        info!(LOG, "Update GMAIL_DKIM_KEY_HASH to: {}", current_hash);
    }
    
    Ok(())
}
```

#### 非同期DKIM鍵取得
```rust
async fn fetch_dkim_key(domain: &str, selector: &str) -> Result<String> {
    let query = format!("{}._domainkey.{}", selector, domain);
    
    // DNSクエリの実行
    let output = tokio::process::Command::new("dig")
        .args(&["TXT", &query, "+short"])
        .output()
        .await?;
    
    let response = String::from_utf8(output.stdout)?;
    
    // "v=DKIM1; k=rsa; p=..." から公開鍵部分を抽出
    if let Some(p_start) = response.find("p=") {
        let p_part = &response[p_start + 2..];
        if let Some(p_end) = p_part.find('"') {
            return Ok(p_part[..p_end].to_string());
        }
    }
    
    Err(anyhow!("Invalid DKIM record format"))
}
```

### 2. 代替案：定期チェック（非推奨）

#### 日次チェックスクリプト（参考）
```bash
#!/bin/bash
# check_gmail_dkim.sh

CURRENT_SELECTOR="20230601"
STORED_HASH="0x1234567890abcdef..."

# Gmail DKIM鍵取得
CURRENT_KEY=$(dig TXT ${CURRENT_SELECTOR}._domainkey.gmail.com +short | tr -d '"')

if [[ $CURRENT_KEY == *"p="* ]]; then
    # 公開鍵ハッシュを計算
    # （実際の計算処理はより複雑）
    echo "Gmail DKIM key check: OK"
else
    echo "WARNING: Gmail DKIM key may have changed!"
    echo "Current response: $CURRENT_KEY"
fi
```

### 3. リアルタイム検知の利点

#### ✅ **即座の検知**
- メール受信と同時にDKIM鍵変更を検知
- 遅延なしでアラート・対応可能
- ダウンタイムの最小化

#### ✅ **効率的なリソース使用**
- 不要な定期チェックが不要
- DNS問い合わせは実際のメール処理時のみ
- CPUリソースの節約

#### ✅ **正確な障害検知**
- 実際のメール検証失敗で即座に判明
- false positiveの削減
- 実際の影響度に基づく判断

#### ✅ **自動復旧の可能性**
```rust
// 自動復旧ロジックの例
if dkim_verification_failed {
    // 1. 新しい鍵を取得
    let new_key = fetch_latest_dkim_key().await?;
    
    // 2. コントラクトを更新
    update_contract_dkim_key(&new_key).await?;
    
    // 3. メール再処理
    retry_email_processing(&email).await?;
}
```

### 4. 緊急時対応手順

#### DKIM鍵更新時の対応
1. **新しい鍵の取得**
   ```bash
   dig TXT NEW_SELECTOR._domainkey.gmail.com
   ```

2. **鍵ハッシュの再計算**
   ```javascript
   // 新しい公開鍵でハッシュ計算
   ```

3. **スマートコントラクトの更新**
   ```solidity
   dkimRegistry.setDKIMPublicKeyHash("gmail.com", newKeyHash);
   ```

4. **リレイヤーの環境変数更新**
   ```bash
   # .envファイル更新
   GMAIL_DKIM_KEY_HASH=0x... # 新しいハッシュ
   GMAIL_SELECTOR=... # 新しいセレクター
   
   # リレイヤー再起動
   docker compose restart relayer
   ```

### 3. 監視ポイント

#### Gmail メール送信の確認
```bash
# テストメール送信後のDKIM検証
python test_gmail_dkim.py --email="Send 1 ETH to test@domain.com"
```

#### リレイヤーログの監視
```bash
# DKIM検証エラーの監視
docker compose logs relayer | grep -i "dkim\|verification"
```

## 将来への移行計画

### 1. 段階的IC復帰
```
Phase 1: Gmail固定運用（MVP）
Phase 2: Gmail + Outlook対応（IC部分復帰検討）
Phase 3: 完全自動化（IC完全復帰）
```

### 2. マルチプロバイダー対応時
- **IC設定の再導入**が推奨
- **手動管理の限界**（複数プロバイダー × 複数セレクター）
- **運用コストの急増**

### 3. 本番環境移行時
- **IC依存の再評価**
- **可用性要件に基づく判断**
- **運用体制の整備**

## 制限事項とリスク

### ❌ **制限事項**
- **Gmail限定**: 他のメールプロバイダー使用不可
- **手動運用**: DKIM鍵更新の監視・対応が必要
- **単一障害点**: Gmail DKIM鍵への依存

### ⚠️ **セキュリティリスク**
- **DNS応答偽装**: 攻撃者がDNS応答を偽装してDKIM鍵を改ざん
- **中間者攻撃**: 単一ソースでの鍵取得による脆弱性
- **信頼性の欠如**: IC Oracleの分散合意なしでの鍵検証

### ⚠️ **運用リスク**
- **サービス停止**: Gmail鍵更新時の対応遅延
- **スケーラビリティ**: 他プロバイダー対応時の技術的債務
- **運用負荷**: 24/7監視の必要性

### 🔒 **IC Oracleと比較した信頼性の違い**

| 項目 | IC Oracle（推奨） | 手動管理（IC離れ） |
|------|------------------|------------------|
| DNS検証 | 複数ノードでの分散合意 | 単一ソースの問い合わせ |
| 改ざん耐性 | 分散システムによる高い耐性 | DNS応答偽装のリスク |
| 自動更新 | 完全自動 | 手動監視・対応 |
| 信頼性 | 暗号学的証明による担保 | 運用者の注意力に依存 |
| 運用コスト | 低（自動化） | 高（24/7監視） |

## 結論

**MVP段階でのIC離れは、開発効率と短期運用の観点から有効**ですが、**重大なセキュリティ・信頼性のトレードオフ**があります：

### ✅ **MVP採用の条件**
1. **Gmail限定の制約**を受け入れる
2. **セキュリティリスクを理解**した上での短期運用
3. **手動DKIM鍵管理**の運用体制を構築
4. **将来のIC復帰**を前提とした設計保持

### ⚠️ **重要な注意事項**

**IC離れは根本的にZK証明システムの信頼性を損なう**行為です：

- **ZK回路がオンチェーンにある** → DKIM鍵もオンチェーン参照が必要
- **IC Oracleは単なる便利機能ではない** → 信頼性の根幹を支える
- **手動管理は一時的な回避策** → 本格運用では必ずIC復帰が必要

### 📊 **採用判断の指針**

| 用途 | IC離れの妥当性 | 推奨度 |
|------|-------------|-------|
| 社内プロトタイプ | ✅ 適切 | ⭐⭐⭐ |
| MVP開発・検証 | ⚠️ 条件付き | ⭐⭐ |
| クローズドβ | ❌ 不適切 | ⭐ |
| 本格サービス | ❌ 絶対不可 | ❌ |

IC離れは**短期的な開発加速**のための戦略であり、**セキュリティと信頼性を犠牲にする**ことを十分理解した上で採用してください。