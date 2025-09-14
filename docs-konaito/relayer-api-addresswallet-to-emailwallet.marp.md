---
marp: true
theme: default
class: lead
paginate: true
backgroundColor: #fff
backgroundImage: url('https://marp.app/assets/hero-background.svg')
---

# AddressWallet→EmailWallet送金
**Relayer API経由での実装アーキテクチャ**

🌉 ハイブリッド設計で実現する次世代Web3 UX

---

## 🎯 解決する問題

### 現在の状況
```
AddressWallet (MetaMask) ❌→ EmailWallet User
```

**不可能な理由**:
- EmailWalletはメール認証ベース
- AddressWalletユーザーもメールアカウント作成が必要
- 直接的な送金パスが存在しない

### 目標
```
AddressWallet (MetaMask) ✅→ EmailWallet User  
```

**実現したい体験**:
- MetaMaskから直接メールアドレス宛送金
- 受信者はワンクリックでクレーム

---

## 💡 Relayer API Solution

### アーキテクチャ概要
```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   DApps UI      │───▶│   Relayer    │───▶│   EmailWallet   │
│ (AddressWallet) │    │   API        │    │   (On-chain)    │
└─────────────────┘    └──────────────┘    └─────────────────┘
     Web3側               ブリッジ層           EmailWallet側
```

**核心アイデア**: RelayerがAddressWalletとEmailWalletの橋渡し役

### ハイブリッド設計の必然性
- **オンチェーン部分**: トークン移動・保管・ZK証明
- **オフチェーン部分**: メール送信・通知・アドレス解決

---

## 🔄 技術的実装フロー

### Step 1: DApps UI での送金リクエスト
```typescript
// フロントエンド実装
const sendToEmail = async () => {
  // 1. Relayerへデポジット
  const depositTx = await userWallet.sendTransaction({
    to: RELAYER_DEPOSIT_ADDRESS,
    value: parseEther(amount),
    data: encodeDepositRequest({
      toEmail: 'friend@gmail.com',
      amount: '10.5',
      token: 'USDC'
    })
  });
  
  // 2. Relayer APIに送金リクエスト
  const response = await fetch('/api/depositToEmail', {
    method: 'POST',
    body: JSON.stringify({
      txHash: depositTx.hash,
      fromWallet: userAddress,
      toEmail: 'friend@gmail.com',
      amount: '10.5',
      token: 'USDC'
    })
  });
};
```

---

### Step 2: Relayer側での処理
```typescript
// Relayer API実装
app.post('/api/depositToEmail', async (req, res) => {
  const { txHash, fromWallet, toEmail, amount, token } = req.body;
  
  try {
    // 1. トランザクション検証
    const isValid = await validateDepositTransaction(
      txHash, fromWallet, amount, token
    );
    if (!isValid) throw new Error('Invalid deposit');
    
    // 2. EmailWallet未請求システムに登録
    const emailHash = keccak256(toEmail.toLowerCase());
    await registerUnclaimedFund({
      emailHash,
      amount: parseUnits(amount, getTokenDecimals(token)),
      tokenAddr: getTokenAddress(token),
      sender: fromWallet
    });
    
    // 3. 受信者にメール通知
    await sendClaimNotification(toEmail, amount, token, fromWallet);
    
    res.json({ success: true, claimId: emailHash });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

---

### Step 3: メール通知システム
```typescript
class EmailNotificationService {
  async sendClaimNotification(
    email: string, 
    amount: string, 
    token: string,
    sender: string
  ) {
    const claimUrl = `https://claim.zkemailpay.com/${keccak256(email)}`;
    
    const emailContent = {
      to: email,
      subject: `💰 You received ${amount} ${token}!`,
      html: `
        <div>
          <h2>You received crypto!</h2>
          <p><strong>${amount} ${token}</strong> from ${sender.slice(0,6)}...</p>
          <a href="${claimUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Claim Now →
          </a>
          <p><small>Click the link to claim your tokens. No wallet required!</small></p>
        </div>
      `
    };
    
    return await this.smtpService.sendEmail(emailContent);
  }
}
```

---

### Step 4: 受信者のクレーム体験
```typescript
// クレームページ実装
function ClaimPage({ claimId }: { claimId: string }) {
  const [claimData, setClaimData] = useState(null);
  
  const handleClaim = async () => {
    // 1. メール認証（簡易版）
    const emailVerification = await verifyEmailOwnership(claimId);
    
    // 2. EmailWalletアカウント自動作成
    if (!emailVerification.hasWallet) {
      await createEmailWalletAccount(emailVerification.email);
    }
    
    // 3. 未請求資産をクレーム
    const claimTx = await claimUnclaimedFund({
      emailHash: claimId,
      emailProof: emailVerification.proof
    });
    
    setClaimCompleted(true);
  };
  
  return (
    <div className="claim-container">
      <h1>💰 You received {claimData?.amount} {claimData?.token}!</h1>
      <p>From: {claimData?.sender}</p>
      <button onClick={handleClaim} className="claim-button">
        Claim Your Tokens
      </button>
    </div>
  );
}
```

---

## 🛠️ 必要なコンポーネント

### 1. **Relayer拡張**
```typescript
interface RelayerExtensions {
  // 新規エンドポイント
  depositToEmail: (request: DepositRequest) => Promise<ClaimId>;
  
