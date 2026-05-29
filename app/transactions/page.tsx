"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { AppLayout } from "@/components/layout/AppLayout";
import { LazyAddTransactionModal } from "@/components/transactions/LazyAddTransactionModal";
import { Plus, Search, Trash2, Inbox } from "lucide-react";
import { CategoryIcon } from "@/lib/icons";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function TransactionsPage() {
  const { transactions, deleteTransaction } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");

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

  return (
    <AppLayout>
      <div style={{ padding: "0 0 24px" }}>
        {/* Header */}
        <div style={{ padding: "56px 20px 16px", background: "#111111" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#f5f5f5" }}>Transaksi</h1>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#22c55e",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Plus size={18} color="#000" strokeWidth={2.5} />
            </button>
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: "12px" }}>
            <Search size={14} color="#666666" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              placeholder="Cari transaksi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                background: "#161616",
                border: "1px solid #2a2a2a",
                borderRadius: "8px",
                padding: "10px 14px 10px 36px",
                color: "#f5f5f5",
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
                  borderColor: filterType === t ? "#22c55e" : "#2a2a2a",
                  background: filterType === t ? "rgba(34,197,94,0.12)" : "transparent",
                  color: filterType === t ? "#22c55e" : "#666666",
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
            <div style={{ textAlign: "center", padding: "60px 0", color: "#666666" }}>
              <p style={{ marginBottom: "12px" }}><Inbox size={32} color="#666666" /></p>
              <p>Belum ada transaksi</p>
            </div>
          ) : (
            grouped.map(([date, txs]) => (
              <div key={date} style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "12px", color: "#666666", fontWeight: 600, marginBottom: "8px", letterSpacing: "0.06em" }}>
                  {new Date(date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {txs.map((tx) => (
                    <div
                      key={tx.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        background: "#161616",
                        border: "1px solid #2a2a2a",
                        borderRadius: "10px",
                        padding: "12px 14px",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: tx.type === "IN" ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.04)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <CategoryIcon category={tx.category} size={16} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: "#f5f5f5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {tx.description}
                        </p>
                        <p style={{ fontSize: "11px", color: "#666666" }}>{tx.category}</p>
                      </div>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: tx.type === "IN" ? "#22c55e" : "#f5f5f5", flexShrink: 0 }}>
                        {tx.type === "IN" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </p>
                      <button
                        onClick={() => setConfirmDeleteId(tx.id)}
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          background: "transparent",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#444444",
                          flexShrink: 0,
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAddModal && <LazyAddTransactionModal onClose={() => setShowAddModal(false)} />}

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
