"use client";

interface Props {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, description, confirmLabel, onConfirm, onCancel }: Props) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="dialog-card">
        <p className="dialog-title">{title}</p>
        {description && <p className="dialog-desc">{description}</p>}
        <div className="dialog-actions">
          <button onClick={onCancel} className="btn-secondary">
            Batal
          </button>
          <button onClick={onConfirm} className="btn-danger">
            {confirmLabel ?? "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
