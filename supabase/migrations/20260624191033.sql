-- Grant permissions for admin panel
GRANT INSERT, UPDATE, SELECT ON public.dev_tasks TO anon, authenticated;
GRANT UPDATE ON public.agents TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE dev_tasks_id_seq TO anon, authenticated;
