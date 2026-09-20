/** Membuat dan mengunduh laporan keuangan bulanan dalam format PDF. */
import type { MonthlyReport } from "./financeReport";
import { formatCurrency } from "./utils";

export async function exportFinanceReport(report: MonthlyReport) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const left = 18;
  const width = 174;
  let y = 0;

  function header() {
    pdf.setFont("helvetica", "bold").setFontSize(17).setTextColor(21, 128, 61);
    pdf.text("DuitQu", left, 20);
    pdf.setFont("helvetica", "normal").setFontSize(10).setTextColor(63, 63, 70);
    pdf.text(`Laporan keuangan | ${report.label}`, left, 29);
    pdf.setDrawColor(228, 228, 231).line(left, 35, left + width, 35);
    y = 45;
  }

  function ensureSpace(height: number) {
    if (y + height > 273) { pdf.addPage(); header(); }
  }

  function section(title: string) {
    ensureSpace(26);
    pdf.setFont("helvetica", "bold").setFontSize(12).setTextColor(24, 24, 27);
    pdf.text(title, left, y);
    y += 10;
  }

  function row(label: string, value: string) {
    pdf.setFont("helvetica", "normal").setFontSize(10);
    const lines = pdf.splitTextToSize(label, 100) as string[];
    const valueLines = pdf.splitTextToSize(value, 65) as string[];
    const lineCount = Math.max(lines.length, valueLines.length);
    if (lineCount * 5 + 6 <= 228) ensureSpace(lineCount * 5 + 6);
    for (let index = 0; index < lineCount; index++) {
      ensureSpace(5);
      pdf.setFont("helvetica", "normal").setFontSize(10).setTextColor(63, 63, 70);
      if (lines[index]) pdf.text(lines[index], left, y);
      if (valueLines[index]) pdf.setTextColor(24, 24, 27).text(valueLines[index], left + width, y, { align: "right" });
      y += 5;
    }
    y += 6;
  }

  header();
  section("Ringkasan bulanan");
  row("Pemasukan", formatCurrency(report.income));
  row("Pengeluaran", formatCurrency(report.expense));
  row("Saldo bersih", formatCurrency(report.net));
  row("Persentase tabungan", report.savingsRate === null ? "Belum ada pemasukan" : `${report.savingsRate}%`);
  row("Saldo bersih bulan sebelumnya", formatCurrency(report.previousNet));
  row("Jumlah transaksi", String(report.transactions.length));
  y += 6;
  section("Arus kas mingguan");
  for (const week of report.weeks) {
    row(`${week.label} (tanggal ${week.range}) - masuk`, formatCurrency(week.income));
    row("Pengeluaran", formatCurrency(week.expense));
  }
  y += 6;
  section("Kategori pengeluaran");
  if (report.categories.length === 0) row("Belum ada pengeluaran", "");
  for (const category of report.categories) row(`${category.name} (${category.percentage}%)`, formatCurrency(category.value));
  y += 6;
  section("Rincian transaksi");
  if (report.transactions.length === 0) row("Belum ada transaksi", "");
  for (const tx of report.transactions) {
    const type = tx.type === "IN" ? "Pemasukan" : tx.type === "OUT" ? "Pengeluaran" : "Transfer";
    row(`${tx.date.slice(0, 10)} | ${type}\n${tx.description || tx.category}`, `${tx.type === "IN" ? "+" : tx.type === "OUT" ? "-" : ""}${formatCurrency(tx.amount)}`);
  }
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page);
    pdf.setFont("helvetica", "normal").setFontSize(9).setTextColor(113, 113, 122);
    pdf.text(`${page} / ${pages}`, left + width, 285, { align: "right" });
  }
  pdf.save(`laporan-keuangan-${report.month + 1}-${report.year}.pdf`);
}
