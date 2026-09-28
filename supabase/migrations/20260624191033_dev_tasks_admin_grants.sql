-- Grant permissions for admin panel
GRANT INSERT, UPDATE, SELECT ON public.dev_tasks TO anon, authenticated;
GRANT UPDATE ON public.agents TO anon, authenticated;
-- dev_tasks.id is uuid (gen_random_uuid), so there is no dev_tasks_id_seq.
-- Guard the sequence grant so this legacy migration never errors on databases
-- where the sequence does not exist.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S' AND n.nspname = 'public'
      AND c.relname = 'dev_tasks_id_seq'
  ) THEN
    GRANT USAGE, SELECT ON SEQUENCE dev_tasks_id_seq TO anon, authenticated;
  END IF;
END $$;
