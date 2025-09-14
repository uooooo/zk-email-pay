"use client";

import { useCallback, useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getWalletAddress } from "@/lib/relayer";
import { ethers } from "ethers";
import { saveEmail, saveWalletAddress, getSavedWalletAddress } from "@/lib/localStorage";

// ERC20 ABI (minimal)
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

function BalanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [walletAddress, setWalletAddress] = useState("");
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // List of tokens to check on Base Sepolia
  const tokenAddresses = useMemo(() => [
    { symbol: "USDC", address: "0x3CA50b9B421646D0B485852A14168Aa8494D2877", name: "USD Coin" },
    { symbol: "JPYC", address: "0x36e3495B2AeC55647bEF00968507366f1f7572C6", name: "JPYC" },
  ], []);

  const checkBalances = useCallback(async (address: string) => {
    const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    const newBalances: TokenBalance[] = [];

    try {
      // ERC20 token balance check
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
            balance: "0",
            decimals: 0,
            address: token.address
          });
        }
      }

      setBalances(newBalances);
    } catch (error) {
      console.error("Balance check failed:", error);
      setError("Failed to get balance");
    }
  }, [tokenAddresses]);

  // Get wallet address and check balance
  const handleGetWalletAddress = useCallback(async (emailParam: string, accountCodeParam: string) => {
    setLoading(true);
    setError("");

    try {
      const address = await getWalletAddress(emailParam, accountCodeParam);
      setWalletAddress(address);
      
      // Save email address and wallet address on successful fetch
      saveEmail(emailParam);
      saveWalletAddress(address);
      
      // Start asset check
      await checkBalances(address);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setError(`Failed to get wallet information: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [checkBalances]);

  // Get email and accountCode from URL parameters and auto-execute wallet check
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const accountCodeParam = searchParams.get('accountCode');

    // If there's a saved wallet address, check balance directly
    const savedAddress = getSavedWalletAddress();
    if (savedAddress) {
      setWalletAddress(savedAddress);
      setLoading(false); // Release loading state
      checkBalances(savedAddress);
      return;
    }

    // If both parameters are set, automatically execute balance check
    if (emailParam && accountCodeParam) {
      handleGetWalletAddress(emailParam, accountCodeParam);
    } else {
      // Redirect to email sending page if no parameters
      router.push('/balance/get');
    }
  }, [searchParams, router, handleGetWalletAddress, checkBalances]);

  if (loading) {
    return (
      <main className="min-h-screen" style={{ background: 'var(--background)' }}>
        <section className="text-white" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>
          <div className="container-narrow px-4 py-8 sm:py-12">
            <div className="flex items-center gap-8 mb-4">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">💰 Wallet</h1>
            </div>
          </div>
        </section>
        <section className="container-narrow px-4 -mt-6 relative z-10">
          <div className="card shadow-xl">
            <div className="card-section">
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}>
                  </div>
                  <p style={{ color: 'var(--foreground)' }}>
                    Loading wallet information...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen" style={{ background: 'var(--background)' }}>
        <section className="text-white" style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' }}>
          <div className="container-narrow px-4 py-8 sm:py-12">
            <div className="flex items-center gap-8 mb-4">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">❌ Error</h1>
            </div>
          </div>
        </section>
        <section className="container-narrow px-4 -mt-6 relative z-10">
          <div className="card shadow-xl">
            <div className="card-section">
              <div className="p-4 rounded-lg border text-sm font-medium"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  color: '#dc2626'
                }}>
                {error}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => router.push('/balance/get')}
                  className="btn btn-primary"
                >
                  Send Balance Check Email
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Hero */}
      <section className="text-white" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>
        <div className="container-narrow px-4 py-8 sm:py-12">
          <div className="flex items-center gap-8 mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">💰 Wallet</h1>
          </div>
        </div>
      </section>

      {/* Wallet Display */}
      <section className="container-narrow px-4 -mt-6 relative z-10">
        <div className="card shadow-xl" role="region" aria-label="wallet-display">
          {/* Wallet Address */}
          <div className="card-section">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                Wallet Address
              </h3>
              <button
                onClick={() => window.open(`https://sepolia.basescan.org/address/${walletAddress}`, '_blank')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:scale-105"
                style={{ 
                  background: 'var(--primary)', 
                  color: '#fff',
                  border: 'none'
                }}
                title="View on BaseSepolia Scan"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
                Explorer
              </button>
            </div>
            <div className="p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
              style={{ background: 'var(--accent-light)', border: '1px solid var(--border-soft)' }}
              onClick={() => navigator.clipboard.writeText(walletAddress)}
              title="Click to copy"
            >
              <code className="text-sm font-mono break-all" style={{ color: 'var(--foreground)' }}>
                {walletAddress}
              </code>
            </div>
          </div>

          <div className="divider"></div>

          {/* Token Balances */}
          <div className="card-section">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Token Balance
            </h3>
            <div className="space-y-3">
              {balances.map((token, index) => (
                <div key={index} className="flex items-stretch gap-3">
                  {/* Token row card */}
                  <div
                    className="flex-1 flex items-center justify-between p-4 rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
                    style={{ background: 'var(--accent-light)', border: '1px solid var(--border-soft)' }}
                    onClick={() => {
                      window.open(`https://sepolia.basescan.org/token/${token.address}`, '_blank');
                    }}
                    title={`View ${token.name} details`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: 'var(--primary)', color: '#fff' }}>
                        {token.symbol === 'USDC' ? '💰' : token.symbol === 'JPYC' ? '¥' : '🪙'}
                      </div>
                      <div>
                        <div className="font-semibold text-base">{token.symbol}</div>
                        <div className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
                          {token.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        {parseFloat(token.balance) > 0 ? parseFloat(token.balance).toFixed(6) : '0.000000'}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
                        {token.symbol}
                      </div>
                    </div>
                  </div>

                  {/* Side send button (only for non-zero) */}
                  {parseFloat(token.balance) > 0 && (
                    <button
                      type="button"
                      onClick={() => router.push(`/send?token=${encodeURIComponent(token.symbol)}`)}
                      aria-label={`Send ${token.symbol}`}
                      className="px-6 inline-flex items-center justify-center rounded-lg border transition-opacity hover:opacity-80"
                      style={{ background: 'var(--accent-light)', color: 'var(--foreground)', borderColor: 'var(--border-soft)' }}
                      title={`Send ${token.symbol}`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M22 2L11 13" />
                        <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* navigation links are centralized in the hamburger menu */}
    </main>
  );
}

export default function BalancePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen" style={{ background: 'var(--background)' }}>
        <section className="text-white" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
          <div className="container-narrow px-4 py-8 sm:py-12">
            <div className="flex items-center gap-8 mb-4">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">💰 Wallet Balance</h1>
            </div>
            <p className="text-lg max-w-md" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Loading...
            </p>
          </div>
        </section>
        <section className="container-narrow px-4 -mt-6 relative z-10">
          <div className="card shadow-xl">
            <div className="card-section">
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}>
                  </div>
                  <p style={{ color: 'var(--foreground)' }}>
                    Loading page...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    }>
      <BalanceContent />
    </Suspense>
  );
}
