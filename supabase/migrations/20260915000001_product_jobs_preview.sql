-- Store the preview object key on the job.
--
-- Background
-- ----------
-- The first cut derived the preview key from the clean key
-- (`<uuid>.jpg` -> `<uuid>.preview.jpg`). That is a paywall hole, not a
-- convenience: the preview URL is handed to the client before payment, and the
-- bucket is served publicly, so anyone holding the preview URL could strip
-- ".preview" and fetch the clean 300 dpi sheet they had not paid for.
--
-- The preview therefore gets its OWN random id, under a separate prefix, and the
-- job row is what remembers it. Nothing in the client-visible URLs points at the
-- paid object any more.
--
-- Idempotent: safe to re-run.

alter table public.product_jobs
  add column if not exists preview_key text;

comment on column public.product_jobs.preview_key is
  'Watermarked preview object. Deliberately an independent random key from output_key so the free URL cannot be edited into the paid one.';
