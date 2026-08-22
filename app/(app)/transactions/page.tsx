"use client";

import { useState, useMemo, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { LazyAddTransactionModal } from "@/components/transactions/LazyAddTransactionModal";
import { Plus, Search, Trash2, Pencil, Inbox } from "lucide-react";
import { CategoryIcon } from "@/lib/icons";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SwipeableRow } from "@/components/ui/SwipeableRow";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { Transaction } from "@/types";

const PAGE_SIZE = 10;

export default function TransactionsPage() {
  const { user, transactions, deleteTransaction, fetchMoreTransactions } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const filtered = useMemo(() => {
    const result = transactions.filter((t) => {
      const matchSearch =
        search === "" ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === "all" || t.category === filterCategory;
      const matchType = filterType === "all" || t.type === filterType;
      return matchSearch && matchCat && matchType;
    });
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, search, filterCategory, filterType]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach((t) => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const loadMore = useCallback(async () => {
    if (!user || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const result = await fetchMoreTransactions(user.id, transactions.length, PAGE_SIZE);
    setHasMore(result.hasMore);
    setLoadingMore(false);
  }, [user, loadingMore, hasMore, fetchMoreTransactions, transactions.length]);

  const sentinelRef = useInfiniteScroll(loadMore, hasMore && !loadingMore && grouped.length > 0);

  return (
    <>
      <div className="page-shell">
        {/* Header */}
        <div className="page-hero pb-4">
          <div className="page-title-row mb-4">
            <h1 className="page-title">Transaksi</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="icon-btn-square icon-btn-square--primary"
            >
              <Plus size={18} color="var(--on-accent)" strokeWidth={2.5} />
            </button>
          </div>

          {/* Search */}
          <div className="search-wrap">
            <Search size={14} color="var(--text-muted)" className="absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Cari transaksi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input form-input--search"
            />
          </div>

          {/* Filters */}
          <div className="filter-row">
            {["all", "IN", "OUT"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`chip ${filterType === t ? "chip--active" : ""}`}
              >
                {t === "all" ? "Semua" : t === "IN" ? "Pemasukan" : "Pengeluaran"}
              </button>
            ))}
          </div>
        </div>

        <div className="page-body">
          {grouped.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon"><Inbox size={32} color="var(--text-muted)" /></p>
              <p>Belum ada transaksi</p>
            </div>
          ) : (
            grouped.map(([date, txs]) => {
              const dayExpense = txs
                .filter((t) => t.type === "OUT")
                .reduce((s, t) => s + t.amount, 0);
              return (
              <div key={date} className="tx-group">
                <div className="tx-day-row">
                  <p className="tx-day-label">
                    {new Date(date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  {dayExpense > 0 && (
                    <div className="tx-day-sum">
                      <span className="tx-day-sum-label"></span>
                      <span className="tx-day-sum-value">
                        {formatCurrency(dayExpense)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="tx-list-page">
                  {txs.map((tx) => (
                    <SwipeableRow
                      key={tx.id}
                      isOpen={openRowId === tx.id}
                      onOpenChange={(open) => setOpenRowId(open ? tx.id : null)}
                      actions={
                        <>
                          {tx.type !== "TRANSFER" && (
                            <button
                              onClick={() => setEditingTx(tx)}
                              aria-label="Edit transaksi"
                              style={{ background: "var(--bg-hover)", color: "var(--text-primary)" }}
                            >
                              <Pencil size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmDeleteId(tx.id)}
                            aria-label="Hapus transaksi"
                            style={{ background: "var(--red)", color: "#fff" }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      }
                    >
                      <div className="tx-row-content">
                        <div className={`tx-icon-box ${tx.type === "IN" ? "tx-icon-box--income" : "tx-icon-box--expense"}`}>
                          <CategoryIcon category={tx.category} size={16} />
                        </div>
                        <div className="transaction-info">
                          <p className="transaction-desc">
                            {tx.description}
                          </p>
                          <p className="transaction-category">{tx.category}</p>
                          <p className="transaction-date">Pukul {new Date(tx.created_at || tx.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                          </p>
                        </div>
                        <p className={`transaction-amount ${tx.type === "IN" ? "transaction-amount--income" : ""}`}>
                          {tx.type === "IN" ? "+" : "-"}{formatCurrency(tx.amount)}
                        </p>
                      </div>
                    </SwipeableRow>
                  ))}
                </div>
              </div>
              );
            })
          )}

          {grouped.length > 0 && hasMore && (
            <div ref={sentinelRef} className="tx-sentinel">
              {loadingMore ? (
                <p className="text-xs text-muted">Memuat...</p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {showAddModal && <LazyAddTransactionModal onClose={() => setShowAddModal(false)} />}

      {editingTx && (
        <LazyAddTransactionModal
          onClose={() => setEditingTx(null)}
          editingTransaction={editingTx}
        />
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          title="Hapus transaksi ini?"
          description="Data yang sudah dihapus tidak bisa dikembalikan."
          onConfirm={() => {
            deleteTransaction(confirmDeleteId);
            setConfirmDeleteId(null);
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </>
  );
}
