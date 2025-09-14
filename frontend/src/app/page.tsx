"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createAccount, isAccountCreated } from "@/lib/relayer";
import { saveEmail, getSavedEmail } from "@/lib/localStorage";

export default function WelcomePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>("");
  const [checking, setChecking] = useState(false);
  const [created, setCreated] = useState<undefined | boolean>(undefined);

  // Load saved email on component mount
  useEffect(() => {
    const savedEmail = getSavedEmail();
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  // Account creation check (using relayer API) - same logic as send page
  useEffect(() => {
    if (!email) {
      setCreated(undefined);
      return;
    }
    
    setChecking(true);
    import('@/lib/relayer').then(({ isAccountCreated }) => {
      isAccountCreated(email)
        .then((exists) => {
          setCreated(exists);
          setChecking(false);
          setStatus("");
        })
        .catch((error) => {
          console.warn('Account check failed:', error);
          // Treat as created in case of error (fallback)
          setCreated(true);
          setChecking(false);
          setStatus("");
        });
    });
  }, [email]);


  async function onInvite() {
    if (created === true) {
      // Account already exists, save email and redirect to send page
      saveEmail(email);
      router.push('/send');
      return;
    }
    
    // Account doesn't exist, create it
    setStatus("Sending creation email...");
    try {
      const requestId = await createAccount(email);
      setStatus(`✅ Account creation request sent. Invitation email will be sent to ${email}. Request ID: ${requestId}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setStatus(`Creation error: ${message}`);
    }
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Hero */}
      <section className="text-white" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>
        <div className="container-narrow px-4 py-8 sm:py-12">
          <div className="flex items-center gap-8 mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Welcome</h1>
          </div>
          <p className="text-lg max-w-md" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Enter your email address and we&apos;ll send you an invitation to get started with EmailWallet</p>
        </div>
      </section>

      {/* Form card */}
      <section className="container-narrow px-4 -mt-6 relative z-10">
        <div className="card shadow-xl" role="region" aria-label="welcome-form">
          <div className="card-section space-y-3">
            <label className="block">
              <span className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Email Address</span>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
              />
            </label>
            {checking && <div className="text-sm flex items-center gap-2" style={{ color: 'var(--primary)' }}>
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div>
              Checking...
            </div>}
            {!checking && created === true && <div className="text-sm font-medium" style={{ color: '#059669' }}>✓ Already created</div>}
            {!checking && created === false && <div className="text-sm font-medium" style={{ color: '#d97706' }}>! Not created (can send creation email)</div>}
          </div>
          <div className="divider"></div>
          <div className="card-section">
            <div className="flex flex-col gap-3">
              <button className="btn btn-primary w-full py-4 text-base font-semibold" onClick={onInvite}>
                {created === true ? '🚀 Go to Send Page' : '🎯 Send Me an Invitation'}
              </button>
            </div>
          </div>
          {status && (
            <>
              <div className="divider"></div>
              <div className="card-section">
                <div className={`p-4 rounded-lg border text-sm font-medium`}
                  style={status.includes('error') || status.includes('Error') ? {
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    color: '#dc2626'
                  } : status.includes('sent') || status.includes('created') ? {
                    background: 'rgba(34, 197, 94, 0.1)',
                    borderColor: 'rgba(34, 197, 94, 0.3)',
                    color: '#059669'
                  } : {
                    background: 'var(--accent-light)',
                    borderColor: 'var(--primary)',
                    color: 'var(--foreground)'
                  }}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">
                      {status.includes('error') || status.includes('Error') ? '❌' : status.includes('sent') || status.includes('created') ? '✅' : '⏳'}
                    </span>
                    <span>{status}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
      
      {/* navigation links are centralized in the hamburger menu */}
    </main>
  );
}
