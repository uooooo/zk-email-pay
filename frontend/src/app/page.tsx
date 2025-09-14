"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Hero */}
      <section className="text-white" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>
        <div className="container-narrow px-4 py-12 sm:py-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
              Email Wallet
            </h1>
            <p className="text-xl max-w-2xl mx-auto mb-8" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              メールで送金、返信で確定。Web3の新しい体験をシンプルに。
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="container-narrow px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Faucet Card */}
          <Link 
            href="/faucet"
            className="card hover:scale-105 transition-all duration-200 block"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="card-section text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                USDC Faucet
              </h3>
              <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                テスト用USDCを無料で受け取れます
              </p>
            </div>
          </Link>

          {/* Send Card */}
          <Link 
            href="/send"
            className="card hover:scale-105 transition-all duration-200 block"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="card-section text-center">
              <div className="text-4xl mb-4">💸</div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                メール送金
              </h3>
              <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                メールアドレスで暗号通貨を送金
              </p>
            </div>
          </Link>

          {/* Wallet Check Card */}
          <Link 
            href="/wallet"
            className="card hover:scale-105 transition-all duration-200 block"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="card-section text-center">
              <div className="text-4xl mb-4">💼</div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                資産確認
              </h3>
              <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                EmailWalletの残高を確認
              </p>
            </div>
          </Link>

          {/* Address Send Card */}
          <Link 
            href="/address"
            className="card hover:scale-105 transition-all duration-200 block"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="card-section text-center">
              <div className="text-4xl mb-4">🏦</div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                アドレス送金
              </h3>
              <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                ウォレットアドレスで暗号通貨を送金
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container-narrow px-4 mt-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            特徴
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--primary)', color: '#fff' }}>
              📧
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                メールで送金
              </h3>
              <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                複雑なウォレットアドレスは不要。メールアドレスだけで暗号通貨を送受信できます。
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--primary)', color: '#fff' }}>
              🔒
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                ゼロ知識証明
              </h3>
              <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                ZK技術により、プライバシーを保護しながら安全な取引を実現します。
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--primary)', color: '#fff' }}>
              ⚡
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                簡単操作
              </h3>
              <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                メールを送るだけ。複雑な設定や専門知識は必要ありません。
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--primary)', color: '#fff' }}>
              🌐
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                Base Sepolia対応
              </h3>
              <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                高速・低コストのBase Sepoliaネットワークを使用しています。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="container-narrow px-4 mt-20 pb-12">
        <div className="text-center">
          <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
            Email Wallet - Web3の新しい送金体験
          </p>
        </div>
      </section>
    </main>
  );
}
