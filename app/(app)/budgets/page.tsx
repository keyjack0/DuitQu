"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrency, calculatePercentage, getBudgetStatus, isThisMonth } from "@/lib/utils";
import { Plus, Trash2, AlertTriangle, Target } from "lucide-react";
import { CategoryIcon } from "@/lib/icons";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CATEGORIES } from "@/types";

export default function BudgetsPage() {
  const { user, budgets, monthTransactions, addBudget, deleteBudget } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [limit, setLimit] = useState("");

  const budgetsWithSpent = useMemo(() => {
    const thisMonthTx = monthTransactions.filter((t) => isThisMonth(t.date) && t.type === "OUT");
    return budgets.map((b) => {
      const spent = thisMonthTx
        .filter((t) => t.category === b.category)
        .reduce((s, t) => s + t.amount, 0);
      return { ...b, spent };
    });
  }, [budgets, monthTransactions]);

  const totalLimit = budgets.reduce((s, b) => s + b.amount_limit, 0);
  const totalSpent = budgetsWithSpent.reduce((s, b) => s + b.spent, 0);
  const totalPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  const formatAmount = (val: string) => {
    const num = val.replace(/\D/g, "");
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleAdd = () => {
    if (!limit) return;
    const parsedLimit = parseFloat(limit.replace(/\./g, ""));
    addBudget({
      id: crypto.randomUUID(),
      user_id: user!.id,
      category,
      amount_limit: parsedLimit,
      period: "MONTH",
    });
    setLimit("");
    setCategory(CATEGORIES[0]);
    setShowAdd(false);
  };

  const dangerCount = budgetsWithSpent.filter((b) => getBudgetStatus(calculatePercentage(b.spent, b.amount_limit)) === "danger").length;

  return (
    <>
      <div className="page-shell">
        <div className="page-hero pb-6">
          <div className="page-title-row mb-5">
            <h1 className="page-title">Budget</h1>
            <button
              onClick={() => setShowAdd(true)}
              className="icon-btn-square icon-btn-square--primary"
            >
              <Plus size={18} color="var(--on-accent)" strokeWidth={2.5} />
            </button>
          </div>

          {/* Overview */}
          <div className="card">
            <div className="ov-row">
              <div>
                <p className="ov-label">Total Terpakai</p>
                <p className="ov-value">{formatCurrency(totalSpent)}</p>
              </div>
              <div className="ov-block--right">
                <p className="ov-label">Total Budget</p>
                <p className="ov-value ov-value--green">{formatCurrency(totalLimit)}</p>
              </div>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${totalPct}%`,
                  background: totalPct > 90 ? "var(--red)" : totalPct > 70 ? "var(--amber)" : "var(--green)",
                }}
              />
            </div>
            <p className="ov-note">
              {totalPct}% dari total budget bulan ini
            </p>
          </div>

          {dangerCount > 0 && (
            <div className="alert-danger">
              <AlertTriangle size={14} color="var(--red)" />
              <p className="alert-danger-text">
                {dangerCount} kategori melebihi 90% budget
              </p>
            </div>
          )}
        </div>

        <div className="page-body">
          <p className="section-label mb-3">
            Budget per Kategori
          </p>

          {budgetsWithSpent.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon"><Target size={32} color="var(--text-muted)" /></p>
              <p className="empty-title">Belum ada budget</p>
              <p className="empty-desc">Tambahkan budget per kategori untuk memulai</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {budgetsWithSpent.map((budget) => {
                const pct = calculatePercentage(budget.spent, budget.amount_limit);
                const status = getBudgetStatus(pct);
                const barColor = status === "danger" ? "var(--red)" : status === "warning" ? "var(--amber)" : "var(--green)";
                const remaining = budget.amount_limit - budget.spent;

                return (
                  <div key={budget.id} className={`budget-card ${status === "danger" ? "budget-card--danger" : ""}`}>
                    <div className="budget-head">
                      <div className="budget-cat">
                        <div className={`budget-cat-icon-box ${status === "danger" ? "budget-cat-icon-box--danger" : status === "warning" ? "budget-cat-icon-box--warning" : "budget-cat-icon-box--safe"}`}>
                          <CategoryIcon category={budget.category} size={16} color="currentColor" />
                        </div>
                        <div>
                          <p className="budget-cat-name">{budget.category}</p>
                          <p className="budget-cat-sum">
                            {formatCurrency(budget.spent)} / {formatCurrency(budget.amount_limit)}
                          </p>
                        </div>
                      </div>
                      <div className="budget-actions">
                        <span
                          className={`status-badge ${status === "danger" ? "status-badge--danger" : status === "warning" ? "status-badge--warning" : "status-badge--safe"}`}
                        >
                          {Math.round(pct)}%
                        </span>
                        <button
                          onClick={() => setConfirmDeleteId(budget.id)}
                          className="mini-icon-btn"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="progress-track progress-track--thin">
                      <div
                        className="progress-fill"
                        style={{ width: `${pct}%`, background: barColor }}
                      />
                    </div>

                    <p className={`budget-remaining ${remaining < 0 ? "budget-remaining--over" : ""}`}>
                      {remaining >= 0 ? `Sisa ${formatCurrency(remaining)}` : `Melebihi ${formatCurrency(Math.abs(remaining))}`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div
          className="sheet-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}
        >
          <div className="sheet-panel">
            <h2 className="sheet-title mb-5">Tambah Budget</h2>

            <div className="form-field">
              <label className="form-label">Kategori</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-input">
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-field form-field--spaced">
              <label className="form-label">Limit per Bulan</label>
              <div className="relative">
                <span className="input-prefix">Rp</span>
                <input type="text" inputMode="numeric" placeholder="0" value={limit} onChange={(e) => setLimit(formatAmount(e.target.value))} className="form-input form-input--prefix" />
              </div>
            </div>

            <button onClick={handleAdd} className="btn-primary">
              Simpan Budget
            </button>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          title="Hapus budget ini?"
          description="Data budget akan dihapus permanen."
          onConfirm={() => {
            deleteBudget(confirmDeleteId);
            setConfirmDeleteId(null);
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </>
  );
}
