"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrency, getMonthLabel } from "@/lib/utils";
import { getSupabaseClient } from "@/lib/supabase";
import { LazyAddTransactionModal } from "@/components/transactions/LazyAddTransactionModal";
import { Plus, Search, Trash2, Pencil, Inbox, TrendingUp, TrendingDown, Calendar, X, ChevronDown } from "lucide-react";
import { CategoryIcon } from "@/lib/icons";
import { CATEGORY_COLORS } from "@/lib/categoryColors";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SwipeableRow } from "@/components/ui/SwipeableRow";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { Transaction } from "@/types";

const PAGE_SIZE = 10;

function generateMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(d);
    options.push({ value, label });
  }
  return options;
}

function getMonthRange(monthStr: string): { start: string; end: string } {
  const [year, month] = monthStr.split("-").map(Number);
  const start = new Date(year, month - 1, 1).toISOString().split("T")[0];
  const end = new Date(year, month, 0).toISOString().split("T")[0];
  return { start, end };
}

function getLastMonthStr(): string {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;
}

function getCurrentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function isDefaultCurrentMonth(monthStr: string): boolean {
  return monthStr === getCurrentMonthStr();
}

function isDefaultLastMonth(monthStr: string): boolean {
  return monthStr === getLastMonthStr();
}

