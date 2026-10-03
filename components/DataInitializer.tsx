"use client";

/** Memuat data awal pengguna dan menangani perubahan sesi autentikasi. */
import { useEffect, useRef } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { useAppStore } from "@/lib/store";
import { getSupabaseClient } from "@/lib/supabase";
import type { UserRow, WalletRow, TransactionRow, BudgetRow } from "@/lib/supabase";
import type { FinancialGoal } from "@/types";
import { getStartOfMonth, getStartOfLastMonth, toLocalDateString } from "@/lib/utils";
import { useRouter } from "next/navigation";

const SYNC_TTL_MS = 60_000;
const TRANSACTIONS_PAGE_SIZE = 10;

export function DataInitializer() {
  const router = useRouter();
  const initGenerationRef = useRef(0);
  const initAbortRef = useRef<AbortController | null>(null);
  const activeUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = getSupabaseClient().auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      const nextUserId = session?.user.id ?? null;
      if (
        event === "SIGNED_OUT" ||
        (activeUserIdRef.current !== null && activeUserIdRef.current !== nextUserId)
      ) {
        initGenerationRef.current += 1;
        initAbortRef.current?.abort();
      }
      activeUserIdRef.current = nextUserId;

      if (event === "SIGNED_OUT") {
        const s = useAppStore.getState();
        s.applyInitialData({
          user: null,
          wallets: [],
          transactions: [],
          monthTransactions: [],
          lastMonthTransactions: [],
          budgets: [],
          financialGoals: [],
          syncMeta: null,
        });
        s.setLoading(false);
        router.push("/login");
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    const abortController = new AbortController();
    const generation = ++initGenerationRef.current;
    initAbortRef.current?.abort();
    initAbortRef.current = abortController;
    const isCurrent = () =>
      !abortController.signal.aborted && initGenerationRef.current === generation;

    const init = async () => {
      useAppStore.getState().setLoading(true);
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!isCurrent()) return;

      if (!session?.user) {
        router.push("/login");
        return;
      }

      const userId = session.user.id;
      if (activeUserIdRef.current !== null && activeUserIdRef.current !== userId) return;
      activeUserIdRef.current = userId;
      const { syncMeta } = useAppStore.getState();

      const currentUser = useAppStore.getState().user;
      if (!currentUser || currentUser.id !== userId) {
        useAppStore.getState().setUser({
          id: userId,
          email: session.user.email ?? "",
          name: session.user.user_metadata?.name ?? session.user.email?.split("@")[0] ?? "User",
          created_at: session.user.created_at,
        });
      }

      const shouldSync =
        !syncMeta ||
        syncMeta.userId !== userId ||
        Date.now() - syncMeta.at > SYNC_TTL_MS;

      const freshState = useAppStore.getState();
      if (
        freshState.wallets.length > 0 &&
        freshState.monthTransactions.length > 0 &&
        !shouldSync
      ) {
        return;
      }

      const currentMonthStart = getStartOfMonth();
      const [currentYear, currentMonth] = currentMonthStart.split("-").map(Number);
      const nextMonthStart = toLocalDateString(new Date(currentYear, currentMonth, 1));
      const signal = abortController.signal;

      const [userResult, walletsResult, txResult, monthResult, lastMonthResult, budgetResult, goalResult] =
        await Promise.allSettled([
          supabase
            .from("users")
            .select("id,email,name,created_at")
            .eq("id", userId)
            .single()
            .abortSignal(signal),
          supabase
            .from("wallets")
            .select("id,user_id,name,balance,initial_balance,icon,color,created_at")
            .eq("user_id", userId)
            .abortSignal(signal),
          supabase
            .from("transactions")
            .select("id,user_id,wallet_id,type,amount,category,description,date,to_wallet_id,created_at")
            .eq("user_id", userId)
            .order("date", { ascending: false })
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .limit(TRANSACTIONS_PAGE_SIZE)
            .abortSignal(signal),
          supabase
            .from("transactions")
            .select("id,user_id,wallet_id,type,amount,category,description,date,to_wallet_id,created_at")
            .eq("user_id", userId)
            .gte("date", currentMonthStart)
            .lt("date", nextMonthStart)
            .order("date", { ascending: false })
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .abortSignal(signal),
          supabase
            .from("transactions")
            .select("id,user_id,wallet_id,type,amount,category,description,date,to_wallet_id,created_at")
            .eq("user_id", userId)
            .gte("date", getStartOfLastMonth())
            .lt("date", currentMonthStart)
            .order("date", { ascending: false })
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .abortSignal(signal),
          supabase
            .from("budgets")
            .select("id,user_id,category,amount_limit,period,created_at")
            .eq("user_id", userId)
            .abortSignal(signal),
          supabase
            .from("financial_goals")
            .select("id,user_id,name,target_amount,current_amount,deadline,icon,color,created_at")
            .eq("user_id", userId)
            .abortSignal(signal),
        ]);

      if (!isCurrent() || activeUserIdRef.current !== userId) return;

      const results = [
        userResult,
        walletsResult,
        txResult,
        monthResult,
        lastMonthResult,
        budgetResult,
        goalResult,
      ];
      const st = useAppStore.getState();
      const initialData: Parameters<typeof st.applyInitialData>[0] = {};
      if (userResult.status === "fulfilled" && !userResult.value.error) {
        const userData = userResult.value.data as UserRow | null;
        if (userData) {
          initialData.user = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            created_at: userData.created_at,
          };
        }
      }

      if (walletsResult.status === "fulfilled" && !walletsResult.value.error && walletsResult.value.data) {
        initialData.wallets = walletsResult.value.data as WalletRow[];
      }

      if (txResult.status === "fulfilled" && !txResult.value.error && txResult.value.data) {
        initialData.transactions = txResult.value.data as TransactionRow[];
      }

      if (monthResult.status === "fulfilled" && !monthResult.value.error && monthResult.value.data) {
        initialData.monthTransactions = monthResult.value.data as TransactionRow[];
      }

      if (lastMonthResult.status === "fulfilled" && !lastMonthResult.value.error && lastMonthResult.value.data) {
        initialData.lastMonthTransactions = lastMonthResult.value.data as TransactionRow[];
      }

      if (budgetResult.status === "fulfilled" && !budgetResult.value.error && budgetResult.value.data) {
        initialData.budgets = budgetResult.value.data as BudgetRow[];
      }

      if (goalResult.status === "fulfilled" && !goalResult.value.error && goalResult.value.data) {
        initialData.financialGoals = goalResult.value.data as FinancialGoal[];
      }

      if (results.every((result) => result.status === "fulfilled" && !result.value.error)) {
        initialData.syncMeta = { userId, at: Date.now() };
      }
      st.applyInitialData(initialData);
    };

    void init()
      .catch((error) => {
        if (isCurrent()) console.error("Gagal menginisialisasi data aplikasi", error);
      })
      .finally(() => {
        if (isCurrent()) useAppStore.getState().setLoading(false);
      });

    return () => {
      abortController.abort();
      if (initGenerationRef.current === generation) initGenerationRef.current += 1;
      if (initAbortRef.current === abortController) initAbortRef.current = null;
    };
  }, [router]);

  return null;
}
