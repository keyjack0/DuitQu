"use client";

import { useAppStore } from "@/lib/store";
import { formatCurrency, isThisMonth } from "@/lib/utils";
import { Transaction } from "@/types";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowUpRight, ArrowDownRight, Plus, Bot, Settings, Eye, EyeOff } from "lucide-react";

const ExpenseChart = dynamic(() => import("@/components/ExpenseChart"), { ssr: false });
const CategoryPieChart = dynamic(() => import("@/components/CategoryPieChart"), { ssr: false });
import { WalletIcon, CategoryIcon } from "@/lib/icons";
import { useMemo, useState } from "react";
import { LazyAddTransactionModal } from "@/components/transactions/LazyAddTransactionModal";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function DashboardPage() {
  const { user, wallets, transactions, monthTransactions } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);

  const totalBalance = useMemo(
    () => wallets.reduce((sum, w) => sum + w.balance, 0),
    [wallets]
  );

  // Gabungkan list paginated + transaksi bulan berjalan (dedupe by id)
  const allTx = useMemo(() => {
    const seen = new Set<string>();
    const merged: Transaction[] = [];
    for (const t of [...transactions, ...monthTransactions]) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        merged.push(t);
      }
    }
    return merged;
  }, [transactions, monthTransactions]);

  const thisMonthTx = useMemo(
    () => allTx.filter((t) => isThisMonth(t.date)),
    [allTx]
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
      const dayExpense = allTx
        .filter((t) => t.date === dateStr && t.type === "OUT")
        .reduce((s, t) => s + t.amount, 0);
      days.push({ day: dayLabel, amount: dayExpense });
    }
    return days;
  }, [allTx]);

  const recentTransactions = useMemo(() =>
    [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [transactions]
  );

  return (
    <>
      <div className="dashboard">
        {/* Header */}
        <div className="dashboard-hero">
          <div className="dashboard-container">
            <div className="dashboard-topbar">
              <div>
                <p className="dashboard-greeting">
                  Hay, {user?.name?.split(" ")[0] || "Pengguna"} 
                </p>
                <h1 className="dashboard-title">
                  Welcome Back Sir!
                </h1>
              </div>
              <div className="dashboard-header-actions">
                <ThemeToggle />
                <Link
                  href="/settings"
                  aria-label="Pengaturan"
                  title="Pengaturan"
                  className="dashboard-icon-button"
                >
                  <Settings size={18} />
                </Link>
              </div>
            </div>

            {/* Balance Card */}
            <div className="dashboard-balance-card">
              <div className="dashboard-balance-label-row">
                <p className="dashboard-balance-label">
                  Total Saldo
                </p>
                <button
                  type="button"
                  onClick={() => setBalanceVisible((v) => !v)}
                  aria-label={balanceVisible ? "Sembunyikan saldo" : "Tampilkan saldo"}
                  title={balanceVisible ? "Sembunyikan saldo" : "Tampilkan saldo"}
                  className="dashboard-balance-toggle"
                >
                  {balanceVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="dashboard-balance-amount">
                {balanceVisible ? formatCurrency(totalBalance) : "Rp ******"}
              </p>
              {/* <div className="dashboard-balance-stats">
                <div className="dashboard-balance-stat">
                  <div className="dashboard-balance-stat-icon">
                    <ArrowUpRight size={14} color="#ffffff" />
                  </div>
                  <div>
                    <p className="dashboard-balance-stat-label">Pemasukan</p>
                    <p className="dashboard-balance-stat-value">{formatCurrency(totalIncome)}</p>
                  </div>
                </div>
                <div className="dashboard-balance-stat">
                  <div className="dashboard-balance-stat-icon">
                    <ArrowDownRight size={14} color="#ffffff" />
                  </div>
                  <div>
                    <p className="dashboard-balance-stat-label">Pengeluaran</p>
                    <p className="dashboard-balance-stat-value">{formatCurrency(totalExpense)}</p>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>

        <div className="dashboard-container dashboard-content">
          <div className="dashboard-column">
            {/* Quick Actions */}
            <div className="dashboard-quick-actions">
              <button
                onClick={() => setShowAddModal(true)}
                className="dashboard-action dashboard-action--primary"
              >
                <Plus size={16} />
                Tambah Transaksi
              </button>
              <Link href="/ai-assistant" className="dashboard-action dashboard-action--secondary">
                <Bot size={16} color="var(--green)" />
                Tanya AI
              </Link>
            </div>

            {/* Charts Data */}
            <div className="dashboard-column">
              <ExpenseChart data={chartData} />
              <CategoryPieChart transactions={thisMonthTx} />
            </div>

            {/* Wallets */}
            <div className="dashboard-section-head">
              <p className="dashboard-section-title">
                Dompet Saya
              </p>
              <Link href="/wallets" className="dashboard-section-link">
                Lihat semua
              </Link>
            </div>
            <div className="dashboard-wallet-list">
              {wallets.map((wallet) => (
                <Link
                  key={wallet.id}
                  href="/wallets"
                  className="wallet-row"
                >
                  <div className="wallet-row-icon">
                    <WalletIcon icon={wallet.icon} size={20} />
                  </div>
                  <p className="wallet-row-name">{wallet.name}</p>
                  <p className="wallet-row-balance">{formatCurrency(wallet.balance)}</p>
                </Link>
              ))}
            </div>

            {/* Recent Transactions */}
            <div className="dashboard-section-head">
              <p className="dashboard-section-title">
                Transaksi Terbaru
              </p>
              <Link href="/transactions" className="dashboard-section-link">
                Lihat semua
              </Link>
            </div>
            <div className="dashboard-tx-list">
              {recentTransactions.map((tx) => (
                <TransactionItem key={tx.id} transaction={tx} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <LazyAddTransactionModal onClose={() => setShowAddModal(false)} />
      )}
    </>
  );
}

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const isIncome = transaction.type === "IN";

  return (
    <div className="transaction-item">
      <div
        className={`transaction-icon ${isIncome ? "transaction-icon--income" : "transaction-icon--expense"}`}
      >
        <CategoryIcon category={transaction.category} size={16} />
      </div>
      <div className="transaction-info">
        <p className="transaction-desc">
          {transaction.description}
        </p>
        <p className="transaction-category">
          {transaction.category}
        </p>
        <p className="transaction-date">
          {new Date(transaction.date).toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
      <p className={`transaction-amount ${isIncome ? "transaction-amount--income" : ""}`}>
        {isIncome ? "+" : "-"}{formatCurrency(transaction.amount)}
      </p>
    </div>
  );
}
