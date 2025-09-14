---
marp: true
theme: default
paginate: true
---

# AddressWallet → EmailWallet トークン送金フロー

email-walletシステムにおけるAddressWalletユーザーからEmailWalletユーザーへのトークン送金の時系列実装フロー

---

## Step 1: AddressWalletユーザーが送金を開始

### 1-1. 送金要求（Web UI経由）
**アクション**: AddressWalletユーザーがWebインターフェース経由で送金要求

**ユーザー入力情報**:
- 送金者: `0x1234...5678` (AddressWalletアドレス)
- 送金量: `100 USDC`
- 受信者: `recipient@example.com` (メールアドレス)

### 1-2. リレイヤーAPIへの変換
**内部処理**: WebUIがリレイヤーの `/api/registerUnclaimedFund` に送信

**実際のAPIコール**:
```json
{
  "sender_address": "0x1234...5678",
  "amount": 100,
  "token_address": "0xA0b86a33E6842f1686f6C19E4C3D7b15d8e8C5a3", 
  "recipient_email": "recipient@example.com",
  "expiry_time": 0
}
```

**処理**: リレイヤーが送金要求を受付

---

## Step 2: リレイヤーがAddressWalletユーザーから直接トークンを受け取る

### 2-1. ERC20トークン承認確認
**処理**: AddressWalletユーザーが事前にトークンをリレイヤーにapprove済み
**確認**: `IERC20(tokenAddr).allowance(senderAddress, relayerAddress) >= amount`

### 2-2. トークンの一時保管
**処理**: リレイヤーがAddressWalletからトークンを受け取り
```solidity
IERC20(tokenAddr).safeTransferFrom(senderAddress, relayerAddress, amount);
```

---

## Step 3: リレイヤーがUnclaimedFundを登録

### 3-1. スマートコントラクト呼び出し
**コントラクト**: `UnclaimsHandler.sol`
**関数**: `registerUnclaimedFund()`
**実装**: `email-wallet/packages/relayer/src/chain.rs:244-280`

```solidity
function registerUnclaimedFund(
    bytes32 emailAddrCommit,    // Hash(email + randomness)
    address tokenAddr,          // ERC20トークンアドレス  
    uint256 amount,            // 送金量
    uint256 expiryTime,        // 有効期限
    uint256 announceCommitRandomness, // 公開用ランダムネス
    string calldata announceEmailAddr // 公開用メールアドレス
) public payable returns (uint256)
```

---

## Step 4: UnclaimedFund登録の詳細処理

### 4-1. 事前処理
- **emailAddrCommit生成**: `keccak256(abi.encode(emailAddr.toLowerCase(), randomness))`
- **ガス手数料計算**: `unclaimedFundClaimGas * maxFeePerGas`
- **ERC20 approve**: 必要に応じてトークン承認

### 4-2. オンチェーン処理
1. **バリデーション**: 送金量、トークンアドレス、有効期限の確認
2. **トークンロック**: `IERC20(tokenAddr).safeTransferFrom(msg.sender, address(this), amount)`
3. **UnclaimedFund作成**: ID、コミット、送金者情報を記録
4. **イベント発行**: `UnclaimedFundRegistered` イベント

---

## Step 5: Invitationメールの送信 📧

### 5-1. イベントリスナー起動
**トリガー**: `UnclaimedFundRegistered` イベント検知
**処理**: `email-wallet/packages/relayer/src/lib.rs:184-217`

### 5-2. 受信者のAccountCode確認・生成
**確認処理**: リレイヤーが受信者のAccountCodeをDBで確認
```rust
let account_code_str = DB.get_account_code(&recipient_email).await?;
```

**新規ユーザーの場合**:
- AccountCodeを新規生成: `AccountCode::new(rand::thread_rng())`
- DBに保存して後でアカウント作成時に使用

### 5-3. Invitationメール生成・送信
**送信先**: 受信者（EmailWalletユーザー）
**件名**: `Your Email Wallet Account is ready to be deployed. Code XXXX`
**テンプレート**: `invitation.html`

**メール内容**:
```
Hi recipient@example.com!
あなた宛にトークンが送金されました。
AccountCode: 1234567890abcdef (新規ユーザーの場合)
このメールに返信してクレームしてください。
ウォレットアドレス: 0x1234...
```

**重要**: AccountCodeは受信者のEmailWalletアカウントの秘密鍵のようなもの

---

## Step 6: EmailWalletユーザーがクレーム要求

### 6-1. クレーム要求送信
**アクション**: EmailWalletユーザーが `/api/unclaim` にリクエスト
**リクエストデータ**:
```json
{
  "email_address": "recipient@example.com",
  "random": "0x1234567890abcdef...", 
  "expiry_time": 1704067200,
  "is_fund": true,
  "tx_hash": "0xabcdef..."
}
```

### 6-2. クレーム処理開始
**処理**: リレイヤーが `unclaim()` 関数を実行
**実装**: `email-wallet/packages/relayer/src/modules/web_server/server.rs:9-48`

---

## Step 7: ZK証明生成と検証

### 7-1. メールアドレスコミット検証
- 受信者のメールアドレスとランダムネスからコミット再生成
- 登録済みコミットとの照合

### 7-2. ZK証明生成
**証明内容**:
- EmailWalletユーザーが指定メールアドレスの所有者
- `emailAddrCommit`と`recipientAccountSalt`が同一メールアドレス由来

### 7-3. AccountCodeによるアカウントソルト生成
**AccountCode取得**: 受信者のAccountCodeをDBから取得
```rust
let account_code_str = DB.get_account_code(&email_address).await?;
let account_code = AccountCode(hex2field(&account_code_str)?);
```

