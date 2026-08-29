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
  { href: "/dashboard", icon: House, label: "" },
  { href: "/transactions", icon: ArrowLeftRight },
  { href: "/wallets", icon: Wallet },
  { href: "/budgets", icon: Target },
  { href: "/ai-assistant", icon: Bot },
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
