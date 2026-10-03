-- Avoid recalculating the same wallet multiple times for one transaction change.

BEGIN;

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

  SELECT COALESCE(array_agg(DISTINCT affected_id), '{}'::UUID[])
    INTO ids
  FROM unnest(ids) AS affected(affected_id)
  WHERE affected_id IS NOT NULL;

  FOREACH wid IN ARRAY ids LOOP
    PERFORM public.recalc_wallet_balance(wid);
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMIT;
