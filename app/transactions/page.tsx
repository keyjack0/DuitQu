"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { AppLayout } from "@/components/layout/AppLayout";
import { LazyAddTransactionModal } from "@/components/transactions/LazyAddTransactionModal";
import { Plus, Search, Trash2, Pencil, Inbox } from "lucide-react";
import { CategoryIcon } from "@/lib/icons";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SwipeableRow } from "@/components/ui/SwipeableRow";
import type { Transaction } from "@/types";

export default function TransactionsPage() {
  const { user, transactions, deleteTransaction, fetchMoreTransactions } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [visibleCount, setVisibleCount] = useState(300);
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

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof visible> = {};
    visible.forEach((t) => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [visible]);

  const handleLoadMore = async () => {
    if (visibleCount < filtered.length) {
      setVisibleCount((v) => v + 100);
      return;
    }
    if (!user || loadingMore) return;
    setLoadingMore(true);
    const loaded = await fetchMoreTransactions(user.id, transactions.length, 300);
    setLoadingMore(false);
    if (loaded > 0) {
      setVisibleCount((v) => v + loaded);
    }
  };

  const canLoadMore =
    visibleCount < filtered.length || transactions.length >= 300;

  return (
    <AppLayout>
      <div style={{ padding: "0 0 24px" }}>
        {/* Header */}
        <div style={{ padding: "56px 20px 16px", background: "var(--bg-secondary)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>Transaksi</h1>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "var(--green)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Plus size={18} color="var(--on-accent)" strokeWidth={2.5} />
            </button>
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: "12px" }}>
            <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              placeholder="Cari transaksi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "10px 14px 10px 36px",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
            {["all", "IN", "OUT"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "20px",
                  border: "1px solid",
                  borderColor: filterType === t ? "var(--green)" : "var(--border)",
                  background: filterType === t ? "rgba(34,197,94,0.12)" : "transparent",
                  color: filterType === t ? "var(--green)" : "var(--text-muted)",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {t === "all" ? "Semua" : t === "IN" ? "Pemasukan" : "Pengeluaran"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "0 20px" }}>
          {grouped.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
              <p style={{ marginBottom: "12px" }}><Inbox size={32} color="var(--text-muted)" /></p>
              <p>Belum ada transaksi</p>
            </div>
          ) : (
            grouped.map(([date, txs]) => {
              const dayExpense = txs
                .filter((t) => t.type === "OUT")
                .reduce((s, t) => s + t.amount, 0);
              return (
              <div key={date} style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em" }}>
                    {new Date(date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  {dayExpense > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}></span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--red)" }}>
                        {formatCurrency(dayExpense)}
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
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
                      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            background: tx.type === "IN" ? "rgba(34,197,94,0.12)" : "var(--overlay-soft)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <CategoryIcon category={tx.category} size={16} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {tx.description}
                          </p>
                          <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{tx.category}</p>
                          <p style={{ fontSize: "10px", color: "var(--text-faint)", marginTop: "2px" }}>Pukul {new Date(tx.created_at || tx.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                          </p>
                        </div>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: tx.type === "IN" ? "var(--green)" : "var(--text-primary)", flexShrink: 0 }}>
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

          {grouped.length > 0 && canLoadMore && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                color: "var(--green)",
                fontWeight: 600,
                fontSize: "14px",
                cursor: loadingMore ? "not-allowed" : "pointer",
                marginBottom: "12px",
              }}
            >
              {loadingMore ? "Memuat..." : "Muat lebih banyak"}
            </button>
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
    </AppLayout>
  );
}
