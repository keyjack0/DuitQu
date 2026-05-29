"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#161616",
          border: "1px solid #2a2a2a",
          borderRadius: "8px",
          padding: "8px 12px",
          fontSize: "12px",
        }}
      >
        <p style={{ color: "#22c55e", fontWeight: 600 }}>
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
        background: "#161616",
        border: "1px solid #2a2a2a",
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
        <TrendingUp size={14} color="#22c55e" />
        <p
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#a0a0a0",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Pengeluaran 7 Hari Terakhir
        </p>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data}>
          <XAxis dataKey="day" axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: "#22c55e", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#22c55e", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
