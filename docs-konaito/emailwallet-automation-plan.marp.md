---
marp: true
theme: default
class: lead
paginate: true
backgroundColor: #fff
backgroundImage: url('https://marp.app/assets/hero-background.svg')
---

# EmailWallet 最重要ユースケース解決計画

**MetaMask → メールアドレス送金を実現する実用的アプローチ**

🎯 現実的な問題解決に焦点を当てた開発ロードマップ

---

## 🚨 最大の問題：基本的なユースケースが動かない

### 実際に欲しい機能
```
👤 Alice (MetaMask) → 📧 bob@gmail.com に10 USDC送金
```

### 現状
❌ **Aliceもメールアカウント作成が必要**  
❌ **Aliceもメール返信が必要**  
❌ **企業の給与支払いが困難**  
❌ **Eコマース決済に使えない**  

**→ 誰も使わないシステムになっている**

---

## 🎯 解決すべき3つの核心ユースケース

### 1. **個人送金** 👥
```
MetaMaskユーザー → 友人のメールアドレス
月1000件 × 平均$50 = 実用的需要
```

### 2. **企業支払い** 🏢
```
企業ウォレット → 従業員メールアドレス（一括）
月100社 × 平均50人 = 5000件の処理需要
```

### 3. **Eコマース決済** 🛒
```
顧客ウォレット → 販売者メールアドレス
月10,000店舗 × 平均100件 = 1M件の処理需要
```  

---

## 💡 Solution 1: Wallet-to-Email Bridge

### 現実的なアプローチ
```
MetaMask → DApp → Bridge Contract → EmailWallet → 受信者
```

**核心アイデア**: 送信者は通常のトランザクション、受信者のみメール

### 実装ステップ
```typescript
// 1. Bridge Contract
contract WalletToEmailBridge {
  function sendToEmail(
    string emailHash,     // 受信者メールのハッシュ
    uint256 amount,       // 送金額
    address token         // トークンアドレス
  ) external {
    // 送信者からトークンを受領
    IERC20(token).transferFrom(msg.sender, address(this), amount);
    
    // 未請求として登録 + 受信者にメール送信
    registerUnclaimed(emailHash, amount, token, msg.sender);
  }
}
```

---

## 💡 Solution 2: DApp Integration SDK

### 開発者向け簡単統合
```typescript
// フロントエンド統合
import { EmailPaySDK } from '@zk-email-pay/sdk';

const emailPay = new EmailPaySDK({
  network: 'base-sepolia',
  relayer: 'https://relayer.zkemailpay.com'
});

// ワンライン送金
await emailPay.sendToEmail({
  to: 'friend@gmail.com',
  amount: '10.5',
  token: 'USDC',
  wallet: userWallet  // MetaMask等
});
```

### 背景で自動実行
```typescript
class EmailPaySDK {
  async sendToEmail(params: SendParams) {
    // 1. Bridge契約に送金
    const tx = await this.bridgeContract.sendToEmail(
      hashEmail(params.to),
      parseAmount(params.amount),
      getTokenAddress(params.token)
    );
    
    // 2. 受信者に自動メール送信（Relayer経由）
    await this.notifyRecipient(params.to, tx.hash);
    
    return tx;
  }
}
```

---

## 🛠️ 具体的な実装手順

### Step 1: Bridge Contract開発 (Week 1)
```solidity
contract WalletToEmailBridge {
  struct PendingTransfer {
    bytes32 emailHash;
    uint256 amount;
    address token;
    address sender;
    uint256 expiry;
  }
  
  mapping(bytes32 => PendingTransfer) public transfers;
  
  function sendToEmail(bytes32 emailHash, uint256 amount, address token) external;
  function claimTransfer(bytes32 emailHash, bytes32 emailProof) external;
}
```

