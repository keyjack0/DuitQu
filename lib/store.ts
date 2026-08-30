import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Transaction, Wallet, Budget, User } from "@/types";
import { getSupabaseClient } from "./supabase";
import { isThisMonth, isLastMonth } from "./utils";
import { toast } from "react-toastify";

interface AppState {
  user: User | null;
  wallets: Wallet[];
  transactions: Transaction[];
  monthTransactions: Transaction[];
  lastMonthTransactions: Transaction[];
  budgets: Budget[];
  isLoading: boolean;
  syncMeta: { userId: string; at: number } | null;

  setUser: (user: User | null) => void;
  setWallets: (wallets: Wallet[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setMonthTransactions: (transactions: Transaction[]) => void;
  setLastMonthTransactions: (transactions: Transaction[]) => void;
  setBudgets: (budgets: Budget[]) => void;
  setLoading: (loading: boolean) => void;
  setSyncMeta: (meta: { userId: string; at: number } | null) => void;

  addTransaction: (transaction: Transaction) => void;
  addWallet: (wallet: Wallet) => void;
  updateWallet: (id: string, updates: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  fetchMoreTransactions: (userId: string, offset: number, limit: number) => Promise<{ loaded: number; hasMore: boolean }>;
  mergeTransactions: (rows: Transaction[]) => void;
  signOut: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist<AppState>(
    (set) => {
      const refreshWallets = async (userId: string) => {
        const { data } = await getSupabaseClient()
          .from("wallets")
          .select("*")
          .eq("user_id", userId);
        if (data) set({ wallets: data as Wallet[] });
      };

      const updateWalletBalanceLocal = (userId: string, walletId: string, delta: number) => {
        set((state) => ({
          wallets: state.wallets.map((w) =>
            w.id === walletId ? { ...w, balance: w.balance + delta } : w
          ),
        }));
        refreshWallets(userId);
      };

      return {
      user: null,
      wallets: [],
      transactions: [],
      monthTransactions: [],
      lastMonthTransactions: [],
      budgets: [],
      isLoading: false,
      syncMeta: null,

      setUser: (user) => set({ user }),
      setWallets: (wallets) => set({ wallets }),
      setTransactions: (transactions) => set({ transactions }),
      setMonthTransactions: (monthTransactions) => set({ monthTransactions }),
      setLastMonthTransactions: (lastMonthTransactions) => set({ lastMonthTransactions }),
      setBudgets: (budgets) => set({ budgets }),
      setLoading: (isLoading) => set({ isLoading }),
      setSyncMeta: (syncMeta) => set({ syncMeta }),

      addTransaction: (transaction) => {
        const txWithTimestamp = { ...transaction, created_at: transaction.created_at || new Date().toISOString() };
        set((state) => ({
          transactions: [txWithTimestamp, ...state.transactions],
          monthTransactions: isThisMonth(txWithTimestamp.date)
            ? [txWithTimestamp, ...state.monthTransactions]
            : state.monthTransactions,
          lastMonthTransactions: isLastMonth(txWithTimestamp.date)
            ? [txWithTimestamp, ...state.lastMonthTransactions]
            : state.lastMonthTransactions,
        }));
        toast.success("Transaksi berhasil ditambahkan");
        getSupabaseClient()
          .from("transactions")
          .insert({
            id: transaction.id,
            user_id: transaction.user_id,
            wallet_id: transaction.wallet_id,
            type: transaction.type,
            amount: transaction.amount,
            category: transaction.category,
            description: transaction.description,
            date: transaction.date,
            to_wallet_id: transaction.to_wallet_id ?? null,
          })
          .then(({ error }: { error: any }) => {
            if (error) {
              set((state) => ({
                transactions: state.transactions.filter((t) => t.id !== transaction.id),
              }));
              toast.error("Gagal menambah transaksi");
            } else if (transaction.wallet_id) {
              updateWalletBalanceLocal(transaction.user_id, transaction.wallet_id, transaction.type === "OUT" ? -transaction.amount : transaction.amount);
            }
          });
      },

      addWallet: (wallet) => {
        set((state) => ({
          wallets: [...state.wallets, wallet],
        }));
        toast.success("Dompet berhasil ditambahkan");
        getSupabaseClient()
          .from("wallets")
          .insert({
            id: wallet.id,
            user_id: wallet.user_id,
            name: wallet.name,
            balance: wallet.balance,
            initial_balance: wallet.initial_balance ?? wallet.balance,
            icon: wallet.icon ?? null,
            color: wallet.color ?? null,
          })
          .then(({ error }: { error: any }) => {
            if (error) {
              set((state) => ({
                wallets: state.wallets.filter((w) => w.id !== wallet.id),
              }));
              toast.error("Gagal menambah dompet");
            }
          });
      },

      updateWallet: (id, updates) => {
        const userId = useAppStore.getState().user?.id;
        const prev = useAppStore.getState().wallets;
        set((state) => ({
          wallets: state.wallets.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        }));

        const revert = () => {
          set({ wallets: prev });
          toast.error("Gagal memperbarui dompet");
        };

        const run = async () => {
          const payload: { name?: string; icon?: string | null; color?: string | null } = {};
          if (updates.name !== undefined) payload.name = updates.name;
          if (updates.icon !== undefined) payload.icon = updates.icon;
          if (updates.color !== undefined) payload.color = updates.color;

          const client = getSupabaseClient();

          if (Object.keys(payload).length > 0) {
            let query = client.from("wallets").update(payload, { count: "exact" }).eq("id", id);
            if (userId) query = query.eq("user_id", userId);
            const { error, count } = await query;
            if (error || !count) return revert();
          }

          if (typeof updates.balance === "number") {
            const { error } = await client.rpc("set_wallet_balance", {
              wallet_uuid: id,
              new_balance: updates.balance,
            });
            if (error) return revert();
          }

          toast.success("Dompet berhasil diperbarui");
          if (userId) refreshWallets(userId);
        };

        run();
      },

      deleteWallet: (id) => {
        const prev = useAppStore.getState().wallets;
        set((state) => ({
          wallets: state.wallets.filter((w) => w.id !== id),
        }));
        toast.success("Dompet berhasil dihapus");
        getSupabaseClient()
          .from("wallets")
          .delete()
          .eq("id", id)
          .then(({ error }: { error: any }) => {
            if (error) {
              set({ wallets: prev });
              toast.error("Gagal menghapus dompet");
            }
          });
      },

      addBudget: (budget) => {
        set((state) => ({
          budgets: [...state.budgets, budget],
        }));
        toast.success("Budget berhasil ditambahkan");
        getSupabaseClient()
          .from("budgets")
          .insert({
            id: budget.id,
            user_id: budget.user_id,
            category: budget.category,
            amount_limit: budget.amount_limit,
            period: budget.period,
          })
          .then(({ error }: { error: any }) => {
            if (error) {
              set((state) => ({
                budgets: state.budgets.filter((b) => b.id !== budget.id),
              }));
              toast.error("Gagal menambah budget");
            }
          });
      },

      updateBudget: (id, updates) => {
        set((state) => ({
          budgets: state.budgets.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        }));
        toast.success("Budget berhasil diperbarui");
        getSupabaseClient()
          .from("budgets")
          .update(updates)
          .eq("id", id)
          .then(({ error }: { error: any }) => {
            if (error) {
              toast.error("Gagal memperbarui budget");
              getSupabaseClient()
                .from("budgets")
                .select("*")
                .eq("id", id)
                .single()
                .then(({ data }: { data: any }) => {
                  if (data) set((state) => ({ budgets: state.budgets.map((b) => (b.id === id ? { ...b, ...data as any } : b)) }));
                });
            }
          });
      },

      deleteBudget: (id) => {
        const prev = useAppStore.getState().budgets;
        set((state) => ({
          budgets: state.budgets.filter((b) => b.id !== id),
        }));
        toast.success("Budget berhasil dihapus");
        getSupabaseClient()
          .from("budgets")
          .delete()
          .eq("id", id)
          .then(({ error }: { error: any }) => {
            if (error) {
              set({ budgets: prev });
              toast.error("Gagal menghapus budget");
            }
          });
      },

      deleteTransaction: (id) => {
        const prev = useAppStore.getState().transactions;
        const prevMonth = useAppStore.getState().monthTransactions;
        const userId = useAppStore.getState().user?.id;
        const tx = useAppStore.getState().transactions.find((t) => t.id === id);
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
          monthTransactions: state.monthTransactions.filter((t) => t.id !== id),
          lastMonthTransactions: state.lastMonthTransactions.filter((t) => t.id !== id),
        }));
        toast.success("Transaksi berhasil dihapus");
        getSupabaseClient()
          .from("transactions")
          .delete()
          .eq("id", id)
          .then(({ error }: { error: any }) => {
            if (error) {
              set({ transactions: prev, monthTransactions: prevMonth });
              toast.error("Gagal menghapus transaksi");
            } else if (userId && tx?.wallet_id) {
              updateWalletBalanceLocal(userId, tx.wallet_id, tx.type === "OUT" ? tx.amount : -tx.amount);
            }
          });
      },

      updateTransaction: (id, updates) => {
        const userId = useAppStore.getState().user?.id;
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
          monthTransactions: state.monthTransactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
          lastMonthTransactions: state.lastMonthTransactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
        toast.success("Transaksi berhasil diperbarui");
        getSupabaseClient()
          .from("transactions")
          .update({
            type: updates.type,
            amount: updates.amount,
            category: updates.category,
            description: updates.description,
            date: updates.date,
            wallet_id: updates.wallet_id,
            to_wallet_id: updates.to_wallet_id ?? null,
          })
          .eq("id", id)
          .then(({ error }: { error: { message: string } | null }) => {
            if (error) {
              toast.error("Gagal memperbarui transaksi");
              getSupabaseClient()
                .from("transactions")
                .select("*")
                .eq("id", id)
                .single()
                .then(({ data }: { data: Transaction | null }) => {
                  if (data) {
                    set((state) => ({
                      transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...data } : t)),
                    }));
                  }
                });
            } else if (userId) {
              refreshWallets(userId);
            }
          });
      },

