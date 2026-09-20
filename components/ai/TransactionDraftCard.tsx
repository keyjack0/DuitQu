"use client";

/** Menampilkan draf transaksi hasil asisten untuk ditinjau dan disimpan. */
import { CheckCircle2, ChevronRight, CircleDollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { ParsedTransaction } from "@/types";

interface Props {
  transaction: ParsedTransaction;
  onReview: () => void;
}

export function TransactionDraftCard({ transaction, onReview }: Props) {
  const saved = transaction.status === "saved";
  const transactionDate = transaction.tanggal ? new Date(`${transaction.tanggal}T00:00:00`) : null;
  const dateLabel = transactionDate && !Number.isNaN(transactionDate.getTime())
    ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(transactionDate)
    : "Hari ini";
  return (
    <section className={`ai-transaction-card ${saved ? "ai-transaction-card--saved" : ""}`} aria-label="Transaksi terdeteksi">
      <div className="ai-transaction-head">
        <span className="ai-transaction-icon">
          {saved ? <CheckCircle2 size={18} aria-hidden="true" /> : <CircleDollarSign size={18} aria-hidden="true" />}
        </span>
        <div>
          <p>{saved ? "Transaksi tersimpan" : "Transaksi terdeteksi"}</p>
          <span>{transaction.tipe === "pemasukan" ? "Pemasukan" : "Pengeluaran"}</span>
        </div>
      </div>
      <p className={`ai-transaction-amount ai-transaction-amount--${transaction.tipe}`}>
        {transaction.tipe === "pemasukan" ? "+" : "-"}{formatCurrency(transaction.nominal)}
      </p>
      <p className="ai-transaction-description">{transaction.deskripsi}</p>
      <div className="ai-transaction-meta">
        <span>{transaction.kategori}</span>
        <span>{transaction.wallet || "Pilih dompet"}</span>
        <span>{dateLabel}</span>
      </div>
      {!saved && (
        <button type="button" className="ai-transaction-action" onClick={onReview}>
          Tinjau &amp; simpan <ChevronRight size={16} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}
