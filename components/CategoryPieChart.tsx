"use client";

import { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { PieChartIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Transaction } from "@/types";

const CATEGORY_COLORS: Record<string, string> = {
  "Makanan & Minuman": "#E96A6A",
  "Transportasi": "#5A8FD8",
  "Hiburan": "#D9AE4A",
  "Investasi": "#4FA69A",
  "Belanja": "#8578D1",
  "Kesehatan": "#E7956D",
  "Pendidikan": "#8993A3",
  "Tagihan & Utilitas": "#72AA91",
  "Tabungan": "#C4C9D1",
  "Gaji & Penghasilan": "#4675BD",
  "Hadiah": "#CE6D88",
  "Lainnya": "#A5A9B1",
};

const DEFAULT_COLOR = "var(--text-muted)";

const COLLAPSED_MAX = 3;

type CategoryTooltipItem = {
  payload?: {
    name: string;
    value: number;
    percentage: string;
  };
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: CategoryTooltipItem[];
}) {
  const data = payload?.[0]?.payload;

  if (active && data) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-title">
          {data.name}
        </p>
        <p className="chart-tooltip-value">
          {formatCurrency(data.value)}
        </p>
        <p className="chart-tooltip-note">
          {data.percentage}%
        </p>
      </div>
    );
  }
  return null;
}

function getMonthDateRange(): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startDay = 1;
  const endDay = new Date(year, month + 1, 0).getDate();
  const monthName = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(now);
  return {
    start: `${startDay} ${monthName} ${year}`,
    end: `${endDay} ${monthName} ${year}`,
  };
}

export default function CategoryPieChart({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const [expanded, setExpanded] = useState(false);

  const data = useMemo(() => {
    const expenseByCategory: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "OUT")
      .forEach((t) => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      });

    const total = Object.values(expenseByCategory).reduce((s, v) => s + v, 0);
    if (total === 0) return [];

    return Object.entries(expenseByCategory)
      .map(([name, value]) => ({
        name,
        value,
        percentage: ((value / total) * 100).toFixed(1),
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const totalExpense = useMemo(
    () => transactions.filter((t) => t.type === "OUT").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const dateRange = getMonthDateRange();
  const visibleData = data.slice(0, COLLAPSED_MAX);
  const hiddenCount = data.length - COLLAPSED_MAX;

  return (
    <div className="chart-card chart-card--expense">
      <div className="expense-info">
        <div className="expense-info-head">
          <PieChartIcon size={14} color="var(--green)" />
          <p className="chart-title">Pengeluaran Bulan Ini</p>
        </div>
        <p className="expense-date-range">
          {dateRange.start} - {dateRange.end}
        </p>
        <p className="expense-total">{formatCurrency(totalExpense)}</p>
        {data.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="expense-detail-link"
          >
            {expanded ? "Sembunyikan" : "Lihat Detail"}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      <div className="expense-chart">
        {data.length === 0 ? (
          <p className="chart-empty">Belum ada pengeluaran bulan ini</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={110}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={45}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={CATEGORY_COLORS[entry.name] || DEFAULT_COLOR}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {expanded && data.length > 0 && (
        <div className="expense-category-full">
          {data.map((item) => (
            <div key={item.name} className="expense-category-row">
              <div className="expense-category-left">
                <div
                  className="expense-category-dot"
                  style={{ background: CATEGORY_COLORS[item.name] || DEFAULT_COLOR }}
                />
                <span className="expense-category-name">{item.name}</span>
              </div>
              <div className="expense-category-right">
                <span className="expense-category-pct">{item.percentage}%</span>
                <span className="expense-category-val">{formatCurrency(item.value)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
