"use client";

/** Menyediakan dialog modal yang konsisten untuk formulir keuangan. */
import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function FinanceDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      previouslyFocused?.focus();
    };
  }, []);

  return (
    <dialog ref={dialogRef} className="finance-dialog" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}>
      <div className="finance-dialog-header">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="finance-icon-btn" onClick={onClose} aria-label="Tutup" title="Tutup"><X size={20} /></button>
      </div>
      {children}
    </dialog>
  );
}
