import {
  ArrowLeftRight,
  BarChart3,
  Bot,
  Calendar,
  CircleUserRound,
  House,
  PieChart,
  Target,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavigationItem {
  href: string;
  icon: LucideIcon;
  label: string;
  mobile: boolean;
}

interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

export const navigationGroups: NavigationGroup[] = [
  {
    label: "Ringkasan",
    items: [
      { href: "/dashboard", icon: House, label: "Dashboard", mobile: true },
      { href: "/transactions", icon: ArrowLeftRight, label: "Transaksi", mobile: true },
      { href: "/wallets", icon: Wallet, label: "Dompet", mobile: true },
    ],
  },
  {
    label: "Perencanaan",
    items: [
      { href: "/budgets", icon: PieChart, label: "Budget", mobile: false },
      { href: "/goals", icon: Target, label: "Goals", mobile: false },
      { href: "/calendar", icon: Calendar, label: "Kalender", mobile: false },
      { href: "/report", icon: BarChart3, label: "Laporan", mobile: false },
    ],
  },
  {
    label: "Lainnya",
    items: [
      { href: "/ai-assistant", icon: Bot, label: "AI DuitQu", mobile: true },
      { href: "/settings", icon: CircleUserRound, label: "Pengaturan", mobile: true },
    ],
  },
];

export const mobileNavigationItems = navigationGroups
  .flatMap((group) => group.items)
  .filter((item) => item.mobile);

export function isNavigationItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