      fetchMoreTransactions: async (userId, offset, limit) => {
        const { data, error } = await getSupabaseClient()
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false })
          .range(offset, offset + limit - 1);
        if (error || !data) return { loaded: 0, hasMore: false };
        const rows = data as Transaction[];
        if (rows.length === 0) return { loaded: 0, hasMore: false };
        const existing = new Set(useAppStore.getState().transactions.map((t) => t.id));
        const newRows = rows.filter((t) => !existing.has(t.id));
        if (newRows.length > 0) {
          set((state) => ({
            transactions: [...state.transactions, ...newRows],
          }));
        }
        return { loaded: rows.length, hasMore: rows.length >= limit };
      },

      mergeTransactions: (rows) => {
        const existing = new Set(useAppStore.getState().transactions.map((t) => t.id));
        const newRows = rows.filter((t) => !existing.has(t.id));
        if (newRows.length > 0) {
          set((state) => ({
            transactions: [...state.transactions, ...newRows],
          }));
        }
      },

      signOut: async () => {
        await getSupabaseClient().auth.signOut();
        useAppStore.persist.clearStorage();
      },
      };
    },
    {
      name: "duitqu-storage",
      partialize: (state: AppState) => ({
        user: state.user,
        syncMeta: state.syncMeta,
      }),
    } as any
  )
);
