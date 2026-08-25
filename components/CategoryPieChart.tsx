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
import { ChevronDown, PieChartIcon } from "lucide-react";
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

  return (
    <div className="chart-card">
      <div className="chart-head">
        <PieChartIcon size={14} color="var(--green)" />
        <p className="chart-title">Pengeluaran Bulan Ini</p>
      </div>

      {data.length === 0 ? (
        <p className="chart-empty">Belum ada pengeluaran bulan ini</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
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

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="chart-toggle"
            aria-expanded={expanded}
          >
            {expanded ? "Sembunyikan detail" : "Lihat detail"}
            <ChevronDown size={14} className={`chart-toggle-icon ${expanded ? "chart-toggle-icon--open" : ""}`} />
          </button>

          {expanded && (
            <div className="pie-legend">
              {data.map((item) => (
                <div key={item.name} className="pie-legend-item">
                  <div
                    className="pie-legend-dot"
                    style={{ background: CATEGORY_COLORS[item.name] || DEFAULT_COLOR }}
                  />
                  <p className="pie-legend-name">{item.name}</p>
                  <p className="pie-legend-pct">{item.percentage}%</p>
                  <p className="pie-legend-val">{formatCurrency(item.value)}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
