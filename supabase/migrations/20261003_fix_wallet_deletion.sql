-- Allow wallets referenced as transfer destinations to be deleted
-- without removing their transaction history.

BEGIN;

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_to_wallet_id_fkey;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_to_wallet_id_fkey
  FOREIGN KEY (to_wallet_id)
  REFERENCES public.wallets(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_to_wallet_id
  ON public.transactions(to_wallet_id);

COMMIT;