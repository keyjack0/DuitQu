"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { getSupabaseClient } from "@/lib/supabase";
import type { UserRow, WalletRow, TransactionRow, BudgetRow } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const SYNC_TTL_MS = 60_000;
const TRANSACTIONS_PAGE_SIZE = 300;

export function DataInitializer() {
  const { syncMeta, setUser, setWallets, setTransactions, setBudgets, setLoading, setSyncMeta } = useAppStore();
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

      const sessionFallback = {
        id: session.user.id,
        email: session.user.email ?? "",
        name: session.user.user_metadata?.name ?? session.user.email?.split("@")[0] ?? "User",
        created_at: session.user.created_at,
      };

      // Jangan timpa user tersimpan (nama terbaru) dengan metadata sesi yang mungkin basi
      const currentUser = useAppStore.getState().user;
      if (!currentUser || currentUser.id !== session.user.id) {
        setUser(sessionFallback);
      }

      // Profil (nama/email) SELALU diambil — sumber nama yang otoritatif
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

      const shouldSync =
        !syncMeta ||
        syncMeta.userId !== session.user.id ||
        Date.now() - syncMeta.at > SYNC_TTL_MS;

      if (!shouldSync) return;

      setLoading(true);

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

      // Load transactions (recent page only)
      try {
        const txResult = await getSupabaseClient()
          .from("transactions")
          .select("*")
          .eq("user_id", session.user.id)
          .order("date", { ascending: false })
          .limit(TRANSACTIONS_PAGE_SIZE);
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

      setSyncMeta({ userId: session.user.id, at: Date.now() });
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
        setSyncMeta(null);
        router.push("/login");
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [
    router,
    syncMeta,
    setUser,
    setWallets,
    setTransactions,
    setBudgets,
    setLoading,
    setSyncMeta,
  ]);

  return null;
}