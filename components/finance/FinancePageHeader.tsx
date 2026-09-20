/** Menyediakan header halaman keuangan dengan navigasi kembali dan aksi opsional. */
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function FinancePageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="finance-header">
      <Link href="/dashboard" className="finance-icon-btn" aria-label="Kembali ke dashboard" title="Kembali ke dashboard">
        <ChevronLeft size={22} />
      </Link>
      <div className="finance-header-copy"><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
      <div className="finance-header-action">{action}</div>
    </header>
  );
}
