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
    <nav className="bottom-nav">
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            title={label}
            className={`bottom-nav-item ${isActive ? "bottom-nav-item--active" : ""}`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
