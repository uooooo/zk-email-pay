# AddressWallet DApp 実装ガイド

AddressWalletユーザーがMetaMaskを使用してEmailWalletユーザーにERC20トークンを送金できるDApps機能の実装ドキュメントです。

## 📋 概要

### 実装したもの
1. **ウォレット接続機能**: MetaMask接続とBase Sepolia自動切り替え
2. **残高表示機能**: ETH・ERC20トークンの残高確認
3. **送金UI**: メールアドレス宛の送金インターフェース  
4. **リレイヤー連携**: registerUnclaimedFund API経由での送金処理
5. **エラーハンドリング**: 包括的なエラー処理とユーザーフィードバック

### 送金フロー
1. **AddressWalletユーザー**: MetaMaskを接続してトークンを選択・送金要求
2. **フロントエンド**: `/api/registerUnclaimedFund` にリクエスト送信
3. **バックエンドAPI**: リレイヤーの `registerUnclaimedFund` を呼び出し
4. **リレイヤー**: UnclaimedFundとして登録し、受信者にメール送信
5. **EmailWalletユーザー**: メールに返信してトークンクレーム

## 🎯 技術仕様

### フロントエンド (`/address/page.tsx`)

#### ウォレット接続
```typescript
// MetaMask接続
const connectWallet = useCallback(async () => {
  const provider = new ethers.BrowserProvider(window.ethereum!);
  const accounts = await provider.send('eth_requestAccounts', []);
  
  // Base Sepolia自動切り替え
  if (network.chainId !== BigInt(84532)) {
    await switchToBaseSepolia();
  }
}, []);
```

#### ERC20残高取得
```typescript
const fetchBalance = useCallback(async () => {
  if (selectedToken.symbol === 'ETH') {
    const balance = await provider.getBalance(walletAddress);
    setBalance(ethers.formatEther(balance));
  } else {
    const contract = new ethers.Contract(selectedToken.address, ERC20_ABI, provider);
    const balance = await contract.balanceOf(walletAddress);
    setBalance(ethers.formatUnits(balance, selectedToken.decimals));
  }
}, []);
```

#### 送金処理
```typescript
const onSendToEmail = useCallback(async () => {
  const response = await fetch('/api/registerUnclaimedFund', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderAddress: walletAddress,
      amount: parseFloat(amount),
      tokenAddress: selectedToken.address,
      recipientEmail: recipientEmail,
      expiryTime: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
    }),
  });
}, []);
```

### バックエンドAPI (`/api/registerUnclaimedFund/route.ts`)

#### バリデーション
- 送信者アドレスの形式確認
- メールアドレスの形式確認
- トークンコントラクトの存在確認
- 送信者残高の確認

#### リレイヤー連携
```typescript
const relayerResponse = await fetch(`${relayerApiUrl}/registerUnclaimedFund`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sender_address: senderAddress,
    amount: parseFloat(amount),
    token_address: tokenAddress,
    recipient_email: recipientEmail,
    expiry_time: expiryTime,
  }),
});
```

## 🔧 セットアップ手順

### 1. 環境設定
`.env.local` ファイルに以下を設定：
```bash
# リレイヤーAPI (既存)
NEXT_PUBLIC_RELAYER_API_URL=http://localhost:8080
NEXT_PUBLIC_RELAYER_EMAIL=zkemailpay@gmail.com
NEXT_PUBLIC_CORE_CONTRACT_ADDRESS=0xF60Ce6F85eebF6279784A7F1acB7653dDFEF86a3
NEXT_PUBLIC_CHAIN_ID=84532

# Base Sepolia RPC (新規)
RPC_URL=https://sepolia.base.org
```

### 2. 必要な依存関係
```json
{
  "dependencies": {
    "ethers": "^6.15.0",
    "next": "15.5.2",
    "react": "19.1.0"
  }
}
```