### Step 2: メール通知システム (Week 1)
```typescript
class EmailNotificationService {
  async notifyRecipient(email: string, transferId: string) {
    const message = {
      to: email,
      subject: "💰 You received tokens!",
      body: `Click here to claim: ${claimUrl}?id=${transferId}`
    };
    
    return await this.sendEmail(message);
  }
}
```

---

## 📅 3週間の実用化ロードマップ

### Week 1: Bridge Contract + 基本SDK 🔧

**目標**: MetaMask → メール送金の基本形実現

```typescript
// 最小限の実装
contract SimpleBridge {
  function sendToEmail(bytes32 emailHash, uint256 amount) external;
}

// 基本SDK
class BasicEmailPay {
  async sendToEmail(email: string, amount: string);
}
```

**成果物**: 
- ✅ Bridge Contract (Foundry)
- ✅ 基本SDK (TypeScript)
- ✅ ローカルテスト環境

---

### Week 2: メール通知 + クレームUI 📧

**目標**: 受信者の簡単クレーム体験実現

```typescript
// メール送信機能
class EmailSender {
  async sendClaimNotification(email: string, claimLink: string);
}

// クレームページ
function ClaimPage({ transferId }: Props) {
  return (
    <div>
      <h1>💰 You received 10 USDC!</h1>
      <button onClick={claimTokens}>Claim Now</button>
    </div>
  );
}
```

**成果物**:
- ✅ 自動メール送信システム
- ✅ ワンクリッククレームUI
- ✅ E2Eテスト完了

---

### Week 3: 企業向け機能 + 本番デプロイ 🚀

**目標**: 企業給与・Eコマース対応

```typescript
// バッチ送金API
app.post('/bulk-send', async (req, res) => {
  const { recipients } = req.body; // CSV解析
  const results = await Promise.all(
    recipients.map(r => emailPay.sendToEmail(r.email, r.amount))
  );
  res.json({ results });
});
```

**成果物**:
- ✅ バッチ送金API
- ✅ CSV一括アップロード
- ✅ Base Sepoliaデプロイ  

---

## 🎯 成功の測定基準

### KPI設定（3週間後）

**利用率目標**
- 📊 週間送金件数: 100件以上
- 👥 アクティブユーザー: 50人以上
- 💰 総送金額: $10,000以上

**UX目標** 
- ⏱️ 送金完了時間: <30秒
- 📧 クレーム完了率: >90%
- 😊 ユーザー満足度: >4.0/5.0

**技術目標**
- 🔧 システム稼働率: >99%
- ⚡ API応答時間: <2秒
- 🛡️ セキュリティ事故: 0件

---

## 🚧 想定される課題と対策

### 課題1: メール到達率
**問題**: Gmail等でスパム認定される
**対策**: SendGrid統合 + SPF/DKIM設定

### 課題2: ガス代変動
**問題**: 高ガス時の送金詰まり
**対策**: ガス価格監視 + 動的手数料調整

### 課題3: 詐欺・悪用
**問題**: フィッシングメール偽装
**対策**: 公式ドメイン + メール署名

---

## 💻 実装の詳細ガイド

### 最小限のBridge Contract
```solidity
// contracts/WalletToEmailBridge.sol
contract WalletToEmailBridge {
    struct Transfer {
        bytes32 emailHash;
        uint256 amount;
        address token;
        address sender;
        uint256 created;
    }
    
    mapping(bytes32 => Transfer) public transfers;
    
    function sendToEmail(
        bytes32 _emailHash,
        uint256 _amount,
        address _token
    ) external {
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        
        transfers[_emailHash] = Transfer({
            emailHash: _emailHash,
            amount: _amount,
            token: _token,
            sender: msg.sender,
            created: block.timestamp
        });
        
        emit TransferCreated(_emailHash, _amount, _token, msg.sender);
    }
}
```

---

