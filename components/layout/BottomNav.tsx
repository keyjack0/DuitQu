"use client";

/** Menyediakan navigasi utama bawah dengan penanda rute aktif. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  ArrowLeftRight,
  Wallet,
  CircleUserRound,
  Bot,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: House, label: "Beranda" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transaksi" },
  { href: "/wallets", icon: Wallet, label: "Dompet" },
  { href: "/ai-assistant", icon: Bot, label: "AI DuitQu" },
  { href: "/settings", icon: CircleUserRound, label: "Profil" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Navigasi utama">
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            title={label}
            aria-current={isActive ? "page" : undefined}
            className={`bottom-nav-item ${isActive ? "bottom-nav-item--active" : ""}`}
          >
            <Icon size={24} strokeWidth={isActive ? 2 : 1.5}  />
            <span className="bottom-nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
