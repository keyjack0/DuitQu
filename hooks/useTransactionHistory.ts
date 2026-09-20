"use client";

/** Mengelola pemuatan, penyaringan, dan paginasi riwayat transaksi. */
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { useAppStore } from "@/lib/store";
import type { Transaction } from "@/types";

interface TransactionHistoryFilters {
  search: string;
  type: string;
  category: string;
  dateFrom: string;
  dateTo: string;
}

interface UseTransactionHistoryOptions extends TransactionHistoryFilters {
  userId?: string;
  pageSize?: number;
}

function normalizeSearch(search: string) {
  return search.replace(/[^\p{L}\p{N}\s&-]/gu, " ").trim().toLocaleLowerCase("id-ID");
}

function matchesFilters(transaction: Transaction, filters: TransactionHistoryFilters) {
  const search = normalizeSearch(filters.search);
  const matchesSearch = !search
    || transaction.description.toLocaleLowerCase("id-ID").includes(search)
    || transaction.category.toLocaleLowerCase("id-ID").includes(search);

  return matchesSearch
    && (filters.type === "all" || transaction.type === filters.type)
    && (filters.category === "all" || transaction.category === filters.category)
    && (!filters.dateFrom || transaction.date >= filters.dateFrom)
    && (!filters.dateTo || transaction.date <= filters.dateTo);
}

export function useTransactionHistory({
  userId,
  search,
  type,
  category,
  dateFrom,
  dateTo,
  pageSize = 10,
}: UseTransactionHistoryOptions) {
  const transactions = useAppStore((state) => state.transactions);
  const mergeTransactions = useAppStore((state) => state.mergeTransactions);
  const deferredSearch = useDeferredValue(search.trim());
  const [transactionIds, setTransactionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const requestGenerationRef = useRef(0);
  const loadMoreInFlightRef = useRef(false);
  const offsetRef = useRef(0);

  const activeFilters = useMemo<TransactionHistoryFilters>(() => ({
    search: deferredSearch,
    type,
    category,
    dateFrom,
    dateTo,
  }), [deferredSearch, type, category, dateFrom, dateTo]);

  const fetchPage = useCallback(async (offset: number, signal?: AbortSignal) => {
    if (!userId) return { rows: [] as Transaction[], hasMore: false };

    let query = getSupabaseClient()
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (activeFilters.type !== "all") query = query.eq("type", activeFilters.type);
    if (activeFilters.category !== "all") query = query.eq("category", activeFilters.category);
    if (activeFilters.dateFrom) query = query.gte("date", activeFilters.dateFrom);
    if (activeFilters.dateTo) query = query.lte("date", activeFilters.dateTo);

    if (activeFilters.search) {
      const safeSearch = normalizeSearch(activeFilters.search);
      if (safeSearch) {
        query = query.or(`description.ilike.%${safeSearch}%,category.ilike.%${safeSearch}%`);
      }
    }

    query = query.range(offset, offset + pageSize - 1);
    if (signal) query = query.abortSignal(signal);

    const { data, error: queryError } = await query;
    if (queryError) throw new Error(queryError.message);

    const rows = (data || []) as Transaction[];
    return { rows, hasMore: rows.length >= pageSize };
  }, [activeFilters, pageSize, userId]);

  useEffect(() => {
    const generation = ++requestGenerationRef.current;
    const controller = new AbortController();

    const loadInitialPage = async () => {
      offsetRef.current = 0;
      loadMoreInFlightRef.current = false;
      setTransactionIds([]);
      setError(null);
      setLoadMoreError(null);
      setHasMore(false);

      if (!userId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { rows, hasMore: nextHasMore } = await fetchPage(0, controller.signal);
        if (controller.signal.aborted || generation !== requestGenerationRef.current) return;
        mergeTransactions(rows);
        setTransactionIds(rows.map((transaction) => transaction.id));
        offsetRef.current = rows.length;
        setHasMore(nextHasMore);
      } catch (fetchError) {
        if (controller.signal.aborted || generation !== requestGenerationRef.current) return;
        setError(fetchError instanceof Error ? fetchError.message : "Gagal memuat transaksi");
      } finally {
        if (!controller.signal.aborted && generation === requestGenerationRef.current) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialPage();

    return () => controller.abort();
  }, [fetchPage, mergeTransactions, reloadKey, userId]);

  const loadMore = useCallback(async () => {
    if (!userId || !hasMore || isLoading || loadMoreInFlightRef.current) return;
    loadMoreInFlightRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreError(null);
    const generation = requestGenerationRef.current;

    try {
      const { rows, hasMore: nextHasMore } = await fetchPage(offsetRef.current);
      if (generation !== requestGenerationRef.current) return;
      mergeTransactions(rows);
      setTransactionIds((current) => {
        const knownIds = new Set(current);
        return [...current, ...rows.map((transaction) => transaction.id).filter((id) => !knownIds.has(id))];
      });
      offsetRef.current += rows.length;
      setHasMore(nextHasMore);
    } catch (fetchError) {
      if (generation === requestGenerationRef.current) {
        setLoadMoreError(fetchError instanceof Error ? fetchError.message : "Gagal memuat transaksi berikutnya");
      }
    } finally {
      loadMoreInFlightRef.current = false;
      if (generation === requestGenerationRef.current) setIsLoadingMore(false);
    }
  }, [fetchPage, hasMore, isLoading, mergeTransactions, userId]);

  const upsertVisibleTransaction = useCallback((transaction: Transaction) => {
    setTransactionIds((current) => {
      const withoutTransaction = current.filter((id) => id !== transaction.id);
      const matches = matchesFilters(transaction, {
        search,
        type,
        category,
        dateFrom,
        dateTo,
      });

      if (matches) return [transaction.id, ...withoutTransaction];
      return current.includes(transaction.id) ? current : withoutTransaction;
    });
  }, [category, dateFrom, dateTo, search, type]);

  const transactionById = useMemo(
    () => new Map(transactions.map((transaction) => [transaction.id, transaction])),
    [transactions]
  );
  const items = transactionIds
    .map((id) => transactionById.get(id))
    .filter((transaction): transaction is Transaction => Boolean(transaction))
    .filter((transaction) => matchesFilters(transaction, activeFilters));

  return {
    items,
    isLoading,
    isLoadingMore,
    error,
    loadMoreError,
    hasMore,
    loadMore,
    retry: () => setReloadKey((key) => key + 1),
    upsertVisibleTransaction,
  };
}
