/** Mengagregasi transaksi menjadi metrik dan rincian laporan keuangan bulanan. */
import type { Transaction } from "@/types";
import { toLocalDateString } from "./utils";

export function getExpenseCategories(transactions: Transaction[]) {
  const amounts = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type === "OUT") amounts.set(tx.category, (amounts.get(tx.category) ?? 0) + tx.amount);
  }
  const total = [...amounts.values()].reduce((sum, value) => sum + value, 0);
  return [...amounts].map(([name, value]) => ({ name, value, percentage: total > 0 ? Math.round(value / total * 100) : 0 }))
    .sort((a, b) => b.value - a.value);
}

export function buildMonthlyReport(transactions: Transaction[], date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = toLocalDateString(new Date(year, month, 1));
  const end = toLocalDateString(new Date(year, month + 1, 1));
  const previousStart = toLocalDateString(new Date(year, month - 1, 1));
  const current = transactions.filter((tx) => tx.date.slice(0, 10) >= start && tx.date.slice(0, 10) < end);
  const previous = transactions.filter((tx) => tx.date.slice(0, 10) >= previousStart && tx.date.slice(0, 10) < start);
  const sum = (rows: Transaction[], type: "IN" | "OUT") => rows.filter((tx) => tx.type === type).reduce((total, tx) => total + tx.amount, 0);
  const income = sum(current, "IN");
  const expense = sum(current, "OUT");
  const previousIncome = sum(previous, "IN");
  const previousExpense = sum(previous, "OUT");
  const days = new Date(year, month + 1, 0).getDate();
  const weeks = Array.from({ length: Math.ceil(days / 7) }, (_, index) => {
    const first = index * 7 + 1;
    const last = Math.min(first + 6, days);
    const rows = current.filter((tx) => { const day = Number(tx.date.slice(8, 10)); return day >= first && day <= last; });
    return { label: `Minggu ${index + 1}`, range: `${first}-${last}`, income: sum(rows, "IN"), expense: sum(rows, "OUT") };
  });
  return {
    year, month, label: date.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
    transactions: current, income, expense, net: income - expense, previousIncome, previousExpense,
    previousNet: previousIncome - previousExpense,
    savingsRate: income > 0 ? Math.round((income - expense) / income * 100) : null,
    previousSavingsRate: previousIncome > 0 ? Math.round((previousIncome - previousExpense) / previousIncome * 100) : null,
    weeks, categories: getExpenseCategories(current),
  };
}

export type MonthlyReport = ReturnType<typeof buildMonthlyReport>;
