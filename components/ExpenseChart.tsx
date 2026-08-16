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
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "8px 12px",
          fontSize: "12px",
        }}
      >
        <p style={{ color: "var(--green)", fontWeight: 600 }}>
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
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "18px",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <TrendingUp size={14} color="var(--green)" />
        <p
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--text-secondary)",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Pengeluaran 7 Hari Terakhir
        </p>
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
