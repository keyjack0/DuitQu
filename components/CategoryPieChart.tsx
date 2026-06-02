"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { PieChartIcon } from "lucide-react";
import { Transaction } from "@/types";

const CATEGORY_COLORS: Record<string, string> = {
  "Makanan & Minuman": "#FF6384",
  "Transportasi": "#36A2EB",
  "Hiburan": "#FFCE56",
  "Investasi": "#4BC0C0",
  "Belanja": "#9966FF",
  "Kesehatan": "#FF9F40",
  "Pendidikan": "#C9CBCF",
  "Tagihan & Utilitas": "#7BC8A4",
  "Tabungan": "#E7E9ED",
  "Gaji & Penghasilan": "#36A2EB",
  "Hadiah": "#FF6384",
  "Lainnya": "#666666",
};

const DEFAULT_COLOR = "#666666";

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
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
        <p style={{ color: "#f5f5f5", fontWeight: 600, marginBottom: "4px" }}>
          {data.name}
        </p>
        <p style={{ color: "#22c55e", fontWeight: 600 }}>
          {formatCurrency(data.value)}
        </p>
        <p style={{ color: "#666666", marginTop: "2px" }}>
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
        <PieChartIcon size={14} color="#22c55e" />
        <p
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#a0a0a0",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Pengeluaran Bulan Ini
        </p>
      </div>

      {data.length === 0 ? (
        <p style={{ textAlign: "center", color: "#555555", fontSize: "13px", padding: "20px 0" }}>
          Belum ada pengeluaran bulan ini
        </p>
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

          <div style={{ marginTop: "12px" }}>
            {data.map((item) => (
              <div
                key={item.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "4px 0",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: CATEGORY_COLORS[item.name] || DEFAULT_COLOR,
                    flexShrink: 0,
                  }}
                />
                <p
                  style={{
                    flex: 1,
                    fontSize: "11px",
                    color: "#a0a0a0",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.name}
                </p>
                <p style={{ fontSize: "11px", color: "#555555", width: "36px", textAlign: "right" }}>
                  {item.percentage}%
                </p>
                <p style={{ fontSize: "11px", color: "#f5f5f5", fontWeight: 600, width: "80px", textAlign: "right" }}>
                  {formatCurrency(item.value)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
