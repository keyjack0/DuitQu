"use client";

/** Menampilkan ringkasan dan daftar transaksi untuk tanggal kalender terpilih. */
import { ArrowLeftRight, ReceiptText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CategoryIcon } from "@/lib/icons";
import { CATEGORY_COLORS } from "@/lib/categoryColors";
import type { Transaction } from "@/types";

export function CalendarDayDetail({ date, transactions }: { date: string; transactions: Transaction[] }) {
  const label = new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
  const income = transactions.filter((tx) => tx.type === "IN").reduce((sum, tx) => sum + tx.amount, 0);
  const expense = transactions.filter((tx) => tx.type === "OUT").reduce((sum, tx) => sum + tx.amount, 0);
  const net = income - expense;
  return (
    <section className="calendar-detail" aria-label={`Transaksi ${label}`}>
      <div className="finance-section-head"><h2 className="finance-section-title">{label}</h2><span>{transactions.length} transaksi</span></div>
      {transactions.length === 0 ? <div className="finance-empty calendar-empty"><ReceiptText size={32} strokeWidth={1.5} /><p>Belum ada transaksi pada tanggal ini.</p></div> : <>
        <dl className="calendar-summary">
          <div><dt>Pemasukan</dt><dd className="finance-positive">{formatCurrency(income)}</dd></div>
          <div><dt>Pengeluaran</dt><dd className="finance-negative">{formatCurrency(expense)}</dd></div>
          <div className="calendar-summary-net"><dt>Selisih</dt><dd className={net >= 0 ? "finance-positive" : "finance-negative"}>{net > 0 ? "+" : ""}{formatCurrency(net)}</dd></div>
        </dl>
        <div className="calendar-tx-list">
          {transactions.map((tx) => {
            const transfer = tx.type === "TRANSFER";
            const income = tx.type === "IN";
            const color = transfer ? "var(--text-secondary)" : CATEGORY_COLORS[tx.category] || "var(--text-secondary)";
            return (
              <div key={tx.id} className="transaction-item calendar-tx-item">
                <span className="transaction-icon calendar-tx-icon" style={{ color }}>{transfer ? <ArrowLeftRight size={18} /> : <CategoryIcon category={tx.category} size={18} color="currentColor" />}</span>
                <div className="transaction-info"><p className="transaction-desc" title={tx.description || (transfer ? "Transfer antar dompet" : tx.category)}>{tx.description || (transfer ? "Transfer antar dompet" : tx.category)}</p><p className="transaction-meta"><span className="transaction-category" style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}>{transfer ? "Transfer" : tx.category}</span></p></div>
                <p className={`transaction-amount calendar-tx-amount${income ? " transaction-amount--income" : ""}`}>{income ? "+" : transfer ? "" : "-"}{formatCurrency(tx.amount)}</p>
              </div>
            );
          })}
        </div>
      </>}
    </section>
  );
}
