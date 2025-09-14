export default function Loading() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Hero */}
      <section className="text-white" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
        <div className="container-narrow px-4 py-8 sm:py-12">
          <div className="flex items-center gap-8 mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">💰 ウォレット残高</h1>
          </div>
          <p className="text-lg max-w-md" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            読み込み中...
          </p>
        </div>
      </section>

      {/* Loading Indicator */}
      <section className="container-narrow px-4 -mt-6 relative z-10">
        <div className="card shadow-xl" role="region" aria-label="loading">
          <div className="card-section">
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}>
                </div>
                <p style={{ color: 'var(--foreground)' }}>
                  ページを読み込んでいます...
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}