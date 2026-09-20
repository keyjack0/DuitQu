/** Menyediakan kontrol untuk berpindah antarbulan pada halaman keuangan. */
import { ChevronLeft, ChevronRight } from "lucide-react";

export function MonthNavigation({ date, onChange, disabled = false }: {
  date: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
}) {
  const label = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(date);
  return (
    <nav className="finance-month-nav" aria-label="Periode">
      <button type="button" className="finance-icon-btn" disabled={disabled} onClick={() => onChange(new Date(date.getFullYear(), date.getMonth() - 1, 1))} aria-label="Bulan sebelumnya" title="Bulan sebelumnya"><ChevronLeft size={20} /></button>
      <p aria-live="polite" aria-atomic="true">{label}</p>
      <button type="button" className="finance-icon-btn" disabled={disabled} onClick={() => onChange(new Date(date.getFullYear(), date.getMonth() + 1, 1))} aria-label="Bulan berikutnya" title="Bulan berikutnya"><ChevronRight size={20} /></button>
    </nav>
  );
}
