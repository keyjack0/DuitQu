"use client";

/** Menyajikan ringkasan saldo, arus kas, dan transaksi terbaru pengguna. */
import { useAppStore } from "@/lib/store";
import { formatCurrency, isThisMonth, toLocalDateString } from "@/lib/utils";
import { Transaction } from "@/types";
import { buildExpenseChartData } from "@/lib/expenseChart";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Plus, Bot, Eye, EyeOff, Target, Calendar, BarChart3, PieChart, ArrowLeftRight } from "lucide-react";
import { WalletIcon, CategoryIcon, WALLET_COLORS } from "@/lib/icons";
import { CATEGORY_COLORS } from "@/lib/categoryColors";
import { useMemo, useState } from "react";
import { LazyAddTransactionModal } from "@/components/transactions/LazyAddTransactionModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChartSkeleton, DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { useShallow } from "zustand/react/shallow";

const ExpenseChart = dynamic(() => import("@/components/ExpenseChart"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
const CategoryPieChart = dynamic(() => import("@/components/CategoryPieChart"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

export default function DashboardPage() {
  const { user, wallets, transactions, monthTransactions, lastMonthTransactions, isLoading } = useAppStore(
    useShallow((state) => ({
      user: state.user,
      wallets: state.wallets,
      transactions: state.transactions,
      monthTransactions: state.monthTransactions,
      lastMonthTransactions: state.lastMonthTransactions,
      isLoading: state.isLoading,
    }))
  );
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

  // Include the previous month only for this chart's rolling date range.
  const chartData = useMemo(
    () => buildExpenseChartData([...allTx, ...lastMonthTransactions]),
    [allTx, lastMonthTransactions]
  );

  const recentTransactions = useMemo(() =>
    [...transactions]
      .sort((a, b) =>
        b.date.localeCompare(a.date) ||
        (b.created_at ?? "").localeCompare(a.created_at ?? "") ||
        b.id.localeCompare(a.id)
      )
      .slice(0, 5),
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

  if (isLoading && wallets.length === 0 && transactions.length === 0) {
    return <DashboardSkeleton />;
  }

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
                  {balanceVisible ? <EyeOff size={18} /> : <Eye size={18} />}
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
          <div className="dashboard-column dashboard-main-grid">
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
            <div className="dashboard-chart-grid">
              <ExpenseChart data={chartData} />
              <CategoryPieChart transactions={thisMonthTx} />
            </div>

            {/* Menu Lanjutan */}
            <section className="dashboard-advanced">
              <div className="dashboard-section-head">
                <p className="dashboard-section-title">Menu Lanjutan</p>
              </div>
              <div className="dashboard-feature-card">
                <div className="dashboard-feature-nav">
                  <Link href="/goals" className="dashboard-feature-item">
                    <PieChart size={20} className="dashboard-feature-icon" />
                    <span className="dashboard-feature-label">Goals</span>
                  </Link>
                  <Link href="/calendar" className="dashboard-feature-item">
                    <Calendar size={20} className="dashboard-feature-icon" />
                    <span className="dashboard-feature-label">Kalender</span>
                  </Link>
                  <Link href="/budgets" className="dashboard-feature-item">
                    <Target size={20} className="dashboard-feature-icon" />
                    <span className="dashboard-feature-label">Budget</span>
                  </Link>
                  <Link href="/report" className="dashboard-feature-item">
                    <BarChart3 size={20} className="dashboard-feature-icon" />
                    <span className="dashboard-feature-label">Laporan</span>
                  </Link>
                </div>
              </div>
            </section>

            <div className="dashboard-lists-grid">
              {/* Wallets */}
              <section className="dashboard-list-panel">
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
              </section>

              {/* Recent Transactions */}
              <section className="dashboard-list-panel">
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
              </section>
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
  const isTransfer = transaction.type === "TRANSFER";
  const wallets = useAppStore((s) => s.wallets);
  const sourceWallet = wallets.find((wallet) => wallet.id === transaction.wallet_id);
  const destinationWallet = wallets.find((wallet) => wallet.id === transaction.to_wallet_id);
  const categoryColor = CATEGORY_COLORS[transaction.category] || "#888888";

  return (
    <div className="transaction-item">
      <div
        className="transaction-icon"
        style={isTransfer ? {
          backgroundColor: "var(--overlay)",
          color: "var(--text-secondary)",
        } : {
          backgroundColor: `${categoryColor}1f`,
          color: categoryColor,
        }}
      >
        {isTransfer
          ? <ArrowLeftRight size={20} />
          : <CategoryIcon category={transaction.category} color="currentColor" />}
      </div>
      <div className="transaction-info">
        <p className="transaction-desc">
          {transaction.description}
        </p>
        <div className="transaction-meta">
          <span
            className="transaction-category"
            style={isTransfer ? {
              backgroundColor: "var(--overlay)",
              color: "var(--text-secondary)",
            } : {
              backgroundColor: `${categoryColor}1f`,
              color: categoryColor,
            }}
          >
            {transaction.category}
          </span>
          {isTransfer ? (
            <span className="transaction-transfer-route">
              {sourceWallet?.name || "Dompet asal"} &rarr; {destinationWallet?.name || "Dompet tujuan"}
            </span>
          ) : sourceWallet && (() => {
            const walletColor = sourceWallet.color || WALLET_COLORS[sourceWallet.icon || ""] || "#888";
            return (
              <>
                <span className="text-faint"> &nbsp;</span>
                <span
                  className="transaction-wallet"
                  style={{ backgroundColor: `${walletColor}1f`, color: walletColor }}
                >
                  {sourceWallet.name}
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
      <p className={`transaction-amount ${isIncome ? "transaction-amount--income" : ""} ${isTransfer ? "transaction-amount--transfer" : ""}`}>
        {isTransfer ? "" : isIncome ? "+" : "-"}{formatCurrency(transaction.amount)}
      </p>
    </div>
  );
}
