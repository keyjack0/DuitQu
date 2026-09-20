"use client";

/** Mengambil dan menyimpan sementara transaksi dalam rentang tanggal tertentu. */
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { getSupabaseClient } from "@/lib/supabase";
import type { Transaction } from "@/types";

const PAGE_SIZE = 500;
const STALE_TIME_MS = 30_000;

interface PeriodCacheEntry {
  transactions?: Transaction[];
  updatedAt?: number;
  promise?: Promise<Transaction[]>;
}

const periodCache = new Map<string, PeriodCacheEntry>();

function getCacheKey(userId: string, start: string, end: string) {
  return `${userId}:${start}:${end}`;
}

function fetchPeriodTransactions(userId: string, start: string, end: string) {
  const key = getCacheKey(userId, start, end);
  const cached = periodCache.get(key);
  if (cached?.transactions && cached.updatedAt && Date.now() - cached.updatedAt < STALE_TIME_MS) {
    return Promise.resolve(cached.transactions);
  }
  if (cached?.promise) return cached.promise;

  const promise = (async () => {
    const transactions: Transaction[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await getSupabaseClient().from("transactions").select("*")
        .eq("user_id", userId).gte("date", start).lt("date", end)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) throw error;
      const rows = (data ?? []) as Transaction[];
      transactions.push(...rows);
      if (rows.length < PAGE_SIZE) break;
    }
    periodCache.set(key, { transactions, updatedAt: Date.now() });
    return transactions;
  })().catch((error) => {
    periodCache.delete(key);
    throw error;
  });

  periodCache.set(key, { ...cached, promise });
  return promise;
}

export function usePeriodTransactions(start: string, end: string) {
  const userId = useAppStore((state) => state.user?.id);
  const transactionRevision = useAppStore((state) => state.transactionRevision);
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${userId}:${start}:${end}:${transactionRevision}:${attempt}`;
  const [result, setResult] = useState<{ key: string; transactions: Transaction[]; error: string | null } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    if (transactionRevision > 0) periodCache.delete(getCacheKey(userId, start, end));
    void fetchPeriodTransactions(userId, start, end)
      .then((transactions) => {
        if (!cancelled) setResult({ key: requestKey, transactions, error: null });
      })
      .catch(() => {
        if (!cancelled) setResult({ key: requestKey, transactions: [], error: "Transaksi belum dapat dimuat. Coba lagi." });
      });
    return () => { cancelled = true; };
  }, [userId, start, end, transactionRevision, requestKey]);

  const current = result?.key === requestKey ? result : null;
  return {
    transactions: current?.transactions ?? [],
    isLoading: !current,
    error: current?.error ?? null,
    retry: () => {
      if (userId) periodCache.delete(getCacheKey(userId, start, end));
      setAttempt((value) => value + 1);
    },
  };
}
