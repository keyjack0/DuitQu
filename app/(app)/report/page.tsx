"use client";

/** Menyajikan analisis dan ekspor PDF untuk bulan yang dipilih pengguna. */
import { useState, useMemo } from "react";
import { Download, LoaderCircle, RotateCcw, TrendingUp, TrendingDown, ChartNoAxesCombined } from "lucide-react";
import { formatCurrency, toLocalDateString } from "@/lib/utils";
import { buildMonthlyReport } from "@/lib/financeReport";
import { usePeriodTransactions } from "@/hooks/usePeriodTransactions";
import { FinancePageHeader } from "@/components/finance/FinancePageHeader";
import { MonthNavigation } from "@/components/finance/MonthNavigation";
import { MonthlySummary } from "@/components/MonthlySummary";
import { TopCategories } from "@/components/TopCategories";

export default function ReportPage() {
  const [date, setDate] = useState(() => new Date());
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const start = toLocalDateString(new Date(date.getFullYear(), date.getMonth() - 1, 1));
  const end = toLocalDateString(new Date(date.getFullYear(), date.getMonth() + 1, 1));
  const { transactions, isLoading, error, retry } = usePeriodTransactions(start, end);
  const report = useMemo(() => buildMonthlyReport(transactions, date), [transactions, date]);
  const weeklyMax = Math.max(1, ...report.weeks.flatMap((week) => [week.income, week.expense]));
  const savingsChange = report.savingsRate !== null && report.previousSavingsRate !== null ? report.savingsRate - report.previousSavingsRate : null;

  async function exportPDF() {
    if (exporting || isLoading || error) return;
    setExporting(true);
    setExportError("");
    try {
      const { exportFinanceReport } = await import("@/lib/exportFinanceReport");
      await exportFinanceReport(report);
    } catch {
      setExportError("PDF belum dapat dibuat. Silakan coba lagi.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="finance-page report-page">
      <FinancePageHeader title="Laporan" subtitle={`Ringkasan keuangan ${report.label}.`} action={<button type="button" className="finance-icon-btn" onClick={exportPDF} disabled={isLoading || !!error || exporting} aria-label={exporting ? "Menyiapkan PDF" : "Unduh PDF"} title={exporting ? "Menyiapkan PDF" : "Unduh PDF"}>{exporting ? <LoaderCircle size={20} className="finance-spinner" /> : <Download size={20} />}</button>} />
      <MonthNavigation date={date} disabled={exporting} onChange={(value) => { setDate(value); setExportError(""); }} />
      {exportError && <p className="finance-error" role="alert">{exportError}</p>}
      {exporting && <p className="sr-only" role="status">Menyiapkan PDF...</p>}
      {isLoading ? <p className="finance-feedback" role="status">Memuat laporan...</p> : error ? <div className="finance-feedback" role="alert"><p>{error}</p><button className="finance-command" onClick={retry}><RotateCcw size={16} />Coba lagi</button></div> : <>
        <section className="report-overview" aria-label="Ringkasan bulanan">
          <div className="report-net">
            <p className="finance-label">Saldo bersih periode ini</p>
            <p className={`report-net-value ${report.net < 0 ? "finance-negative" : ""}`}>{report.net > 0 ? "+" : ""}{formatCurrency(report.net)}</p>
            {report.previousNet !== 0 && <p className={`report-trend ${report.net >= report.previousNet ? "finance-positive" : "finance-negative"}`}>
              {report.net >= report.previousNet ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{report.net >= report.previousNet ? "+" : ""}{formatCurrency(report.net - report.previousNet)} dari bulan lalu</span>
            </p>}
          </div>
          <MonthlySummary income={report.income} expense={report.expense} lastMonthIncome={report.previousIncome} lastMonthExpense={report.previousExpense} />
          <div className="report-savings">
            <div className="report-savings-heading"><span className="finance-label">Persentase tabungan</span><strong>{report.savingsRate === null ? "-" : `${report.savingsRate}%`}</strong></div>
            <div className="report-savings-track" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(100, report.savingsRate ?? 0))}%` }} /></div>
            <p className="finance-label">{report.savingsRate === null ? "Belum ada pemasukan pada periode ini." : savingsChange !== null ? `${savingsChange >= 0 ? "+" : ""}${savingsChange} poin persentase dari bulan lalu` : "Dari total pemasukan periode ini."}</p>
          </div>
        </section>
        {report.transactions.length === 0 ? <section className="finance-empty"><ChartNoAxesCombined size={42} strokeWidth={1.8} /><h2>Belum ada transaksi</h2><p>{report.label}</p></section> : <div className="report-analysis">
          <section className="report-section" aria-label="Arus kas mingguan">
            <div className="finance-section-head"><h2 className="finance-section-title">Arus kas mingguan</h2></div>
            <div className="report-legend"><span><i className="report-bar--income" />Pemasukan</span><span><i className="report-bar--expense" />Pengeluaran</span></div>
            <div className="report-weekly">
              {report.weeks.map((week) => <div className="report-week" key={week.label}>
                <div className="report-week-head"><h3>{week.label}</h3><span>Tanggal {week.range}</span></div>
                <div className="report-week-series"><div className="report-week-track" aria-hidden="true"><span className="report-bar--income" style={{ width: `${week.income / weeklyMax * 100}%` }} /></div><span className="finance-positive"><span className="sr-only">Pemasukan </span>{formatCurrency(week.income)}</span></div>
                <div className="report-week-series"><div className="report-week-track" aria-hidden="true"><span className="report-bar--expense" style={{ width: `${week.expense / weeklyMax * 100}%` }} /></div><span className="finance-negative"><span className="sr-only">Pengeluaran </span>{formatCurrency(week.expense)}</span></div>
              </div>)}
            </div>
          </section>
          <TopCategories transactions={report.transactions} />
        </div>}
      </>}
    </div>
  );
}
