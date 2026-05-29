export type TransactionType = "IN" | "OUT" | "TRANSFER";

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  icon: string | null;
  color: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  wallet?: Wallet;
  to_wallet_id: string | null;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount_limit: number;
  period: "MONTH" | "YEAR";
  spent?: number;
}

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ParsedTransaction {
  nominal: number;
  kategori: string;
  deskripsi: string;
  wallet: string;
  tipe: "pemasukan" | "pengeluaran";
  tanggal?: string;
}

export const CATEGORIES = [
  "Makanan & Minuman",
  "Transportasi",
  "Hiburan",
  "Investasi",
  "Belanja",
  "Kesehatan",
  "Pendidikan",
  "Tagihan & Utilitas",
  "Tabungan",
  "Gaji & Penghasilan",
  "Hadiah",
  "Lainnya",
];

export const WALLET_ICONS: Record<string, string> = {
  cash: "Wallet",
  bank: "Landmark",
  ewallet: "Smartphone",
  card: "CreditCard",
  savings: "PiggyBank",
  investment: "TrendingUp",
};
