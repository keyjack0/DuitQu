"use client";

/** Menyediakan formulir untuk membuat atau memperbarui target keuangan. */
import { useState, type FormEvent } from "react";
import { Check, Save } from "lucide-react";
import { FinanceDialog } from "@/components/finance/FinanceDialog";
import { goalColors, goalIcons, goalIconNames, formatGoalAmount, parseGoalAmount } from "./goalOptions";
import type { FinancialGoal } from "@/types";

export type GoalValues = Pick<FinancialGoal, "name" | "target_amount" | "current_amount" | "deadline" | "icon" | "color">;

export function GoalForm({ goal, amountOnly = false, saving = false, onSave, onClose }: {
  goal?: FinancialGoal;
  amountOnly?: boolean;
  saving?: boolean;
  onSave: (values: GoalValues) => Promise<void> | void;
  onClose: () => void;
}) {
  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(goal ? formatGoalAmount(String(goal.target_amount)) : "");
  const [current, setCurrent] = useState(goal ? formatGoalAmount(String(goal.current_amount)) : "");
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");
  const [icon, setIcon] = useState(goal?.icon ?? "target");
  const [color, setColor] = useState(goal?.color ?? goalColors[0].value);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const targetAmount = parseGoalAmount(target);
    const currentAmount = parseGoalAmount(current);
    if (!name.trim()) { setError("Nama target harus diisi."); return; }
    if (!Number.isSafeInteger(targetAmount) || targetAmount <= 0) { setError("Masukkan target nominal yang valid, lebih dari Rp0."); return; }
    if (!Number.isSafeInteger(currentAmount) || currentAmount < 0) { setError("Masukkan jumlah terkumpul yang valid."); return; }
    void onSave({ name: name.trim(), target_amount: targetAmount, current_amount: currentAmount, deadline: deadline || null, icon, color });
  }

  return (
    <FinanceDialog title={amountOnly ? "Ubah nominal" : goal ? "Edit target" : "Tambah target"} onClose={onClose}>
      <form onSubmit={submit}>
        {amountOnly && <p className="goal-form-name">{goal?.name}</p>}
        {!amountOnly && <>
          <div className="form-field">
            <label htmlFor="goal-name" className="form-label">Nama target</label>
            <input id="goal-name" className="form-input" placeholder="Contoh: Dana darurat" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required />
          </div>
          <div className="form-field">
            <label htmlFor="goal-target" className="form-label">Target tabungan</label>
            <div className="relative"><span className="input-prefix">Rp</span><input id="goal-target" className="form-input form-input--prefix" inputMode="numeric" placeholder="0" value={target} onChange={(event) => setTarget(formatGoalAmount(event.target.value))} required /></div>
          </div>
        </>}
        <div className="form-field">
          <label htmlFor="goal-current" className="form-label">Jumlah terkumpul</label>
          <div className="relative"><span className="input-prefix">Rp</span><input id="goal-current" className="form-input form-input--prefix" inputMode="numeric" placeholder="0" value={current} onChange={(event) => setCurrent(formatGoalAmount(event.target.value))} /></div>
        </div>
        {!amountOnly && <>
          <div className="form-field">
            <label htmlFor="goal-deadline" className="form-label">Tanggal target <span className="finance-label">(opsional)</span></label>
            <input id="goal-deadline" type="date" className="form-input" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
          </div>
          <fieldset className="goal-picker-field"><legend className="form-label">Ikon</legend><div className="goal-picker">
            {Object.entries(goalIcons).map(([key, Icon]) => <button key={key} type="button" className="goal-picker-option" aria-label={goalIconNames[key]} title={goalIconNames[key]} aria-pressed={icon === key} onClick={() => setIcon(key)}><Icon size={20} /></button>)}
          </div></fieldset>
          <fieldset className="goal-picker-field"><legend className="form-label">Warna</legend><div className="goal-picker">
            {goalColors.map((item) => <button key={item.value} type="button" className="goal-picker-option" aria-label={item.name} title={item.name} aria-pressed={color === item.value} onClick={() => setColor(item.value)}><span className="goal-swatch" style={{ backgroundColor: item.value }}>{color === item.value && <Check size={16} />}</span></button>)}
          </div></fieldset>
        </>}
        {error && <p className="finance-error" role="alert">{error}</p>}
        <div className="finance-dialog-actions">
          <button type="button" className="finance-command" onClick={onClose} disabled={saving}>Batal</button>
          <button type="submit" className="finance-command finance-command--primary" disabled={saving}><Save size={16} />{saving ? "Menyimpan..." : "Simpan"}</button>
        </div>
      </form>
    </FinanceDialog>
  );
}