**アカウントソルト生成**: Emailアドレス + AccountCodeからウォレット固有のsaltを生成
```rust
let account_salt = AccountSalt::new(
    &PaddedEmailAddr::from_email_addr(&email_address),
    account_code  // 受信者の秘密情報
)?;
```

**重要**: AccountCodeが一致しないとクレームできない（所有者証明の仕組み）

---

## Step 8: claimUnclaimedFund実行

### 8-1. スマートコントラクト呼び出し
**コントラクト**: `UnclaimsHandler.sol`
**関数**: `claimUnclaimedFund()`
**実装**: `email-wallet/packages/relayer/src/chain.rs:182-196`

```solidity
function claimUnclaimedFund(
    uint256 id,                    // UnclaimedFundのID
    bytes32 recipientAccountSalt,  // 受信者のウォレットsalt
    bytes calldata proof          // ZK証明
) public nonReentrant
```

### 8-2. オンチェーン処理
1. **バリデーション**: ID、有効期限、リレイヤー権限確認
2. **ZK証明検証**: `verifier.verifyClaimFundProof()`
3. **受信者ウォレット取得**: `accountHandler.getWalletOfSalt()`
4. **トークン転送**: `IERC20(fund.tokenAddr).safeTransfer(recipientAddr, fund.amount)`
5. **ガス代償還**: `payable(msg.sender).transfer(unclaimedFundClaimGas * maxFeePerGas)`

---

## Step 9: Claimedメールの送信 📧

### 9-1. クレーム成功イベント処理
**トリガー**: `claimUnclaimedFund()` 成功
**イベント**: `EmailWalletEvent::Claimed`

### 9-2. 受信者への完了メール
**送信先**: 受信者（EmailWalletユーザー）
**件名**: `Email Wallet Notification. You received cryptocurrency`
**テンプレート**: `claimed.html`

**メール内容**:
```
Hi recipient@example.com!
トークンの受け取りが完了しました。
トランザクション: 0x...
ウォレットアドレス: 0x1234...
```

---

## Step 10: 送金完了

### 10-1. 送金者への完了通知（オプション）
**送信先**: 送金者（AddressWalletユーザー）
**件名**: `Email Wallet Transaction Completed`
**テンプレート**: `email_handled.html`

**メール内容**:
```
Hi sender@example.com!
送金処理が完了しました。
送金内容: Send 100 USDC to recipient@example.com
トランザクション: 0x...
```

### 10-2. 送金完了
**結果**: 受信者のウォレットにトークンが正常に転送完了

---

## 期限切れ時の処理（Step 11）

### 11-1. 自動期限チェック
**処理**: リレイヤーが定期的に期限切れUnclaimedFundをチェック
**実装**: `email-wallet/packages/relayer/src/lib.rs:267-276`

### 11-2. voidUnclaimedFund実行
**関数**: `voidUnclaimedFund(uint256 id)`
**処理**:
1. 期限切れ確認: `fund.expiryTime < block.timestamp`
2. トークン返却: 元の送金者に返金
3. ガス代清算: 処理ガス代を差し引いて残りを返却

---

## エラー処理とメール通知 📧

### 各段階でのエラー処理
- **Step 2-3**: トークン承認・転送失敗 → Error 通知
- **Step 3-4**: UnclaimedFund登録失敗 → Error 通知  
- **Step 7-8**: ZK証明検証失敗 → Error メール送信
- **Step 9**: クレーム処理失敗 → Error メール送信

### エラーメールテンプレート
**テンプレート**: `error.html`
**内容**: エラー原因と対処法の案内

---

## AccountCodeの重要性

### AccountCodeとは
- **定義**: 各EmailWalletユーザー固有の秘密情報（32バイトのランダム値）
- **役割**: メールアドレスと組み合わせて一意なウォレットアドレスを生成
- **セキュリティ**: AccountCodeを知らない人はウォレットにアクセスできない

### AccountCodeの生成と管理
1. **初回送金時**: リレイヤーが新規AccountCodeを生成
2. **DB保存**: メールアドレスとAccountCodeをペアで保存
3. **メール送信**: AccountCodeを受信者にメール送信
4. **永続化**: 受信者は自分でAccountCodeを安全に保存

### ウォレットアドレス決定式
```
WalletAddress = CREATE2(
  salt: AccountSalt(EmailAddress, AccountCode),
  bytecode: WalletContractBytecode
)
```

**つまり**: 同じEmailアドレス + 同じAccountCode = 常に同じウォレットアドレス

---

## 完全な時系列フロー まとめ

**全体の流れ（時系列順）**:

1. 📤 AddressWalletユーザーがWebUI経由で送金要求
2. 💰 リレイヤーがAddressWalletからトークンを受け取り
3. ⛓️ リレイヤーが`registerUnclaimedFund()`実行
4. 🔑 リレイヤーが受信者のAccountCodeを確認・生成
5. 📧 リレイヤーがInvitationメール送信（AccountCode含む）
6. 📤 EmailWalletユーザーがクレーム要求
7. 🔐 リレイヤーがAccountCodeでZK証明生成・検証
8. ⛓️ リレイヤーが`claimUnclaimedFund()`実行  
9. 📧 リレイヤーがClaimedメール送信
10. ✅ **送金完了**

**重要な特徴**:
- **ユーザーはスマートコントラクトを直接操作しない**
- **リレイヤーがすべてのオンチェーン処理を代理実行**
- **各段階でメール通知による丁寧なUX**
- **ZK証明による安全な身元確認**

このアーキテクチャにより、Web2的UXでWeb3のトークン送金が実現される。