  // 既存機能の活用
  registerUnclaimedFund: (fund: UnclaimedFund) => void;
  sendClaimNotification: (email: string) => void;
  
  // 新規検証機能
  validateExternalDeposit: (txHash: string) => boolean;
}
```

### 2. **DApps SDK**
```typescript
// 開発者向け簡単統合
import { AddressToEmailSDK } from '@zk-email-pay/sdk';

const emailPay = new AddressToEmailSDK({
  relayerUrl: 'https://relayer.zkemailpay.com',
  network: 'base-sepolia'
});

// ワンライン送金
await emailPay.sendToEmail({
  to: 'friend@gmail.com',
  amount: '10.5',
  token: 'USDC',
  wallet: userWallet
});
```

---

### 3. **クレームUI**
```typescript
// 受信者向けシンプルUI
interface ClaimInterface {
  // メール認証
  emailVerification: SimpleEmailVerification;
  
  // ワンクリッククレーム
  claimProcess: OneClickClaim;
  
  // ウォレット自動作成
  autoWalletCreation: EmailWalletGeneration;
}
```

---

## 📊 技術的メリット・デメリット

### ✅ **メリット**

**1. 実装容易性**
- 既存EmailWalletインフラ活用
- 最小限の追加開発で実現

**2. UX優秀性**
- AddressWalletユーザー: メールアドレス指定で送金
- EmailWalletユーザー: ワンクリックでクレーム

**3. スケーラビリティ**
- Relayer負荷分散可能
- マルチチェーン対応容易

---

### ⚠️ **デメリット・制約**

**1. 中央集権性**
- Relayerサービスへの依存
- 単一障害点の存在

**2. レイテンシ**
- オフチェーン処理による遅延
- メール配信時間の影響

**3. 信頼性要件**
- Relayer運用の継続性
- メールインフラの可用性

---

## 🔒 セキュリティ考慮事項

### セキュリティ設計

**1. トランザクション検証**
```typescript
async function validateDepositTransaction(
  txHash: string,
  fromWallet: string, 
  amount: string,
  token: string
): Promise<boolean> {
  const tx = await provider.getTransaction(txHash);
  
  // 送信者確認
  if (tx.from.toLowerCase() !== fromWallet.toLowerCase()) return false;
  
  // 金額確認
  const decodedData = decodeDepositData(tx.data);
  if (decodedData.amount !== parseUnits(amount, getTokenDecimals(token))) return false;
  
  // トランザクション実行確認
  const receipt = await provider.getTransactionReceipt(txHash);
  return receipt.status === 1;
}
```

**2. レート制限・異常検知**
```typescript
interface SecurityMeasures {
  rateLimiting: {
    perWallet: '10 transactions/hour';
    perEmail: '5 claims/day';
  };
  anomalyDetection: {
    largeDamountAlerts: 'amount > $1000';
    suspiciousPatterns: 'ML-based detection';
  };
}
```

---

## 📈 パフォーマンス最適化

### 1. **並列処理**
```typescript
// 複数処理の並列実行
async function processDepositRequest(request: DepositRequest) {
  const [
    validationResult,
    unclaimedRegistration,
    emailNotification
  ] = await Promise.all([
    validateDeposit(request),
    registerUnclaimed(request),
    sendEmail(request)
  ]);
  
  return { validationResult, unclaimedRegistration, emailNotification };
}
```

### 2. **キャッシング戦略**
```typescript
interface CachingStrategy {
  tokenAddresses: 'Redis 24h cache';
  emailHashes: 'Memory cache with TTL';
  transactionResults: '5min cache for validation';
}
```

### 3. **バッチ処理**
```typescript
// 大量送金時のバッチ最適化
async function bulkDepositToEmail(requests: DepositRequest[]) {
  const batches = chunk(requests, 10);
  
  for (const batch of batches) {
    await Promise.all(batch.map(processDepositRequest));
    await delay(100); // Rate limiting
  }
}
```

---

## 🚀 実装ロードマップ

### Week 1: **Core API 開発**
```typescript
// 最小限の実装
✅ POST /api/depositToEmail エンドポイント
✅ トランザクション検証機能
✅ 基本的なメール通知
✅ ローカルテスト環境
```

### Week 2: **DApps Integration**
```typescript
// フロントエンド統合
✅ React SDK開発
✅ MetaMask連携
✅ ユーザーインターフェース
✅ エラーハンドリング
```

### Week 3: **Production Ready**
```typescript
// 本番化対応
✅ セキュリティ強化
✅ レート制限実装
✅監視・ログ機能
✅ Base Sepoliaデプロイ
```

---

## 💰 収益モデル

### 手数料体系
```typescript
interface FeeStructure {
  transactionFee: '0.5% of amount';
  minimumFee: '$0.10';
  enterpriseAPI: '$99/month unlimited';
  
