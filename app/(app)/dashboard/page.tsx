"use client";

import { useAppStore } from "@/lib/store";
import { formatCurrency, isThisMonth, isLastMonth, toLocalDateString } from "@/lib/utils";
import { Transaction } from "@/types";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowUpRight, ArrowDownRight, Plus, Bot, Settings, Eye, EyeOff, TrendingUp, TrendingDown } from "lucide-react";

const ExpenseChart = dynamic(() => import("@/components/ExpenseChart"), { ssr: false });
const CategoryPieChart = dynamic(() => import("@/components/CategoryPieChart"), { ssr: false });
import { WalletIcon, CategoryIcon, WALLET_COLORS } from "@/lib/icons";
import { CATEGORY_COLORS } from "@/lib/categoryColors";
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

  const lastMonthIncome = useMemo(
    () => allTx.filter((t) => t.type === "IN" && isLastMonth(t.date)).reduce((s, t) => s + t.amount, 0),
    [allTx]
  );

  const incomeChange = useMemo(() => {
    if (lastMonthIncome === 0) return totalIncome > 0 ? 100 : 0;
    return ((totalIncome - lastMonthIncome) / lastMonthIncome) * 100;
  }, [totalIncome, lastMonthIncome]);

  // Build last 7 days chart data
  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = toLocalDateString(d);
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

  // Minggu berjalan (Senin - Minggu)
  const weekRange = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: toLocalDateString(monday),
      end: toLocalDateString(sunday),
    };
  }, []);

  const weekTx = useMemo(
    () => allTx.filter((t) => t.date >= weekRange.start && t.date <= weekRange.end),
    [allTx, weekRange]
  );

  const weekIncome = useMemo(
    () => weekTx.filter((t) => t.type === "IN").reduce((s, t) => s + t.amount, 0),
    [weekTx]
  );

  const weekExpense = useMemo(
    () => weekTx.filter((t) => t.type === "OUT").reduce((s, t) => s + t.amount, 0),
    [weekTx]
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
              {/* {balanceVisible && (
                <div className="dashboard-balance-trend">
                  {incomeChange >= 0 ? (
                    <TrendingUp size={12} className="dashboard-balance-trend-icon--up" />
                  ) : (
                    <TrendingDown size={12} className="dashboard-balance-trend-icon--down" />
                  )}
                  <span className={`dashboard-balance-trend-text ${incomeChange >= 0 ? "dashboard-balance-trend-text--up" : "dashboard-balance-trend-text--down"}`}>
                    {incomeChange >= 0 ? "+" : ""}
                    {incomeChange.toFixed(1)}%
                  dari bulan lalu
                  </span>
                </div>
              )} */}
              {balanceVisible && (
                <div >
                  <p className="dashboard-balance-trend-text">
                    ini sisa uang mu sekarang, jangan lupa untuk menabung yaa
                  </p>
                </div>)}
              {balanceVisible && (
                <div className="dashboard-balance-weekly">
                  <div className="dashboard-balance-stat">
                    <span className="dashboard-balance-stat-label">Pemasukan</span>
                    <span className="dashboard-balance-stat-value dashboard-balance-stat-value--income">
                      {formatCurrency(weekIncome)}
                    </span>
                  </div>
                  <div className="dashboard-balance-stat">
                    <span className="dashboard-balance-stat-label">Pengeluaran</span>
                    <span className="dashboard-balance-stat-value dashboard-balance-stat-value--expense">
                      {formatCurrency(weekExpense)}
                    </span>
                  </div>
                </div>
              )}
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
              <Link href="/ai-assistant" className="dashboard-action dashboard-action--green">
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
                  <div
                    className="wallet-row-icon"
                    style={{ backgroundColor: `${WALLET_COLORS[wallet.icon ?? ""] || "var(--text-muted)"}1f` }}
                  >
                    <WalletIcon icon={wallet.icon} size={20} color={WALLET_COLORS[wallet.icon ?? ""] || "var(--text-muted)"} />
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
  const wallets = useAppStore((s) => s.wallets);

  return (
    <div className="transaction-item">
      <div
        className="transaction-icon"
        style={{
          backgroundColor: `${CATEGORY_COLORS[transaction.category]}1f`,
          color: CATEGORY_COLORS[transaction.category],
        }}
      >
        <CategoryIcon category={transaction.category} size={16} color="currentColor" />
      </div>
      <div className="transaction-info">
        <p className="transaction-desc">
          {transaction.description}
        </p>
        <div className="transaction-meta">
          <span
            className="transaction-category"
            style={{ backgroundColor: `${CATEGORY_COLORS[transaction.category]}1f`, color: CATEGORY_COLORS[transaction.category] }}
          >
            {transaction.category}
          </span>
          {transaction.wallet_id && (() => {
            const wallet = wallets.find((w) => w.id === transaction.wallet_id);
            if (!wallet) return null;
            const walletColor = wallet.color || WALLET_COLORS[wallet.icon || ""] || "#888";
            return (
              <>
                <span className="text-faint"> &nbsp;</span>
                <span
                  className="transaction-wallet"
                  style={{ backgroundColor: `${walletColor}1f`, color: walletColor }}
                >
                  {wallet.name}
                </span>
              </>
            );
          })()}
        </div>
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
