/** Membandingkan pemasukan dan pengeluaran bulan ini dengan bulan sebelumnya. */
import { ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface MonthlySummaryProps {
  income: number;
  expense: number;
  lastMonthIncome: number;
  lastMonthExpense: number;
}

export function MonthlySummary({ income, expense, lastMonthIncome, lastMonthExpense }: MonthlySummaryProps) {
  const items = [
    { label: "Pemasukan", amount: income, previous: lastMonthIncome, icon: ArrowDownLeft, income: true },
    { label: "Pengeluaran", amount: expense, previous: lastMonthExpense, icon: ArrowUpRight, income: false },
  ];
  return (
    <div className="report-summary-grid">
      {items.map(({ label, amount, previous, icon: Icon, income: isIncome }) => {
        const change = previous > 0 ? Math.round((amount - previous) / previous * 100) : null;
        const positive = change !== null && (isIncome ? change >= 0 : change <= 0);
        return <div className="report-summary-item" key={label}>
          <p className="report-summary-label"><Icon size={15} className={isIncome ? "finance-positive" : "finance-negative"} />{label}</p>
          <p className="report-summary-value">{formatCurrency(amount)}</p>
          {change !== null ? <p className={`report-trend ${positive ? "finance-positive" : "finance-negative"}`}>
            {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{change >= 0 ? "+" : ""}{change}% <span className="report-trend-context">dari bulan lalu</span></span>
          </p> : <p className="finance-label">Belum ada pembanding</p>}
        </div>;
      })}
    </div>
  );
}
