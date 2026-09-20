"use client";

/**
 * Menampilkan satu baris pengaturan. Baris menjadi tombol ketika menerima
 * onClick, dan tetap menjadi informasi statis jika tidak memiliki aksi.
 */
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface Props {
  icon: ReactNode;
  label: string;
  description?: string;
  value?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export function SettingsRow({ icon, label, description, value, onClick, disabled = false, danger = false }: Props) {
  const content = (
    <>
      <span className={`settings-row-icon ${danger ? "settings-row-icon--danger" : ""}`}>{icon}</span>
      <span className="settings-row-copy">
        <strong className={danger ? "settings-row-label--danger" : ""}>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      {value && <span className="settings-row-value">{value}</span>}
      {onClick && <ChevronRight size={17} className="settings-row-chevron" aria-hidden="true" />}
    </>
  );

  return onClick ? (
    <button type="button" className="settings-row" onClick={onClick} disabled={disabled}>{content}</button>
  ) : (
    <div className="settings-row">{content}</div>
  );
}
