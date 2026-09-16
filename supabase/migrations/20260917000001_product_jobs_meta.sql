-- Record what the engine answered for each job.
--
-- Background
-- ----------
-- The engine returns its own measurements in an `x-job-meta` header (page counts,
-- the hosted model that served a call and its cost, the tax rows an invoice
-- printed). The job route has always passed that object back to the app in the
-- response body — and never stored it, so the table could not answer "which
-- provider served this job, and what did it cost", which is the measurement the
-- product prices are supposed to come from.
--
-- The column is jsonb and nullable: the rows that predate it keep NULL, and a job
-- whose engine meta is empty stores NULL rather than `{}` (no measurement is not
-- a measurement of nothing).
--
-- Idempotent: safe to re-run.

alter table public.product_jobs
  add column if not exists meta jsonb;

comment on column public.product_jobs.meta is
  'What the engine answered for this job (its x-job-meta header): page counts, the model that served a hosted call, the tax rows an invoice printed. NULL when the engine reported nothing.';
