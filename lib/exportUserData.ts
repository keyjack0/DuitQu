/**
 * Mengambil seluruh data DuitQu milik pengguna melalui RLS Supabase dan
 * mengunduhnya sebagai JSON portabel tanpa mengirim data ke layanan lain.
 */
import { getSupabaseClient } from "@/lib/supabase";
import type { User } from "@/types";

const EXPORT_PAGE_SIZE = 500;

async function fetchAllUserRows(table: string, select: string, userId: string, orderColumn?: string) {
  const rows: unknown[] = [];
  for (let offset = 0; ; offset += EXPORT_PAGE_SIZE) {
    let query = getSupabaseClient().from(table).select(select).eq("user_id", userId);
    if (orderColumn) query = query.order(orderColumn, { ascending: true });
    const { data, error } = await query.range(offset, offset + EXPORT_PAGE_SIZE - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < EXPORT_PAGE_SIZE) return rows;
  }
}

export async function exportUserData(user: User) {
  const [wallets, transactions, budgets, goals, chats] = await Promise.all([
    fetchAllUserRows("wallets", "*", user.id, "created_at"),
    fetchAllUserRows("transactions", "*", user.id, "date"),
    fetchAllUserRows("budgets", "*", user.id, "created_at"),
    fetchAllUserRows("financial_goals", "*", user.id, "created_at"),
    fetchAllUserRows("ai_chats", "id, role, content, parsed_transaction, created_at", user.id, "created_at"),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    app: "DuitQu",
    profile: user,
    wallets,
    transactions,
    budgets,
    financial_goals: goals,
    ai_chats: chats,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `duitqu-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
