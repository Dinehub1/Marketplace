-- Wellness family: the main data in the main database.
--
-- Until now the six wellness screens (breathe, stretch, walk, water, japa, sleep) kept
-- everything in the phone's own AsyncStorage. That is the right home for a goal, a phrase
-- or an in-flight session, and the wrong home for the one thing a person would miss if
-- they lost the phone: what they actually did. This migration gives that data a table.
--
-- Two tables and nothing else:
--
--   wellness_sessions  one row per finished session (breathe 5 min, walk 4 rounds, a
--                      japa round). Timed, so it can answer "when" as well as "how much".
--   wellness_daily     one row per (screen, day) for the tap counters (water, japa beads),
--                      which have a number rather than an event. Kept separate because a
--                      counter that ticks ten times a minute must not write ten rows.
--
-- Identity, without an account. The wellness apps promise "no sign-up", and that promise is
-- the product (docs/wellness-reference.md, docs/breathe-app-plan.md). So there is no user
-- id here. Instead each install generates a random token, keeps it in its own storage, and
-- sends it as the `x-wellness-token` header. `wellness_token_hash()` turns that header into
-- a SHA-256 digest server-side, so:
--
--   * the database never stores the token itself — a dump of these tables is a set of
--     digests, not a set of usable credentials;
--   * the client needs no crypto library (React Native/Hermes has no WebCrypto), because it
--     sends the raw token and never computes the digest;
--   * the header is the whole authorization check, enforced in the row policy below, so a
--     token can only ever read and write its own rows.
--
-- The honest limit of that model: a token is a bearer secret. Someone who extracts it from
-- a device can read that device's rows, exactly as they could read its AsyncStorage. It
-- cannot be used to reach anybody else's rows, and there is nothing here worth more than
-- that. Data that is merely convenient (goals, the breathing phrase, the offline cache and
-- the sync queue) deliberately stays on the device and never reaches this file.
--
-- Idempotent on purpose: every statement is IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY
-- IF EXISTS, so re-running this file against a project that already has it is a no-op.

-- ── The credential, derived from the request header ───────────────────────────────────
--
-- Returns NULL when no token was sent, which is what makes an unauthenticated request fail
-- closed: the column default below is NULL (so the insert is refused by NOT NULL) and every
-- policy comparison against NULL is false (so the read returns nothing). A single shared
-- "empty token" row is the bug this avoids.
create or replace function public.wellness_token_hash()
returns text
language sql
stable
set search_path = public, extensions
as $$
  select case
    when coalesce(current_setting('request.headers', true)::json ->> 'x-wellness-token', '') = ''
      then null
    else encode(
      extensions.digest(current_setting('request.headers', true)::json ->> 'x-wellness-token', 'sha256'),
      'hex'
    )
  end
$$;

comment on function public.wellness_token_hash() is
  'SHA-256 of the x-wellness-token request header. NULL when the header is absent, so RLS fails closed.';

-- ── Sessions: one row per finished practice ───────────────────────────────────────────
create table if not exists public.wellness_sessions (
  id           uuid primary key default gen_random_uuid(),
  -- No user id: the digest of the install's token IS the owner. Defaulted from the header
  -- so a client can never claim someone else's token_hash, and the policy below checks it.
  token_hash   text not null default public.wellness_token_hash(),
  -- The client's own id for this session. Replaying the offline queue must not duplicate a
  -- row, and this is the column the unique constraint uses to make that true.
  client_id    text not null,
  screen       text not null,
  occurred_at  timestamptz not null,
  minutes      integer not null default 0,
  units        integer not null default 0,
  label        text not null default '',
  created_at   timestamptz not null default now(),
  constraint wellness_sessions_client_unique unique (token_hash, client_id)
);

comment on table public.wellness_sessions is
  'One finished wellness session per row, owned by an anonymous install token digest.';

-- The read path is always "this install, newest first". The unique constraint above already
-- indexes (token_hash, client_id); this one makes the history query an index scan.
create index if not exists wellness_sessions_token_time_idx
  on public.wellness_sessions (token_hash, occurred_at desc);

-- ── Daily counts: one row per (screen, day) for the tap counters ──────────────────────
create table if not exists public.wellness_daily (
  token_hash text not null default public.wellness_token_hash(),
  screen     text not null,
  day        date not null,
  count      integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (token_hash, screen, day)
);

comment on table public.wellness_daily is
  'Absolute per-day counts for the tap counters (water glasses, japa beads). One row per day, not per tap.';

-- ── Row level security: the header is the owner ───────────────────────────────────────
alter table public.wellness_sessions enable row level security;
alter table public.wellness_daily    enable row level security;

-- `for all` covers select, insert, update and delete. `using` decides which existing rows are
-- visible and which can be changed; `with check` decides what a write is allowed to contain.
-- Both compare against the header-derived digest, so a request carrying token A cannot read,
-- write or delete the rows of token B — and a request carrying no token matches nothing.
drop policy if exists wellness_sessions_owner on public.wellness_sessions;
create policy wellness_sessions_owner on public.wellness_sessions
  for all
  to anon, authenticated
  using (token_hash = public.wellness_token_hash())
  with check (token_hash = public.wellness_token_hash());

drop policy if exists wellness_daily_owner on public.wellness_daily;
create policy wellness_daily_owner on public.wellness_daily
  for all
  to anon, authenticated
  using (token_hash = public.wellness_token_hash())
  with check (token_hash = public.wellness_token_hash());

-- Explicit grants: the anon role is what the app actually uses (there is no sign-in), and a
-- migration should not depend on the project's default privileges having been set the way
-- this file assumes.
grant select, insert, update, delete on public.wellness_sessions to anon, authenticated;
grant select, insert, update, delete on public.wellness_daily    to anon, authenticated;
grant execute on function public.wellness_token_hash() to anon, authenticated;

-- ── Writing a counter ─────────────────────────────────────────────────────────────────
--
-- An absolute count, not a delta, so replaying a queued write is idempotent and a phone
-- that was offline for a week cannot "add" the same glass twice. It has to be a function
-- rather than a PostgREST upsert because token_hash is derived from the header and is not
-- in the client's payload, which makes a composite conflict target awkward to name.
--
-- `security invoker` is deliberate: this runs with the caller's rights, so the RLS policy
-- above still applies to the insert and the update it performs. A security-definer version
-- would punch straight through the only access control these tables have.
create or replace function public.wellness_put_count(
  p_screen text,
  p_day    date,
  p_count  integer
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.wellness_daily (token_hash, screen, day, count)
  values (public.wellness_token_hash(), p_screen, p_day, greatest(0, coalesce(p_count, 0)))
  on conflict (token_hash, screen, day)
  do update set count = greatest(0, excluded.count), updated_at = now();
end;
$$;

comment on function public.wellness_put_count(text, date, integer) is
  'Sets the absolute count for one (screen, day) of the calling install. Idempotent: replaying it is safe.';

grant execute on function public.wellness_put_count(text, date, integer) to anon, authenticated;
