import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// ERC20 ABI (最小限)
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];;

export async function POST(request: NextRequest) {
  console.log('=== RegisterUnclaimedFund API Called ===');
  
  try {
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { senderAddress, amount, tokenAddress, recipientEmail, expiryTime } = body;

    // バリデーション
    if (!senderAddress || !amount || tokenAddress === undefined || !recipientEmail || !expiryTime) {
      console.error('Missing required fields:', { senderAddress, amount, tokenAddress, recipientEmail, expiryTime });
      return NextResponse.json(
        { error: 'Missing required fields: senderAddress, amount, tokenAddress, recipientEmail, expiryTime' },
        { status: 400 }
      );
    }

    // メールアドレスの簡易バリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      console.error('Invalid email address:', recipientEmail);
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // 環境変数をチェック
    const relayerApiUrl = process.env.NEXT_PUBLIC_RELAYER_API_URL;
    const rpcUrl = process.env.RPC_URL || "https://sepolia.base.org";
    const coreContractAddress = process.env.NEXT_PUBLIC_CORE_CONTRACT_ADDRESS;
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    
    console.log('Environment variables:', { relayerApiUrl, rpcUrl, coreContractAddress });
    
    if (!relayerApiUrl) {
      console.error('NEXT_PUBLIC_RELAYER_API_URL not configured');
      return NextResponse.json(
        { error: 'リレイヤーAPIのURLが設定されていません。' },
        { status: 500 }
      );
    }

    if (!coreContractAddress || !adminPrivateKey) {
      console.error('Contract address or admin private key not configured');
      return NextResponse.json(
        { error: 'コントラクトアドレスまたは秘密鍵が設定されていません。' },
        { status: 500 }
      );
    }

    // Ethereum addressの検証
    if (!ethers.isAddress(senderAddress)) {
      console.error('Invalid sender address format:', senderAddress);
      return NextResponse.json(
        { error: 'Invalid sender address format' },
        { status: 400 }
      );
    }

    console.log('Starting provider initialization...');
    
    // プロバイダー設定とウォレット作成
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(adminPrivateKey, provider);

    // 現在のガス価格を取得して適切に設定
    const feeData = await provider.getFeeData();
    console.log('Current network fee data:', {
      gasPrice: feeData.gasPrice?.toString(),
      maxFeePerGas: feeData.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString()
    });

    // ガス価格を50%増加させて確実に通るようにする
    const gasPrice = feeData.gasPrice ? (feeData.gasPrice * BigInt(150)) / BigInt(100) : ethers.parseUnits('25', 'gwei');
    const maxFeePerGas = feeData.maxFeePerGas ? (feeData.maxFeePerGas * BigInt(150)) / BigInt(100) : ethers.parseUnits('35', 'gwei');
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? (feeData.maxPriorityFeePerGas * BigInt(150)) / BigInt(100) : ethers.parseUnits('3', 'gwei');

    console.log('Adjusted gas settings:', {
      gasPrice: gasPrice.toString(),
      maxFeePerGas: maxFeePerGas.toString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toString()
    });

    // トークンの詳細情報を取得
    let tokenDecimals = 18;
    let tokenSymbol = "ETH";
    
    if (tokenAddress !== 'native') {
      console.log('Getting token info for:', tokenAddress);
      try {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        console.log('Token contract created successfully');
        
        const decimalsResult = await tokenContract.decimals();
        tokenDecimals = Number(decimalsResult);
        console.log('Token decimals:', tokenDecimals);
        
        tokenSymbol = await tokenContract.symbol();
        console.log('Token symbol:', tokenSymbol);
        
      } catch (error) {
        console.error('Token contract error:', error);
        return NextResponse.json(
          { error: 'Invalid token contract address or network error' },
          { status: 400 }
        );
      }
    }

    // 送金者の残高確認（参考情報）
    try {
      console.log('Checking balance...');
      let balance = BigInt(0);
      if (tokenAddress === 'native') {
        balance = await provider.getBalance(senderAddress);
      } else {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        balance = await tokenContract.balanceOf(senderAddress);
      }
      
      const amountWei = ethers.parseUnits(amount.toString(), tokenDecimals);
      console.log('Balance check:', {
        balance: balance.toString(),
        required: amountWei.toString(),
        sufficient: balance >= amountWei
      });
      
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

    // リレイヤーからaccount codeを生成
    console.log('Generating account code from relayer...');
    let accountCode: string;
    try {
      const accountCodeResponse = await fetch(`${relayerApiUrl}/api/genAccountCode`, {
        method: 'GET',
      });

      if (!accountCodeResponse.ok) {
        console.error('Failed to generate account code:', accountCodeResponse.status);
        return NextResponse.json(
          { error: 'リレイヤーからaccount codeの生成に失敗しました' },
          { status: 500 }
        );
      }

      accountCode = await accountCodeResponse.text();
      console.log('Generated account code:', accountCode);
    } catch (accountCodeError) {
      console.error('Error generating account code:', accountCodeError);
      return NextResponse.json(
        { error: 'Account codeの生成に失敗しました' },
        { status: 500 }
      );
    }

    // メールアドレスのコミットメント生成
    console.log('Generating email address commitment...');
    let emailAddrCommit: string;
    try {
      const commitResponse = await fetch(`${relayerApiUrl}/api/emailAddrCommit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: recipientEmail,
          random: accountCode
        }),
      });

      if (!commitResponse.ok) {
        console.error('Failed to generate email address commitment');
        return NextResponse.json(
          { error: 'メールアドレスコミットメントの生成に失敗しました' },
          { status: 500 }
        );
      }

      emailAddrCommit = await commitResponse.text();
      console.log('Generated email address commitment:', emailAddrCommit);
    } catch (commitError) {
      console.error('Error generating email address commitment:', commitError);
      return NextResponse.json(
        { error: 'メールアドレスコミットメントの生成に失敗しました' },
        { status: 500 }
      );
    }

    // コアコントラクトからUnclaimsHandlerアドレスを取得
    console.log('Getting UnclaimsHandler address from core contract...');
    const coreContractABI = [
      "function unclaimsHandler() view returns (address)"
    ];
    
    let unclaimsHandlerAddress: string;
    try {
      const coreContract = new ethers.Contract(coreContractAddress, coreContractABI, provider);
      unclaimsHandlerAddress = await coreContract.unclaimsHandler();
      console.log('UnclaimsHandler address:', unclaimsHandlerAddress);
    } catch (error) {
      console.error('Failed to get UnclaimsHandler address:', error);
      return NextResponse.json(
        { error: 'UnclaimsHandlerアドレスの取得に失敗しました' },
        { status: 500 }
      );
    }

    // 実際のスマートコントラクト呼び出し
    console.log('Calling registerUnclaimedFund on blockchain...');
    const unclaimsHandlerABI = [
      "function registerUnclaimedFund(bytes32 emailAddrCommit, address tokenAddr, uint256 amount, uint256 expiryTime, uint256 announceCommitRandomness, string calldata announceEmailAddr) public payable returns (uint256)",
      "function unclaimedFundClaimGas() view returns (uint256)",
      "function maxFeePerGas() view returns (uint256)"
    ];

    try {
      const unclaimsHandler = new ethers.Contract(unclaimsHandlerAddress, unclaimsHandlerABI, wallet);
      
      // 必要な手数料を取得
      const unclaimedFundClaimGas = await unclaimsHandler.unclaimedFundClaimGas();
      const maxFeePerGasContract = await unclaimsHandler.maxFeePerGas();
      const registrationFee = unclaimedFundClaimGas * maxFeePerGasContract;
      
      console.log('Registration fee:', ethers.formatEther(registrationFee), 'ETH');

      // トークンの事前承認（非ネイティブトークンの場合）
      if (tokenAddress !== 'native') {
        console.log('Approving token transfer...');
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
        
        // ランダムなナンス追加でトランザクションを区別
        const nonce = await wallet.getNonce();
        console.log('Using nonce for approval:', nonce);
        
        const approveTx = await tokenContract.approve(unclaimsHandlerAddress, ethers.parseUnits(amount.toString(), tokenDecimals), {
          nonce: nonce,
          gasLimit: 100000,
          maxFeePerGas: maxFeePerGas,
          maxPriorityFeePerGas: maxPriorityFeePerGas
        });
        
        await approveTx.wait();
        console.log('Token approval completed:', approveTx.hash);
        
        // 少し待機してナンスが確実に更新されるようにする
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // registerUnclaimedFund呼び出し
      const nonce = await wallet.getNonce();
      console.log('Using nonce for registerUnclaimedFund:', nonce);
      
      const tx = await unclaimsHandler.registerUnclaimedFund(
        emailAddrCommit,
        tokenAddress,
        ethers.parseUnits(amount.toString(), tokenDecimals),
        expiryTime,
        0, // announceCommitRandomness
        "", // announceEmailAddr
        { 
          value: registrationFee,
          gasLimit: 500000,
          nonce: nonce,
          maxFeePerGas: maxFeePerGas,
          maxPriorityFeePerGas: maxPriorityFeePerGas
        }
      );

      console.log('Transaction submitted:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);

      // リレイヤーにunclaim通知
      console.log('Calling relayer API...');
      const unclaimPayload = {
        email_address: recipientEmail,
        random: accountCode,
        expiry_time: expiryTime,
        is_fund: true,
        tx_hash: receipt.hash
      };
      
      console.log('Unclaim payload:', JSON.stringify(unclaimPayload, null, 2));
      
      try {
        const relayerResponse = await fetch(`${relayerApiUrl}/api/unclaim`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(unclaimPayload),
        });

        console.log('Relayer response status:', relayerResponse.status);
        
        if (relayerResponse.ok) {
          const relayerResult = await relayerResponse.text();
          console.log('Relayer unclaim response:', relayerResult);
        } else {
          console.warn('Relayer API failed but transaction succeeded');
        }
      } catch (relayerError) {
        console.warn('Relayer communication failed but transaction succeeded:', relayerError);
      }

      // 成功レスポンス
      return NextResponse.json({
        success: true,
        message: `UnclaimedFund登録が完了しました。${recipientEmail} にクレーム通知メールが送信されます。`,
        transactionHash: receipt.hash,
        fundId: receipt.logs?.[0]?.topics?.[1] || receipt.hash, // ログから実際のfund IDを取得
        senderAddress: senderAddress,
        recipientEmail: recipientEmail,
        amount: amount,
        tokenAddress: tokenAddress,
        tokenSymbol: tokenSymbol,
        tokenDecimals: tokenDecimals,
        expiryTime: expiryTime,
        accountCode: accountCode,
        registrationFee: ethers.formatEther(registrationFee),
        unclaimsHandlerAddress: unclaimsHandlerAddress
      });

    } catch (contractError) {
      console.error('Contract call failed:', contractError);
      return NextResponse.json(
        { 
          error: 'スマートコントラクトの呼び出しに失敗しました',
          details: contractError instanceof Error ? contractError.message : 'Contract error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('RegisterUnclaimedFund API error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      { 
        error: 'UnclaimedFund登録処理中にエラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}