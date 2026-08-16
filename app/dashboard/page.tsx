"use client";

import { useAppStore } from "@/lib/store";
import { formatCurrency, isThisMonth } from "@/lib/utils";
import { AppLayout } from "@/components/layout/AppLayout";
import { Transaction } from "@/types";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowUpRight, ArrowDownRight, Plus, Bot, Hand, Settings, Eye, EyeOff } from "lucide-react";

const ExpenseChart = dynamic(() => import("@/components/ExpenseChart"), { ssr: false });
const CategoryPieChart = dynamic(() => import("@/components/CategoryPieChart"), { ssr: false });
import { WalletIcon, CategoryIcon } from "@/lib/icons";
import { useMemo, useState } from "react";
import { LazyAddTransactionModal } from "@/components/transactions/LazyAddTransactionModal";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function DashboardPage() {
  const { user, wallets, transactions, budgets } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);

  const totalBalance = useMemo(
    () => wallets.reduce((sum, w) => sum + w.balance, 0),
    [wallets]
  );

  const thisMonthTx = useMemo(
    () => transactions.filter((t) => isThisMonth(t.date)),
    [transactions]
  );

  const totalIncome = useMemo(
    () => thisMonthTx.filter((t) => t.type === "IN").reduce((s, t) => s + t.amount, 0),
    [thisMonthTx]
  );

  const totalExpense = useMemo(
    () => thisMonthTx.filter((t) => t.type === "OUT").reduce((s, t) => s + t.amount, 0),
    [thisMonthTx]
  );

  // Build last 7 days chart data
  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("id-ID", { weekday: "short" });
      const dayExpense = transactions
        .filter((t) => t.date === dateStr && t.type === "OUT")
        .reduce((s, t) => s + t.amount, 0);
      days.push({ day: dayLabel, amount: dayExpense });
    }
    return days;
  }, [transactions]);

  const recentTransactions = useMemo(() =>
    [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [transactions]
  );

  return (
    <AppLayout>
      <div style={{ padding: "0 0 24px" }}>
        {/* Header */}
        <div
          style={{
            padding: "56px 20px 24px",
            background: "linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
            <div>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "4px" }}>
                Halo, {user?.name?.split(" ")[0] || "Pengguna"} <Hand size={14} style={{ display: "inline" }} />
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ThemeToggle />
              <Link
                href="/settings"
                aria-label="Pengaturan"
                title="Pengaturan"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "var(--green-dim)",
                  border: "1px solid var(--green-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--green)",
                  cursor: "pointer",
                }}
              >
                <Settings size={18} />
              </Link>
            </div>
          </div>

          {/* Balance Card */}
          <div
            style={{
              background: "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-2) 100%)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 4px 30px rgba(34, 197, 94, 0.08)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative element */}
            <div
              style={{
                position: "absolute",
                top: "-40px",
                right: "-40px",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: "rgba(34, 197, 94, 0.04)",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Total Saldo
              </p>
              <button
                type="button"
                onClick={() => setBalanceVisible((v) => !v)}
                aria-label={balanceVisible ? "Sembunyikan saldo" : "Tampilkan saldo"}
                title={balanceVisible ? "Sembunyikan saldo" : "Tampilkan saldo"}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  border: "none",
                  background: "transparent",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {balanceVisible ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p style={{ fontSize: "32px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "20px", letterSpacing: "-0.02em" }}>
              {balanceVisible ? formatCurrency(totalBalance) : "Rp ••••••••"}
            </p>
            <div style={{ display: "flex", gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "rgba(34, 197, 94, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ArrowUpRight size={14} color="var(--green)" />
                </div>
                <div>
                  <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>Pemasukan</p>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--green)" }}>{formatCurrency(totalIncome)}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "var(--overlay)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ArrowDownRight size={14} color="var(--text-secondary)" />
                </div>
                <div>
                  <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>Pengeluaran</p>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{formatCurrency(totalExpense)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "0 20px" }}>
          {/* Quick Actions */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                flex: 1,
                background: "var(--green)",
                color: "var(--on-accent)",
                border: "none",
                borderRadius: "10px",
                padding: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <Plus size={16} />
              Tambah Transaksi
            </button>
            <Link
              href="/ai-assistant"
              style={{
                padding: "12px 16px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--text-secondary)",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              <Bot size={16} color="var(--green)" />
              Tanya AI
            </Link>
          </div>

          <ExpenseChart data={chartData} />

          <CategoryPieChart transactions={thisMonthTx} />

          {/* Wallets */}
          <p style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "12px" }}>
            Dompet Saya
          </p>
          <div style={{ display: "flex", gap: "10px", marginBottom: "24px", overflowX: "auto", paddingBottom: "4px" }}>
            {wallets.map((wallet) => (
              <Link
                key={wallet.id}
                href="/wallets"
                style={{
                  minWidth: "140px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "14px",
                  textDecoration: "none",
                }}
              >
                <p style={{ marginBottom: "8px" }}>
                  <WalletIcon icon={wallet.icon} size={22} />
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>{wallet.name}</p>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{formatCurrency(wallet.balance)}</p>
              </Link>
            ))}
          </div>

          {/* Recent Transactions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Transaksi Terbaru
            </p>
            <Link href="/transactions" style={{ fontSize: "12px", color: "var(--green)", textDecoration: "none" }}>
              Lihat semua
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recentTransactions.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))}
          </div>
        </div>
      </div>

      {showAddModal && (
        <LazyAddTransactionModal onClose={() => setShowAddModal(false)} />
      )}

      </AppLayout>
  );
}

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const isIncome = transaction.type === "IN";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: isIncome ? "rgba(34, 197, 94, 0.12)" : "var(--overlay-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <CategoryIcon category={transaction.category} size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {transaction.description}
        </p>
        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          {transaction.category} · {new Date(transaction.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
        </p>
      </div>
      <p style={{ fontSize: "14px", fontWeight: 600, color: isIncome ? "var(--green)" : "var(--text-primary)", flexShrink: 0 }}>
        {isIncome ? "+" : "-"}{formatCurrency(transaction.amount)}
      </p>
    </div>
  );
}
