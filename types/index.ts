/** Mendefinisikan model data dan konstanta domain utama DuitQu. */
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
  initial_balance?: number;
  icon: string | null;
  color: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string | null;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  wallet?: Wallet;
  created_at?: string;
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

export interface FinancialGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string;
  color: string;
  created_at: string;
}

export type AITransactionStatus = "draft" | "saved";

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  parsedTransaction?: ParsedTransaction;
  createdAt?: string;
}

export interface ParsedTransaction {
  nominal: number;
  kategori: string;
  deskripsi: string;
  wallet: string;
  walletId?: string;
  tipe: "pemasukan" | "pengeluaran";
  tanggal?: string;
  status?: AITransactionStatus;
  transactionId?: string;
}

export type AssistantAction =
  | { kind: "prompt"; label: string; prompt: string }
  | { kind: "link"; label: string; href: string };

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
