"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  ArrowLeftRight,
  Wallet,
  Target,
  Bot,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: House, label: "Beranda" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transaksi" },
  { href: "/wallets", icon: Wallet, label: "Dompet" },
  { href: "/budgets", icon: Target, label: "Budget" },
  { href: "/ai-assistant", icon: Bot, label: "AI" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(10,10,10,0.95)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid #2a2a2a",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "8px 8px 20px",
        zIndex: 100,
      }}
    >
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              padding: "8px 16px",
              color: isActive ? "#22c55e" : "#666666",
              borderRadius: "10px",
              transition: "all 0.2s ease",
              textDecoration: "none",
              fontSize: "11px",
              fontWeight: isActive ? 600 : 400,
              background: isActive ? "rgba(34, 197, 94, 0.08)" : "transparent",
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
