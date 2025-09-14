# Wallet→Email Transfer Library 設計書

**実装者**: 最初で最後の実装者として、SDK化は考えずlib化に特化した設計

## アーキテクチャ概要

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   DApp/Frontend │───▶│  Bridge Lib  │───▶│   EmailWallet   │
│  (AddressWallet)│    │  (Core Logic) │    │   (Recipient)   │
└─────────────────┘    └──────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │    Relayer   │
                       │ (Email Send) │
                       └──────────────┘
```

## 1. Core Library Structure

```
wallet-to-email-lib/
├── contracts/                 # Smart Contracts
│   ├── WalletToEmailBridge.sol
│   ├── interfaces/
│   └── test/
├── lib/                      # TypeScript Library
│   ├── core/
│   │   ├── BridgeClient.ts
│   │   ├── EmailNotifier.ts
│   │   └── TransactionHandler.ts
│   ├── types/
│   └── utils/
├── relayer/                  # Relayer Extensions
│   ├── api/
│   └── email/
└── examples/                 # Integration Examples
```

## 2. Smart Contract Layer

### WalletToEmailBridge.sol (最小実装)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract WalletToEmailBridge is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    struct PendingTransfer {
        bytes32 emailHash;      // keccak256(email.toLowerCase())
        uint256 amount;
        address tokenAddr;
        address sender;
        uint256 timestamp;
        bool claimed;
    }
    
    mapping(bytes32 => PendingTransfer) public transfers;
    mapping(address => bool) public authorizedRelayers;
    
    address public emailWalletCore;
    uint256 public constant EXPIRY_TIME = 30 days;
    
    event TransferInitiated(
        bytes32 indexed transferId,
        bytes32 indexed emailHash,
        address indexed sender,
        address tokenAddr,
        uint256 amount
    );
    
    event TransferClaimed(
        bytes32 indexed transferId,
        address indexed recipient
    );
    
    // Step 1: AddressWallet送信者がトークンをロック
    function initiateTransfer(
        bytes32 emailHash,
        address tokenAddr,
        uint256 amount
    ) external nonReentrant returns (bytes32 transferId) {
        require(amount > 0, "Amount must be positive");
        
        transferId = keccak256(abi.encodePacked(
            emailHash, msg.sender, tokenAddr, amount, block.timestamp
        ));
        
        require(transfers[transferId].sender == address(0), "Transfer exists");
        
        // トークンをBridge契約にロック
        IERC20(tokenAddr).safeTransferFrom(msg.sender, address(this), amount);
        
        transfers[transferId] = PendingTransfer({
            emailHash: emailHash,
            amount: amount,
            tokenAddr: tokenAddr,
            sender: msg.sender,
            timestamp: block.timestamp,
            claimed: false
        });
        
        emit TransferInitiated(transferId, emailHash, msg.sender, tokenAddr, amount);
        
        // Relayerにメール送信を依頼（off-chain）
        return transferId;
    }
    
    // Step 2: EmailWalletユーザーがクレーム
    function claimTransfer(
        bytes32 transferId,
        bytes32 emailProof
    ) external nonReentrant {
        PendingTransfer storage transfer = transfers[transferId];
        
        require(transfer.sender != address(0), "Transfer not found");
        require(!transfer.claimed, "Already claimed");
        require(
            block.timestamp <= transfer.timestamp + EXPIRY_TIME, 
            "Transfer expired"
        );
        
        // EmailWallet認証（簡略版 - 本実装では適切な検証）
        require(_verifyEmailProof(transfer.emailHash, emailProof), "Invalid proof");
        
        transfer.claimed = true;
        
        // EmailWalletに送金
        IERC20(transfer.tokenAddr).safeTransfer(msg.sender, transfer.amount);
        
        emit TransferClaimed(transferId, msg.sender);
    }
    
    // Step 3: 期限切れ時の返金
    function refundTransfer(bytes32 transferId) external nonReentrant {
        PendingTransfer storage transfer = transfers[transferId];
        
        require(transfer.sender == msg.sender, "Only sender can refund");
        require(!transfer.claimed, "Already claimed");
        require(
            block.timestamp > transfer.timestamp + EXPIRY_TIME,
            "Not yet expired"
        );
        
        transfer.claimed = true; // Prevent re-entry
        
        IERC20(transfer.tokenAddr).safeTransfer(msg.sender, transfer.amount);
    }
    
    function _verifyEmailProof(
        bytes32 emailHash, 
        bytes32 emailProof
    ) internal pure returns (bool) {
        // 簡略版実装 - 実際はZK Proof検証
        return emailHash == emailProof;
    }
}
```

## 3. TypeScript Library Layer

### BridgeClient.ts (コア機能)

