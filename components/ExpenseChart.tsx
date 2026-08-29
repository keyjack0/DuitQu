"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-value">
          {formatCurrency(payload[0]?.value || 0)}
        </p>
      </div>
    );
  }
  return null;
}

export default function ExpenseChart({
  data,
}: {
  data: { day: string; amount: number }[];
}) {
  return (
    <div className="chart-card">
      <div className="chart-head">
        {/* <TrendingUp size={14} color="var(--green)" /> */}
        <p className="chart-title">Pengeluaran 7 Hari Terakhir</p>
      </div>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <linearGradient id="expenseArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--green)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--green)" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data}>
          <XAxis dataKey="day" axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="var(--green)"
            strokeWidth={2}
            fill="url(#expenseArea)"
            dot={{ fill: "var(--green)", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "var(--green)", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
