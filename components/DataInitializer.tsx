"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { getSupabaseClient } from "@/lib/supabase";
import type { UserRow, WalletRow, TransactionRow, BudgetRow } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function DataInitializer() {
  const { setUser, setWallets, setTransactions, setBudgets, setLoading } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();

      if (!session?.user) {
        router.push("/login");
        return;
      }

      setLoading(true);

      // Set user from auth session immediately
      setUser({
        id: session.user.id,
        email: session.user.email ?? "",
        name: session.user.user_metadata?.name ?? session.user.email?.split("@")[0] ?? "User",
        created_at: session.user.created_at,
      });

      // Try loading user profile (may fail if table doesn't exist)
      try {
        const userResult = await getSupabaseClient()
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();
        const userData = userResult.data as UserRow | null;
        if (userData) {
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            created_at: userData.created_at,
          });
        }
      } catch {
        // Table may not exist yet — use auth fallback
      }

      // Load wallets
      try {
        const walletsResult = await getSupabaseClient()
          .from("wallets")
          .select("*")
          .eq("user_id", session.user.id);
        const wallets = walletsResult.data as WalletRow[] | null;
        if (wallets) setWallets(wallets);
      } catch {
        // Table may not exist
      }

      // Load transactions
      try {
        const txResult = await getSupabaseClient()
          .from("transactions")
          .select("*")
          .eq("user_id", session.user.id)
          .order("date", { ascending: false });
        const transactions = txResult.data as TransactionRow[] | null;
        if (transactions) setTransactions(transactions);
      } catch {
        // Table may not exist
      }

      // Load budgets
      try {
        const budgetResult = await getSupabaseClient()
          .from("budgets")
          .select("*")
          .eq("user_id", session.user.id);
        const budgets = budgetResult.data as BudgetRow[] | null;
        if (budgets) setBudgets(budgets);
      } catch {
        // Table may not exist
      }

      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = getSupabaseClient().auth.onAuthStateChange((event: string) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setWallets([]);
        setTransactions([]);
        setBudgets([]);
        router.push("/login");
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return null;
}