```typescript
import { ethers } from 'ethers';
import { BRIDGE_ABI, BRIDGE_ADDRESSES } from './constants';

export interface TransferParams {
  toEmail: string;
  amount: string;
  tokenAddress: string;
  signer: ethers.Signer;
  network?: string;
}

export interface TransferResult {
  transferId: string;
  txHash: string;
  bridgeAddress: string;
  emailHash: string;
}

export class WalletToEmailBridge {
  private bridge: ethers.Contract;
  private relayerUrl: string;
  
  constructor(
    provider: ethers.providers.Provider,
    network: string = 'base-sepolia',
    relayerUrl?: string
  ) {
    const bridgeAddress = BRIDGE_ADDRESSES[network];
    if (!bridgeAddress) {
      throw new Error(`Unsupported network: ${network}`);
    }
    
    this.bridge = new ethers.Contract(bridgeAddress, BRIDGE_ABI, provider);
    this.relayerUrl = relayerUrl || `https://relayer.zkemailpay.com`;
  }
  
  // メイン送金機能
  async sendToEmail(params: TransferParams): Promise<TransferResult> {
    const { toEmail, amount, tokenAddress, signer } = params;
    
    // 1. メールハッシュ化
    const emailHash = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(toEmail.toLowerCase())
    );
    
    // 2. 送金額をwei変換
    const amountWei = ethers.utils.parseUnits(amount, 6); // USDC = 6桁
    
    // 3. トークン承認
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const approveTx = await token.approve(this.bridge.address, amountWei);
    await approveTx.wait();
    
    // 4. Bridge契約実行
    const bridgeWithSigner = this.bridge.connect(signer);
    const tx = await bridgeWithSigner.initiateTransfer(
      emailHash,
      tokenAddress,
      amountWei
    );
    const receipt = await tx.wait();
    
    // 5. TransferIdを取得
    const transferEvent = receipt.events?.find(
      (e: any) => e.event === 'TransferInitiated'
    );
    const transferId = transferEvent?.args?.transferId;
    
    // 6. Relayerにメール送信依頼
    await this._notifyRelayer({
      transferId,
      toEmail,
      amount,
      tokenAddress,
      senderAddress: await signer.getAddress()
    });
    
    return {
      transferId,
      txHash: tx.hash,
      bridgeAddress: this.bridge.address,
      emailHash
    };
  }
  
  // クレーム状況確認
  async getTransferStatus(transferId: string) {
    const transfer = await this.bridge.transfers(transferId);
    return {
      exists: transfer.sender !== ethers.constants.AddressZero,
      claimed: transfer.claimed,
      amount: transfer.amount.toString(),
      tokenAddr: transfer.tokenAddr,
      sender: transfer.sender,
      timestamp: transfer.timestamp.toNumber(),
      expired: Date.now() > (transfer.timestamp.toNumber() + 30 * 24 * 60 * 60) * 1000
    };
  }
  
  // 返金実行
  async refundTransfer(transferId: string, signer: ethers.Signer) {
    const bridgeWithSigner = this.bridge.connect(signer);
    const tx = await bridgeWithSigner.refundTransfer(transferId);
    return tx.wait();
  }
  
  private async _notifyRelayer(params: {
    transferId: string;
    toEmail: string;
    amount: string;
    tokenAddress: string;
    senderAddress: string;
  }) {
    try {
      const response = await fetch(`${this.relayerUrl}/api/send-claim-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        console.warn('Failed to notify relayer, but transfer is locked on-chain');
      }
    } catch (error) {
      console.warn('Relayer notification failed:', error);
    }
  }
}
```

### EmailNotifier.ts (メール送信部分)

```typescript
import nodemailer from 'nodemailer';

export interface ClaimEmailParams {
  toEmail: string;
  amount: string;
  tokenSymbol: string;
  senderAddress: string;
  transferId: string;
  claimUrl: string;
}

export class EmailNotificationService {
  private transporter: nodemailer.Transporter;
  
  constructor(smtpConfig: nodemailer.TransporterOptions) {
    this.transporter = nodemailer.createTransporter(smtpConfig);
  }
  
  async sendClaimNotification(params: ClaimEmailParams): Promise<boolean> {
    const { toEmail, amount, tokenSymbol, senderAddress, transferId, claimUrl } = params;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><title>You received crypto!</title></head>
      <body style="font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2E8B57;">💰 You received ${amount} ${tokenSymbol}!</h2>
          
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Amount:</strong> ${amount} ${tokenSymbol}</p>
            <p><strong>From:</strong> ${senderAddress.slice(0, 8)}...${senderAddress.slice(-6)}</p>
            <p><strong>Transfer ID:</strong> ${transferId}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${claimUrl}" 
               style="background: #007bff; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Claim Your Tokens →
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This transfer will expire in 30 days. Click the link above to claim your tokens.
            No wallet required - we'll guide you through the process!
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px;">
            Powered by zk-email-pay | 
            <a href="https://zkemailpay.com/help">Need help?</a>
          </p>
        </div>
      </body>
      </html>
    `;
    
    try {
      await this.transporter.sendMail({
        from: '"ZK Email Pay" <noreply@zkemailpay.com>',
        to: toEmail,
        subject: `💰 You received ${amount} ${tokenSymbol}!`,
        html: htmlContent,
        text: `You received ${amount} ${tokenSymbol} from ${senderAddress}. Claim at: ${claimUrl}`
      });
      
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }
}
```

## 4. Relayer API Extension

### relayer/api/send-claim-email.ts

```typescript
import express from 'express';
import { EmailNotificationService } from '../lib/EmailNotifier';

const router = express.Router();
const emailService = new EmailNotificationService({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

router.post('/send-claim-email', async (req, res) => {
  try {
    const { transferId, toEmail, amount, tokenAddress, senderAddress } = req.body;
    
    // トークン名取得（レジストリまたはハードコード）
    const tokenSymbol = getTokenSymbol(tokenAddress) || 'TOKEN';
    
    // クレームURL生成
    const claimUrl = `https://claim.zkemailpay.com/${transferId}`;
    
    const success = await emailService.sendClaimNotification({
      toEmail,
      amount,
      tokenSymbol,
      senderAddress,
      transferId,
      claimUrl
    });
    
    if (success) {
      res.json({ success: true, message: 'Claim email sent' });
    } else {
      res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function getTokenSymbol(tokenAddress: string): string {
  const TOKEN_MAP: { [key: string]: string } = {
    '0xA0b86a33E6C3d4A56A1E1f7F1E2b1C0D2E3F4A5B': 'USDC', // Base Sepolia USDC
    // 他のトークンを追加
  };
  
  return TOKEN_MAP[tokenAddress.toLowerCase()] || 'TOKEN';
}

export default router;
```

## 5. Integration Examples

### examples/react-dapp-integration.tsx

```typescript
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { WalletToEmailBridge } from 'wallet-to-email-lib';

export const SendToEmailComponent: React.FC = () => {
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const handleSend = async () => {
    try {
      setLoading(true);
      
      // MetaMask接続
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      
      // Bridge初期化
      const bridge = new WalletToEmailBridge(provider, 'base-sepolia');
      
      // 送金実行
      const result = await bridge.sendToEmail({
        toEmail: email,
        amount: amount,
        tokenAddress: '0xA0b86a33E6C3d4A56A1E1f7F1E2b1C0D2E3F4A5B', // USDC
        signer
      });
      
      setResult(result);
      setEmail('');
      setAmount('');
    } catch (error) {
      console.error('Send failed:', error);
      alert('Transfer failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h3>Send USDC to Email</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label>Recipient Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="friend@gmail.com"
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label>Amount (USDC):</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="10.5"
          step="0.01"
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>
      
      <button
        onClick={handleSend}
        disabled={loading || !email || !amount}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Sending...' : 'Send to Email'}
      </button>
      
      {result && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '5px' }}>
          <h4>Transfer Initiated!</h4>
          <p><strong>Transfer ID:</strong> {result.transferId}</p>
          <p><strong>Transaction:</strong> {result.txHash}</p>
          <p>Recipient will receive an email with claim instructions.</p>
        </div>
      )}
    </div>
  );
};
```

## 6. 実装ロードマップ

### Phase 1: MVP (2週間)
1. **Smart Contract**: 基本的なBridge契約
2. **TypeScript Lib**: 送金機能のみ
3. **Relayer Extension**: メール送信API
4. **Local Testing**: 開発環境での動作確認

### Phase 2: Production Ready (1週間)
1. **Security Audit**: コントラクト監査
2. **Error Handling**: 包括的なエラー処理
3. **Monitoring**: ログ・メトリクス追加
4. **Deploy**: Base Sepoliaデプロイ

### Phase 3: Enhancement (継続的)
1. **Multi-Token Support**: 複数トークン対応
2. **Batch Transfer**: 一括送金機能
3. **UI Templates**: 統合用UIコンポーネント

## 7. lib使用方法

### インストール（将来）
```bash
npm install wallet-to-email-lib
# または
yarn add wallet-to-email-lib
```

### 最小限の統合
```typescript
import { WalletToEmailBridge } from 'wallet-to-email-lib';

// DApp内での使用
const bridge = new WalletToEmailBridge(provider, 'base-sepolia');

// ワンライン送金
const result = await bridge.sendToEmail({
  toEmail: 'user@gmail.com',
  amount: '10.5',
  tokenAddress: USDC_ADDRESS,
  signer: userSigner
});

console.log(`Transfer ID: ${result.transferId}`);
```

この設計により、最小限の実装でWallet→Email転送を実現し、後から機能拡張可能な構造になっています。