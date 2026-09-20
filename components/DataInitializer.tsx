"use client";

/** Memuat data awal pengguna dan menangani perubahan sesi autentikasi. */
import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { getSupabaseClient } from "@/lib/supabase";
import type { UserRow, WalletRow, TransactionRow, BudgetRow } from "@/lib/supabase";
import type { FinancialGoal } from "@/types";
import { getStartOfMonth, getStartOfLastMonth } from "@/lib/utils";
import { useRouter } from "next/navigation";

const SYNC_TTL_MS = 60_000;
const TRANSACTIONS_PAGE_SIZE = 10;

export function DataInitializer() {
  const router = useRouter();
  const initRanRef = useRef(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = getSupabaseClient().auth.onAuthStateChange((event: string) => {
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
        router.push("/login");
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (initRanRef.current) return;
    initRanRef.current = true;

    const init = async () => {
      useAppStore.getState().setLoading(true);
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/login");
        return;
      }

      const userId = session.user.id;
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

      const [userResult, walletsResult, txResult, monthResult, lastMonthResult, budgetResult, goalResult] =
        await Promise.allSettled([
          supabase.from("users").select("*").eq("id", userId).single(),
          supabase.from("wallets").select("*").eq("user_id", userId),
          supabase
            .from("transactions")
            .select("*")
            .eq("user_id", userId)
            .order("date", { ascending: false })
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .limit(TRANSACTIONS_PAGE_SIZE),
          supabase
            .from("transactions")
            .select("*")
            .eq("user_id", userId)
            .gte("date", getStartOfMonth())
            .order("date", { ascending: false })
            .order("created_at", { ascending: false })
            .order("id", { ascending: false }),
          supabase
            .from("transactions")
            .select("*")
            .eq("user_id", userId)
            .gte("date", getStartOfLastMonth())
            .lt("date", getStartOfMonth())
            .order("date", { ascending: false })
            .order("created_at", { ascending: false })
            .order("id", { ascending: false }),
          supabase.from("budgets").select("*").eq("user_id", userId),
          supabase.from("financial_goals").select("*").eq("user_id", userId),
        ]);

      const st = useAppStore.getState();
      const initialData: Parameters<typeof st.applyInitialData>[0] = {};
      if (userResult.status === "fulfilled") {
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

      if (walletsResult.status === "fulfilled" && walletsResult.value.data) {
        initialData.wallets = walletsResult.value.data as WalletRow[];
      }

      if (txResult.status === "fulfilled" && txResult.value.data) {
        initialData.transactions = txResult.value.data as TransactionRow[];
      }

      if (monthResult.status === "fulfilled" && monthResult.value.data) {
        initialData.monthTransactions = monthResult.value.data as TransactionRow[];
      }

      if (lastMonthResult.status === "fulfilled" && lastMonthResult.value.data) {
        initialData.lastMonthTransactions = lastMonthResult.value.data as TransactionRow[];
      }

      if (budgetResult.status === "fulfilled" && budgetResult.value.data) {
        initialData.budgets = budgetResult.value.data as BudgetRow[];
      }

      if (goalResult.status === "fulfilled" && goalResult.value.data) {
        initialData.financialGoals = goalResult.value.data as FinancialGoal[];
      }

      initialData.syncMeta = { userId, at: Date.now() };
      st.applyInitialData(initialData);
    };

    void init()
      .catch((error) => console.error("Gagal menginisialisasi data aplikasi", error))
      .finally(() => useAppStore.getState().setLoading(false));
  }, [router]);

  return null;
}
