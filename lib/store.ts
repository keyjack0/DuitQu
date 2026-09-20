/**
 * Menyimpan state utama DuitQu dan menyediakan mutasi optimistis yang
 * disinkronkan dengan database Supabase.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Transaction, Wallet, Budget, User, FinancialGoal } from "@/types";
import { getSupabaseClient } from "./supabase";
import { isThisMonth, isLastMonth } from "./utils";
import { toast } from "react-toastify";

type InitialData = Partial<{
  user: User | null;
  wallets: Wallet[];
  transactions: Transaction[];
  monthTransactions: Transaction[];
  lastMonthTransactions: Transaction[];
  budgets: Budget[];
  financialGoals: FinancialGoal[];
  syncMeta: { userId: string; at: number } | null;
}>;

interface AppState {
  user: User | null;
  wallets: Wallet[];
  transactions: Transaction[];
  monthTransactions: Transaction[];
  lastMonthTransactions: Transaction[];
  budgets: Budget[];
  financialGoals: FinancialGoal[];
  transactionRevision: number;
  isLoading: boolean;
  syncMeta: { userId: string; at: number } | null;

  setUser: (user: User | null) => void;
  setWallets: (wallets: Wallet[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setMonthTransactions: (transactions: Transaction[]) => void;
  setLastMonthTransactions: (transactions: Transaction[]) => void;
  setBudgets: (budgets: Budget[]) => void;
  setFinancialGoals: (goals: FinancialGoal[]) => void;
  setLoading: (loading: boolean) => void;
  setSyncMeta: (meta: { userId: string; at: number } | null) => void;
  applyInitialData: (data: InitialData) => void;

  addTransaction: (transaction: Transaction) => Promise<boolean>;
  addWallet: (wallet: Wallet) => void;
  updateWallet: (id: string, updates: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  addFinancialGoal: (goal: FinancialGoal) => Promise<boolean>;
  updateFinancialGoal: (id: string, updates: Partial<FinancialGoal>) => Promise<boolean>;
  deleteFinancialGoal: (id: string) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<boolean>;
  fetchMoreTransactions: (userId: string, offset: number, limit: number) => Promise<{ loaded: number; hasMore: boolean }>;
  mergeTransactions: (rows: Transaction[]) => void;
  signOut: () => Promise<boolean>;
}

export const useAppStore = create<AppState>()(
  persist<AppState, [], [], Pick<AppState, "user" | "syncMeta">>(
    (set) => {
      const refreshWallets = async (userId: string) => {
        const { data, error } = await getSupabaseClient()
          .from("wallets")
          .select("*")
          .eq("user_id", userId);
        if (error) return;
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
      financialGoals: [],
      transactionRevision: 0,
      isLoading: true,
      syncMeta: null,

      setUser: (user) => set({ user }),
      setWallets: (wallets) => set({ wallets }),
      setTransactions: (transactions) => set({ transactions }),
      setMonthTransactions: (monthTransactions) => set({ monthTransactions }),
      setLastMonthTransactions: (lastMonthTransactions) => set({ lastMonthTransactions }),
      setBudgets: (budgets) => set({ budgets }),
      setFinancialGoals: (financialGoals) => set({ financialGoals }),
      setLoading: (isLoading) => set({ isLoading }),
      setSyncMeta: (syncMeta) => set({ syncMeta }),
      applyInitialData: (data) => set(data),

      addTransaction: async (transaction) => {
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
        const { error } = await getSupabaseClient()
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
          });
        if (error) {
          set((state) => ({
            transactions: state.transactions.filter((t) => t.id !== transaction.id),
            monthTransactions: state.monthTransactions.filter((t) => t.id !== transaction.id),
            lastMonthTransactions: state.lastMonthTransactions.filter((t) => t.id !== transaction.id),
          }));
          toast.error("Gagal menambah transaksi");
          return false;
        }
        if (transaction.type === "TRANSFER") {
          void refreshWallets(transaction.user_id);
          toast.success("Transfer berhasil");
        } else {
          if (transaction.wallet_id) {
            updateWalletBalanceLocal(transaction.user_id, transaction.wallet_id, transaction.type === "OUT" ? -transaction.amount : transaction.amount);
          }
          toast.success("Transaksi berhasil ditambahkan");
        }
        set((state) => ({ transactionRevision: state.transactionRevision + 1 }));
        return true;
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
          .then(({ error }: { error: unknown }) => {
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
          .then(({ error }: { error: unknown }) => {
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
          .then(({ error }: { error: unknown }) => {
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
          .then(({ error }: { error: unknown }) => {
            if (error) {
              toast.error("Gagal memperbarui budget");
              getSupabaseClient()
                .from("budgets")
                .select("*")
                .eq("id", id)
                .single()
                .then(({ data }: { data: Budget | null }) => {
                  if (data) set((state) => ({ budgets: state.budgets.map((b) => (b.id === id ? { ...b, ...data } : b)) }));
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
          .then(({ error }: { error: unknown }) => {
            if (error) {
              set({ budgets: prev });
              toast.error("Gagal menghapus budget");
            }
          });
      },

      addFinancialGoal: async (goal) => {
        set((state) => ({
          financialGoals: [...state.financialGoals, goal],
        }));
        const { error } = await getSupabaseClient()
          .from("financial_goals")
          .insert({
            id: goal.id,
            user_id: goal.user_id,
            name: goal.name,
            target_amount: goal.target_amount,
            current_amount: goal.current_amount,
            deadline: goal.deadline,
            icon: goal.icon,
            color: goal.color,
          });
        if (error) {
          set((state) => ({
            financialGoals: state.financialGoals.filter((g) => g.id !== goal.id),
          }));
          toast.error("Gagal menambah goal");
          return false;
        }
        toast.success("Goal berhasil ditambahkan");
        return true;
      },

      updateFinancialGoal: async (id, updates) => {
        const prev = useAppStore.getState().financialGoals;
        const userId = useAppStore.getState().user?.id;
        set((state) => ({
          financialGoals: state.financialGoals.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        }));
        let query = getSupabaseClient()
          .from("financial_goals")
          .update(updates, { count: "exact" })
          .eq("id", id);
        if (userId) query = query.eq("user_id", userId);
        const { error, count } = await query;
        if (error || !count) {
          set({ financialGoals: prev });
          toast.error("Gagal memperbarui goal");
          return false;
        }
        toast.success("Goal berhasil diperbarui");
        return true;
      },

      deleteFinancialGoal: async (id) => {
        const prev = useAppStore.getState().financialGoals;
        const userId = useAppStore.getState().user?.id;
        set((state) => ({
          financialGoals: state.financialGoals.filter((g) => g.id !== id),
        }));
        let query = getSupabaseClient()
          .from("financial_goals")
          .delete({ count: "exact" })
          .eq("id", id);
        if (userId) query = query.eq("user_id", userId);
        const { error, count } = await query;
        if (error || !count) {
          set({ financialGoals: prev });
          toast.error("Gagal menghapus goal");
          return false;
        }
        toast.success("Goal berhasil dihapus");
        return true;
      },

      deleteTransaction: async (id) => {
        const prev = useAppStore.getState().transactions;
        const prevMonth = useAppStore.getState().monthTransactions;
        const prevLastMonth = useAppStore.getState().lastMonthTransactions;
        const userId = useAppStore.getState().user?.id;
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
          monthTransactions: state.monthTransactions.filter((t) => t.id !== id),
          lastMonthTransactions: state.lastMonthTransactions.filter((t) => t.id !== id),
        }));
        const { error } = await getSupabaseClient()
          .from("transactions")
          .delete()
          .eq("id", id);
        if (error) {
          set({
            transactions: prev,
            monthTransactions: prevMonth,
            lastMonthTransactions: prevLastMonth,
          });
          toast.error("Gagal menghapus transaksi");
          return false;
        }
        set((state) => ({ transactionRevision: state.transactionRevision + 1 }));
        toast.success("Transaksi berhasil dihapus");
        if (userId) void refreshWallets(userId);
        return true;
      },

      updateTransaction: async (id, updates) => {
        const userId = useAppStore.getState().user?.id;
        const previousState = useAppStore.getState();
        const previousTransactions = previousState.transactions;
        const previousMonthTransactions = previousState.monthTransactions;
        const previousLastMonthTransactions = previousState.lastMonthTransactions;
        const existingTransaction = previousTransactions.find((transaction) => transaction.id === id);
        const updatedTransaction = existingTransaction ? { ...existingTransaction, ...updates } : null;

        set((state) => {
          const monthWithoutTransaction = state.monthTransactions.filter((transaction) => transaction.id !== id);
          const lastMonthWithoutTransaction = state.lastMonthTransactions.filter((transaction) => transaction.id !== id);

          return {
            transactions: state.transactions.map((transaction) =>
              transaction.id === id ? { ...transaction, ...updates } : transaction
            ),
            monthTransactions: updatedTransaction && isThisMonth(updatedTransaction.date)
              ? [updatedTransaction, ...monthWithoutTransaction]
              : monthWithoutTransaction,
            lastMonthTransactions: updatedTransaction && isLastMonth(updatedTransaction.date)
              ? [updatedTransaction, ...lastMonthWithoutTransaction]
              : lastMonthWithoutTransaction,
          };
        });
        const { error } = await getSupabaseClient()
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
          .eq("id", id);
        if (error) {
          toast.error("Gagal memperbarui transaksi");
          set({
            transactions: previousTransactions,
            monthTransactions: previousMonthTransactions,
            lastMonthTransactions: previousLastMonthTransactions,
          });
          return false;
        }
        toast.success("Transaksi berhasil diperbarui");
        set((state) => ({ transactionRevision: state.transactionRevision + 1 }));
        if (userId) void refreshWallets(userId);
        return true;
      },

      fetchMoreTransactions: async (userId, offset, limit) => {
        const { data, error } = await getSupabaseClient()
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false })
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
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
        const { error } = await getSupabaseClient().auth.signOut();
        if (error) return false;
        set({
          user: null,
          wallets: [],
          transactions: [],
          monthTransactions: [],
          lastMonthTransactions: [],
          budgets: [],
          financialGoals: [],
          transactionRevision: 0,
          syncMeta: null,
        });
        useAppStore.persist.clearStorage();
        return true;
      },
      };
    },
    {
      name: "duitqu-storage",
      partialize: (state: AppState) => ({
        user: state.user,
        syncMeta: state.syncMeta,
      }),
    }
  )
);
