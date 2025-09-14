import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

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
      <body className={`antialiased`}>
        <main className="mx-auto max-w-3xl relative">
          <Navbar />
          {children}
        </main>
      </body>
    </html>
  );
}
