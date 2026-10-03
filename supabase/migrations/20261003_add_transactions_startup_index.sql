-- Support user-scoped transaction feeds and month-range queries in display order.

BEGIN;

CREATE INDEX IF NOT EXISTS idx_transactions_user_date_created_id
  ON public.transactions(user_id, date DESC, created_at DESC, id DESC);

COMMIT;
