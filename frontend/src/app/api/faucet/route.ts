import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// USDC ERC20 ABI (最小限)
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

export async function POST(request: NextRequest) {
  try {
    const { recipientEmail, amount, tokenAddress } = await request.json();

    // バリデーション
    if (!recipientEmail || !amount || !tokenAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientEmail, amount, tokenAddress' },
        { status: 400 }
      );
    }

    // メールアドレスの簡易バリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // 環境変数をチェック
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    const rpcUrl = process.env.RPC_URL || "https://sepolia.base.org"; // Base Sepolia
    const relayerApiUrl = process.env.NEXT_PUBLIC_RELAYER_API_URL;
    
    if (!adminPrivateKey) {
      console.error('ADMIN_PRIVATE_KEY not configured');
      return NextResponse.json(
        { error: '運営秘密鍵が設定されていません。ADMIN_PRIVATE_KEYを設定してください。' },
        { status: 500 }
      );
    }

    if (!relayerApiUrl) {
      console.error('NEXT_PUBLIC_RELAYER_API_URL not configured');
      return NextResponse.json(
        { error: 'リレイヤーAPIのURLが設定されていません。' },
        { status: 500 }
      );
    }

    // プロバイダーとウォレット設定
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
    const adminAddress = adminWallet.address;

    console.log(`Admin address: ${adminAddress}`);

    // USDCコントラクト接続
    const usdcContract = new ethers.Contract(tokenAddress, ERC20_ABI, adminWallet);
    
    // USDCの精度（通常6桁）を考慮して量を調整
    const usdcDecimals = 6; // USDCは6桁
    const amountWei = ethers.parseUnits(amount.toString(), usdcDecimals);

    // 管理者のUSDC残高確認
    const adminBalance = await usdcContract.balanceOf(adminAddress);
    console.log(`Admin USDC balance: ${ethers.formatUnits(adminBalance, usdcDecimals)} USDC`);

    if (adminBalance < amountWei) {
      return NextResponse.json(
        { error: `運営のUSDC残高が不足しています。必要: ${amount} USDC, 現在: ${ethers.formatUnits(adminBalance, usdcDecimals)} USDC` },
        { status: 400 }
      );
    }

    // リレイヤーのregisterUnclaimedFund APIを呼び出し
    // 30日後の有効期限を設定
    const expiryTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30日後

    const relayerResponse = await fetch(`${relayerApiUrl}/registerUnclaimedFund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender_address: adminAddress,
        amount: parseFloat(amount),
        token_address: tokenAddress,
        recipient_email: recipientEmail,
        expiry_time: expiryTime,
      }),
    });

    if (!relayerResponse.ok) {
      const errorText = await relayerResponse.text();
      console.error('Relayer API error:', errorText);
      return NextResponse.json(
        { error: `リレイヤーでのUnclaimedFund登録に失敗しました: ${errorText}` },
        { status: 500 }
      );
    }

    const relayerResult = await relayerResponse.json();
    console.log('Relayer response:', relayerResult);

    // 成功レスポンス
    return NextResponse.json({
      success: true,
      message: `フaucet要求が完了しました。${recipientEmail} にクレーム通知メールが送信されます。`,
      transactionHash: relayerResult.tx_hash,
      fundId: relayerResult.fund_id,
      amount: amount,
      tokenAddress: tokenAddress,
      expiryTime: expiryTime
    });

  } catch (error) {
    console.error('Faucet API error:', error);
    return NextResponse.json(
      { 
        error: 'フaucet処理中にエラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}