### シンプルなSDK実装
```typescript
// sdk/EmailPaySDK.ts
export class EmailPaySDK {
  constructor(private config: Config) {}
  
  async sendToEmail(params: {
    to: string;
    amount: string;
    token: 'USDC' | 'USDT';
    wallet: any;  // MetaMask provider
  }) {
    // 1. メールをハッシュ化
    const emailHash = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(params.to.toLowerCase())
    );
    
    // 2. Bridge契約実行
    const contract = new ethers.Contract(
      this.config.bridgeAddress,
      BRIDGE_ABI,
      params.wallet
    );
    
    const tx = await contract.sendToEmail(
      emailHash,
      ethers.utils.parseUnits(params.amount, 6), // USDC = 6桁
      this.getTokenAddress(params.token)
    );
    
    // 3. メール送信（Relayer経由）
    await this.sendNotificationEmail(params.to, tx.hash);
    
    return tx;
  }
}

---

## 🚀 今すぐ始められるNext Steps

### Step 1: 最小実装でテスト (今日から)
```bash
# リポジトリ作成
mkdir wallet-to-email-bridge
cd wallet-to-email-bridge

# Foundryプロジェクト初期化
forge init

# Bridge Contract作成
echo "// TODO: WalletToEmailBridge.sol" > src/WalletToEmailBridge.sol
```

### Step 2: 最初のユーザーテスト (1週間以内)
- 自分の2つのメールアドレス間でテスト
- 友人・家族10人での実使用テスト
- フィードバック収集・改善点特定

### Step 3: 小さなコミュニティ展開 (2週間以内)  
- Discord/Telegram グループでβテスト
- 大学・コワーキング内での給与・経費精算テスト
- 利用データ分析・UX改善

---

## 💡 実用化の鍵：シンプルさの徹底

### やること
✅ **MetaMask → メール** 1つの機能に集中  
✅ **USDC** 1つのトークンでスタート  
✅ **Base Sepolia** 1つのネットワークで検証  
✅ **最小限のUI** - 送金とクレームのみ  

### やらないこと  
❌ 複雑なZK証明（最初は）  
❌ 多数のトークン対応  
❌ 高度なセキュリティ機能  
❌ 企業向け管理画面（後で）  

**→ 2週間で動くものを作る**

---

## 📈 成功への道筋

### 段階的成長戦略
```
Week 1-2:  動作する最小プロダクト
Week 3-4:  10人の継続利用者  
Week 5-8:  100件の送金実績
Week 9-12: 企業1社での給与支払い採用
```

### 持続可能性の確保
- **手数料モデル**: 送金額の0.5%
- **企業プラン**: 月額$99でAPI利用無制限  
- **パートナー**: Eコマース・給与支払いサービス連携

---

## 📋 まとめ：実用化への道筋

### 🎯 **明確な問題の特定**
- EmailWalletの最大の問題: **基本ユースケースが動かない**
- 解決すべき核心: **MetaMask → メール送金**

### 🔧 **シンプルな解決策**  
- Bridge Contract: 外部ウォレット → EmailWallet仲介
- SDK提供: 開発者が簡単に統合可能
- 最小実装: 3週間で実用可能

### 📈 **段階的成長**
- Week 1: 動く最小プロダクト
- Week 2: 実ユーザーでテスト  
- Week 3: 企業向け機能追加

### 💰 **持続可能な成長**
- 手数料モデルで収益化
- 企業プランで安定収入
- パートナー連携で拡大

---

## 🚀 Action Items - 今日から始める

### 開発者向け
1. **Fork zk-email-pay repository**
2. **WalletToEmailBridge.sol を実装**
3. **BasicSDK.ts を作成**
4. **ローカルテストを実行**

### 事業開発向け  
1. **10人のβテスターリスト作成**
2. **企業パートナー候補の特定**
3. **競合分析とポジショニング**

### コミュニティ向け
1. **Discord/Telegramでフィードバック募集**
2. **ハッカソンでのプレゼンテーション**
3. **オープンソース貢献の呼びかけ**

**Let's build the future of Web3 payments! 🌟**