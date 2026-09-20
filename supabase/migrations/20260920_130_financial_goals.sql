-- DuitQu 1.3.0: add financial goals and the paginated AI history index.
-- Apply this migration before deploying the 1.3.0 application.

BEGIN;

CREATE TABLE IF NOT EXISTS public.financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  deadline DATE,
  icon TEXT DEFAULT 'target',
  color TEXT DEFAULT '#22c55e',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'financial_goals'
      AND policyname = 'Users can manage own goals'
  ) THEN
    CREATE POLICY "Users can manage own goals"
      ON public.financial_goals
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$migration$;

CREATE INDEX IF NOT EXISTS idx_financial_goals_user_id
  ON public.financial_goals(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_chats_user_created_id
  ON public.ai_chats(user_id, created_at DESC, id DESC);

COMMIT;
