import {
  Wallet, Landmark, Smartphone, CreditCard, PiggyBank, TrendingUp,
  UtensilsCrossed, Car, Gamepad2, ShoppingBag, Pill, BookOpen,
  Zap, Briefcase, Gift, MoreHorizontal, Target, Inbox,
  ArrowUpCircle, ArrowDownCircle, Hand,
  type LucideIcon,
} from "lucide-react";

export const WALLET_ICON_MAP: Record<string, LucideIcon> = {
  cash: Wallet,
  bank: Landmark,
  ewallet: Smartphone,
  card: CreditCard,
  savings: PiggyBank,
  investment: TrendingUp,
};

export const WALLET_COLORS: Record<string, string> = {
  cash: "#EF4444",
  bank: "#3B82F6",
  ewallet: "#14B8A6",
  card: "#8B5CF6",
  savings: "#F59E0B",
  investment: "#10B981",
};

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  "Makanan & Minuman": UtensilsCrossed,
  "Transportasi": Car,
  "Hiburan": Gamepad2,
  "Investasi": TrendingUp,
  "Belanja": ShoppingBag,
  "Kesehatan": Pill,
  "Pendidikan": BookOpen,
  "Tagihan & Utilitas": Zap,
  "Tabungan": Landmark,
  "Gaji & Penghasilan": Briefcase,
  "Hadiah": Gift,
  "Lainnya": MoreHorizontal,
};

export interface IconPickerOption {
  key: string;
  label: string;
  icon: LucideIcon;
}

export const WALLET_ICON_OPTIONS: IconPickerOption[] = [
  { key: "cash", label: "Tunai", icon: Wallet },
  { key: "bank", label: "Bank", icon: Landmark },
  { key: "ewallet", label: "E-Wallet", icon: Smartphone },
  { key: "card", label: "Kartu", icon: CreditCard },
  { key: "savings", label: "Tabungan", icon: PiggyBank },
  { key: "investment", label: "Investasi", icon: TrendingUp },
];



export function WalletIcon({ icon, size = 20, color, strokeWidth = 2.5 }: { 
  icon: string | null; size?: number; color?: string; strokeWidth?: number 
}) {
  const Icon = WALLET_ICON_MAP[icon ?? ""] ?? Wallet;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}

export function CategoryIcon({ category, size = 20, color, strokeWidth = 3 }: { category: string; size?: number; color?: string; strokeWidth?: number }) {
  const Icon = CATEGORY_ICON_MAP[category] ?? MoreHorizontal;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}