  // 段階的料金
  volume: {
    '0-100 tx/month': '0.5%';
    '101-1000 tx/month': '0.3%';
    '1000+ tx/month': '0.1%';
  };
}
```

### 市場規模
- **P2P送金**: $1.8兆市場
- **給与支払い**: $600億市場  
- **Eコマース**: $6兆市場

---

## 🎯 成功指標 (KPI)

### 3ヶ月後の目標

**利用統計**
- 📊 月間送金件数: 1,000件
- 👥 アクティブユーザー: 300人
- 💰 総送金額: $50,000

**技術指標**  
- ⏱️ 平均処理時間: <30秒
- 📧 メール到達率: >95%
- 🔄 クレーム成功率: >90%

**ビジネス指標**
- 💵 月間収益: $250 (手数料0.5%)
- 📈 月間成長率: >20%
- 😊 ユーザー満足度: >4.5/5.0

---

## 🤔 既存ソリューションとの比較

### 競合分析

| 機能 | 既存サービス | Relayer API Solution |
|------|-------------|-------------------|
| 送金方法 | ウォレットアドレス必須 | **メールアドレスOK** |
| 受信者要件 | Web3知識必須 | **メールのみで受取** |
| オンボーディング | 複雑（KYC、ウォレット作成） | **自動・透明** |
| 技術統合 | 複雑なSDK | **シンプルなAPI** |
| インフラ依存度 | フルオンチェーン | **ハイブリッド** |

### 独自価値提案
✅ **既存ウォレット活用** - 新規ユーザー獲得不要  
✅ **メール体験** - 最も身近なインターフェース  
✅ **開発者フレンドリー** - 簡単なAPI統合  
✅ **エンタープライズ対応** - 大量処理・管理機能  

---

## 🔮 将来の拡張性

### Phase 2: 高度な機能
```typescript
interface AdvancedFeatures {
  // AI最適化
  smartGasPricing: 'ML-based gas prediction';
  fraudDetection: 'Pattern recognition';
  
  // クロスチェーン
  multiChainSupport: ['Ethereum', 'Polygon', 'Arbitrum'];
  bridgeIntegration: 'Automatic chain selection';
  
  // 企業機能
  bulkPayments: 'CSV upload processing';
  complianceReporting: 'Audit trail export';
  webhookIntegration: 'Real-time notifications';
}
```

### Phase 3: エコシステム
```typescript
interface EcosystemExpansion {
  // パートナー統合
  payrollServices: 'HR software integration';
  ecommercePlugins: 'Shopify, WooCommerce';
  socialPlatforms: 'Discord, Twitter tipping';
  
  // 金融サービス
  savingsAccounts: 'Interest-bearing EmailWallets';
  lendingProtocol: 'Email-based lending';
  insuranceProducts: 'Wallet protection';
}
```

---

## 📋 まとめ

### 🎯 **実現可能性**: 高い
- 既存EmailWalletインフラの活用
- 最小限の追加開発で実装
- 技術的リスクは低い

### 💡 **市場価値**: 非常に高い  
- Web3の最大の課題「オンボーディング」を解決
- 既存ウォレットユーザーにとって自然な体験
- 企業採用への明確なパス

### ⚡ **競合優位性**: 圧倒的
- 世界初のWallet→Email直接送金
- ハイブリッド設計による最適なUX
- 開発者エコシステムへの統合容易性

### 🚀 **Action**: 今すぐ始める
- Week 1: API実装開始
- Week 2: DApps統合
- Week 3: 本番展開

**Let's build the bridge between Web3 and Email! 🌉**

---

## 参考資料

- **EmailWallet Documentation**: docs/zkemail/
- **Technical Implementation**: docs/engineering/
- **API Reference**: docs/api/

**GitHub Repository**: [zk-email-pay](https://github.com/your-org/zk-email-pay)

**Contact**: team@zkemailpay.com

**Thank you!** 🎉