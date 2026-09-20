"use client";

/**
 * Form dialog untuk mengganti kata sandi akun dengan validasi panjang dan
 * konfirmasi sebelum perubahan dikirim melalui Supabase Auth.
 */
import { useState, type FormEvent } from "react";
import { FinanceDialog } from "@/components/finance/FinanceDialog";

export function PasswordDialog({ onSave, onClose }: {
  onSave: (password: string) => Promise<boolean>;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      setError("Kata sandi minimal terdiri dari 8 karakter.");
      return;
    }
    if (password !== confirmation) {
      setError("Konfirmasi kata sandi belum sama.");
      return;
    }
    setError("");
    setSaving(true);
    const saved = await onSave(password);
    setSaving(false);
    if (saved) onClose();
  }

  return (
    <FinanceDialog title="Ubah kata sandi" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="new-password" className="form-label">Kata sandi baru</label>
          <input id="new-password" type="password" autoComplete="new-password" className="form-input settings-form-input" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} autoFocus />
        </div>
        <div className="form-field">
          <label htmlFor="confirm-password" className="form-label">Ulangi kata sandi</label>
          <input id="confirm-password" type="password" autoComplete="new-password" className="form-input settings-form-input" value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setError(""); }} />
        </div>
        {error && <p className="settings-form-error" role="alert">{error}</p>}
        <div className="finance-dialog-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Batal</button>
          <button type="submit" className="btn-primary" disabled={saving || !password || !confirmation}>{saving ? "Memperbarui..." : "Perbarui kata sandi"}</button>
        </div>
      </form>
    </FinanceDialog>
  );
}
