import { Budget, Transaction, Wallet } from "@/types";

export type HealthFactorKey = "savings" | "expenseRatio" | "budget" | "emergency";

export interface HealthFactor {
  key: HealthFactorKey;
  label: string;
  weight: number;
  score: number | null;
  detail: string;
  tip: string;
}

export interface HealthLevel {
  label: string;
  color: string;
  desc: string;
}

export interface HealthScoreResult {
  score: number | null;
  level: HealthLevel | null;
  factors: HealthFactor[];
}

const WEIGHTS = {
  savings: 30,
  expenseRatio: 20,
  budget: 25,
  emergency: 25,
} as const;

export function getHealthLevel(score: number): HealthLevel {
  if (score >= 80)
    return { label: "Sangat Sehat", color: "#22c55e", desc: "Keuanganmu dalam kondisi prima. Pertahankan!" };
  if (score >= 60)
    return { label: "Cukup Sehat", color: "#84cc16", desc: "Lumayan! Masih ada ruang untuk memperbaiki beberapa kebiasaan." };
  if (score >= 40)
    return { label: "Hati-hati", color: "#f59e0b", desc: "Beberapa indikator keuanganmu mulai mengkhawatirkan." };
  return { label: "Perlu Perbaikan", color: "#ef4444", desc: "Keuanganmu butuh perhatian serius bulan ini." };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatPct(value: number, digits = 0): string {
  return value.toFixed(digits).replace(".", ",");
}

export function calculateHealthScore(
  transactions: Transaction[],
  wallets: Wallet[],
  budgets: Budget[]
): HealthScoreResult {
  const income = transactions.filter((t) => t.type === "IN").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === "OUT").reduce((s, t) => s + t.amount, 0);
  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);

  const factors: HealthFactor[] = [];
  let earned = 0;
  let availableWeight = 0;

  // 1. Savings rate — porsi penghasilan yang tersimpan (ideal ≥ 20%)
  if (income > 0) {
    const rate = clamp((income - expense) / income, -1, 1);
    const score = rate <= 0 ? 0 : Math.min(rate / 0.2, 1) * WEIGHTS.savings;
    const ratio = score / WEIGHTS.savings;
    factors.push({
      key: "savings",
      label: "Savings Rate",
      weight: WEIGHTS.savings,
      score,
      detail: `${formatPct(rate * 100)}% dari pemasukan tersimpan`,
      tip:
        ratio >= 0.8
          ? "Kebiasaan menabungmu sehat, pertahankan."
          : ratio >= 0.5
            ? "Coba tingkatkan tabunganmu mendekati 20% penghasilan."
            : "Sisihkan minimal 20% penghasilan di awal bulan.",
    });
    earned += score;
    availableWeight += WEIGHTS.savings;
  } else {
    factors.push({
      key: "savings",
      label: "Savings Rate",
      weight: WEIGHTS.savings,
      score: null,
      detail: "Belum ada pemasukan bulan ini",
      tip: "Catat pemasukan agar faktor ini bisa dinilai.",
    });
  }

  // 2. Rasio pengeluaran — porsi penghasilan yang habis (aman ≤ 70%)
  if (income > 0) {
    const ratio = expense / income;
    const score = clamp((1 - (ratio - 0.7) / 0.3), 0, 1) * WEIGHTS.expenseRatio;
    const levelRatio = score / WEIGHTS.expenseRatio;
    factors.push({
      key: "expenseRatio",
      label: "Rasio Pengeluaran",
      weight: WEIGHTS.expenseRatio,
      score,
      detail: `${formatPct(ratio * 100)}% dari pemasukan terpakai`,
      tip:
        levelRatio >= 0.8
          ? "Pengeluaranmu terkendali dibanding pemasukan."
          : levelRatio >= 0.5
            ? "Pengeluaran masih besar relatif terhadap pemasukan."
            : "Targetkan belanja maksimal 70% dari pemasukan.",
    });
    earned += score;
    availableWeight += WEIGHTS.expenseRatio;
  } else {
    factors.push({
      key: "expenseRatio",
      label: "Rasio Pengeluaran",
      weight: WEIGHTS.expenseRatio,
      score: null,
      detail: "Belum ada pemasukan bulan ini",
      tip: "Catat pemasukan agar faktor ini bisa dinilai.",
    });
  }

  // 3. Kepatuhan budget — rata-rata utilitas vs limit semua budget
  const activeBudgets = budgets.filter((b) => b.amount_limit > 0);
  if (activeBudgets.length > 0) {
    let totalLimit = 0;
    let totalSpent = 0;
    let adherenceSum = 0;
    for (const b of activeBudgets) {
      const spent = transactions
        .filter((t) => t.type === "OUT" && t.category === b.category)
        .reduce((s, t) => s + t.amount, 0);
      totalLimit += b.amount_limit;
      totalSpent += spent;
      adherenceSum +=
        spent <= b.amount_limit
          ? 1
          : Math.max(0, 1 - (spent - b.amount_limit) / b.amount_limit);
    }
    const adherence = adherenceSum / activeBudgets.length;
    const score = adherence * WEIGHTS.budget;
    const levelRatio = score / WEIGHTS.budget;
    factors.push({
      key: "budget",
      label: "Kepatuhan Budget",
      weight: WEIGHTS.budget,
      score,
      detail: `Terpakai ${formatPct((totalSpent / totalLimit) * 100)}% dari ${activeBudgets.length} budget`,
      tip:
        levelRatio >= 0.8
          ? "Semua budget masih dalam batas. Kerja bagus!"
          : levelRatio >= 0.5
            ? "Beberapa budget hampir menyentuh limit."
            : "Ada budget yang terlampaui, evaluasi kategorinya.",
    });
    earned += score;
    availableWeight += WEIGHTS.budget;
  } else {
    factors.push({
      key: "budget",
      label: "Kepatuhan Budget",
      weight: WEIGHTS.budget,
      score: null,
      detail: "Belum ada budget aktif",
      tip: "Atur budget agar skor lebih akurat.",
    });
  }

  // 4. Dana darurat — saldo menutup berapa bulan pengeluaran (ideal ≥ 6 bulan)
  if (expense > 0) {
    const months = totalBalance / expense;
    const score = clamp(months / 6, 0, 1) * WEIGHTS.emergency;
    const levelRatio = score / WEIGHTS.emergency;
    factors.push({
      key: "emergency",
      label: "Dana Darurat",
      weight: WEIGHTS.emergency,
      score,
      detail: `${formatPct(months, 1)} bulan cadangan`,
      tip:
        levelRatio >= 0.8
          ? "Dana daruratmu ideal, setara 6 bulan pengeluaran."
          : levelRatio >= 0.5
            ? "Tingkatkan tabunganmu menuju 6 bulan pengeluaran."
            : "Bangun dana darurat minimal 6 bulan pengeluaran.",
    });
    earned += score;
    availableWeight += WEIGHTS.emergency;
  } else {
    factors.push({
      key: "emergency",
      label: "Dana Darurat",
      weight: WEIGHTS.emergency,
      score: null,
      detail: "Belum ada pengeluaran bulan ini",
      tip: "Catat pengeluaran agar faktor ini bisa dinilai.",
    });
  }

  if (availableWeight === 0) {
    return { score: null, level: null, factors };
  }

  const score = Math.round((earned / availableWeight) * 100);
  return { score, level: getHealthLevel(score), factors };
}
