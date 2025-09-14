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
  { href: "/address", label: "アドレス送金", icon: "🏦" },
  { href: "/faucet", label: "USDC Faucet", icon: "💰" },
  { href: "/balance/get", label: "残高メール", icon: "📧" },
  { href: "/balance", label: "残高ビュー", icon: "💼" },
  { href: "/other", label: "その他", icon: "🧰" },
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
    <header className="absolute mb-3 w-full">
      <div className="flex justify-end p-2">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="メニュー"
          aria-controls="global-drawer"
          aria-expanded={open}
          className="btn btn-ghost px-3 py-2"
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
      <nav
        id="global-drawer"
        role="navigation"
        className="relative w-full h-full"
        aria-hidden={!open}
      >
        <div
          className={`absolute right-0 left-0 mt-2 rounded-xl border shadow-xl overflow-hidden transition-all duration-150 ${
            open
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
          style={{ background: "var(--card-bg)" }}
        >
          <ul className="p-2">
            {NAV_ITEMS.map((item) => {
              const active =
                current === item.href ||
                (item.href !== "/" && current.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${
                      active ? "pill-active" : "pill"
                    }`}
                    style={active ? {} : { borderColor: "var(--border-soft)" }}
                  >
                    <span className="text-lg w-6 text-center" aria-hidden>
                      {item.icon ?? "•"}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div
            className="p-3 border-t text-xs opacity-60"
            style={{ color: "var(--foreground)" }}
          >
            © {new Date().getFullYear()} zk-email-pay
          </div>
        </div>
      </nav>
    </header>
  );
}
