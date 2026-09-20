"use client";

/** Menampilkan, memfilter, menambah, mengubah, dan menghapus riwayat transaksi. */
import { useState, useMemo, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrency, getMonthLabel, toLocalDateString } from "@/lib/utils";
import { getSupabaseClient } from "@/lib/supabase";
import { LazyAddTransactionModal } from "@/components/transactions/LazyAddTransactionModal";
import { Plus, Search, Trash2, Pencil, Inbox, TrendingUp, TrendingDown, Calendar, X, ChevronDown, SlidersHorizontal, RefreshCw } from "lucide-react";
import { CategoryIcon, WALLET_COLORS } from "@/lib/icons";
import { CATEGORY_COLORS } from "@/lib/categoryColors";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SwipeableRow } from "@/components/ui/SwipeableRow";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import type { Transaction } from "@/types";
import { CATEGORIES } from "@/types";

function compareTransactions(a: Transaction, b: Transaction) {
  return b.date.localeCompare(a.date) ||
    (b.created_at ?? "").localeCompare(a.created_at ?? "") ||
    b.id.localeCompare(a.id);
}

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
  const start = toLocalDateString(new Date(year, month - 1, 1));
  const end = toLocalDateString(new Date(year, month, 0));
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

function formatGroupDate(date: string) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date === toLocalDateString(today)) return "Hari ini";
  if (date === toLocalDateString(yesterday)) return "Kemarin";

  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTransactionTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export default function TransactionsPage() {
  const user = useAppStore((s) => s.user);
  const wallets = useAppStore((s) => s.wallets);
  const monthTransactions = useAppStore((s) => s.monthTransactions);
  const lastMonthTransactions = useAppStore((s) => s.lastMonthTransactions);
  const deleteTransaction = useAppStore((s) => s.deleteTransaction);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showTypeFilterSheet, setShowTypeFilterSheet] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tempFilterType, setTempFilterType] = useState("all");
  const [tempFilterCategory, setTempFilterCategory] = useState("all");
  const [tempDateFrom, setTempDateFrom] = useState("");
  const [tempDateTo, setTempDateTo] = useState("");
  const compareGenerationRef = useRef(0);

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

  useEffect(() => {
    if (!showFilterSheet && !showTypeFilterSheet) return;

    const closeSheet = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setShowFilterSheet(false);
      setShowTypeFilterSheet(false);
    };

    document.addEventListener("keydown", closeSheet);
    return () => document.removeEventListener("keydown", closeSheet);
  }, [showFilterSheet, showTypeFilterSheet]);

  // Fetch compare data for both months
  useEffect(() => {
    const generation = ++compareGenerationRef.current;
    const controller = new AbortController();

    const summarize = (rows: { type: string; amount: number }[]) => ({
      income: rows.filter((transaction) => transaction.type === "IN").reduce((sum, transaction) => sum + transaction.amount, 0),
      expense: rows.filter((transaction) => transaction.type === "OUT").reduce((sum, transaction) => sum + transaction.amount, 0),
    });

    const fetchCompareData = async () => {
      if (!user) return;

      const aFromStore = isDefaultLastMonth(selectedMonthA);
      const bFromStore = isDefaultCurrentMonth(selectedMonthB);

      if (aFromStore && bFromStore) {
        setCompareDataA(summarize(lastMonthTransactions));
        setCompareDataB(summarize(monthTransactions));
        setLoadingCompare(false);
        return;
      }

      setLoadingCompare(true);
      try {
        const [rangeA, rangeB] = [getMonthRange(selectedMonthA), getMonthRange(selectedMonthB)];
        const fetchRange = async (range: { start: string; end: string }) => {
          const { data, error } = await getSupabaseClient()
            .from("transactions")
            .select("type, amount")
            .eq("user_id", user.id)
            .gte("date", range.start)
            .lte("date", range.end)
            .abortSignal(controller.signal);
          if (error) throw new Error(error.message);
          return (data || []) as { type: string; amount: number }[];
        };

        const [rowsA, rowsB] = await Promise.all([
          aFromStore ? Promise.resolve(lastMonthTransactions) : fetchRange(rangeA),
          bFromStore ? Promise.resolve(monthTransactions) : fetchRange(rangeB),
        ]);

        if (controller.signal.aborted || generation !== compareGenerationRef.current) return;
        setCompareDataA(summarize(rowsA));
        setCompareDataB(summarize(rowsB));
      } catch {
        if (controller.signal.aborted || generation !== compareGenerationRef.current) return;
        setCompareDataA(null);
        setCompareDataB(null);
      } finally {
        if (!controller.signal.aborted && generation === compareGenerationRef.current) {
          setLoadingCompare(false);
        }
      }
    };

    void fetchCompareData();
    return () => controller.abort();
  }, [user, selectedMonthA, selectedMonthB, monthTransactions, lastMonthTransactions]);

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

  const walletById = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet])),
    [wallets]
  );

  const {
    items: historyTransactions,
    isLoading: loadingHistory,
    isLoadingMore: loadingMore,
    error: historyError,
    loadMoreError,
    hasMore,
    loadMore,
    retry: retryHistory,
    upsertVisibleTransaction,
  } = useTransactionHistory({
    userId: user?.id,
    search,
    type: filterType,
    category: filterCategory,
    dateFrom,
    dateTo,
  });

  const filtered = useMemo(
    () => [...historyTransactions].sort(compareTransactions),
    [historyTransactions]
  );

  const grouped = useMemo(() => {
    const groups = new Map<string, { date: string; transactions: Transaction[]; expense: number }>();
    filtered.forEach((t) => {
      const group = groups.get(t.date) ?? { date: t.date, transactions: [], expense: 0 };
      group.transactions.push(t);
      if (t.type === "OUT") group.expense += t.amount;
      groups.set(t.date, group);
    });
    return Array.from(groups.values());
  }, [filtered]);

  const sentinelRef = useInfiniteScroll(loadMore, hasMore && !loadingMore && !loadingHistory);
  const activeFilterCount = [
    filterType !== "all",
    filterCategory !== "all",
    Boolean(dateFrom || dateTo),
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0 || search.trim().length > 0;
  const invalidTempDateRange = Boolean(tempDateFrom && tempDateTo && tempDateFrom > tempDateTo);

  const resetFilters = () => {
    setSearch("");
    setFilterType("all");
    setFilterCategory("all");
    setDateFrom("");
    setDateTo("");
    setTempFilterType("all");
    setTempFilterCategory("all");
    setTempDateFrom("");
    setTempDateTo("");
  };

  return (
    <>
      <div className="page-shell transactions-page">
        <header className="transactions-page-header">
          <div>
            <h1 className="page-title">Transaksi</h1>
            <p>Temukan, bandingkan, dan kelola seluruh aktivitas keuanganmu.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="icon-btn-square icon-btn-square--primary"
            aria-label="Tambah transaksi"
            title="Tambah transaksi"
          >
            <Plus size={24} color="var(--on-accent)" strokeWidth={1.8} />
          </button>
        </header>

        <div className="transactions-layout">
          <aside className="transactions-sidebar">
            <section className="compare-card" aria-labelledby="compare-title">
              <div className="compare-header">
                <h2 id="compare-title" className="compare-title">Perbandingan</h2>
                <button
                  type="button"
                  className="compare-filter-btn"
                  onClick={() => {
                    setTempMonthA(selectedMonthA);
                    setTempMonthB(selectedMonthB);
                    setShowFilterSheet(true);
                  }}
                  aria-label="Pilih periode perbandingan"
                  title="Pilih periode perbandingan"
                >
                  <Calendar size={16} />
                </button>
              </div>

              <div className="compare-type-row" role="group" aria-label="Data yang dibandingkan">
                <button
                  type="button"
                  aria-pressed={compareType === "OUT"}
                  className={`compare-type-btn ${compareType === "OUT" ? "compare-type-btn--active" : ""}`}
                  onClick={() => setCompareType("OUT")}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  aria-pressed={compareType === "IN"}
                  className={`compare-type-btn ${compareType === "IN" ? "compare-type-btn--active" : ""}`}
                  onClick={() => setCompareType("IN")}
                >
                  Pemasukan
                </button>
              </div>

              {loadingCompare ? (
                <div className="compare-loading" role="status">Memuat perbandingan...</div>
              ) : compareDataA && compareDataB ? (
                <div className="compare-body">
                  <p className="compare-big-number">{formatCurrency(currentAmount)}</p>

                  <div className="compare-trend">
                    {prevAmount === 0 && currentAmount > 0 ? (
                      <span className="compare-trend-badge compare-trend-badge--new">Baru</span>
                    ) : changePercent !== null && changePercent >= 0 ? (
                      <span className={`compare-trend-badge ${compareType === "OUT" ? "compare-trend-badge--neg" : "compare-trend-badge--pos"}`}>
                        <TrendingUp size={12} /> +{changePercent.toFixed(1)}%
                      </span>
                    ) : changePercent !== null ? (
                      <span className={`compare-trend-badge ${compareType === "OUT" ? "compare-trend-badge--pos" : "compare-trend-badge--neg"}`}>
                        <TrendingDown size={12} /> {changePercent.toFixed(1)}%
                      </span>
                    ) : null}
                    <span className="compare-trend-ref">
                      dari {formatCurrency(prevAmount)} bulan {getMonthLabel(selectedMonthA)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="compare-empty">Perbandingan belum dapat dimuat.</div>
              )}
            </section>
          </aside>

          <section className="transactions-main" aria-labelledby="transaction-list-title">
            <div className="transactions-toolbar">
              <label className="search-wrap">
                <Search size={16} aria-hidden="true" />
                <span className="sr-only">Cari transaksi</span>
                <input
                  type="search"
                  placeholder="Cari deskripsi atau kategori..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <button
                type="button"
                className={`filter-dropdown-btn ${activeFilterCount > 0 ? "filter-dropdown-btn--active" : ""}`}
                onClick={() => {
                  setTempFilterType(filterType);
                  setTempFilterCategory(filterCategory);
                  setTempDateFrom(dateFrom);
                  setTempDateTo(dateTo);
                  setShowTypeFilterSheet(true);
                }}
                aria-label={`Filter transaksi${activeFilterCount > 0 ? `, ${activeFilterCount} aktif` : ""}`}
              >
                <SlidersHorizontal size={16} />
                <span>Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}</span>
              </button>
            </div>

            {hasActiveFilters && (
              <div className="transaction-filter-chips" aria-label="Filter aktif">
                {filterType !== "all" && (
                  <button type="button" onClick={() => setFilterType("all")}>
                    {filterType === "IN" ? "Pemasukan" : filterType === "OUT" ? "Pengeluaran" : "Transfer"}<X size={12} />
                  </button>
                )}
                {filterCategory !== "all" && (
                  <button type="button" onClick={() => setFilterCategory("all")}>{filterCategory}<X size={12} /></button>
                )}
                {(dateFrom || dateTo) && (
                  <button type="button" onClick={() => { setDateFrom(""); setDateTo(""); }}>
                    {dateFrom || "Awal"} - {dateTo || "Kini"}<X size={12} />
                  </button>
                )}
                {search && (
                  <button type="button" onClick={() => setSearch("")}>“{search}”<X size={12} /></button>
                )}
                <button type="button" className="transaction-filter-clear" onClick={resetFilters}>Hapus semua</button>
              </div>
            )}

            <div className="transactions-list-head">
              <div>
                <p className="transactions-eyebrow">Riwayat</p>
                <h2 id="transaction-list-title">Daftar Transaksi</h2>
              </div>
              {!loadingHistory && <span>{filtered.length} ditampilkan</span>}
            </div>

            {loadingHistory ? (
              <div className="transaction-skeleton-list" role="status" aria-label="Memuat transaksi">
                {[0, 1, 2, 3].map((item) => <div key={item} className="transaction-skeleton-row" />)}
              </div>
            ) : historyError ? (
              <div className="transaction-state">
                <div className="transaction-state-icon"><RefreshCw size={25} /></div>
                <h3>Transaksi gagal dimuat</h3>
                <p>Periksa koneksi internetmu, lalu coba lagi.</p>
                <button type="button" className="btn-primary btn-primary--sm" onClick={retryHistory}>Coba Lagi</button>
              </div>
            ) : grouped.length === 0 ? (
              <div className="transaction-state">
                <div className="transaction-state-icon"><Inbox size={26} /></div>
                <h3>{hasActiveFilters ? "Tidak ada transaksi yang cocok" : "Belum ada transaksi"}</h3>
                <p>{hasActiveFilters ? "Coba ubah kata pencarian atau hapus filter aktif." : "Tambahkan transaksi pertama untuk mulai membangun riwayat keuangan."}</p>
                <button
                  type="button"
                  className="btn-primary btn-primary--sm"
                  onClick={hasActiveFilters ? resetFilters : () => setShowAddModal(true)}
                >
                  {hasActiveFilters ? "Hapus Filter" : "Tambah Transaksi"}
                </button>
              </div>
            ) : (
              grouped.map(({ date, transactions: dayTransactions, expense: dayExpense }) => (
                <section key={date} className="tx-group" aria-labelledby={`transaction-date-${date}`}>
                  <div className="tx-day-row">
                    <h3 id={`transaction-date-${date}`} className="tx-day-label">{formatGroupDate(date)}</h3>
                    {dayExpense > 0 && (
                      <div className="tx-day-sum">
                        <span className="tx-day-sum-label">Keluar</span>
                        <span className="tx-day-sum-value">{formatCurrency(dayExpense)}</span>
                      </div>
                    )}
                  </div>
                  <div className="tx-list-page">
                    {dayTransactions.map((transaction) => {
                      const categoryColor = CATEGORY_COLORS[transaction.category] || "#64748b";
                      const isTransfer = transaction.type === "TRANSFER";
                      const wallet = transaction.wallet_id ? walletById.get(transaction.wallet_id) : null;
                      const walletColor = wallet?.color || WALLET_COLORS[wallet?.icon || ""] || "#64748b";
                      const timestamp = transaction.created_at || `${transaction.date}T00:00:00+07:00`;

                      return (
                        <SwipeableRow
                          key={transaction.id}
                          isOpen={openRowId === transaction.id}
                          onOpenChange={(open) => setOpenRowId(open ? transaction.id : null)}
                          actions={
                            <>
                              {!isTransfer && (
                                <button
                                  type="button"
                                  onClick={() => setEditingTx(transaction)}
                                  aria-label={`Edit ${transaction.description}`}
                                  title="Edit transaksi"
                                  style={{ background: "var(--bg-hover)", color: "var(--text-primary)" }}
                                >
                                  <Pencil size={15} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(transaction.id)}
                                aria-label={`Hapus ${transaction.description}`}
                                title="Hapus transaksi"
                                style={{ background: "var(--red)", color: "#fff" }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          }
                        >
                          <div className="tx-row-content">
                            <div className="tx-icon-box" style={{ backgroundColor: `${categoryColor}1f`, color: categoryColor }}>
                              <CategoryIcon category={transaction.category} color="currentColor" />
                            </div>
                            <div className="transaction-info">
                              <p className="transaction-desc">{transaction.description || transaction.category}</p>
                              <div className="transaction-meta">
                                <span className="transaction-category" style={{ backgroundColor: `${categoryColor}1f`, color: categoryColor }}>
                                  {transaction.category}
                                </span>
                                {wallet && (
                                  <span className="transaction-wallet" style={{ backgroundColor: `${walletColor}1f`, color: walletColor }}>
                                    {wallet.name}
                                  </span>
                                )}
                              </div>
                              <time className="transaction-date" dateTime={timestamp}>Pukul {formatTransactionTime(timestamp)} WIB</time>
                            </div>
                            <p className={`transaction-amount ${transaction.type === "IN" ? "transaction-amount--income" : isTransfer ? "transaction-amount--transfer" : "transaction-amount--expense"}`}>
                              {transaction.type === "IN" ? "+" : isTransfer ? "" : "-"}{formatCurrency(transaction.amount)}
                            </p>
                          </div>
                        </SwipeableRow>
                      );
                    })}
                  </div>
                </section>
              ))
            )}

            {hasMore && !loadingHistory && !historyError && (
              <div ref={sentinelRef} className="tx-sentinel" role="status">
                {loadMoreError ? (
                  <button type="button" onClick={loadMore}>Gagal memuat. Coba lagi</button>
                ) : loadingMore ? (
                  <span>Memuat transaksi berikutnya...</span>
                ) : null}
              </div>
            )}

            {!loadingHistory && grouped.length > 0 && (
              <p className="transaction-mobile-hint">Geser transaksi ke kiri untuk mengedit atau menghapus.</p>
            )}
          </section>
        </div>
      </div>

      {showFilterSheet && (
        <div className="sheet-overlay sheet-overlay--fade transaction-sheet-overlay" onClick={(event) => event.target === event.currentTarget && setShowFilterSheet(false)}>
          <div className="sheet-panel sheet-panel--rise transaction-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="compare-period-title">
            <div className="sheet-head">
              <h2 id="compare-period-title" className="sheet-title">Pilih Periode</h2>
              <button type="button" onClick={() => setShowFilterSheet(false)} className="sheet-close" aria-label="Tutup pilihan periode"><X size={15} /></button>
            </div>
            <div className="filter-sheet-fields">
              <div className="filter-sheet-field">
                <label htmlFor="compare-period-a" className="filter-sheet-label">Periode pembanding</label>
                <div className="compare-select-wrap">
                  <select id="compare-period-a" value={tempMonthA} onChange={(event) => setTempMonthA(event.target.value)} className="compare-select">
                    {monthOptions.map((option) => <option key={option.value} value={option.value} disabled={option.value === tempMonthB}>{option.label}</option>)}
                  </select>
                  <ChevronDown size={14} className="compare-select-icon" />
                </div>
              </div>
              <div className="filter-sheet-field">
                <label htmlFor="compare-period-b" className="filter-sheet-label">Periode utama</label>
                <div className="compare-select-wrap">
                  <select id="compare-period-b" value={tempMonthB} onChange={(event) => setTempMonthB(event.target.value)} className="compare-select">
                    {monthOptions.map((option) => <option key={option.value} value={option.value} disabled={option.value === tempMonthA}>{option.label}</option>)}
                  </select>
                  <ChevronDown size={14} className="compare-select-icon" />
                </div>
              </div>
            </div>
            {tempMonthA === tempMonthB && <p className="filter-sheet-error" role="alert">Pilih dua periode yang berbeda.</p>}
            <button
              type="button"
              className="filter-sheet-apply"
              disabled={tempMonthA === tempMonthB}
              onClick={() => {
                setSelectedMonthA(tempMonthA);
                setSelectedMonthB(tempMonthB);
                setShowFilterSheet(false);
              }}
            >
              Terapkan
            </button>
          </div>
        </div>
      )}

      {showTypeFilterSheet && (
        <div className="sheet-overlay sheet-overlay--fade transaction-sheet-overlay" onClick={(event) => event.target === event.currentTarget && setShowTypeFilterSheet(false)}>
          <div className="sheet-panel sheet-panel--rise transaction-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="transaction-filter-title">
            <div className="sheet-head">
              <h2 id="transaction-filter-title" className="sheet-title">Filter Transaksi</h2>
              <button type="button" onClick={() => setShowTypeFilterSheet(false)} className="sheet-close" aria-label="Tutup filter"><X size={15} /></button>
            </div>

            <div className="filter-sheet-fields">
              <div className="filter-sheet-field">
                <label htmlFor="transaction-filter-type" className="filter-sheet-label">Tipe Transaksi</label>
                <div className="compare-select-wrap">
                  <select id="transaction-filter-type" value={tempFilterType} onChange={(event) => setTempFilterType(event.target.value)} className="compare-select">
                    <option value="all">Semua Transaksi</option>
                    <option value="IN">Pemasukan</option>
                    <option value="OUT">Pengeluaran</option>
                    <option value="TRANSFER">Transfer</option>
                  </select>
                  <ChevronDown size={14} className="compare-select-icon" />
                </div>
              </div>

              <div className="filter-sheet-field">
                <label htmlFor="transaction-filter-category" className="filter-sheet-label">Kategori</label>
                <div className="compare-select-wrap">
                  <select id="transaction-filter-category" value={tempFilterCategory} onChange={(event) => setTempFilterCategory(event.target.value)} className="compare-select">
                    <option value="all">Semua Kategori</option>
                    {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                  <ChevronDown size={14} className="compare-select-icon" />
                </div>
              </div>

              <div className="filter-sheet-daterow">
                <div className="filter-sheet-datefield">
                  <label htmlFor="transaction-date-from" className="filter-sheet-label">Dari</label>
                  <input id="transaction-date-from" type="date" value={tempDateFrom} onChange={(event) => setTempDateFrom(event.target.value)} className="form-input" />
                </div>
                <div className="filter-sheet-datefield">
                  <label htmlFor="transaction-date-to" className="filter-sheet-label">Sampai</label>
                  <input id="transaction-date-to" type="date" value={tempDateTo} onChange={(event) => setTempDateTo(event.target.value)} className="form-input" />
                </div>
              </div>
            </div>

            {invalidTempDateRange && <p className="filter-sheet-error" role="alert">Tanggal awal tidak boleh melewati tanggal akhir.</p>}

            <div className="filter-sheet-actions">
              <button type="button" className="filter-sheet-reset" onClick={() => {
                setTempFilterType("all");
                setTempFilterCategory("all");
                setTempDateFrom("");
                setTempDateTo("");
              }}>Bersihkan</button>
              <button
                type="button"
                className="filter-sheet-apply"
                disabled={invalidTempDateRange}
                onClick={() => {
                  setFilterType(tempFilterType);
                  setFilterCategory(tempFilterCategory);
                  setDateFrom(tempDateFrom);
                  setDateTo(tempDateTo);
                  setShowTypeFilterSheet(false);
                }}
              >Terapkan</button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <LazyAddTransactionModal
          onClose={() => setShowAddModal(false)}
          onSaved={(transaction) => {
            upsertVisibleTransaction(transaction);
            retryHistory();
          }}
        />
      )}

      {editingTx && (
        <LazyAddTransactionModal
          onClose={() => setEditingTx(null)}
          editingTransaction={editingTx}
          onSaved={(transaction) => {
            upsertVisibleTransaction(transaction);
            retryHistory();
          }}
        />
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          title="Hapus transaksi ini?"
          description="Data yang sudah dihapus tidak bisa dikembalikan."
          onConfirm={() => void (async () => {
            const deleted = await deleteTransaction(confirmDeleteId);
            if (deleted) retryHistory();
            setConfirmDeleteId(null);
          })()}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </>
  );
}
