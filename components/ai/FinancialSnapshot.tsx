/** Menyajikan ringkasan saldo, arus kas, anggaran, dan target untuk asisten. */
import { ArrowDownRight, ArrowUpRight, PiggyBank } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { AssistantSnapshot } from "@/lib/aiAssistant";

export function FinancialSnapshot({ snapshot }: { snapshot: AssistantSnapshot }) {
  const netPositive = snapshot.net >= 0;
  const healthStatus = !snapshot.hasTransactions ? "neutral" : netPositive ? "safe" : "danger";
  const healthLabel = !snapshot.hasTransactions ? "Belum ada data" : netPositive ? "Arus kas positif" : "Perlu perhatian";
  return (
    <section className="ai-snapshot" aria-labelledby="ai-snapshot-title">
      <div className="ai-section-head">
        <div>
          <p className="ai-eyebrow">Bulan ini</p>
          <h2 id="ai-snapshot-title" className="ai-section-title">Kondisi keuangan</h2>
        </div>
        <span className={`ai-health-badge ai-health-badge--${healthStatus}`}>
          {healthLabel}
        </span>
      </div>

      <div className="ai-balance-card">
        <p>Total saldo</p>
        <strong>{formatCurrency(snapshot.totalBalance)}</strong>
        <span className={netPositive ? "ai-net--positive" : "ai-net--negative"}>
          {snapshot.hasTransactions ? `${netPositive ? "+" : ""}${formatCurrency(snapshot.net)} bulan ini` : "Belum ada transaksi bulan ini"}
        </span>
      </div>

      <div className="ai-metric-grid">
        <div className="ai-metric-card">
          <span className="ai-metric-icon ai-metric-icon--income"><ArrowUpRight size={15} aria-hidden="true" /></span>
          <span>Pemasukan</span>
          <strong>{formatCurrency(snapshot.income)}</strong>
        </div>
        <div className="ai-metric-card">
          <span className="ai-metric-icon ai-metric-icon--expense"><ArrowDownRight size={15} aria-hidden="true" /></span>
          <span>Pengeluaran</span>
          <strong>{formatCurrency(snapshot.expense)}</strong>
          <em>{snapshot.expenseChange === null ? "Belum ada pembanding" : `${snapshot.expenseChange > 0 ? "+" : ""}${snapshot.expenseChange}% vs bulan lalu`}</em>
        </div>
      </div>

      <div className="ai-progress-card">
        <div className="ai-progress-copy">
          <span><PiggyBank size={15} aria-hidden="true" /> Savings rate</span>
          <strong>{snapshot.savingsRate === null ? "-" : `${snapshot.savingsRate}%`}</strong>
        </div>
        <progress
          className="ai-progress"
          max="100"
          value={Math.max(0, Math.min(snapshot.savingsRate ?? 0, 100))}
          aria-label="Savings rate bulan ini"
        />
      </div>

      {snapshot.budget && (
        <div className={`ai-budget-note ai-budget-note--${snapshot.budget.status}`}>
          <div>
            <span>Budget terpakai tertinggi</span>
            <strong>{snapshot.budget.category}</strong>
          </div>
          <b>{snapshot.budget.percentage}%</b>
        </div>
      )}

      {snapshot.goal && (
        <div className="ai-goal-note">
          <div>
            <span>Target aktif</span>
            <strong>{snapshot.goal.name}</strong>
          </div>
          <b>{snapshot.goal.percentage}%</b>
        </div>
      )}
    </section>
  );
}
