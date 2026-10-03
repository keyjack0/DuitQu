"use client";

/** Menampilkan dan mengelola batas anggaran bulanan per kategori. */
import { useState, useMemo } from "react";
import { FinancePageHeader } from "@/components/finance/FinancePageHeader";
import { useAppStore } from "@/lib/store";
import { formatCurrency, calculatePercentage, getBudgetStatus, isThisMonth } from "@/lib/utils";
import { Plus, Pencil, Trash2, AlertTriangle, Target } from "lucide-react";
import { CategoryIcon } from "@/lib/icons";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SwipeableRow } from "@/components/ui/SwipeableRow";
import { CATEGORIES } from "@/types";
import type { Budget } from "@/types";
import { useShallow } from "zustand/react/shallow";

export default function BudgetsPage() {
  const { user, budgets, monthTransactions, addBudget, updateBudget, deleteBudget } = useAppStore(
    useShallow((state) => ({
      user: state.user,
      budgets: state.budgets,
      monthTransactions: state.monthTransactions,
      addBudget: state.addBudget,
      updateBudget: state.updateBudget,
      deleteBudget: state.deleteBudget,
    }))
  );
  const [showAdd, setShowAdd] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
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

  const closeForm = () => {
    setLimit("");
    setCategory(CATEGORIES[0]);
    setEditingBudget(null);
    setShowAdd(false);
  };

  const openEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setCategory(budget.category);
    setLimit(formatAmount(budget.amount_limit.toString()));
    setOpenRowId(null);
    setShowAdd(true);
  };

  const parsedLimit = Number(limit.replace(/\./g, ""));
  const isValidLimit = Number.isFinite(parsedLimit) && parsedLimit > 0;

  const handleSave = () => {
    if (!isValidLimit) return;
    if (editingBudget) {
      updateBudget(editingBudget.id, { category, amount_limit: parsedLimit });
    } else {
      if (!user) return;
      addBudget({
        id: crypto.randomUUID(),
        user_id: user.id,
        category,
        amount_limit: parsedLimit,
        period: "MONTH",
      });
    }
    closeForm();
  };

  const dangerCount = budgetsWithSpent.filter((b) => getBudgetStatus(calculatePercentage(b.spent, b.amount_limit)) === "danger").length;

  return (
    <>
      <div className="page-shell">
        <div className="page-hero budget-page-container">
          <FinancePageHeader
            title="Budget"
            subtitle="Atur batas pengeluaran agar keuangan tetap terkontrol."
            action={
              <button
                onClick={() => {
                  closeForm();
                  setOpenRowId(null);
                  setShowAdd(true);
                }}
                aria-label="Tambah budget"
                className="icon-btn-square icon-btn-square--primary"
              >
                <Plus size={24} color="var(--on-accent)" strokeWidth={1.8} />
              </button>
            }
          />

          <div className="budget-layout">
            <aside className="budget-summary" aria-label="Ringkasan budget bulan ini">
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
            </aside>

            <section className="page-body budget-list" aria-labelledby="budget-list-title">
              <h2 id="budget-list-title" className="section-label mb-3">
                Budget per Kategori
              </h2>

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
                      <SwipeableRow
                        key={budget.id}
                        isOpen={openRowId === budget.id}
                        onOpenChange={(open) => setOpenRowId(open ? budget.id : null)}
                        actions={
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(budget)}
                              aria-label="Edit budget"
                              style={{ background: "var(--bg-hover)", color: "var(--text-primary)" }}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenRowId(null);
                                setConfirmDeleteId(budget.id);
                              }}
                              aria-label="Hapus budget"
                              style={{ background: "var(--red)", color: "#fff" }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        }
                      >
                        <div className="budget-row-content">
                          <div className="budget-head">
                            <div className="budget-cat">
                              <div className={`budget-cat-icon-box ${status === "danger" ? "budget-cat-icon-box--danger" : status === "warning" ? "budget-cat-icon-box--warning" : "budget-cat-icon-box--safe"}`}>
                                <CategoryIcon category={budget.category} color="currentColor" />
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
                            </div>
                          </div>

                          <div className="progress-track progress-track--thin">
                            <div
                              className="progress-fill"
                              style={{ width: `${pct}%`, background: barColor }}
                            />
                          </div>

                          {/* <p className={`budget-remaining ${remaining < 0 ? "budget-remaining--over" : ""}`}>
                            {remaining >= 0 ? `Sisa ${formatCurrency(remaining)}` : `Melebihi ${formatCurrency(Math.abs(remaining))}`}
                          </p> */}
                        </div>
                      </SwipeableRow>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {showAdd && (
        <div
          className="sheet-overlay budget-sheet-overlay"
          onClick={(e) => e.target === e.currentTarget && closeForm()}
        >
          <div
            className="sheet-panel budget-sheet-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="budget-form-title"
          >
            <h2 id="budget-form-title" className="sheet-title mb-5">{editingBudget ? "Edit Budget" : "Tambah Budget"}</h2>

            <div className="form-field">
              <label htmlFor="budget-category" className="form-label">Kategori</label>
              <select id="budget-category" value={category} onChange={(e) => setCategory(e.target.value)} className="form-input">
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-field form-field--spaced">
              <label htmlFor="budget-limit" className="form-label">Limit per Bulan</label>
              <div className="relative">
                <span className="input-prefix">Rp</span>
                <input id="budget-limit" type="text" inputMode="numeric" placeholder="0" value={limit} onChange={(e) => setLimit(formatAmount(e.target.value))} className="form-input form-input--prefix" />
              </div>
            </div>

            <div className="dialog-actions">
              <button onClick={closeForm} className="btn-secondary">Batal</button>
              <button onClick={handleSave} disabled={!isValidLimit} className="btn-primary">
                {editingBudget ? "Simpan Perubahan" : "Simpan Budget"}
              </button>
            </div>
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
