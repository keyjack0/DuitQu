/** Mengagregasi pengeluaran harian menjadi data grafik 30 hari. */
import { toLocalDateString } from "@/lib/utils";
import type { Transaction } from "@/types";

export function buildExpenseChartData(transactions: Transaction[], today = new Date()) {
  const dailyExpenses = new Map<string, number>();
  const seen = new Set<string>();
  for (const transaction of transactions) {
    if (seen.has(transaction.id)) continue;
    seen.add(transaction.id);
    if (transaction.type !== "OUT") continue;
    const date = transaction.date.slice(0, 10);
    dailyExpenses.set(date, (dailyExpenses.get(date) ?? 0) + transaction.amount);
  }

  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (29 - index));
    const key = toLocalDateString(date);
    return {
      date: key,
      day: date.toLocaleDateString("id-ID", { weekday: "short" }),
      amount: dailyExpenses.get(key) ?? 0,
    };
  });
}
