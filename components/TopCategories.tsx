/** Menampilkan kategori pengeluaran terbesar pada laporan keuangan. */
import { getExpenseCategories } from "@/lib/financeReport";
import { formatCurrency } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/categoryColors";
import type { Transaction } from "@/types";

export function TopCategories({ transactions }: { transactions: Transaction[] }) {
  const categories = getExpenseCategories(transactions).slice(0, 5);
  return (
    <section className="report-section report-categories-section" aria-label="Kategori pengeluaran">
      <div className="finance-section-head"><h2 className="finance-section-title">Pengeluaran terbesar</h2><span>Top 5</span></div>
      {categories.length === 0 ? <p className="finance-label">Belum ada pengeluaran pada periode ini.</p> : <ol className="report-categories">
        {categories.map((category, index) => <li className="report-category" key={category.name}>
          <div className="report-category-head"><span className="report-category-rank">{index + 1}</span><h3>{category.name}</h3><span className="report-category-pct">{category.percentage}%</span></div>
          <p className="report-category-value">{formatCurrency(category.value)}</p>
          <div className="report-category-track" aria-hidden="true"><span style={{ width: `${category.percentage}%`, background: CATEGORY_COLORS[category.name] || "var(--text-secondary)" }} /></div>
        </li>)}
      </ol>}
    </section>
  );
}
