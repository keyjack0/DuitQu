-- DuitQu Database Schema
-- Jalankan di Supabase SQL Editor

-- Users table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  balance DECIMAL(15,2) DEFAULT 0,
  initial_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  icon TEXT DEFAULT 'cash',
  color TEXT DEFAULT '#22c55e',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('IN', 'OUT', 'TRANSFER')),
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  to_wallet_id UUID REFERENCES public.wallets(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount_limit DECIMAL(15,2) NOT NULL CHECK (amount_limit > 0),
  period TEXT NOT NULL DEFAULT 'MONTH' CHECK (period IN ('MONTH', 'YEAR')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, period)
);

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON public.users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own wallets" ON public.wallets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own transactions" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own budgets" ON public.budgets
  FOR ALL USING (auth.uid() = user_id);

-- Allow insert during signup (trigger will handle this)
CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);

-- Function: Create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Migration: add initial_balance to existing wallets (idempotent)
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS initial_balance DECIMAL(15,2) NOT NULL DEFAULT 0;

-- Function: Recompute a wallet's balance from all related transactions
CREATE OR REPLACE FUNCTION public.recalc_wallet_balance(wallet_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.wallets w
  SET balance = w.initial_balance
    + COALESCE((
        SELECT SUM(CASE
          WHEN t.type = 'IN' THEN t.amount
          WHEN t.type = 'OUT' THEN -t.amount
          WHEN t.type = 'TRANSFER' THEN -t.amount
          ELSE 0
        END)
        FROM public.transactions t
        WHERE t.wallet_id = w.id
      ), 0)
    + COALESCE((
        SELECT SUM(t.amount)
        FROM public.transactions t
        WHERE t.to_wallet_id = w.id
      ), 0)
  WHERE w.id = wallet_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function: Set a wallet's current balance to an exact value,
-- adjusting initial_balance so it stays consistent with its transactions
CREATE OR REPLACE FUNCTION public.set_wallet_balance(wallet_uuid UUID, new_balance DECIMAL(15,2))
RETURNS VOID AS $$
DECLARE
  delta DECIMAL(15,2);
  incoming DECIMAL(15,2);
BEGIN
  SELECT COALESCE(SUM(CASE
      WHEN t.type = 'IN' THEN t.amount
      WHEN t.type = 'OUT' THEN -t.amount
      WHEN t.type = 'TRANSFER' THEN -t.amount
      ELSE 0
    END), 0)
    INTO delta
  FROM public.transactions t
  WHERE t.wallet_id = wallet_uuid;

  SELECT COALESCE(SUM(t.amount), 0)
    INTO incoming
  FROM public.transactions t
  WHERE t.to_wallet_id = wallet_uuid;

  UPDATE public.wallets w
  SET initial_balance = new_balance - delta - incoming,
      balance = new_balance
  WHERE w.id = wallet_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function: Recompute balances for all wallets affected by a transaction change
CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER AS $$
DECLARE
  ids UUID[] := '{}'::UUID[];
  wid UUID;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    ids := ids || OLD.wallet_id;
    IF OLD.to_wallet_id IS NOT NULL THEN
      ids := ids || OLD.to_wallet_id;
    END IF;
  END IF;
  IF TG_OP <> 'DELETE' THEN
    ids := ids || NEW.wallet_id;
    IF NEW.to_wallet_id IS NOT NULL THEN
      ids := ids || NEW.to_wallet_id;
    END IF;
  END IF;

  FOREACH wid IN ARRAY ids LOOP
    PERFORM public.recalc_wallet_balance(wid);
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_wallet_balance ON public.transactions;
CREATE TRIGGER trigger_update_wallet_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance();

-- One-time migration: recover true opening balance and fix any drift
UPDATE public.wallets w
SET initial_balance = w.balance
  - COALESCE((
      SELECT SUM(CASE
        WHEN t.type = 'IN' THEN t.amount
        WHEN t.type = 'OUT' THEN -t.amount
        WHEN t.type = 'TRANSFER' THEN -t.amount
        ELSE 0 END)
      FROM public.transactions t
      WHERE t.wallet_id = w.id
    ), 0)
  - COALESCE((
      SELECT SUM(t.amount)
      FROM public.transactions t
      WHERE t.to_wallet_id = w.id
    ), 0);

SELECT public.recalc_wallet_balance(id) FROM public.wallets;

-- AI Chat History
CREATE TABLE IF NOT EXISTS public.ai_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  parsed_transaction JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own chats" ON public.ai_chats
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_chats_user_id ON public.ai_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chats_created_at ON public.ai_chats(created_at);
