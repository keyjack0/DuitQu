"use client";

/** Menampilkan dan mengelola target keuangan beserta progres tabungannya. */
import { useState } from "react";
import { Plus, Target, Check, CalendarDays, MoreHorizontal, Pencil, Trash2, Wallet } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { FinancePageHeader } from "@/components/finance/FinancePageHeader";
import { FinanceDialog } from "@/components/finance/FinanceDialog";
import { GoalForm, type GoalValues } from "@/components/goals/GoalForm";
import { goalIcons } from "@/components/goals/goalOptions";
import type { FinancialGoal } from "@/types";
import { useShallow } from "zustand/react/shallow";

type GoalEditor = { mode: "add" } | { mode: "edit" | "amount"; goal: FinancialGoal };

export default function GoalsPage() {
  const { user, financialGoals, isLoading, addFinancialGoal, updateFinancialGoal, deleteFinancialGoal } = useAppStore(
    useShallow((state) => ({
      user: state.user,
      financialGoals: state.financialGoals,
      isLoading: state.isLoading,
      addFinancialGoal: state.addFinancialGoal,
      updateFinancialGoal: state.updateFinancialGoal,
      deleteFinancialGoal: state.deleteFinancialGoal,
    }))
  );
  const [editor, setEditor] = useState<GoalEditor | null>(null);
  const [optionsGoal, setOptionsGoal] = useState<FinancialGoal | null>(null);
  const [deleteGoal, setDeleteGoal] = useState<FinancialGoal | null>(null);
  const [saving, setSaving] = useState(false);
  const totalTarget = financialGoals.reduce((sum, goal) => sum + goal.target_amount, 0);
  const totalCurrent = financialGoals.reduce((sum, goal) => sum + goal.current_amount, 0);
  const totalPct = totalTarget > 0 ? Math.min(100, Math.round(totalCurrent / totalTarget * 100)) : 0;
  const completed = financialGoals.filter((goal) => goal.current_amount >= goal.target_amount).length;

  async function save(values: GoalValues) {
    if (!user || !editor) return;
    setSaving(true);
    let saved = false;
    if (editor.mode === "add") {
      saved = await addFinancialGoal({ ...values, id: crypto.randomUUID(), user_id: user.id, created_at: new Date().toISOString() });
    } else {
      saved = await updateFinancialGoal(editor.goal.id, editor.mode === "amount" ? { current_amount: values.current_amount } : values);
    }
    setSaving(false);
    if (saved) setEditor(null);
  }

  return (
    <div className="finance-page goals-page">
      <FinancePageHeader title="Goals" subtitle="Wujudkan rencana, selangkah demi selangkah." action={<button type="button" className="finance-icon-btn finance-icon-btn--primary" disabled={!user} onClick={() => setEditor({ mode: "add" })} aria-label="Tambah target" title="Tambah target"><Plus size={24} strokeWidth={2}/>
      </button>} />
      {isLoading && financialGoals.length === 0 ? <p className="finance-feedback" role="status">Memuat target tabungan...</p> : financialGoals.length === 0 ? (
        <section className="finance-empty"><Target size={32} strokeWidth={1.8} />
          <h2>Setiap rencana punya tujuan</h2>
          <p>Belum ada target tabungan.</p>
          <button type="button" className="finance-command finance-command--primary" disabled={!user} onClick={() => setEditor({ mode: "add" })}>Buat goal-mu</button>
        </section>
      ) : <>
        <section className="goals-overview" aria-label="Ringkasan target tabungan">
          <p className="finance-label">Total terkumpul</p>
          <p className="goals-overview-value">{formatCurrency(totalCurrent)}</p>
          <p className="goals-overview-target">dari target <strong>{formatCurrency(totalTarget)}</strong></p>
          <div className="goals-overview-bottom"><span>{completed} dari {financialGoals.length} target tercapai</span><strong>{totalPct}%</strong></div>
          <progress className="goal-progress" max={100} value={totalPct} aria-label="Progres seluruh target" />
        </section>
        <div className="finance-section-head"><h2 className="finance-section-title">Target tabungan</h2><span>{financialGoals.length} target</span></div>
        <div className="goals-list">
          {financialGoals.map((goal) => {
            const pct = goal.target_amount > 0 ? Math.min(100, Math.round(goal.current_amount / goal.target_amount * 100)) : 0;
            const reached = goal.current_amount >= goal.target_amount;
            const Icon = goalIcons[goal.icon as keyof typeof goalIcons] ?? Target;
            return (
              <article key={goal.id} className="goal-card">
                <div className="goal-header">
                  <span className="goal-icon" style={{ color: goal.color }}><Icon size={21} /></span>
                  <h3 className="goal-name">{goal.name}</h3>
                  <button type="button" className="finance-icon-btn" aria-label={`Opsi ${goal.name}`} title="Opsi target" onClick={() => setOptionsGoal(goal)}><MoreHorizontal size={20} /></button>
                </div>
                <div className="goal-amount-row"><p className="goal-amount">{formatCurrency(goal.current_amount)}</p><span className={`goal-percentage${reached ? " goal-percentage--complete" : ""}`}>{reached && <Check size={13} />}{pct}%</span></div>
                <p className="finance-label">Target {formatCurrency(goal.target_amount)}</p>
                <progress className="goal-progress" style={{ accentColor: goal.color, color: goal.color }} value={pct} max={100} aria-label={`Progres ${goal.name}`} />
                <p className="goal-remaining">{reached ? "Target tercapai" : `Sisa ${formatCurrency(goal.target_amount - goal.current_amount)}`}</p>
                <div className="goal-footer">
                  <span className="goal-deadline"><CalendarDays size={14} />{goal.deadline ? new Date(`${goal.deadline}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Tanpa tenggat"}</span>
                  <button type="button" className="goal-amount-btn" onClick={() => setEditor({ mode: "amount", goal })}><Wallet size={14} />Ubah nominal</button>
                </div>
              </article>
            );
          })}
        </div>
      </>}
      {editor && <GoalForm goal={editor.mode === "add" ? undefined : editor.goal} amountOnly={editor.mode === "amount"} saving={saving} onSave={save} onClose={() => setEditor(null)} />}
      {optionsGoal && <FinanceDialog title="Opsi target" onClose={() => setOptionsGoal(null)}>
        <p className="goal-form-name">{optionsGoal.name}</p>
        <div className="goal-options">
          <button className="finance-command" onClick={() => { setEditor({ mode: "edit", goal: optionsGoal }); setOptionsGoal(null); }}><Pencil size={17} />Edit target</button>
          <button className="finance-command finance-command--danger" onClick={() => { setDeleteGoal(optionsGoal); setOptionsGoal(null); }}><Trash2 size={17} />Hapus target</button>
        </div>
      </FinanceDialog>}
      {deleteGoal && <FinanceDialog title="Hapus target?" onClose={() => setDeleteGoal(null)}>
        <p className="goal-delete-description">Target <strong>{deleteGoal.name}</strong> akan dihapus permanen.</p>
        <div className="finance-dialog-actions"><button className="finance-command" disabled={saving} onClick={() => setDeleteGoal(null)}>Batal</button><button className="finance-command finance-command--danger" disabled={saving} onClick={() => void (async () => { setSaving(true); const deleted = await deleteFinancialGoal(deleteGoal.id); setSaving(false); if (deleted) setDeleteGoal(null); })()}><Trash2 size={16} />{saving ? "Menghapus..." : "Hapus target"}</button></div>
      </FinanceDialog>}
    </div>
  );
}
