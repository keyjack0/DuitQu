import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Transaction, Wallet, Budget, User } from "@/types";
import { getSupabaseClient } from "./supabase";
import { toast } from "react-toastify";

interface AppState {
  user: User | null;
  wallets: Wallet[];
  transactions: Transaction[];
  budgets: Budget[];
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setWallets: (wallets: Wallet[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setBudgets: (budgets: Budget[]) => void;
  setLoading: (loading: boolean) => void;

  addTransaction: (transaction: Transaction) => void;
  addWallet: (wallet: Wallet) => void;
  updateWallet: (id: string, updates: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  deleteTransaction: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist<AppState>(
    (set) => ({
      user: null,
      wallets: [],
      transactions: [],
      budgets: [],
      isLoading: false,

      setUser: (user) => set({ user }),
      setWallets: (wallets) => set({ wallets }),
      setTransactions: (transactions) => set({ transactions }),
      setBudgets: (budgets) => set({ budgets }),
      setLoading: (isLoading) => set({ isLoading }),

      addTransaction: (transaction) => {
        set((state) => ({
          transactions: [transaction, ...state.transactions],
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
        set((state) => ({
          wallets: state.wallets.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        }));
        toast.success("Dompet berhasil diperbarui");
        getSupabaseClient()
          .from("wallets")
          .update({
            name: updates.name,
            balance: updates.balance,
            icon: updates.icon ?? null,
            color: updates.color ?? null,
          })
          .eq("id", id)
          .then(({ error }: { error: any }) => {
            if (error) {
              toast.error("Gagal memperbarui dompet");
              getSupabaseClient()
                .from("wallets")
                .select("*")
                .eq("id", id)
                .single()
                .then(({ data }: { data: any }) => {
                  if (data) {
                    set((state) => ({
                      wallets: state.wallets.map((w) => (w.id === id ? { ...w, ...data as any } : w)),
                    }));
                  }
                });
            }
          });
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
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
        toast.success("Transaksi berhasil dihapus");
        getSupabaseClient()
          .from("transactions")
          .delete()
          .eq("id", id)
          .then(({ error }: { error: any }) => {
            if (error) {
              set({ transactions: prev });
              toast.error("Gagal menghapus transaksi");
            }
          });
      },
    }),
    {
      name: "duitqu-storage",
    }
  )
);