### 3. 対応トークン
```typescript
const tokenOptions = [
  { symbol: "ETH", address: "native", name: "Ethereum", decimals: 18 },
  { symbol: "USDC", address: "0x3CA50b9B421646D0B485852A14168Aa8494D2877", name: "USD Coin", decimals: 6 },
  { symbol: "JPYC", address: "0x36e3495B2AeC55647bEF00968507366f1f7572C6", name: "JPYC", decimals: 18 },
];
```

## 🚀 使用方法

### ユーザー側の操作
1. `http://localhost:3000/address` にアクセス
2. 「MetaMaskを接続」ボタンをクリック
3. Base Sepoliaネットワークが自動で追加/切り替え
4. 送付先メールアドレスを入力
5. 送金量とトークンを選択
6. 「送金」ボタンをクリック
7. 受信者にクレーム通知メールが送信される

### 管理者側の監視
```bash
# Base Sepolia上でのトランザクション確認
https://sepolia.basescan.org/

# リレイヤーログ確認
# リレイヤーサーバーのログを監視
```

## 📁 ファイル構成

```
frontend/
├── src/app/address/
│   └── page.tsx                          # AddressWallet DApp メインページ
├── src/app/api/registerUnclaimedFund/
│   └── route.ts                          # UnclaimedFund登録 API
├── src/types/
│   └── ethereum.d.ts                     # MetaMask型定義
└── package.json                          # 依存関係
```

## 🔧 主要機能

### 1. ウォレット接続
- MetaMask自動検出
- Base Sepolia自動追加・切り替え
- ネットワーク状態監視
- エラーハンドリング

### 2. 残高管理
- ETH残高表示
- ERC20トークン残高表示
- 手動残高更新機能
- リアルタイム更新

### 3. 送金処理
- メールアドレスバリデーション
- 残高確認
- リレイヤーAPI連携
- トランザクション状態追跡

### 4. ユーザビリティ
- ローディング状態表示
- エラーメッセージ
- 操作ガイド
- レスポンシブデザイン

## ⚠️ 注意点とベストプラクティス

### セキュリティ
- 秘密鍵は絶対にフロントエンドで扱わない
- バリデーションをクライアント・サーバー両方で実施
- エラーメッセージに機密情報を含めない

### 運用
- リレイヤーサーバーの稼働状況監視
- ネットワーク接続エラー対応
- ユーザーサポート体制

### パフォーマンス
- 残高取得の頻度調整
- APIリクエストのキャッシュ
- 大量送金時の負荷分散

## 🐛 トラブルシューティング

### よくある問題

#### 1. MetaMask接続エラー
```
Error: MetaMaskがインストールされていません
→ MetaMaskブラウザ拡張をインストール
```

#### 2. ネットワーク切り替えエラー
```
Error: ネットワーク切り替えに失敗
→ MetaMaskで手動でBase Sepoliaに切り替え
```

#### 3. 残高不足エラー  
```
Error: Insufficient balance
→ 送金者のウォレットに十分なトークンを準備
```

#### 4. リレイヤーAPI接続エラー
```
Error: リレイヤーでのUnclaimedFund登録に失敗
→ リレイヤーサーバーの稼働確認
→ NEXT_PUBLIC_RELAYER_API_URL設定確認
```

## 📈 今後の改善案

### 機能拡張
1. **複数トークン一括送金**: 同時に複数のトークンを送金
2. **送金履歴**: 過去の送金記録表示
3. **送金スケジュール**: 定期送金機能
4. **ガス代最適化**: 動的ガス料金設定

### UX改善
1. **プログレスバー**: 送金処理進捗の可視化
2. **通知システム**: リアルタイム状態更新
3. **QRコード**: メールアドレス入力簡略化
4. **マルチ言語**: 多言語対応

### 技術改善
1. **Web3Modal**: 複数ウォレット対応
2. **状態管理**: Redux/Zustand導入
3. **テスト**: 自動テスト追加
4. **監視**: APM導入

## 📞 サポート

問題が発生した場合：
1. ブラウザコンソールのエラーログ確認
2. MetaMaskの接続状態確認
3. リレイヤーサーバーのログ確認
4. Base Sepoliaネットワーク状態確認

技術的な詳細については、実装コードのコメントもご参照ください。