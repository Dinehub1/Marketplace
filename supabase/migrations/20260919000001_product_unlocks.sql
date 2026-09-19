-- ============================================================================
-- Free-file unlocks earned by watching a rewarded ad.
--
-- The rule this table enforces, in one line: **one completed rewarded ad unlocks
-- one specific file** — never a pack, never a subscription, never a second file.
--
-- Why a table and not a flag on the job. The clean file URL is the thing being
-- sold, and until now it was released only by `orders` — proof that Razorpay took
-- money. An ad unlock is a second, weaker proof, and the two must stay separately
-- auditable: "was this given away, or paid for?" is a question the books have to
-- answer, and a boolean on `product_jobs` could not answer it.
--
-- The strictness lives in the constraints, not in the UI:
--
--   * `unique (job_id)` — a job can be unlocked free exactly once, ever. A second
--     completed view on the same job does not stack, does not extend, and does not
--     transfer to another file. The client is not trusted to remember that.
--   * `source` is an enum of exactly one value today. When a second free path
--     exists it becomes a value here, so it cannot arrive as an unlabelled grant.
--   * The clean URL is never stored. The row is the proof; the route derives the
--     URL from `product_jobs.output_key` at read time.
--
-- Access posture (matches business_events and ad_events): service-role only, RLS
-- default-deny, no anon read or write — a client cannot mint its own unlock.
--
-- Idempotent: safe to re-run.
-- ============================================================================

create table if not exists public.product_unlocks (
  id          bigserial primary key,
  job_id      bigint not null,
  product     text,
  -- How the file was released. Deliberately constrained so a future free path has
  -- to name itself rather than reuse an existing label.
  source      text not null,
  -- Which placement earned it ('job.unlock-rewarded'), and the run it happened in,
  -- so an unlock is attributable to a moment and a session like every other ad event.
  placement   text,
  session_id  text,
  created_at  timestamp with time zone not null default now(),
  constraint product_unlocks_job_fkey
    foreign key (job_id) references public.product_jobs(id) on delete cascade,
  constraint product_unlocks_source_check
    check (source in ('rewarded_ad')),
  -- One free unlock per file, enforced where a client cannot argue with it.
  constraint product_unlocks_one_per_job unique (job_id)
);

create index if not exists product_unlocks_created_idx
  on public.product_unlocks (created_at desc);

alter table public.product_unlocks enable row level security;

revoke all on public.product_unlocks from anon, authenticated;
grant select, insert, update, delete on public.product_unlocks to service_role;
revoke all on sequence public.product_unlocks_id_seq from anon, authenticated;
grant usage, select on sequence public.product_unlocks_id_seq to service_role;

comment on table public.product_unlocks is
  'Free file unlocks earned by a completed rewarded ad. One row per file (unique job_id), source-constrained, service-role only. The clean URL is derived from product_jobs at read time and never stored here.';
