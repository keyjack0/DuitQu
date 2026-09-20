"use client";

/** Menampilkan transaksi bulanan dalam kalender dan rincian per tanggal. */
import { useState, useMemo } from "react";
import { CalendarCheck, RotateCcw } from "lucide-react";
import { toLocalDateString } from "@/lib/utils";
import { usePeriodTransactions } from "@/hooks/usePeriodTransactions";
import { FinancePageHeader } from "@/components/finance/FinancePageHeader";
import { MonthNavigation } from "@/components/finance/MonthNavigation";
import { CalendarGrid } from "@/components/CalendarGrid";
import { CalendarDayDetail } from "@/components/CalendarDayDetail";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateString(new Date()));
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const start = toLocalDateString(new Date(year, month, 1));
  const end = toLocalDateString(new Date(year, month + 1, 1));
  const { transactions, isLoading, error, retry } = usePeriodTransactions(start, end);

  const dailyData = useMemo(() => {
    const data: Record<string, { income: number; expense: number; transfers: number }> = {};
    transactions.forEach((tx) => {
      const key = tx.date.slice(0, 10);
      if (!data[key]) data[key] = { income: 0, expense: 0, transfers: 0 };
      if (tx.type === "IN") data[key].income += tx.amount;
      else if (tx.type === "OUT") data[key].expense += tx.amount;
      else data[key].transfers += 1;
    });
    return data;
  }, [transactions]);
  const selectedTransactions = transactions.filter((tx) => tx.date.slice(0, 10) === selectedDate);

  function changeMonth(date: Date) {
    setCurrentDate(date);
    setSelectedDate(toLocalDateString(date));
  }

  return (
    <div className="finance-page finance-page--compact calendar-page">
      <FinancePageHeader title="Kalender" subtitle="Catatan keuangan dalam setiap hari." action={<button type="button" className="finance-icon-btn" aria-label="Hari ini" title="Hari ini" onClick={() => changeMonth(new Date())}><CalendarCheck size={21} /></button>} />
      <div className="calendar-layout">
      <section className="calendar-panel" aria-label="Kalender transaksi" aria-busy={isLoading}>
        <MonthNavigation date={currentDate} onChange={changeMonth} />
        <CalendarGrid year={year} month={month} dailyData={dailyData} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        <div className="calendar-legend" aria-label="Jenis transaksi">
          <span><i className="calendar-mark--income" />Pemasukan</span>
          <span><i className="calendar-mark--expense" />Pengeluaran</span>
          <span><i className="calendar-mark--transfer" />Transfer</span>
        </div>
      </section>
      {isLoading ? <p className="finance-feedback" role="status">Memuat transaksi bulan ini...</p> : error ? <div className="finance-feedback" role="alert"><p>{error}</p><button className="finance-command" onClick={retry}><RotateCcw size={16} />Coba lagi</button></div> : (
        <CalendarDayDetail date={selectedDate} transactions={selectedTransactions} />
      )}
      </div>
    </div>
  );
}
