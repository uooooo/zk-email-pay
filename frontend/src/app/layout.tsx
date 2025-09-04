import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "zk-email-pay",
  description: "Send to email, claim, and withdraw via ZK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="border-b">
          <nav className="mx-auto max-w-5xl px-4 py-3 flex gap-4 text-sm">
            <Link href="/" className="font-semibold">zk-email-pay</Link>
            <Link href="/send">送金</Link>
            <Link href="/claim">クレーム</Link>
            <Link href="/withdraw">引き出し</Link>
            <Link href="/account">アカウント</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
