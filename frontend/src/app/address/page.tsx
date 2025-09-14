"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { saveEmail, getSavedEmail, saveWalletAddress, getSavedWalletAddress } from "@/lib/localStorage";

// ERC20 ABI (minimal)
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

export default function AddressWalletPage() {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState("10");
  const tokenOptions = useMemo(() => [
    { symbol: "ETH", address: "native", name: "Ethereum", decimals: 18 },
    { symbol: "USDC", address: "0x3CA50b9B421646D0B485852A14168Aa8494D2877", name: "USDC", decimals: 6 },
    { symbol: "JPYC", address: "0x36e3495B2AeC55647bEF00968507366f1f7572C6", name: "JPYC", decimals: 18 },
  ] as const, []);
  const [token, setToken] = useState<"ETH" | "USDC" | "JPYC">("USDC");
  const [status, setStatus] = useState<string>("");
  
  // Wallet related state
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);

  // Load saved email on component mount
  useEffect(() => {
    const savedEmail = getSavedEmail();
    if (savedEmail) {
      setRecipientEmail(savedEmail);
    }
  }, []);

  const [balance, setBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);

  const selectedToken = useMemo(() => 
    tokenOptions.find(t => t.symbol === token), 
    [token, tokenOptions]
  );

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const canSend = useMemo(() => {
    if (!isConnected || !recipientEmail || !amount) return false;
    if (!isValidEmail(recipientEmail)) return false;
    const n = Number(amount);
    return Number.isFinite(n) && n > 0;
  }, [isConnected, recipientEmail, amount]);

  // Switch to Base Sepolia network
  const switchToBaseSepolia = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x14a34' }], // 84532 in hex
      });
    } catch (switchError: unknown) {
      // Add network if it doesn't exist
      if (switchError && typeof switchError === 'object' && 'code' in switchError && switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x14a34',
                chainName: 'Base Sepolia',
                rpcUrls: ['https://sepolia.base.org'],
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://sepolia.basescan.org/'],
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add Base Sepolia network:', addError);
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  }, []);

  // Wallet connection
  const connectWallet = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setStatus('❌ MetaMask is not installed');
      return;
    }

    try {
      setIsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts.length > 0) {
        const address = accounts[0];
        setWalletAddress(address);
        setIsConnected(true);
        // Save address on successful wallet connection
        saveWalletAddress(address);
        
        // Check if network is Base Sepolia
        const network = await provider.getNetwork();
        if (network.chainId !== BigInt(84532)) {
          setStatus('⚠️ Switching to Base Sepolia...');
          await switchToBaseSepolia();
          setStatus('✅ Connected to Base Sepolia');
        } else {
          setStatus('✅ Wallet connected');
        }
      }
    } catch (error: unknown) {
      console.error('Wallet connection error:', error);
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 4001) {
          setStatus('❌ Wallet connection cancelled by user');
        } else if (error.code === -32002) {
          setStatus('❌ Request already being processed in MetaMask');
        } else {
          setStatus('❌ Wallet connection error occurred');
        }
      } else {
        setStatus('❌ Wallet connection error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }, [switchToBaseSepolia]);

  // Get balance
  const fetchBalance = useCallback(async () => {
    if (!isConnected || !walletAddress || !selectedToken) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      
      if (selectedToken.symbol === 'ETH') {
        const balance = await provider.getBalance(walletAddress);
        setBalance(ethers.formatEther(balance));
      } else {
        const contract = new ethers.Contract(selectedToken.address, ERC20_ABI, provider);
        const balance = await contract.balanceOf(walletAddress);
        setBalance(ethers.formatUnits(balance, selectedToken.decimals));
      }
    } catch (error) {
      console.error('Balance fetch error:', error);
      setBalance('0');
    }
  }, [isConnected, walletAddress, selectedToken]);

  // Get balance when token changes or when connected
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Send processing
  const onSendToEmail = useCallback(async () => {
    if (!canSend || !selectedToken) return;

    setIsLoading(true);
    setStatus('Processing...');

    try {
      // Request transfer to relayer API
      const response = await fetch('/api/registerUnclaimedFund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderAddress: walletAddress,
          amount: parseFloat(amount),
          tokenAddress: selectedToken.symbol === 'ETH' ? 'native' : selectedToken.address,
          recipientEmail: recipientEmail,
          expiryTime: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days later
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus(`✅ Transfer request sent to ${recipientEmail}. Claim notification will be sent via email.`);
        // Re-fetch balance
        setTimeout(() => fetchBalance(), 2000);
      } else {
        setStatus(`❌ Error: ${result.error || 'An unknown error occurred'}`);
      }
    } catch (error) {
      console.error('Send error:', error);
      setStatus(`❌ Error occurred during transfer processing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [canSend, selectedToken, walletAddress, amount, recipientEmail, fetchBalance]);

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Hero */}
      <section className="text-white" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' }}>
        <div className="container-narrow px-4 py-8 sm:py-12">
          <div className="flex items-center gap-8 mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">🏦 AddressWallet Transfer</h1>
          </div>
          <p className="text-lg max-w-md" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Connect your wallet to send ERC20 tokens to EmailWallet users
          </p>
        </div>
      </section>

      {/* Form card */}
      <section className="container-narrow px-4 -mt-6 relative z-10">
        <div className="card shadow-xl" role="region" aria-label="address-wallet-form">
          
          {/* Wallet Connection */}
          <div className="card-section space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Wallet Connection
              </span>
              {isConnected && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                    Connected
                  </span>
                </div>
              )}
            </div>
            
            {!isConnected ? (
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="btn btn-primary w-full py-3 text-base font-semibold"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2" style={{ borderColor: '#fff', borderTopColor: 'transparent' }}></div>
                    Connecting...
                  </>
                ) : (
                  '🦊 Connect MetaMask'
                )}
              </button>
            ) : (
              <div className="p-3 rounded-lg" style={{ background: 'var(--accent-light)', border: '1px solid var(--border-soft)' }}>
                <div className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                  Connected Address
                </div>
                <code className="text-xs font-mono" style={{ color: 'var(--foreground)' }}>
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </code>
              </div>
            )}
          </div>

          {isConnected && (
            <>
              <div className="divider"></div>
              
              {/* Recipient Email */}
              <div className="card-section space-y-3">
                <label className="block">
                  <span className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>
                    Recipient Email Address
                  </span>
                  <input
                    className="input"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="recipient@example.com"
                    aria-label="Recipient email address"
                  />
                </label>
              </div>
              
              {/* Amount + Token row */}
              <div className="card-section space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <label className="flex-1">
                    <span className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Amount</span>
                    <input
                      className="input text-2xl sm:text-3xl font-bold tracking-wide"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="10"
                      inputMode="decimal"
                      aria-label="Amount"
                    />
                  </label>
                  <div className="sm:ml-4">
                    <span className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Token</span>
                    <div className="flex gap-2" aria-label="Token selection">
                      {tokenOptions.map((t) => (
                        <button
                          key={t.symbol}
                          type="button"
                          onClick={() => setToken(t.symbol)}
                          className={`pill transition-all duration-200 hover:scale-105 ${token === t.symbol ? "pill-active" : ""}`}
                          style={token !== t.symbol ? { borderColor: 'var(--border-soft)' } : {}}
                          aria-pressed={token === t.symbol}
                        >
                          {t.symbol}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Balance Display */}
                <div className="p-3 rounded-lg" style={{ background: 'var(--accent-light)', border: '1px solid var(--border-soft)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                        {selectedToken?.name} Balance
                      </div>
                      <div className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                        {parseFloat(balance).toFixed(6)} {selectedToken?.symbol}
                      </div>
                    </div>
                    <button
                      onClick={fetchBalance}
                      className="p-2 rounded-full transition-colors hover:scale-110"
                      style={{ 
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-soft)',
                        color: 'var(--primary)'
                      }}
                      title="Refresh balance"
                    >
                      🔄
                    </button>
                  </div>
                </div>
                
                {/* Token Address Display */}
                {token !== "ETH" && (
                  <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--accent-light)', border: '1px solid var(--border-soft)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-xs font-medium mb-1" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                          {selectedToken?.name} Contract Address
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                            {`${selectedToken?.address.slice(0, 6)}...${selectedToken?.address.slice(-4)}`}
                          </code>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (selectedToken?.address) {
                            window.open(`https://sepolia.basescan.org/token/${selectedToken.address}`, '_blank');
                          }
                        }}
                        className="ml-3 p-2 rounded-full transition-colors hover:scale-110"
                        style={{ 
                          background: 'var(--card-bg)',
                          border: '1px solid var(--border-soft)',
                          color: 'var(--primary)'
                        }}
                        title="View on BaseSepolia Scan"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Status */}
              {status && (
                <>
                  <div className="divider"></div>
                  <div className="card-section">
                    <div className={`p-4 rounded-lg border text-sm font-medium`}
                      style={status.includes('❌') || status.includes('Error') || status.includes('エラー') ? {
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                        color: '#dc2626'
                      } : status.includes('✅') || status.includes('sent') || status.includes('送信') ? {
                        background: 'rgba(34, 197, 94, 0.1)',
                        borderColor: 'rgba(34, 197, 94, 0.3)',
                        color: '#059669'
                      } : {
                        background: 'var(--accent-light)',
                        borderColor: 'var(--primary)',
                        color: 'var(--foreground)'
                      }}>
                      <div className="flex items-start gap-2">
                        <span>{status}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              <div className="divider"></div>
              <div className="card-section">
                <button 
                  className="btn btn-primary w-full py-4 text-base font-semibold" 
                  onClick={onSendToEmail} 
                  disabled={!canSend || isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2" style={{ borderColor: '#fff', borderTopColor: 'transparent' }}></div>
                      Processing transfer...
                    </>
                  ) : !canSend ? (
                    'Please complete the form'
                  ) : (
                    `💸 Send ${amount} ${token} to ${recipientEmail}`
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </section>
      
      {/* Info Section */}
      {isConnected && (
        <section className="container-narrow px-4 mt-6">
          <div className="card">
            <div className="card-section">
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                🔄 Transfer Flow
              </h3>
              <div className="space-y-2 text-sm" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
                <div>1. Transfer tokens from wallet to relayer</div>
                <div>2. Relayer registers as UnclaimedFund</div>
                <div>3. Send claim notification email to recipient</div>
                <div>4. Recipient replies to email to claim</div>
                <div>5. Relayer transfers tokens to recipient's EmailWallet</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* navigation links are centralized in the hamburger menu */}
    </main>
  );
}
