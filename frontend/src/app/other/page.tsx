"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAccount, isAccountCreated } from "@/lib/relayer";
import Link from "next/link";

export default function OtherPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>("");

  async function onCheck() {
    setStatus("確認中...");
    try {
      const ok = await isAccountCreated(email);
      setStatus(ok ? "このメールはウォレット作成済みです" : "未作成です（作成メールを送れます）");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setStatus(`確認エラー: ${message}`);
    }
  }

  async function onInvite() {
    setStatus("作成メール送信中...");
    try {
      // mailto リンクを生成（アカウント作成用）
      const mailtoLink = `mailto:zkemailpay@gmail.com?subject=${encodeURIComponent('confirm')}&body=${encodeURIComponent(`アカウント作成をお願いします。

アカウント情報:
- メールアドレス: ${email}
- 作成日時: ${new Date().toLocaleString('ja-JP')}

確認済み`)}`;

      // send-email APIを使用してカスタムメールを送信
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: 'ZK Email Pay - アカウント作成のご案内',
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #eab308;">ZK Email アカウント作成</h2>
            
            <p>${email} 様</p>
            
            <p>ZK Email Payへようこそ！アカウント作成を開始いたします。</p>
            
            <div style="background: #fffef5; border: 1px solid #eab308; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #eab308;">アカウント情報</h3>
              <ul>
                <li><strong>メールアドレス:</strong> ${email}</li>
                <li><strong>作成日時:</strong> ${new Date().toLocaleString('ja-JP')}</li>
                <li><strong>ステータス:</strong> 作成準備中</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${mailtoLink}" 
                 style="display: inline-block; background: #eab308; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                🎯 アカウント作成を完了する
              </a>
            </div>
            
            <p style="text-align: center; margin: 20px 0;">
              <strong>または、このメールに直接返信してください</strong>
            </p>
            
            <div style="background: #f3f4f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">返信時の件名（重要）:</p>
              <code style="background: white; padding: 10px; border-radius: 4px; display: block; margin-top: 5px; font-size: 14px;">
                confirm
              </code>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">
                ⚠️ 件名を変更するとアカウント作成が実行されません
              </p>
            </div>
            
            <div style="background: #e8f4fd; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #1d4ed8;">📧 zk-emailの仕組み</h4>
              <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px;">
                <li>このメールに返信することで、DKIM署名が生成されます</li>
                <li>zk-email技術により、あなたのメールアドレスを秘匿したままアカウントが作成されます</li>
                <li>ブロックチェーン上で安全かつプライベートに処理されます</li>
              </ul>
            </div>
            
            <div style="background: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #065f46;">✨ ZK Email Payの特徴</h4>
              <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px;">
                <li>メールアドレスだけで暗号通貨を受け取り</li>
                <li>ウォレットアプリ不要の簡単操作</li>
                <li>ガス代不要（リレイヤーが代行）</li>
                <li>ゼロナレッジ技術で最高レベルの安全性</li>
              </ul>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              ZK Email システム<br>
              zkemailpay@gmail.com<br>
              <a href="https://zk-email-pay.vercel.app/other" style="color: #eab308;">その他機能ページへ</a>
            </p>
          </div>
        `
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setStatus("招待メールが送信されました。そのまま返信してください。");
      } else {
        setStatus(`作成エラー: ${result.error || result.details || '不明なエラー'}`);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setStatus(`作成エラー: ${message}`);
    }
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Hero */}
      <section className="text-white" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>
        <div className="container-narrow px-4 py-8 sm:py-12">
          <div className="flex items-center gap-8 mb-4">
            <button
              onClick={() => router.push('/send')}
              className="hover:text-white transition-colors duration-200 text-lg font-medium opacity-60 hover:opacity-100"
              style={{ color: 'rgba(255, 255, 255, 0.8)' }}
            >
              送金
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">その他</h1>
          </div>
          <p className="text-lg max-w-md" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>アカウント確認・招待メールの送信</p>
        </div>
      </section>

      {/* Form card */}
      <section className="container-narrow px-4 -mt-6 relative z-10">
        <div className="card shadow-xl" role="region" aria-label="other-actions">
          <div className="card-section space-y-3">
            <label className="block">
              <span className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>メールアドレス</span>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="メールアドレス"
              />
            </label>
          </div>
          <div className="divider"></div>
          <div className="card-section">
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="btn btn-ghost flex-1" onClick={onCheck}>
                🔍 アカウント確認
              </button>
              <button className="btn btn-primary flex-1" onClick={onInvite}>
                🎯 招待メールを受け取る
              </button>
            </div>
          </div>
          {status && (
            <>
              <div className="divider"></div>
              <div className="card-section">
                <div className={`p-4 rounded-lg border text-sm font-medium`}
                  style={status.includes('エラー') ? {
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    color: '#dc2626'
                  } : status.includes('送信されました') || status.includes('作成済みです') ? {
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
                      {status.includes('エラー') ? '❌' : status.includes('送信されました') || status.includes('作成済みです') ? '✅' : '⏳'}
                    </span>
                    <span>{status}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
      
      {/* Link to home */}
      <section className="container-narrow px-4 mt-6">
        <div className="text-center">
          <Link 
            href="/address"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
            style={{
              background: 'var(--card-bg)',
              border: '2px solid var(--border-soft)',
              color: 'var(--foreground)',
              textDecoration: 'none'
            }}
          >
            アドレスをお持ちの方はこちらへ
          </Link>
        </div>
      </section>
    </main>
  );
}
