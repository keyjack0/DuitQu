"use client";

/** Merender kisi kalender bulanan dengan indikator aktivitas transaksi harian. */
import { toLocalDateString, formatCurrency } from "@/lib/utils";
import type { KeyboardEvent } from "react";

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

interface CalendarGridProps {
  year: number;
  month: number;
  dailyData: Record<string, { income: number; expense: number; transfers?: number }>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

export function CalendarGrid({ year, month, dailyData, selectedDate, onSelectDate }: CalendarGridProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = toLocalDateString(new Date());
  const focusDate = selectedDate ?? (today.startsWith(toLocalDateString(new Date(year, month, 1)).slice(0, 7)) ? today : toLocalDateString(new Date(year, month, 1)));

  function navigate(event: KeyboardEvent<HTMLButtonElement>, day: number) {
    const weekday = new Date(year, month, day).getDay();
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -weekday, End: 6 - weekday };
    if (!(event.key in offsets)) return;
    event.preventDefault();
    const next = Math.min(daysInMonth, Math.max(1, day + offsets[event.key]));
    onSelectDate(toLocalDateString(new Date(year, month, next)));
    event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-day="${next}"]`)?.focus();
  }

  return (
    <div className="calendar-grid" role="group" aria-label="Tanggal dalam bulan">
      {WEEKDAYS.map((day) => <div key={day} className="calendar-day-header" aria-hidden="true">{day}</div>)}
      {Array.from({ length: 42 }, (_, index) => {
        const day = index - firstDay + 1;
        if (day < 1 || day > daysInMonth) return <div key={index} className="calendar-day calendar-day--empty" aria-hidden="true" />;
        const date = new Date(year, month, day);
        const key = toLocalDateString(date);
        const data = dailyData[key];
        const label = date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        const summary = data ? `, pemasukan ${formatCurrency(data.income)}, pengeluaran ${formatCurrency(data.expense)}${data.transfers ? `, ${data.transfers} transfer` : ""}` : ", tidak ada transaksi";
        return (
          <button key={key} type="button" data-day={day}
            className={`calendar-day${key === selectedDate ? " calendar-day--selected" : ""}${key === today ? " calendar-day--today" : ""}`}
            aria-label={label + summary} aria-pressed={key === selectedDate} aria-current={key === today ? "date" : undefined}
            tabIndex={key === focusDate ? 0 : -1}
            onClick={() => onSelectDate(key)} onKeyDown={(event) => navigate(event, day)}>
            <span className="calendar-day-number">{day}</span>
            <span className="calendar-day-marks" aria-hidden="true">
              {data && data.income > 0 && <i className="calendar-mark--income" />}
              {data && data.expense > 0 && <i className="calendar-mark--expense" />}
              {!!data?.transfers && <i className="calendar-mark--transfer" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
