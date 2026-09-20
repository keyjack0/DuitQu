/** Menyusun ringkasan, saran tindakan, dan normalisasi transaksi untuk asisten AI. */
import { buildMonthlyReport } from "@/lib/financeReport";
import type { AssistantAction, Budget, FinancialGoal, ParsedTransaction, Transaction, Wallet } from "@/types";
import { CATEGORIES } from "@/types";

export interface AssistantBudgetSnapshot {
  category: string;
  spent: number;
  limit: number;
  percentage: number;
  status: "safe" | "warning" | "danger";
}

export interface AssistantGoalSnapshot {
  id: string;
  name: string;
  current: number;
  target: number;
  percentage: number;
}

export interface AssistantSnapshot {
  totalBalance: number;
  income: number;
  expense: number;
  net: number;
  savingsRate: number | null;
  expenseChange: number | null;
  budget: AssistantBudgetSnapshot | null;
  goal: AssistantGoalSnapshot | null;
  hasTransactions: boolean;
}

interface SnapshotInput {
  wallets: Wallet[];
  monthTransactions: Transaction[];
  lastMonthTransactions: Transaction[];
  budgets: Budget[];
  goals: FinancialGoal[];
  now?: Date;
}

export function buildAssistantSnapshot({
  wallets,
  monthTransactions,
  lastMonthTransactions,
  budgets,
  goals,
  now = new Date(),
}: SnapshotInput): AssistantSnapshot {
  const transactionsById = new Map<string, Transaction>();
  for (const transaction of [...monthTransactions, ...lastMonthTransactions]) {
    transactionsById.set(transaction.id, transaction);
  }
  const report = buildMonthlyReport([...transactionsById.values()], now);
  const monthlyBudgets = budgets.filter((budget) => budget.period === "MONTH");
  const budgetSnapshots = monthlyBudgets.map((budget) => {
    const spent = report.transactions
      .filter((transaction) => transaction.type === "OUT" && transaction.category === budget.category)
      .reduce((total, transaction) => total + transaction.amount, 0);
    const rawPercentage = budget.amount_limit > 0 ? spent / budget.amount_limit * 100 : 0;
    return {
      category: budget.category,
      spent,
      limit: budget.amount_limit,
      percentage: Math.min(Math.round(rawPercentage), 100),
      status: rawPercentage >= 90 ? "danger" as const : rawPercentage >= 70 ? "warning" as const : "safe" as const,
    };
  });
  const budget = budgetSnapshots.sort((a, b) => b.percentage - a.percentage)[0] ?? null;
  const goal = [...goals]
    .filter((item) => item.target_amount > 0 && item.current_amount < item.target_amount)
    .sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    })[0];
  const expenseChange = report.previousExpense > 0
    ? Math.round((report.expense - report.previousExpense) / report.previousExpense * 100)
    : null;

  return {
    totalBalance: wallets.reduce((total, wallet) => total + wallet.balance, 0),
    income: report.income,
    expense: report.expense,
    net: report.net,
    savingsRate: report.savingsRate,
    expenseChange,
    budget,
    goal: goal ? {
      id: goal.id,
      name: goal.name,
      current: goal.current_amount,
      target: goal.target_amount,
      percentage: Math.min(Math.round(goal.current_amount / goal.target_amount * 100), 100),
    } : null,
    hasTransactions: report.transactions.length > 0,
  };
}

export function buildAssistantActions(snapshot: AssistantSnapshot, walletCount: number): AssistantAction[] {
  if (walletCount === 0) {
    return [
      { kind: "link", label: "Buat dompet", href: "/wallets" },
      { kind: "prompt", label: "Pelajari DuitQu AI", prompt: "Apa saja yang bisa kamu bantu untuk mengatur keuanganku?" },
    ];
  }
  if (!snapshot.hasTransactions) {
    return [
      { kind: "prompt", label: "Catat pengeluaran", prompt: "Bantu aku mencatat pengeluaran hari ini" },
      { kind: "prompt", label: "Catat pemasukan", prompt: "Bantu aku mencatat pemasukan hari ini" },
      { kind: "prompt", label: "Mulai buat budget", prompt: "Bantu aku menentukan budget bulanan yang sederhana" },
    ];
  }

  const actions: AssistantAction[] = [];
  if (snapshot.budget?.status === "danger") {
    actions.push({
      kind: "prompt",
      label: `Cek ${snapshot.budget.category}`,
      prompt: `Kenapa budget ${snapshot.budget.category} hampir atau sudah habis?`,
    });
  } else if (snapshot.net < 0) {
    actions.push({ kind: "prompt", label: "Analisis pengeluaran", prompt: "Analisis pengeluaranku bulan ini dan berikan tiga langkah penghematan" });
  } else if (snapshot.goal) {
    actions.push({ kind: "prompt", label: "Cek target tabungan", prompt: `Bantu evaluasi progres target ${snapshot.goal.name}` });
  }
  actions.push(
    { kind: "prompt", label: "Ringkasan bulan ini", prompt: "Buat ringkasan kondisi keuanganku bulan ini" },
    { kind: "prompt", label: "Catat transaksi", prompt: "Bantu aku mencatat transaksi baru" },
  );
  return actions.slice(0, 3);
}

export function normalizeParsedTransaction(value: unknown): ParsedTransaction | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const nominal = parseIndonesianAmount(row.nominal);
  if (!Number.isFinite(nominal) || nominal <= 0) return null;
  if (row.tipe !== "pemasukan" && row.tipe !== "pengeluaran") return null;
  const category = typeof row.kategori === "string" && CATEGORIES.includes(row.kategori)
    ? row.kategori
    : "Lainnya";
  const rawDate = typeof row.tanggal === "string" ? row.tanggal : undefined;
  const validDate = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) && !Number.isNaN(Date.parse(`${rawDate}T00:00:00`))
    ? rawDate
    : undefined;
  return {
    nominal,
    kategori: category,
    deskripsi: typeof row.deskripsi === "string" && row.deskripsi.trim() ? row.deskripsi.trim() : category,
    wallet: typeof row.wallet === "string" ? row.wallet : "",
    walletId: typeof row.walletId === "string" ? row.walletId : undefined,
    tipe: row.tipe,
    tanggal: validDate,
    status: row.status === "saved" ? "saved" : "draft",
    transactionId: typeof row.transactionId === "string" ? row.transactionId : undefined,
  };
}

export function parseIndonesianAmount(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return Number.NaN;

  let amount = value.toLowerCase().trim().replace(/^rp\s*/, "").replace(/\s+/g, "");
  const suffix = amount.match(/(ribu|rb|k|juta|jt)$/)?.[1];
  const multiplier = suffix === "ribu" || suffix === "rb" || suffix === "k"
    ? 1_000
    : suffix === "juta" || suffix === "jt"
      ? 1_000_000
      : 1;

  if (suffix) amount = amount.slice(0, -suffix.length);

  if (multiplier > 1) {
    if (amount.includes(",") && amount.includes(".")) {
      const decimalSeparator = amount.lastIndexOf(",") > amount.lastIndexOf(".") ? "," : ".";
      const groupingSeparator = decimalSeparator === "," ? "." : ",";
      amount = amount.replaceAll(groupingSeparator, "").replace(decimalSeparator, ".");
    } else {
      amount = amount.replace(",", ".");
    }
  } else if (/^\d{1,3}(?:[.,]\d{3})+$/.test(amount)) {
    amount = amount.replace(/[.,]/g, "");
  } else {
    amount = amount.replace(",", ".");
  }

  return Number(amount) * multiplier;
}
