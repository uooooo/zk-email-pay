"use client";

import { useCallback, useState, useEffect } from "react";
import { getSavedEmail } from "@/lib/localStorage";

export default function FaucetPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  
  const USDC_AMOUNT = "10"; // USDC amount distributed by operators (fixed)
  const USDC_ADDRESS = "0x3CA50b9B421646D0B485852A14168Aa8494D2877"; // Base Sepolia USDC

  // Load saved email on component mount
  useEffect(() => {
    const savedEmail = getSavedEmail();
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };


  const onClaimFaucet = useCallback(async () => {
    if (!email || !isValidEmail(email)) {
      setStatus("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setStatus("Processing...");

    try {
      // Request USDC transfer from operators to EmailWallet user
      const response = await fetch("/api/faucet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientEmail: email,
          amount: USDC_AMOUNT,
          tokenAddress: USDC_ADDRESS,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus(`✅ Claim notification email sent to ${email}. Please reply to the email to claim your tokens.`);
      } else {
        setStatus(`❌ Error: ${result.error || "An unknown error occurred"}`);
      }
    } catch (error) {
      console.error("Faucet claim error:", error);
      setStatus(`❌ Network error occurred: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Hero */}
      <section className="text-white" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
        <div className="container-narrow px-4 py-8 sm:py-12">
          <div className="flex items-center gap-8 mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">💰 USDC Faucet</h1>
          </div>
          <p className="text-lg max-w-md" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            USDC distribution system for EmailWallet users. Enter your email address to receive test USDC.
          </p>
        </div>
      </section>

      {/* Form card */}
      <section className="container-narrow px-4 -mt-6 relative z-10">
        <div className="card shadow-xl" role="region" aria-label="faucet-form">
          {/* Email row */}
          <div className="card-section space-y-3">
            <label className="block">
              <span className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>
                Email Address
              </span>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                disabled={isLoading}
              />
            </label>
          </div>
          
          <div className="divider"></div>

          {/* Amount Info */}
          <div className="card-section space-y-4">
            <div className="p-4 rounded-lg" style={{ background: 'var(--accent-light)', border: '1px solid var(--border-soft)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--primary)', color: '#fff' }}>
                  💰
                </div>
                <div>
                  <div className="font-bold text-lg">{USDC_AMOUNT} USDC</div>
                  <div className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                    Distribute test USDC
                  </div>
                </div>
              </div>
            </div>
            
            {/* Token Address Display */}
            <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--accent-light)', border: '1px solid var(--border-soft)' }}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                    USDC Contract Address (Base Sepolia)
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                      {`${USDC_ADDRESS.slice(0, 6)}...${USDC_ADDRESS.slice(-4)}`}
                    </code>
                  </div>
                </div>
                <button
                  onClick={() => {
                    window.open(`https://sepolia.basescan.org/token/${USDC_ADDRESS}`, '_blank');
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
          </div>

          {status && (
            <>
              <div className="divider"></div>
              <div className="card-section">
                <div className={`p-4 rounded-lg border text-sm font-medium`}
                  style={status.includes('❌') || status.includes('エラー') ? {
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    color: '#dc2626'
                  } : status.includes('✅') || status.includes('送信') ? {
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
              onClick={onClaimFaucet}
              disabled={isLoading || !email || !isValidEmail(email)}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2" style={{ borderColor: '#fff', borderTopColor: 'transparent' }}></div>
                  Processing...
                </>
              ) : !email || !isValidEmail(email) ? (
                'Please enter a valid email address'
              ) : (
                '💰 Claim USDC'
              )}
            </button>
          </div>
        </div>
      </section>
      
      {/* Info Section */}
      <section className="container-narrow px-4 mt-6">
        <div className="card">
          <div className="card-section">
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
              🔄 How to Use
            </h3>
            <div className="space-y-2 text-sm" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
              <div>1. Enter your email address above</div>
              <div>2. Click the &quot;Claim USDC&quot; button</div>
              <div>3. A claim notification will be sent via email</div>
              <div>4. Reply to the email to claim your USDC</div>
            </div>
          </div>
        </div>
      </section>

      {/* navigation links are centralized in the hamburger menu */}
    </main>
  );
}
