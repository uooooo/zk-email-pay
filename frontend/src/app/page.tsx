"use client";

import { useState, useEffect, useCallback } from "react";
import { createAccount, isAccountCreated } from "@/lib/relayer";
import { saveEmail, getSavedEmail } from "@/lib/localStorage";

export default function OtherPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>("");

  // Load saved email on component mount
  useEffect(() => {
    const savedEmail = getSavedEmail();
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);


  async function onCheck() {
    setStatus("Checking...");
    try {
      const ok = await isAccountCreated(email);
      setStatus(ok ? "This email has a wallet already created" : "Not created (can send creation email)");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setStatus(`Check error: ${message}`);
    }
  }

  async function onInvite() {
    setStatus("Sending creation email...");
    try {
      // Call actual relayer's createAccount
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
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Other</h1>
          </div>
          <p className="text-lg max-w-md" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Account verification & invitation email sending</p>
        </div>
      </section>

      {/* Form card */}
      <section className="container-narrow px-4 -mt-6 relative z-10">
        <div className="card shadow-xl" role="region" aria-label="other-actions">
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
          </div>
          <div className="divider"></div>
          <div className="card-section">
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="btn btn-ghost flex-1" onClick={onCheck}>
                🔍 Check Account
              </button>
              <button className="btn btn-primary flex-1" onClick={onInvite}>
                🎯 Receive Invitation Email
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
