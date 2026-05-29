"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrency, calculatePercentage, getBudgetStatus, isThisMonth } from "@/lib/utils";
import { AppLayout } from "@/components/layout/AppLayout";
import { Plus, Trash2, AlertTriangle, Target } from "lucide-react";
import { CategoryIcon } from "@/lib/icons";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CATEGORIES } from "@/types";

export default function BudgetsPage() {
  const { user, budgets, transactions, addBudget, deleteBudget } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [limit, setLimit] = useState("");

  const budgetsWithSpent = useMemo(() => {
    const thisMonthTx = transactions.filter((t) => isThisMonth(t.date) && t.type === "OUT");
    return budgets.map((b) => {
      const spent = thisMonthTx
        .filter((t) => t.category === b.category)
        .reduce((s, t) => s + t.amount, 0);
      return { ...b, spent };
    });
  }, [budgets, transactions]);

  const totalLimit = budgets.reduce((s, b) => s + b.amount_limit, 0);
  const totalSpent = budgetsWithSpent.reduce((s, b) => s + b.spent, 0);

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
    <AppLayout>
      <div style={{ padding: "0 0 24px" }}>
        <div style={{ padding: "56px 20px 24px", background: "#111111" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#f5f5f5" }}>Budget</h1>
            <button
              onClick={() => setShowAdd(true)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#22c55e",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Plus size={18} color="#000" strokeWidth={2.5} />
            </button>
          </div>

          {/* Overview */}
          <div style={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: "14px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <div>
                <p style={{ fontSize: "11px", color: "#666666", marginBottom: "4px" }}>Total Terpakai</p>
                <p style={{ fontSize: "20px", fontWeight: 700, color: "#f5f5f5" }}>{formatCurrency(totalSpent)}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "11px", color: "#666666", marginBottom: "4px" }}>Total Budget</p>
                <p style={{ fontSize: "20px", fontWeight: 700, color: "#22c55e" }}>{formatCurrency(totalLimit)}</p>
              </div>
            </div>
            <div style={{ background: "#2a2a2a", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.min((totalSpent / totalLimit) * 100, 100)}%`,
                  background: totalSpent / totalLimit > 0.9 ? "#ef4444" : totalSpent / totalLimit > 0.7 ? "#f59e0b" : "#22c55e",
                  borderRadius: "4px",
                  transition: "width 0.5s ease",
                }}
              />
            </div>
            <p style={{ fontSize: "11px", color: "#666666", marginTop: "8px" }}>
              {Math.round((totalSpent / totalLimit) * 100)}% dari total budget bulan ini
            </p>
          </div>

          {dangerCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "10px", padding: "10px 14px", marginTop: "12px" }}>
              <AlertTriangle size={14} color="#ef4444" />
              <p style={{ fontSize: "13px", color: "#ef4444" }}>
                {dangerCount} kategori melebihi 90% budget
              </p>
            </div>
          )}
        </div>

        <div style={{ padding: "0 20px" }}>
          <p style={{ fontSize: "12px", color: "#666666", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>
            Budget per Kategori
          </p>

          {budgetsWithSpent.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#666666" }}>
              <p style={{ marginBottom: "12px" }}><Target size={32} color="#666666" /></p>
              <p style={{ marginBottom: "8px" }}>Belum ada budget</p>
              <p style={{ fontSize: "12px" }}>Tambahkan budget per kategori untuk memulai</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {budgetsWithSpent.map((budget) => {
                const pct = calculatePercentage(budget.spent, budget.amount_limit);
                const status = getBudgetStatus(pct);
                const barColor = status === "danger" ? "#ef4444" : status === "warning" ? "#f59e0b" : "#22c55e";
                const remaining = budget.amount_limit - budget.spent;

                return (
                  <div
                    key={budget.id}
                    style={{
                      background: "#161616",
                      border: "1px solid",
                      borderColor: status === "danger" ? "rgba(239,68,68,0.2)" : "#2a2a2a",
                      borderRadius: "12px",
                      padding: "16px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <CategoryIcon category={budget.category} size={20} />
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#f5f5f5" }}>{budget.category}</p>
                          <p style={{ fontSize: "11px", color: "#666666" }}>
                            {formatCurrency(budget.spent)} / {formatCurrency(budget.amount_limit)}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: status === "danger" ? "rgba(239,68,68,0.12)" : status === "warning" ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.12)",
                            color: barColor,
                          }}
                        >
                          {Math.round(pct)}%
                        </span>
                        <button
                          onClick={() => setConfirmDeleteId(budget.id)}
                          style={{ width: "24px", height: "24px", borderRadius: "6px", background: "transparent", border: "none", cursor: "pointer", color: "#444444", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div style={{ background: "#2a2a2a", borderRadius: "4px", height: "5px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: barColor,
                          borderRadius: "4px",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>

                    <p style={{ fontSize: "11px", color: remaining >= 0 ? "#666666" : "#ef4444", marginTop: "6px" }}>
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
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", zIndex: 200 }}
          onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}
        >
          <div style={{ width: "100%", background: "#111111", borderRadius: "20px 20px 0 0", border: "1px solid #2a2a2a", padding: "24px 20px 40px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#f5f5f5", marginBottom: "20px" }}>Tambah Budget</h2>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#666666", marginBottom: "6px" }}>Kategori</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", background: "#161616", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "10px 14px", color: "#f5f5f5", fontSize: "14px", outline: "none" }}>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} style={{ background: "#161616" }}>{cat}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#666666", marginBottom: "6px" }}>Limit per Bulan</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#666666", fontSize: "13px" }}>Rp</span>
                <input type="text" inputMode="numeric" placeholder="0" value={limit} onChange={(e) => setLimit(formatAmount(e.target.value))} style={{ width: "100%", background: "#161616", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "10px 14px 10px 38px", color: "#f5f5f5", fontSize: "14px", outline: "none" }} />
              </div>
            </div>

            <button onClick={handleAdd} style={{ width: "100%", padding: "14px", background: "#22c55e", color: "#000", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "15px", cursor: "pointer" }}>
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
    </AppLayout>
  );
}
