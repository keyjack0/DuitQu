"use client";

/** Menampilkan arus kas, kategori, dan transaksi terbaru untuk satu dompet. */
import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrency, isThisMonth } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/categoryColors";
import { useShallow } from "zustand/react/shallow";

interface WalletDetailProps {
  walletId: string;
}

export function WalletDetail({ walletId }: WalletDetailProps) {
  const { transactions, monthTransactions } = useAppStore(
    useShallow((state) => ({
      transactions: state.transactions,
      monthTransactions: state.monthTransactions,
    }))
  );

  const walletMonthTx = useMemo(() => {
    return monthTransactions.filter(
      (tx) => tx.wallet_id === walletId && isThisMonth(tx.date)
    );
  }, [monthTransactions, walletId]);

  const totalExpense = useMemo(
    () => walletMonthTx.filter((t) => t.type === "OUT").reduce((s, t) => s + t.amount, 0),
    [walletMonthTx]
  );

  const totalIncome = useMemo(
    () => walletMonthTx.filter((t) => t.type === "IN").reduce((s, t) => s + t.amount, 0),
    [walletMonthTx]
  );

  const categoryData = useMemo(() => {
    const expenseByCategory: Record<string, number> = {};
    walletMonthTx
      .filter((t) => t.type === "OUT")
      .forEach((t) => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      });

    return Object.entries(expenseByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [walletMonthTx]);

  const recentTransactions = useMemo(() => {
    return transactions
      .filter((tx) => tx.wallet_id === walletId || tx.to_wallet_id === walletId)
      .slice(0, 5);
  }, [transactions, walletId]);

  const maxCategoryValue = categoryData[0]?.value || 1;

  return (
    <div className="wallet-detail">
      <div className="wallet-detail-summary">
        <div className="wallet-detail-summary-card">
          <span className="wallet-detail-summary-label">Pemasukan bulan ini</span>
          <span className="wallet-detail-summary-value wallet-detail-summary-value--income">
            +{formatCurrency(totalIncome)}
          </span>
        </div>
        <div className="wallet-detail-summary-card">
          <span className="wallet-detail-summary-label">Pengeluaran bulan ini</span>
          <span className="wallet-detail-summary-value wallet-detail-summary-value--expense">
            -{formatCurrency(totalExpense)}
          </span>
        </div>
      </div>

      {categoryData.length > 0 && (
        <div className="wallet-detail-section">
          <p className="wallet-detail-title">Pengeluaran per Kategori</p>
          <div className="wallet-detail-categories">
            {categoryData.map((cat) => (
              <div key={cat.name} className="wallet-detail-cat-row">
                <div className="wallet-detail-cat-left">
                  <div
                    className="wallet-detail-cat-dot"
                    style={{ background: CATEGORY_COLORS[cat.name] || "#64748b" }}
                  />
                  <span className="wallet-detail-cat-name">{cat.name}</span>
                </div>
                <div className="wallet-detail-cat-right">
                  <div className="wallet-detail-cat-bar-wrap">
                    <div
                      className="wallet-detail-cat-bar"
                      style={{
                        width: `${(cat.value / maxCategoryValue) * 100}%`,
                        background: CATEGORY_COLORS[cat.name] || "#64748b",
                      }}
                    />
                  </div>
                  <span className="wallet-detail-cat-value">{formatCurrency(cat.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {categoryData.length === 0 && totalExpense === 0 && (
        <p className="wallet-detail-empty">Belum ada pengeluaran bulan ini</p>
      )}

      {recentTransactions.length > 0 && (
        <div className="wallet-detail-section">
          <p className="wallet-detail-title">Transaksi Terbaru</p>
          <div className="wallet-detail-tx-list">
            {recentTransactions.map((tx) => {
              const isTransfer = tx.type === "TRANSFER";
              const isIncomingTransfer = isTransfer && tx.to_wallet_id === walletId;
              const isIncome = tx.type === "IN" || isIncomingTransfer;
              const categoryColor = CATEGORY_COLORS[tx.category] || "#64748b";
              return (
                <div key={tx.id} className="wallet-detail-tx">
                  <div
                    className="wallet-detail-tx-icon"
                    style={{
                      backgroundColor: `${categoryColor}1f`,
                      color: categoryColor,
                    }}
                  >
                    <span className="text-[10px]">
                      {isIncome ? "+" : "-"}
                    </span>
                  </div>
                  <div className="wallet-detail-tx-info">
                    <p className="wallet-detail-tx-desc">
                      {isIncomingTransfer ? "Transfer masuk" : tx.description || tx.category}
                    </p>
                    <p className="wallet-detail-tx-date">
                      {new Date(tx.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <p className={`wallet-detail-tx-amount ${isTransfer ? "wallet-detail-tx-amount--transfer" : isIncome ? "wallet-detail-tx-amount--income" : ""}`}>
                    {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
