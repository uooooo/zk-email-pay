import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// ERC20 ABI (最小限)
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

export async function POST(request: NextRequest) {
  try {
    const { senderAddress, amount, tokenAddress, recipientEmail, expiryTime } = await request.json();

    // バリデーション
    if (!senderAddress || !amount || !tokenAddress || !recipientEmail || !expiryTime) {
      return NextResponse.json(
        { error: 'Missing required fields: senderAddress, amount, tokenAddress, recipientEmail, expiryTime' },
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
    const relayerApiUrl = process.env.NEXT_PUBLIC_RELAYER_API_URL;
    const rpcUrl = process.env.RPC_URL || "https://sepolia.base.org";
    
    if (!relayerApiUrl) {
      console.error('NEXT_PUBLIC_RELAYER_API_URL not configured');
      return NextResponse.json(
        { error: 'リレイヤーAPIのURLが設定されていません。' },
        { status: 500 }
      );
    }

    // Ethereum addressの検証
    if (!ethers.isAddress(senderAddress)) {
      return NextResponse.json(
        { error: 'Invalid sender address format' },
        { status: 400 }
      );
    }

    // プロバイダー設定（読み取り専用）
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // トークンの詳細情報を取得
    let tokenDecimals = 18;
    let tokenSymbol = "ETH";
    
    if (tokenAddress !== 'native') {
      try {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        tokenDecimals = await tokenContract.decimals();
        tokenSymbol = await tokenContract.symbol();
      } catch (error) {
        console.error('Token contract error:', error);
        return NextResponse.json(
          { error: 'Invalid token contract address' },
          { status: 400 }
        );
      }
    }

    // 送金者の残高確認（参考情報）
    try {
      let balance = BigInt(0);
      if (tokenAddress === 'native') {
        balance = await provider.getBalance(senderAddress);
      } else {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        balance = await tokenContract.balanceOf(senderAddress);
      }
      
      const amountWei = ethers.parseUnits(amount.toString(), tokenDecimals);
      if (balance < amountWei) {
        return NextResponse.json(
          { error: `Insufficient balance. Required: ${amount} ${tokenSymbol}, Available: ${ethers.formatUnits(balance, tokenDecimals)} ${tokenSymbol}` },
          { status: 400 }
        );
      }
    } catch (error) {
      console.warn('Balance check failed:', error);
      // バランスチェックに失敗しても処理は続行
    }

    // リレイヤーのregisterUnclaimedFund APIを呼び出し
    const relayerResponse = await fetch(`${relayerApiUrl}/registerUnclaimedFund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender_address: senderAddress,
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
    console.log('Relayer registerUnclaimedFund response:', relayerResult);

    // 成功レスポンス
    return NextResponse.json({
      success: true,
      message: `UnclaimedFund登録が完了しました。${recipientEmail} にクレーム通知メールが送信されます。`,
      transactionHash: relayerResult.tx_hash,
      fundId: relayerResult.fund_id,
      senderAddress: senderAddress,
      recipientEmail: recipientEmail,
      amount: amount,
      tokenAddress: tokenAddress,
      tokenSymbol: tokenSymbol,
      tokenDecimals: tokenDecimals,
      expiryTime: expiryTime
    });

  } catch (error) {
    console.error('RegisterUnclaimedFund API error:', error);
    return NextResponse.json(
      { 
        error: 'UnclaimedFund登録処理中にエラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}