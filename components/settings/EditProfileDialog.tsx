"use client";

/**
 * Form dialog untuk memperbarui nama pengguna dengan validasi lokal dan
 * feedback inline sebelum perubahan dikirim ke Supabase oleh halaman induk.
 */
import { useState, type FormEvent } from "react";
import { FinanceDialog } from "@/components/finance/FinanceDialog";

export function EditProfileDialog({ initialName, onSave, onClose }: {
  initialName: string;
  onSave: (name: string) => Promise<boolean>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = name.trim().replace(/\s+/g, " ");
    if (normalized.length < 2) {
      setError("Nama minimal terdiri dari 2 karakter.");
      return;
    }
    if (normalized.length > 50) {
      setError("Nama maksimal terdiri dari 50 karakter.");
      return;
    }
    if (normalized === initialName) {
      onClose();
      return;
    }
    setError("");
    setSaving(true);
    const saved = await onSave(normalized);
    setSaving(false);
    if (saved) onClose();
  }

  return (
    <FinanceDialog title="Edit profil" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="profile-name" className="form-label">Nama lengkap</label>
          <input
            id="profile-name"
            name="name"
            autoComplete="name"
            className="form-input settings-form-input"
            value={name}
            maxLength={50}
            onChange={(event) => { setName(event.target.value); setError(""); }}
            aria-describedby="profile-name-help profile-name-error"
            autoFocus
          />
          <div className="settings-field-meta">
            <span id="profile-name-help">Nama ini tampil di seluruh DuitQu.</span>
            <span>{name.length}/50</span>
          </div>
          {error && <p id="profile-name-error" className="settings-form-error" role="alert">{error}</p>}
        </div>
        <div className="finance-dialog-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Batal</button>
          <button type="submit" className="btn-primary" disabled={saving || !name.trim()}>{saving ? "Menyimpan..." : "Simpan perubahan"}</button>
        </div>
      </form>
    </FinanceDialog>
  );
}
