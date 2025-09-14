"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { getWalletAddress, recoverAccountCode } from "@/lib/relayer";
import { ethers } from "ethers";
import Link from "next/link";

// ERC20 ABI (最小限)
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  address: string;
}

export default function WalletPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [accountCode, setAccountCode] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Base Sepoliaで確認するトークン一覧
  const tokenAddresses = [
    { symbol: "USDC", address: "0x3CA50b9B421646D0B485852A14168Aa8494D2877", name: "USD Coin" },
    { symbol: "JPYC", address: "0x36e3495B2AeC55647bEF00968507366f1f7572C6", name: "JPYC" },
  ];

  const handleGetWalletAddress = useCallback(async () => {
    if (!email || !accountCode) {
      setStatus("メールアドレスとアカウントコードを入力してください");
      return;
    }

    setLoading(true);
    setStatus("ウォレットアドレス取得中...");

    try {
      const address = await getWalletAddress(email, accountCode);
      setWalletAddress(address);
      setStatus(`✅ ウォレットアドレス: ${address}`);
      
      // 資産チェック開始
      await checkBalances(address);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`❌ エラー: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [email, accountCode]);

  const handleRecoverAccountCode = useCallback(async () => {
    if (!email) {
      setStatus("メールアドレスを入力してください");
      return;
    }

    setLoading(true);
    setStatus("アカウントコード復旧メール送信中...");

    try {
      await recoverAccountCode(email);
      setStatus(`✅ ${email} にアカウントコード復旧メールを送信しました`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`❌ エラー: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [email]);

  const checkBalances = async (address: string) => {
    setStatus("資産残高確認中...");
    const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    const newBalances: TokenBalance[] = [];

    try {
      // ETH残高チェック
      const ethBalance = await provider.getBalance(address);
      newBalances.push({
        symbol: "ETH",
        name: "Ethereum",
        balance: ethers.formatEther(ethBalance),
        decimals: 18,
        address: "native"
      });

      // ERC20トークン残高チェック
      for (const token of tokenAddresses) {
        try {
          const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);
          const [balance, decimals, symbol, name] = await Promise.all([
            tokenContract.balanceOf(address),
            tokenContract.decimals(),
            tokenContract.symbol(),
            tokenContract.name()
          ]);

          newBalances.push({
            symbol,
            name,
            balance: ethers.formatUnits(balance, decimals),
            decimals: Number(decimals),
            address: token.address
          });
        } catch (error) {
          console.warn(`Failed to get balance for ${token.symbol}:`, error);
          newBalances.push({
            symbol: token.symbol,
            name: token.name,
            balance: "取得エラー",
            decimals: 0,
            address: token.address
          });
        }
      }

      setBalances(newBalances);
      setStatus("✅ 資産残高の確認が完了しました");
    } catch (error) {
      console.error("Balance check failed:", error);
      setStatus("❌ 資産残高の確認に失敗しました");
    }
  };

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Hero */}
      <section className="text-white" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
        <div className="container-narrow px-4 py-8 sm:py-12">
          <div className="flex items-center gap-8 mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">💰 ウォレット資産確認</h1>
            <button
              onClick={() => router.push('/')}
              className="hover:text-white transition-colors duration-200 text-lg font-medium opacity-60 hover:opacity-100"
              style={{ color: 'rgba(255, 255, 255, 0.8)' }}
            >
              ホーム
            </button>
          </div>
          <p className="text-lg max-w-md" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            EmailWalletの残高と資産状況を確認できます
          </p>
        </div>
      </section>

      {/* Form card */}
      <section className="container-narrow px-4 -mt-6 relative z-10">
        <div className="card shadow-xl" role="region" aria-label="wallet-check">
          {/* Email and Account Code */}
          <div className="card-section space-y-4">
            <div>
              <label className="block">
                <span className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>メールアドレス</span>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </label>
            </div>
            
            <div>
              <label className="block">
                <span className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>アカウントコード</span>
                <input
                  className="input font-mono"
                  type="text"
                  value={accountCode}
                  onChange={(e) => setAccountCode(e.target.value)}
                  placeholder="0x123..."
                  disabled={loading}
                />
                <div className="text-xs mt-1" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
                  アカウント作成時に受信したメールに記載されています
                </div>
              </label>
            </div>
          </div>

          <div className="divider"></div>

          {/* Action Buttons */}
          <div className="card-section">
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                className="btn btn-primary flex-1" 
                onClick={handleGetWalletAddress}
                disabled={loading || !email || !accountCode}
              >
                {loading ? "処理中..." : "💰 残高を確認"}
              </button>
              <button 
                className="btn btn-ghost flex-1" 
                onClick={handleRecoverAccountCode}
                disabled={loading || !email}
              >
                🔑 アカウントコード復旧
              </button>
            </div>
          </div>

          {/* Status */}
          {status && (
            <>
              <div className="divider"></div>
              <div className="card-section">
                <div className={`p-4 rounded-lg border text-sm font-medium`}
                  style={status.includes('❌') ? {
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    color: '#dc2626'
                  } : status.includes('✅') ? {
                    background: 'rgba(34, 197, 94, 0.1)',
                    borderColor: 'rgba(34, 197, 94, 0.3)',
                    color: '#059669'
                  } : {
                    background: 'var(--accent-light)',
                    borderColor: 'var(--primary)',
                    color: 'var(--foreground)'
                  }}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0 mt-1">
                      {status.includes('❌') ? '❌' : status.includes('✅') ? '✅' : '⏳'}
                    </span>
                    <div className="whitespace-pre-line">{status}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Wallet Address and Balances */}
          {walletAddress && balances.length > 0 && (
            <>
              <div className="divider"></div>
              <div className="card-section">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                  💼 資産残高
                </h3>
                
                {/* Wallet Address */}
                <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--accent-light)', border: '1px solid var(--border-soft)' }}>
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                    ウォレットアドレス
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono flex-1" style={{ color: 'var(--foreground)' }}>
                      {walletAddress}
                    </code>
                    <button
                      onClick={() => {
                        window.open(`https://sepolia.basescan.org/address/${walletAddress}`, '_blank');
                      }}
                      className="p-2 rounded-full transition-colors hover:scale-110"
                      style={{ 
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-soft)',
                        color: 'var(--primary)'
                      }}
                      title="BaseSepolia Scanで確認"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Token Balances */}
                <div className="space-y-3">
                  {balances.map((token, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg" 
                      style={{ background: 'var(--accent-light)', border: '1px solid var(--border-soft)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                          style={{ background: 'var(--primary)', color: '#fff' }}>
                          {token.symbol === 'ETH' ? '⟠' : token.symbol === 'USDC' ? '💰' : token.symbol === 'JPYC' ? '¥' : '🪙'}
                        </div>
                        <div>
                          <div className="font-semibold">{token.symbol}</div>
                          <div className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
                            {token.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {parseFloat(token.balance) > 0 ? parseFloat(token.balance).toFixed(6) : '0'}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
                          {token.symbol}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
      
      {/* Links */}
      <section className="container-narrow px-4 mt-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/send"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
            style={{
              background: 'var(--card-bg)',
              border: '2px solid var(--border-soft)',
              color: 'var(--foreground)',
              textDecoration: 'none'
            }}
          >
            💸 送金ページ
          </Link>
          <Link 
            href="/address"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
            style={{
              background: 'var(--card-bg)',
              border: '2px solid var(--border-soft)',
              color: 'var(--foreground)',
              textDecoration: 'none'
            }}
          >
            🏦 アドレス送金ページ
          </Link>
        </div>
      </section>
    </main>
  );
}