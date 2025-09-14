"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon?: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "ホーム", icon: "🏠" },
  { href: "/send", label: "送金", icon: "💸" },
  { href: "/faucet", label: "USDC Faucet", icon: "💰" },
  { href: "/balance/get", label: "残高メール", icon: "📧" },
  { href: "/balance", label: "残高ビュー", icon: "💼" },
  { href: "/other", label: "その他", icon: "🧰" },
];

const NAV_DAPPS: NavItem[] = [
  { href: "/address", label: "アドレス送金", icon: "🏦" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // No body scroll lock needed for inline dropdown

  const current = useMemo(() => pathname || "/", [pathname]);

  return (
    <>
      <header className="absolute top-0 right-0 z-50">
        <div className="p-4">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="メニュー"
            aria-controls="global-drawer"
            aria-expanded={open}
            className="btn btn-ghost px-3 py-2 relative z-50"
          >
            <span className="sr-only">メニュー</span>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ color: "var(--foreground)" }}
            >
              {open ? (
                <path d="M18.3 5.71L12 12.01 5.7 5.7 4.29 7.11 10.59 13.4 4.29 19.7 5.7 21.11 12 14.82 18.29 21.11 19.7 19.7 13.41 13.41 19.7 7.12z" />
              ) : (
                <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
              )}
            </svg>
          </button>
        </div>
      </header>

      <nav
        id="global-drawer"
        role="navigation"
        className={`absolute inset-0 z-40 transition-all duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setOpen(false)}
        />
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            open ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
          style={{ background: "var(--card-bg)" }}
        >
          <div className="max-w-md w-full mx-4">
            <div className="text-center mb-8">
              <h2
                className="text-2xl font-bold mb-2"
                style={{ color: "var(--foreground)" }}
              >
                ナビゲーション
              </h2>
              <div
                className="w-16 h-1 mx-auto rounded-full mb-4"
                style={{ background: "var(--primary)" }}
              ></div>
              <ul className="space-y-2">
                {NAV_ITEMS.map((item) => {
                  const active =
                    current === item.href ||
                    (item.href !== "/" && current.startsWith(item.href));
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-4 px-6 py-4 rounded-lg transition-all duration-200 hover:scale-105 ${
                          active ? "pill-active" : "pill"
                        }`}
                        style={
                          active ? {} : { borderColor: "var(--border-soft)" }
                        }
                      >
                        <span className="text-2xl w-8 text-center" aria-hidden>
                          {item.icon ?? "•"}
                        </span>
                        <span className="font-medium text-lg">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="text-center mb-8">
              <h2
                className="text-2xl font-bold mb-2"
                style={{ color: "var(--foreground)" }}
              >
                Dapps(wallet接続)
              </h2>
              <div
                className="w-16 h-1 mx-auto rounded-full mb-4"
                style={{ background: "var(--primary)" }}
              ></div>

            <ul className="space-y-2">
              {NAV_DAPPS.map((item) => {
                const active =
                  current === item.href ||
                  (item.href !== "/" && current.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-4 px-6 py-4 rounded-lg transition-all duration-200 hover:scale-105 ${
                        active ? "pill-active" : "pill"
                      }`}
                      style={
                        active ? {} : { borderColor: "var(--border-soft)" }
                      }
                    >
                      <span className="text-2xl w-8 text-center" aria-hidden>
                        {item.icon ?? "•"}
                      </span>
                      <span className="font-medium text-lg">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            </div>
            <div
              className="text-center mt-8 pt-6 border-t"
              style={{ borderColor: "var(--border-soft)" }}
            >
              <div
                className="text-sm opacity-60"
                style={{ color: "var(--foreground)" }}
              >
                © {new Date().getFullYear()} zk-email-pay
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