export default function TransactionsPage() {
  const user = useAppStore((s) => s.user);
  const transactions = useAppStore((s) => s.transactions);
  const monthTransactions = useAppStore((s) => s.monthTransactions);
  const lastMonthTransactions = useAppStore((s) => s.lastMonthTransactions);
  const deleteTransaction = useAppStore((s) => s.deleteTransaction);
  const fetchMoreTransactions = useAppStore((s) => s.fetchMoreTransactions);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Compare card state
  const monthOptions = useMemo(() => generateMonthOptions(), []);
  const [selectedMonthA, setSelectedMonthA] = useState(getLastMonthStr);
  const [selectedMonthB, setSelectedMonthB] = useState(getCurrentMonthStr);
  const [compareDataA, setCompareDataA] = useState<{ income: number; expense: number } | null>(null);
  const [compareDataB, setCompareDataB] = useState<{ income: number; expense: number } | null>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [tempMonthA, setTempMonthA] = useState(getLastMonthStr);
  const [tempMonthB, setTempMonthB] = useState(getCurrentMonthStr);
  const [compareType, setCompareType] = useState<"IN" | "OUT">("OUT");

  // Fetch compare data for both months
  useEffect(() => {
    const fetchCompareData = async () => {
      if (!user) return;

      const aFromStore = isDefaultLastMonth(selectedMonthA);
      const bFromStore = isDefaultCurrentMonth(selectedMonthB);

      if (aFromStore && bFromStore) {
        const incomeA = lastMonthTransactions
          .filter((t) => t.type === "IN")
          .reduce((s, t) => s + t.amount, 0);
        const expenseA = lastMonthTransactions
          .filter((t) => t.type === "OUT")
          .reduce((s, t) => s + t.amount, 0);
        setCompareDataA({ income: incomeA, expense: expenseA });

        const incomeB = monthTransactions
          .filter((t) => t.type === "IN")
          .reduce((s, t) => s + t.amount, 0);
        const expenseB = monthTransactions
          .filter((t) => t.type === "OUT")
          .reduce((s, t) => s + t.amount, 0);
        setCompareDataB({ income: incomeB, expense: expenseB });
        return;
      }

      setLoadingCompare(true);
      try {
        const [rangeA, rangeB] = [getMonthRange(selectedMonthA), getMonthRange(selectedMonthB)];
        const queries: Promise<{ data: { type: string; amount: number }[] | null }>[] = [];

        if (!aFromStore) {
          queries.push(
            getSupabaseClient()
              .from("transactions")
              .select("type, amount")
              .eq("user_id", user.id)
              .gte("date", rangeA.start)
              .lte("date", rangeA.end)
          );
        } else {
          queries.push(Promise.resolve({ data: null }));
        }

        if (!bFromStore) {
          queries.push(
            getSupabaseClient()
              .from("transactions")
              .select("type, amount")
              .eq("user_id", user.id)
              .gte("date", rangeB.start)
              .lte("date", rangeB.end)
          );
        } else {
          queries.push(Promise.resolve({ data: null }));
        }

        const [resultA, resultB] = await Promise.all(queries);

        if (!aFromStore && resultA.data) {
          const income = resultA.data.filter((t) => t.type === "IN").reduce((s, t) => s + t.amount, 0);
          const expense = resultA.data.filter((t) => t.type === "OUT").reduce((s, t) => s + t.amount, 0);
          setCompareDataA({ income, expense });
        } else if (aFromStore) {
          const income = lastMonthTransactions.filter((t) => t.type === "IN").reduce((s, t) => s + t.amount, 0);
          const expense = lastMonthTransactions.filter((t) => t.type === "OUT").reduce((s, t) => s + t.amount, 0);
          setCompareDataA({ income, expense });
        }

        if (!bFromStore && resultB.data) {
          const income = resultB.data.filter((t) => t.type === "IN").reduce((s, t) => s + t.amount, 0);
          const expense = resultB.data.filter((t) => t.type === "OUT").reduce((s, t) => s + t.amount, 0);
          setCompareDataB({ income, expense });
        } else if (bFromStore) {
          const income = monthTransactions.filter((t) => t.type === "IN").reduce((s, t) => s + t.amount, 0);
          const expense = monthTransactions.filter((t) => t.type === "OUT").reduce((s, t) => s + t.amount, 0);
          setCompareDataB({ income, expense });
        }
      } catch {
        setCompareDataA(null);
        setCompareDataB(null);
      }
      setLoadingCompare(false);
    };
    fetchCompareData();
  }, [user?.id, selectedMonthA, selectedMonthB, monthTransactions, lastMonthTransactions]);

  const incomeChange = useMemo(() => {
    if (!compareDataA || !compareDataB) return null;
    if (compareDataA.income === 0) return compareDataB.income > 0 ? 100 : 0;
    return ((compareDataB.income - compareDataA.income) / compareDataA.income) * 100;
  }, [compareDataA, compareDataB]);

  const expenseChange = useMemo(() => {
    if (!compareDataA || !compareDataB) return null;
    if (compareDataA.expense === 0) return compareDataB.expense > 0 ? 100 : 0;
    return ((compareDataB.expense - compareDataA.expense) / compareDataA.expense) * 100;
  }, [compareDataA, compareDataB]);

  const currentAmount = compareType === "OUT" ? compareDataB?.expense ?? 0 : compareDataB?.income ?? 0;
  const prevAmount = compareType === "OUT" ? compareDataA?.expense ?? 0 : compareDataA?.income ?? 0;
  const changePercent = compareType === "OUT" ? expenseChange : incomeChange;

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

          {/* Compare Card */}
          <div className="compare-card">
            <div className="compare-header">
              <p className="compare-title">Perbandingan</p>
              <button className="compare-filter-btn" onClick={() => { setTempMonthA(selectedMonthA); setTempMonthB(selectedMonthB); setShowFilterSheet(true); }}>
                <Calendar size={15} />
              </button>
            </div>

            <div className="compare-type-row">
              <button
                className={`compare-type-btn ${compareType === "OUT" ? "compare-type-btn--active" : ""}`}
                onClick={() => setCompareType("OUT")}
              >
                Pengeluaran
              </button>
              <button
                className={`compare-type-btn ${compareType === "IN" ? "compare-type-btn--active" : ""}`}
                onClick={() => setCompareType("IN")}
              >
                Pemasukan
              </button>
            </div>

            {loadingCompare ? (
              <div className="compare-loading">Memuat...</div>
            ) : compareDataA && compareDataB ? (
              <div className="compare-body">
                <div className="compare-big-number">{formatCurrency(currentAmount)}</div>

                {changePercent !== null && (
                  <div className="compare-trend">
                    {changePercent >= 0 ? (
                      <span className={`compare-trend-badge ${compareType === "OUT" ? "compare-trend-badge--neg" : "compare-trend-badge--pos"}`}>
                        <TrendingUp size={12} /> +{changePercent.toFixed(1)}%
                      </span>
                    ) : (
                      <span className={`compare-trend-badge ${compareType === "OUT" ? "compare-trend-badge--pos" : "compare-trend-badge--neg"}`}>
                        <TrendingDown size={12} /> {changePercent.toFixed(1)}%
                      </span>
                    )}
                    <span className="compare-trend-ref">
                      dari {formatCurrency(prevAmount)} Bulan {getMonthLabel(selectedMonthA).replace(" 20", " '")?.split(" ").slice(0, 1)}
                    </span>
                  </div>
                )}

                {/* <div className="compare-period-row">
                  <div className="compare-period-item">
                    <span className="compare-period-label">{getMonthLabel(selectedMonthB)}</span>
                    <span className="compare-period-value">{formatCurrency(currentAmount)}</span>
                  </div>
                  <div className="compare-period-item">
                    <span className="compare-period-label">{getMonthLabel(selectedMonthA)}</span>
                    <span className="compare-period-value compare-period-value--muted">{formatCurrency(prevAmount)}</span>
                  </div>
                </div> */}
              </div>
            ) : (
              <div className="compare-empty">Tidak ada data untuk bulan ini</div>
            )}
          </div>

          {/* Filter Bottom Sheet */}
          {showFilterSheet && (
            <div className="sheet-overlay sheet-overlay--fade" onClick={(e) => { if (e.target === e.currentTarget) setShowFilterSheet(false); }}>
              <div className="sheet-panel sheet-panel--rise">
                <div className="sheet-head">
                  <h2 className="sheet-title">Pilih Periode</h2>
                  <button onClick={() => setShowFilterSheet(false)} className="sheet-close"><X size={15} /></button>
                </div>
                <div className="filter-sheet-fields">
                  <div className="filter-sheet-field">
                    <label className="filter-sheet-label">Periode 1</label>
                    <div className="compare-select-wrap">
                      <select value={tempMonthA} onChange={(e) => setTempMonthA(e.target.value)} className="compare-select">
                        {monthOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="compare-select-icon" />
                    </div>
                  </div>
                  <div className="filter-sheet-field">
                    <label className="filter-sheet-label">Periode 2</label>
                    <div className="compare-select-wrap">
                      <select value={tempMonthB} onChange={(e) => setTempMonthB(e.target.value)} className="compare-select">
                        {monthOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="compare-select-icon" />
                    </div>
                  </div>
                </div>
                <button className="filter-sheet-apply" onClick={() => { setSelectedMonthA(tempMonthA); setSelectedMonthB(tempMonthB); setShowFilterSheet(false); }}>
                  Terapkan
                </button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="search-wrap">
            <Search size={14} color="var(--text-muted)" className="absolute left-3 top-1/2 -translate-y-1/2 " />
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
                        <div
                          className="tx-icon-box"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[tx.category]}1f`,
                            color: CATEGORY_COLORS[tx.category],
                          }}
                        >
                          <CategoryIcon category={tx.category} size={16} color="currentColor" />
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
