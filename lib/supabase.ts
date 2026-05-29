import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}

export type UserRow = {
  id: string;
  email: string;
  name: string;
  created_at: string;
};

export type WalletRow = {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  icon: string | null;
  color: string | null;
  created_at: string;
};

export type TransactionRow = {
  id: string;
  user_id: string;
  wallet_id: string;
  type: "IN" | "OUT" | "TRANSFER";
  amount: number;
  category: string;
  description: string;
  date: string;
  to_wallet_id: string | null;
  created_at: string;
};

export type BudgetRow = {
  id: string;
  user_id: string;
  category: string;
  amount_limit: number;
  period: "MONTH" | "YEAR";
  created_at: string;
};

export type TransactionInsert = {
  id?: string;
  user_id: string;
  wallet_id: string;
  type: "IN" | "OUT" | "TRANSFER";
  amount: number;
  category: string;
  description?: string;
  date?: string;
  to_wallet_id?: string | null;
};

export type WalletInsert = {
  id?: string;
  user_id: string;
  name: string;
  balance?: number;
  icon?: string | null;
  color?: string | null;
};

export type BudgetInsert = {
  id?: string;
  user_id: string;
  category: string;
  amount_limit: number;
  period: "MONTH" | "YEAR";
};
