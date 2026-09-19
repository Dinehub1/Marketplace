-- ============================================================================
-- Reward claims — the record that lets AdMob's server, not the phone, be the witness.
--
-- ## The weakness this closes
--
-- P1's chain was: AdMob → phone → the app says "I earned the reward" → server grants.
-- The phone was the witness, so anyone who knew the route could claim a reward
-- without watching an ad. Server-side verification replaces the witness: AdMob's own
-- server calls ours with a signed receipt, and only a receipt whose signature
-- verifies against Google's published key may open a file.
--
-- ```
--   P1:  AdMob → phone → POST /ad-unlock { "I watched it" } → grant      (phone trusted)
--   P3:  AdMob → phone → AdMob server → GET /ssv (signed) → verified → grant
-- ```
--
-- ## Why a claim row has to exist before the ad is requested
--
-- The SSV callback names the reward by the `user_id` + `custom_data` our own app put
-- on the ad request. So the app must ask for a nonce *first*, then request the ad
-- carrying it. That ordering is what binds "this receipt" to "this job" without ever
-- trusting the client's word: the client can invent a nonce, but it cannot invent
-- AdMob's signature over one.
--
-- `status` makes the pending state explicit and auditable:
--   pending    — the app asked to unlock a file; no ad or no callback yet
--   verified   — an SSV callback arrived, its signature checked, and it is the one
--                that may release the file
--   rejected   — a callback arrived and did not verify (kept, not deleted: a forged
--                callback is evidence and should be visible, not silently dropped)
--
-- `signature_ok` is stored alongside the reason so "how many callbacks failed" is a
-- query rather than a log-diving exercise.
--
-- Idempotent: safe to re-run.
-- ============================================================================

create table if not exists public.ad_reward_claims (
  id              bigserial primary key,
  created_at      timestamp with time zone not null default now(),
  /** The reward request's handshake: what the ad request carries and SSV returns. */
  nonce           text not null,
  job_id          bigint not null,
  product         text,
  placement       text,
  app_target      text,
  session_id      text,

  status          text not null default 'pending',
  /** AdMob's own identifiers, filled only by a verified callback. */
  transaction_id  text,
  ad_unit_id      text,
  ad_network      text,
  reward_item     text,
  reward_amount   numeric,
  /** When AdMob says the reward happened, from the signed payload. */
  ssv_timestamp   timestamp with time zone,
  verified_at     timestamp with time zone,
  /** Why a rejected callback was rejected: bad_signature, stale_timestamp, … */
  reject_reason   text,
  signature_ok    boolean,

  constraint ad_reward_claims_job_fkey
    foreign key (job_id) references public.product_jobs(id) on delete cascade,
  constraint ad_reward_claims_status_check
    check (status in ('pending','verified','rejected')),
  -- One claim per nonce: the nonce is the identity the ad request carried.
  constraint ad_reward_claims_nonce_key unique (nonce)
);

-- A verified claim must carry the proof of what verified it.
alter table public.ad_reward_claims
  drop constraint if exists ad_reward_claims_verified_needs_txn;
alter table public.ad_reward_claims
  add constraint ad_reward_claims_verified_needs_txn
  check (status <> 'verified' or transaction_id is not null);

create index if not exists ad_reward_claims_job_idx
  on public.ad_reward_claims (job_id, status);
create index if not exists ad_reward_claims_status_created_idx
  on public.ad_reward_claims (status, created_at desc);

alter table public.ad_reward_claims enable row level security;

revoke all on public.ad_reward_claims from anon, authenticated;
grant select, insert, update, delete on public.ad_reward_claims to service_role;
revoke all on sequence public.ad_reward_claims_id_seq from anon, authenticated;
grant usage, select on sequence public.ad_reward_claims_id_seq to service_role;

comment on table public.ad_reward_claims is
  'Rewarded-ad unlock claims. pending until AdMob SSV callback verifies (verified) or refuses (rejected). Only a verified claim may release a file — the phone is never the witness.';

-- ----------------------------------------------------------------------------
-- `product_unlocks` gains an SSV-sourced value.
--
-- P1 shipped with `check (source = 'rewarded_ad')`, which was the whole point then:
-- one named free path, and a free grant could not arrive unlabelled. Now there are
-- genuinely two proofs, and they are NOT equal:
--
--   rewarded_ad       the phone claimed a completion (P1; no longer grants on its own)
--   rewarded_ad_ssv   AdMob's server signed a completion (P3; the only free grant)
--
-- Keeping both values means the ledger can still answer "was this file given away on
-- a claim, or on a signature" — and the route decides which one is strong enough.
-- ----------------------------------------------------------------------------
alter table public.product_unlocks
  drop constraint if exists product_unlocks_source_check;
alter table public.product_unlocks
  add constraint product_unlocks_source_check
  check (source in ('rewarded_ad','rewarded_ad_ssv'));

alter table public.product_unlocks
  add column if not exists claim_id bigint;

alter table public.product_unlocks
  drop constraint if exists product_unlocks_claim_fkey;
alter table public.product_unlocks
  add constraint product_unlocks_claim_fkey
    foreign key (claim_id) references public.ad_reward_claims(id) on delete set null;

comment on column public.product_unlocks.claim_id is
  'The verified SSV claim that released this file. NULL for a P1-style client claim, which no longer grants on its own.';
