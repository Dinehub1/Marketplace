-- ============================================================
-- Consolidated, replay-safe baseline schema + RLS posture
-- Project: xpfmqpmhmcouwzebfwhb (Supabase)
-- Generated 2026-08-14 from live introspection, with Phase 0 (C1-C9)
-- security posture folded in. Safe to run on a fresh OR existing DB.
-- Supersedes: 20260814000000_phase0_rls.sql, 20260624191033.sql
-- ============================================================

-- ============================================================
-- Baseline schema - reconstructed from live Supabase (project xpfmqpmhmcouwzebfwhb)
-- Generated 2026-08-14 from pg introspection (tables, constraints, indexes, policies, grants).
-- NOTE: anon currently holds broad GRANTs;

-- RLS policies are the real access control.
-- Phase 0 hardening (supabase/migrations/20260814000000_phase0_rls.sql) applies on top.
-- ============================================================

-- Extensions used below. On the live project pg_trgm was enabled out-of-band;
-- a fresh replay needs it before the trigram indexes at the bottom of this
-- file (the later listing_media migration also creates it — IF NOT EXISTS
-- makes both orders safe).
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- === TABLES ===
CREATE TABLE IF NOT EXISTS public.agent_memory (
  id uuid not null default gen_random_uuid(),
  agent_slug text not null,
  memory_type text not null,
  key text not null,
  value jsonb not null,
  source text,
  confidence real default 1.0,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

CREATE TABLE IF NOT EXISTS public.agent_outputs ( id uuid not null default gen_random_uuid(), agent_slug text not null, run_id uuid, status text default 'running'::text, summary text, output jsonb default '{}'::jsonb, duration_seconds numeric default 0, created_at timestamp with time zone default now(), brand_id uuid );

CREATE TABLE IF NOT EXISTS public.agent_triggers ( id uuid not null default gen_random_uuid(), source_agent text not null, target_agent text not null, trigger_event text not null, condition text, enabled boolean default true, created_at timestamp with time zone default now() );

CREATE TABLE IF NOT EXISTS public.agents ( id uuid not null default gen_random_uuid(), slug text not null, name text not null, emoji text, role text, schedule text, description text, status text not null default 'paused'::text, last_run timestamp with time zone, sort_order integer not null default 100, created_at timestamp with time zone not null default now(), updated_at timestamp with time zone not null default now() );

CREATE TABLE IF NOT EXISTS public.apps ( id uuid not null default gen_random_uuid(), name text not null, slug text not null, status text default 'developing'::text, owner_id uuid, description text, domain text, logo_url text, sort_order integer default 0, created_at timestamp with time zone default now(), updated_at timestamp with time zone default now() );

CREATE TABLE IF NOT EXISTS public.backlog ( id uuid not null default gen_random_uuid(), title text not null, description text, agent_slug text, category text default 'feature'::text, priority integer default 50, status text default 'queued'::text, brand_id uuid, metadata jsonb default '{}'::jsonb, created_at timestamp with time zone default now(), updated_at timestamp with time zone default now() );

CREATE TABLE IF NOT EXISTS public.bookings ( id uuid not null default gen_random_uuid(), app_id uuid, user_id uuid, business_id bigint, service_type text, booking_date timestamp with time zone, status text default 'pending'::text, notes text, amount numeric, created_at timestamp with time zone default now(), updated_at timestamp with time zone default now() );

CREATE TABLE IF NOT EXISTS public.brands ( id uuid not null default gen_random_uuid(), slug text not null, name text not null, domain text, category text, emoji text, tagline text, description text, theme jsonb not null default '{}'::jsonb, features jsonb not null default '{}'::jsonb, status text not null default 'active'::text, uptime numeric not null default 100, sort_order integer not null default 100, created_at timestamp with time zone not null default now(), updated_at timestamp with time zone not null default now(), folder text, seo_title text, seo_description text, logo_url text, contact_email text, contact_phone text, social jsonb default '{}'::jsonb, page_flags jsonb default '{}'::jsonb, page_content jsonb default '{}'::jsonb, about_text text, mission_text text, team_json jsonb default '[]'::jsonb, testimonials_json jsonb default '[]'::jsonb, reviews_json jsonb default '[]'::jsonb, faq_json jsonb default '[]'::jsonb, blog_json jsonb default '[]'::jsonb, careers_json jsonb default '[]'::jsonb, gallery_json jsonb default '[]'::jsonb, services_json jsonb default '[]'::jsonb, pricing_json jsonb default '[]'::jsonb, features_json jsonb default '[]'::jsonb, booking_enabled boolean default false, quote_enabled boolean default false, checkout_enabled boolean default false, chat_enabled boolean default false );

CREATE TABLE IF NOT EXISTS public.businesses ( id bigint not null, brand_id uuid, name text not null, category text, phone text, email text, address text, area text, city text default 'Indore'::text, pincode text, lat double precision, lng double precision, rating numeric, website text, source text, raw jsonb, created_at timestamp with time zone not null default now(), status text default 'active'::text, owner_id uuid, premium boolean default false, verified boolean default false, slug text, google_maps text, updated_at timestamp with time zone default now(), app_id uuid, image_url text, reviews_count integer, description text, featured boolean not null default false, priority integer not null default 0 );

CREATE TABLE IF NOT EXISTS public.businesses_staging ( id bigint not null, brand_id uuid, name text not null, category text, phone text, email text, address text, area text, city text default 'Indore'::text, pincode text, lat double precision, lng double precision, rating numeric, website text, source text, raw jsonb, created_at timestamp with time zone not null default now(), status text default 'active'::text, owner_id uuid, premium boolean default false, verified boolean default false, slug text, google_maps text, updated_at timestamp with time zone default now(), app_id uuid );

CREATE TABLE IF NOT EXISTS public.categories ( id uuid not null default gen_random_uuid(), app_id uuid, name text not null, slug text not null, icon text default 'fa-briefcase'::text, business_count integer default 0, created_at timestamp with time zone default now() );

CREATE TABLE IF NOT EXISTS public.content ( id uuid not null default gen_random_uuid(), brand_id uuid, type text not null, slug text, title text, body jsonb not null default '{}'::jsonb, published boolean not null default false, sort_order integer not null default 100, created_at timestamp with time zone not null default now(), updated_at timestamp with time zone not null default now() );

CREATE TABLE IF NOT EXISTS public.content_strategy_framework ( id serial, section_type character varying(100) not null, best_practices jsonb not null, examples jsonb not null, conversion_tips jsonb not null, created_at timestamp with time zone default now() );

CREATE TABLE IF NOT EXISTS public.courses ( id uuid not null default gen_random_uuid(), app_id uuid, title text not null, slug text, instructor text, price numeric default 0, duration text, description text, syllabus text, thumbnail_url text, status text default 'active'::text, enrollments integer default 0, rating real default 0, created_at timestamp with time zone default now(), updated_at timestamp with time zone default now() );

CREATE TABLE IF NOT EXISTS public.dev_tasks ( id uuid not null default gen_random_uuid(), brand_id uuid, title text not null, spec text, status text not null default 'queued'::text, priority integer not null default 100, assignee text not null default 'dev-agent'::text, branch text, pr_url text, result text, created_at timestamp with time zone not null default now(), updated_at timestamp with time zone not null default now(), started_at timestamp with time zone, finished_at timestamp with time zone );

CREATE TABLE IF NOT EXISTS public.event_config ( id uuid not null default gen_random_uuid(), event_type text not null, description text, default_agent text not null, fallback_agent text, default_priority text default 'medium'::text, auto_retry boolean default true, max_retries integer default 3, cooldown_seconds integer default 60, enabled boolean default true, created_at timestamp with time zone default now() );

CREATE TABLE IF NOT EXISTS public.events ( id uuid not null default gen_random_uuid(), type text not null, source text not null, priority text default 'medium'::text, status text default 'new'::text, payload jsonb default '{}'::jsonb, dedup_key text, assigned_agent text, retry_count integer default 0, max_retries integer default 3, error_message text, created_at timestamp with time zone default now(), processed_at timestamp with time zone, completed_at timestamp with time zone );

CREATE TABLE IF NOT EXISTS public.execution_metrics ( id uuid not null default gen_random_uuid(), agent_slug text not null, task_id uuid, event_id uuid, status text not null, duration_ms integer, tokens_used integer, model text, input_size integer, output_size integer, error_type text, metadata jsonb default '{}'::jsonb, created_at timestamp with time zone default now() );

CREATE TABLE IF NOT EXISTS public.jobs ( id uuid not null default gen_random_uuid(), app_id uuid, title text not null, company text, location text, salary text, job_type text default 'full-time'::text, description text, requirements text, contact_email text, status text default 'open'::text, views integer default 0, created_at timestamp with time zone default now(), updated_at timestamp with time zone default now() );

CREATE TABLE IF NOT EXISTS public.landing_page_templates ( id serial, niche character varying(100) not null, brand_name character varying(200), hero_headline text, hero_subheadline text, hero_cta_primary text, hero_cta_secondary text, hero_visual_type character varying(50), features jsonb, pricing_tier_name character varying(100), pricing_amount integer, pricing_features jsonb, social_proof_type character varying(50), social_proof_source text, trust_signals jsonb, target_persona text, tone_of_voice character varying(100), created_at timestamp with time zone default now() );

CREATE TABLE IF NOT EXISTS public.leads ( id uuid not null default gen_random_uuid(), brand_id uuid, name text, phone text, email text, message text, source_path text, status text not null default 'new'::text, meta jsonb not null default '{}'::jsonb, created_at timestamp with time zone not null default now(), app_id uuid, business_id bigint );

CREATE TABLE IF NOT EXISTS public.learning_log ( id uuid not null default gen_random_uuid(), agent_slug text not null, action text not null, outcome text, lesson text, context jsonb default '{}'::jsonb, created_at timestamp with time zone default now() );

CREATE TABLE IF NOT EXISTS public.notifications ( id uuid not null default gen_random_uuid(), app_id uuid, user_id uuid, title text not null, message text, type text default 'info'::text, read boolean default false, link text, created_at timestamp with time zone default now() );

CREATE TABLE IF NOT EXISTS public.otp_codes ( id bigserial, phone text not null, code text not null, purpose text default 'lead'::text, expires_at timestamp with time zone not null, verified_at timestamp with time zone, attempts integer default 0, created_at timestamp with time zone default now() );

CREATE TABLE IF NOT EXISTS public.payments ( id uuid not null default gen_random_uuid(), brand_id uuid, amount numeric not null, currency text not null default 'INR'::text, method text not null default 'upi'::text, upi_ref text, status text not null default 'pending'::text, payer_name text, payer_contact text, meta jsonb not null default '{}'::jsonb, created_at timestamp with time zone not null default now(), app_id uuid );

CREATE TABLE IF NOT EXISTS public.profiles ( id uuid not null, brand_id uuid, role text not null default 'user'::text, full_name text, created_at timestamp with time zone not null default now(), updated_at timestamp with time zone default now() );

CREATE TABLE IF NOT EXISTS public.provider_verifications ( id uuid not null default gen_random_uuid(), provider_id uuid, code text not null, expires_at timestamp with time zone not null, verified boolean default false, created_at timestamp with time zone default now() );

CREATE TABLE IF NOT EXISTS public.research_logs ( id uuid not null default gen_random_uuid(), topic text not null, source text, findings jsonb default '{}'::jsonb, sentiment text, priority integer default 50, created_at timestamp with time zone default now() );

CREATE TABLE IF NOT EXISTS public.reviews ( id bigserial, business_id bigint not null, user_id uuid, reviewer_name text not null, rating numeric not null, title text, comment text not null, is_verified boolean default false, is_approved boolean default true, helpful_count integer default 0, meta jsonb default '{}'::jsonb, created_at timestamp with time zone default now(), updated_at timestamp with time zone default now(), owner_reply text );

CREATE TABLE IF NOT EXISTS public.service_providers ( id uuid not null default gen_random_uuid(), name text not null, address text, phone text, website text, domain text, category text not null, subcategory text, rating numeric(2,1) default 0, review_count integer default 0, latitude numeric(10,8), longitude numeric(11,8), google_maps_url text, image_url text, verified boolean default false, verified_at timestamp with time zone, premium_plan text, premium_until timestamp with time zone, created_at timestamp with time zone default now(), updated_at timestamp with time zone default now() );

CREATE TABLE IF NOT EXISTS public.settings ( id uuid not null default gen_random_uuid(), app_id uuid, key text not null, value jsonb, created_at timestamp with time zone default now(), updated_at timestamp with time zone default now() );

CREATE TABLE IF NOT EXISTS public.subscriptions ( id uuid not null default gen_random_uuid(), app_id uuid, user_id uuid, plan_name text not null, price numeric not null, "interval" text default 'monthly'::text, status text default 'active'::text, starts_at timestamp with time zone default now(), ends_at timestamp with time zone, created_at timestamp with time zone default now(), updated_at timestamp with time zone default now() );

CREATE TABLE IF NOT EXISTS public.task_queue ( id uuid not null default gen_random_uuid(), event_id uuid, title text not null, description text, agent_slug text not null, priority integer default 50, status text default 'queued'::text, dedup_key text, parent_task_id uuid, metadata jsonb default '{}'::jsonb, timeout_seconds integer default 300, retry_count integer default 0, max_retries integer default 3, last_error text, assigned_at timestamp with time zone, started_at timestamp with time zone, completed_at timestamp with time zone, created_at timestamp with time zone default now(), updated_at timestamp with time zone default now() );

CREATE TABLE IF NOT EXISTS public.trades ( id uuid not null default gen_random_uuid(), app_id uuid, user_id uuid, symbol text not null, type text, quantity numeric not null, price numeric not null, total numeric not null, status text default 'open'::text, profit_loss numeric default 0, notes text, created_at timestamp with time zone default now(), updated_at timestamp with time zone default now() );

CREATE TABLE IF NOT EXISTS public.whatsapp_templates ( id uuid not null default gen_random_uuid(), template_id text not null, name text not null, language text not null default 'en'::text, category text, status text, body text, variables integer default 0, raw jsonb not null default '{}'::jsonb, last_synced_at timestamp with time zone not null default now(), created_at timestamp with time zone not null default now(), updated_at timestamp with time zone not null default now() );

-- === CONSTRAINTS ===

-- Pre-pass: install every table's `id` PRIMARY KEY before any FK block runs.
-- The blocks below are ordered alphabetically BY TABLE, so an FK like
-- content.brand_id -> brands.id can appear before brands_pkey. That never
-- mattered on the original live database (its constraints predate this file)
-- but breaks a fresh replay, which is exactly what this file promises to
-- support. Idempotent: tables that already have a PK are skipped.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'id'
      AND c.udt_name IN ('uuid', 'int8')
      AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.table_schema = 'public'
          AND tc.table_name = c.table_name
          AND tc.constraint_type = 'PRIMARY KEY')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I PRIMARY KEY (id)',
                   r.table_name, r.table_name || '_pkey');
  END LOOP;
END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='apps_owner_id_fkey' AND conrelid='public.apps'::regclass) THEN ALTER TABLE public.apps ADD CONSTRAINT apps_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='apps_pkey' AND conrelid='public.apps'::regclass) THEN ALTER TABLE public.apps ADD CONSTRAINT apps_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='apps_slug_key' AND conrelid='public.apps'::regclass) THEN ALTER TABLE public.apps ADD CONSTRAINT apps_slug_key UNIQUE (slug); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='apps_status_check' AND conrelid='public.apps'::regclass) THEN ALTER TABLE public.apps ADD CONSTRAINT apps_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'developing'::text]))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='categories_app_id_fkey' AND conrelid='public.categories'::regclass) THEN ALTER TABLE public.categories ADD CONSTRAINT categories_app_id_fkey FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='categories_app_id_slug_key' AND conrelid='public.categories'::regclass) THEN ALTER TABLE public.categories ADD CONSTRAINT categories_app_id_slug_key UNIQUE (app_id, slug); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='categories_pkey' AND conrelid='public.categories'::regclass) THEN ALTER TABLE public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='content_brand_id_fkey' AND conrelid='public.content'::regclass) THEN ALTER TABLE public.content ADD CONSTRAINT content_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='content_brand_id_type_slug_key' AND conrelid='public.content'::regclass) THEN ALTER TABLE public.content ADD CONSTRAINT content_brand_id_type_slug_key UNIQUE (brand_id, type, slug); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='content_pkey' AND conrelid='public.content'::regclass) THEN ALTER TABLE public.content ADD CONSTRAINT content_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='dev_tasks_brand_id_fkey' AND conrelid='public.dev_tasks'::regclass) THEN ALTER TABLE public.dev_tasks ADD CONSTRAINT dev_tasks_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='dev_tasks_pkey' AND conrelid='public.dev_tasks'::regclass) THEN ALTER TABLE public.dev_tasks ADD CONSTRAINT dev_tasks_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='courses_app_id_fkey' AND conrelid='public.courses'::regclass) THEN ALTER TABLE public.courses ADD CONSTRAINT courses_app_id_fkey FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='courses_pkey' AND conrelid='public.courses'::regclass) THEN ALTER TABLE public.courses ADD CONSTRAINT courses_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='courses_status_check' AND conrelid='public.courses'::regclass) THEN ALTER TABLE public.courses ADD CONSTRAINT courses_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'draft'::text]))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agents_pkey' AND conrelid='public.agents'::regclass) THEN ALTER TABLE public.agents ADD CONSTRAINT agents_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agents_slug_key' AND conrelid='public.agents'::regclass) THEN ALTER TABLE public.agents ADD CONSTRAINT agents_slug_key UNIQUE (slug); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='bookings_app_id_fkey' AND conrelid='public.bookings'::regclass) THEN ALTER TABLE public.bookings ADD CONSTRAINT bookings_app_id_fkey FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='bookings_business_id_fkey' AND conrelid='public.bookings'::regclass) THEN ALTER TABLE public.bookings ADD CONSTRAINT bookings_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='bookings_pkey' AND conrelid='public.bookings'::regclass) THEN ALTER TABLE public.bookings ADD CONSTRAINT bookings_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='bookings_status_check' AND conrelid='public.bookings'::regclass) THEN ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text]))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='bookings_user_id_fkey' AND conrelid='public.bookings'::regclass) THEN ALTER TABLE public.bookings ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='trades_app_id_fkey' AND conrelid='public.trades'::regclass) THEN ALTER TABLE public.trades ADD CONSTRAINT trades_app_id_fkey FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='trades_pkey' AND conrelid='public.trades'::regclass) THEN ALTER TABLE public.trades ADD CONSTRAINT trades_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='trades_status_check' AND conrelid='public.trades'::regclass) THEN ALTER TABLE public.trades ADD CONSTRAINT trades_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text, 'cancelled'::text]))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='trades_type_check' AND conrelid='public.trades'::regclass) THEN ALTER TABLE public.trades ADD CONSTRAINT trades_type_check CHECK ((type = ANY (ARRAY['buy'::text, 'sell'::text]))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='trades_user_id_fkey' AND conrelid='public.trades'::regclass) THEN ALTER TABLE public.trades ADD CONSTRAINT trades_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='subscriptions_app_id_fkey' AND conrelid='public.subscriptions'::regclass) THEN ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_app_id_fkey FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='subscriptions_interval_check' AND conrelid='public.subscriptions'::regclass) THEN ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_interval_check CHECK (("interval" = ANY (ARRAY['monthly'::text, 'yearly'::text, 'one-time'::text]))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='subscriptions_pkey' AND conrelid='public.subscriptions'::regclass) THEN ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='subscriptions_status_check' AND conrelid='public.subscriptions'::regclass) THEN ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text]))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='subscriptions_user_id_fkey' AND conrelid='public.subscriptions'::regclass) THEN ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='notifications_app_id_fkey' AND conrelid='public.notifications'::regclass) THEN ALTER TABLE public.notifications ADD CONSTRAINT notifications_app_id_fkey FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='notifications_pkey' AND conrelid='public.notifications'::regclass) THEN ALTER TABLE public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='notifications_type_check' AND conrelid='public.notifications'::regclass) THEN ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK ((type = ANY (ARRAY['info'::text, 'success'::text, 'warning'::text, 'error'::text]))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='notifications_user_id_fkey' AND conrelid='public.notifications'::regclass) THEN ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='settings_app_id_fkey' AND conrelid='public.settings'::regclass) THEN ALTER TABLE public.settings ADD CONSTRAINT settings_app_id_fkey FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='settings_app_id_key_key' AND conrelid='public.settings'::regclass) THEN ALTER TABLE public.settings ADD CONSTRAINT settings_app_id_key_key UNIQUE (app_id, key); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='settings_pkey' AND conrelid='public.settings'::regclass) THEN ALTER TABLE public.settings ADD CONSTRAINT settings_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='profiles_brand_id_fkey' AND conrelid='public.profiles'::regclass) THEN ALTER TABLE public.profiles ADD CONSTRAINT profiles_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='profiles_id_fkey' AND conrelid='public.profiles'::regclass) THEN ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='profiles_pkey' AND conrelid='public.profiles'::regclass) THEN ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='jobs_app_id_fkey' AND conrelid='public.jobs'::regclass) THEN ALTER TABLE public.jobs ADD CONSTRAINT jobs_app_id_fkey FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='jobs_job_type_check' AND conrelid='public.jobs'::regclass) THEN ALTER TABLE public.jobs ADD CONSTRAINT jobs_job_type_check CHECK ((job_type = ANY (ARRAY['full-time'::text, 'part-time'::text, 'contract'::text, 'internship'::text]))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='jobs_pkey' AND conrelid='public.jobs'::regclass) THEN ALTER TABLE public.jobs ADD CONSTRAINT jobs_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='jobs_status_check' AND conrelid='public.jobs'::regclass) THEN ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text, 'draft'::text]))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='businesses_app_id_fkey' AND conrelid='public.businesses'::regclass) THEN ALTER TABLE public.businesses ADD CONSTRAINT businesses_app_id_fkey FOREIGN KEY (app_id) REFERENCES apps(id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='businesses_brand_id_fkey' AND conrelid='public.businesses'::regclass) THEN ALTER TABLE public.businesses ADD CONSTRAINT businesses_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='businesses_owner_id_fkey' AND conrelid='public.businesses'::regclass) THEN ALTER TABLE public.businesses ADD CONSTRAINT businesses_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='businesses_pkey' AND conrelid='public.businesses'::regclass) THEN ALTER TABLE public.businesses ADD CONSTRAINT businesses_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='businesses_rating_check' AND conrelid='public.businesses'::regclass) THEN ALTER TABLE public.businesses ADD CONSTRAINT businesses_rating_check CHECK (((rating IS NULL) OR ((rating >= (0)::numeric) AND (rating <= (5)::numeric)))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='businesses_reviews_check' AND conrelid='public.businesses'::regclass) THEN ALTER TABLE public.businesses ADD CONSTRAINT businesses_reviews_check CHECK (((reviews_count IS NULL) OR (reviews_count >= 0))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='leads_app_id_fkey' AND conrelid='public.leads'::regclass) THEN ALTER TABLE public.leads ADD CONSTRAINT leads_app_id_fkey FOREIGN KEY (app_id) REFERENCES apps(id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='leads_brand_id_fkey' AND conrelid='public.leads'::regclass) THEN ALTER TABLE public.leads ADD CONSTRAINT leads_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='leads_business_id_fkey' AND conrelid='public.leads'::regclass) THEN ALTER TABLE public.leads ADD CONSTRAINT leads_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='leads_pkey' AND conrelid='public.leads'::regclass) THEN ALTER TABLE public.leads ADD CONSTRAINT leads_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_outputs_brand_id_fkey' AND conrelid='public.agent_outputs'::regclass) THEN ALTER TABLE public.agent_outputs ADD CONSTRAINT agent_outputs_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_outputs_pkey' AND conrelid='public.agent_outputs'::regclass) THEN ALTER TABLE public.agent_outputs ADD CONSTRAINT agent_outputs_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_outputs_status_check' AND conrelid='public.agent_outputs'::regclass) THEN ALTER TABLE public.agent_outputs ADD CONSTRAINT agent_outputs_status_check CHECK ((status = ANY (ARRAY['running'::text, 'success'::text, 'failed'::text, 'skipped'::text]))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='research_logs_pkey' AND conrelid='public.research_logs'::regclass) THEN ALTER TABLE public.research_logs ADD CONSTRAINT research_logs_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='research_logs_sentiment_check' AND conrelid='public.research_logs'::regclass) THEN ALTER TABLE public.research_logs ADD CONSTRAINT research_logs_sentiment_check CHECK ((sentiment = ANY (ARRAY['positive'::text, 'negative'::text, 'neutral'::text, 'opportunity'::text, 'threat'::text]))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='backlog_brand_id_fkey' AND conrelid='public.backlog'::regclass) THEN ALTER TABLE public.backlog ADD CONSTRAINT backlog_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='backlog_category_check' AND conrelid='public.backlog'::regclass) THEN ALTER TABLE public.backlog ADD CONSTRAINT backlog_category_check CHECK ((category = ANY (ARRAY['bug'::text, 'feature'::text, 'automation'::text, 'growth'::text, 'security'::text, 'content'::text, 'infrastructure'::text]))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='backlog_pkey' AND conrelid='public.backlog'::regclass) THEN ALTER TABLE public.backlog ADD CONSTRAINT backlog_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='backlog_status_check' AND conrelid='public.backlog'::regclass) THEN ALTER TABLE public.backlog ADD CONSTRAINT backlog_status_check CHECK ((status = ANY (ARRAY['queued'::text, 'in_progress'::text, 'done'::text, 'cancelled'::text]))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='learning_log_outcome_check' AND conrelid='public.learning_log'::regclass) THEN ALTER TABLE public.learning_log ADD CONSTRAINT learning_log_outcome_check CHECK ((outcome = ANY (ARRAY['success'::text, 'failure'::text, 'partial'::text]))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='learning_log_pkey' AND conrelid='public.learning_log'::regclass) THEN ALTER TABLE public.learning_log ADD CONSTRAINT learning_log_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='brands_pkey' AND conrelid='public.brands'::regclass) THEN ALTER TABLE public.brands ADD CONSTRAINT brands_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='brands_slug_key' AND conrelid='public.brands'::regclass) THEN ALTER TABLE public.brands ADD CONSTRAINT brands_slug_key UNIQUE (slug); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='content_strategy_framework_pkey' AND conrelid='public.content_strategy_framework'::regclass) THEN ALTER TABLE public.content_strategy_framework ADD CONSTRAINT content_strategy_framework_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='businesses_staging_pkey' AND conrelid='public.businesses_staging'::regclass) THEN ALTER TABLE public.businesses_staging ADD CONSTRAINT businesses_staging_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='landing_page_templates_pkey' AND conrelid='public.landing_page_templates'::regclass) THEN ALTER TABLE public.landing_page_templates ADD CONSTRAINT landing_page_templates_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='service_providers_phone_key' AND conrelid='public.service_providers'::regclass) THEN ALTER TABLE public.service_providers ADD CONSTRAINT service_providers_phone_key UNIQUE (phone); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='service_providers_pkey' AND conrelid='public.service_providers'::regclass) THEN ALTER TABLE public.service_providers ADD CONSTRAINT service_providers_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='unique_phone' AND conrelid='public.service_providers'::regclass) THEN ALTER TABLE public.service_providers ADD CONSTRAINT unique_phone UNIQUE (phone); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='events_dedup_key_key' AND conrelid='public.events'::regclass) THEN ALTER TABLE public.events ADD CONSTRAINT events_dedup_key_key UNIQUE (dedup_key); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='events_pkey' AND conrelid='public.events'::regclass) THEN ALTER TABLE public.events ADD CONSTRAINT events_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='events_priority_check' AND conrelid='public.events'::regclass) THEN ALTER TABLE public.events ADD CONSTRAINT events_priority_check CHECK ((priority = ANY (ARRAY['critical'::text, 'high'::text, 'medium'::text, 'low'::text]))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='events_status_check' AND conrelid='public.events'::regclass) THEN ALTER TABLE public.events ADD CONSTRAINT events_status_check CHECK ((status = ANY (ARRAY['new'::text, 'queued'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'deduped'::text, 'cancelled'::text]))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='task_queue_dedup_key_key' AND conrelid='public.task_queue'::regclass) THEN ALTER TABLE public.task_queue ADD CONSTRAINT task_queue_dedup_key_key UNIQUE (dedup_key); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='task_queue_event_id_fkey' AND conrelid='public.task_queue'::regclass) THEN ALTER TABLE public.task_queue ADD CONSTRAINT task_queue_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='task_queue_parent_task_id_fkey' AND conrelid='public.task_queue'::regclass) THEN ALTER TABLE public.task_queue ADD CONSTRAINT task_queue_parent_task_id_fkey FOREIGN KEY (parent_task_id) REFERENCES task_queue(id) ON DELETE SET NULL; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='task_queue_pkey' AND conrelid='public.task_queue'::regclass) THEN ALTER TABLE public.task_queue ADD CONSTRAINT task_queue_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='task_queue_status_check' AND conrelid='public.task_queue'::regclass) THEN ALTER TABLE public.task_queue ADD CONSTRAINT task_queue_status_check CHECK ((status = ANY (ARRAY['queued'::text, 'assigned'::text, 'in_progress'::text, 'blocked'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_memory_agent_slug_memory_type_key_key' AND conrelid='public.agent_memory'::regclass) THEN ALTER TABLE public.agent_memory ADD CONSTRAINT agent_memory_agent_slug_memory_type_key_key UNIQUE (agent_slug, memory_type, key); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_memory_memory_type_check' AND conrelid='public.agent_memory'::regclass) THEN ALTER TABLE public.agent_memory ADD CONSTRAINT agent_memory_memory_type_check CHECK ((memory_type = ANY (ARRAY['fact'::text, 'lesson'::text, 'pattern'::text, 'decision'::text, 'outcome'::text, 'context'::text]))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_memory_pkey' AND conrelid='public.agent_memory'::regclass) THEN ALTER TABLE public.agent_memory ADD CONSTRAINT agent_memory_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_triggers_pkey' AND conrelid='public.agent_triggers'::regclass) THEN ALTER TABLE public.agent_triggers ADD CONSTRAINT agent_triggers_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='execution_metrics_event_id_fkey' AND conrelid='public.execution_metrics'::regclass) THEN ALTER TABLE public.execution_metrics ADD CONSTRAINT execution_metrics_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='execution_metrics_pkey' AND conrelid='public.execution_metrics'::regclass) THEN ALTER TABLE public.execution_metrics ADD CONSTRAINT execution_metrics_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='execution_metrics_status_check' AND conrelid='public.execution_metrics'::regclass) THEN ALTER TABLE public.execution_metrics ADD CONSTRAINT execution_metrics_status_check CHECK ((status = ANY (ARRAY['success'::text, 'failure'::text, 'timeout'::text, 'cancelled'::text]))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='execution_metrics_task_id_fkey' AND conrelid='public.execution_metrics'::regclass) THEN ALTER TABLE public.execution_metrics ADD CONSTRAINT execution_metrics_task_id_fkey FOREIGN KEY (task_id) REFERENCES task_queue(id) ON DELETE SET NULL; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='event_config_default_priority_check' AND conrelid='public.event_config'::regclass) THEN ALTER TABLE public.event_config ADD CONSTRAINT event_config_default_priority_check CHECK ((default_priority = ANY (ARRAY['critical'::text, 'high'::text, 'medium'::text, 'low'::text]))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='event_config_event_type_key' AND conrelid='public.event_config'::regclass) THEN ALTER TABLE public.event_config ADD CONSTRAINT event_config_event_type_key UNIQUE (event_type); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='event_config_pkey' AND conrelid='public.event_config'::regclass) THEN ALTER TABLE public.event_config ADD CONSTRAINT event_config_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='provider_verifications_pkey' AND conrelid='public.provider_verifications'::regclass) THEN ALTER TABLE public.provider_verifications ADD CONSTRAINT provider_verifications_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='provider_verifications_provider_id_fkey' AND conrelid='public.provider_verifications'::regclass) THEN ALTER TABLE public.provider_verifications ADD CONSTRAINT provider_verifications_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='whatsapp_templates_pkey' AND conrelid='public.whatsapp_templates'::regclass) THEN ALTER TABLE public.whatsapp_templates ADD CONSTRAINT whatsapp_templates_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='whatsapp_templates_template_id_language_key' AND conrelid='public.whatsapp_templates'::regclass) THEN ALTER TABLE public.whatsapp_templates ADD CONSTRAINT whatsapp_templates_template_id_language_key UNIQUE (template_id, language); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='otp_codes_pkey' AND conrelid='public.otp_codes'::regclass) THEN ALTER TABLE public.otp_codes ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='payments_app_id_fkey' AND conrelid='public.payments'::regclass) THEN ALTER TABLE public.payments ADD CONSTRAINT payments_app_id_fkey FOREIGN KEY (app_id) REFERENCES apps(id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='payments_brand_id_fkey' AND conrelid='public.payments'::regclass) THEN ALTER TABLE public.payments ADD CONSTRAINT payments_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='payments_pkey' AND conrelid='public.payments'::regclass) THEN ALTER TABLE public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='reviews_business_id_fkey' AND conrelid='public.reviews'::regclass) THEN ALTER TABLE public.reviews ADD CONSTRAINT reviews_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='reviews_pkey' AND conrelid='public.reviews'::regclass) THEN ALTER TABLE public.reviews ADD CONSTRAINT reviews_pkey PRIMARY KEY (id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='reviews_rating_check' AND conrelid='public.reviews'::regclass) THEN ALTER TABLE public.reviews ADD CONSTRAINT reviews_rating_check CHECK (((rating >= (1)::numeric) AND (rating <= (5)::numeric))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='reviews_user_id_fkey' AND conrelid='public.reviews'::regclass) THEN ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL; END IF; END $$;

-- === INDEXES ===
CREATE UNIQUE INDEX IF NOT EXISTS apps_pkey ON public.apps USING btree (id);

CREATE INDEX IF NOT EXISTS idx_biz_category ON public.businesses USING btree (category);

CREATE INDEX IF NOT EXISTS idx_biz_city ON public.businesses USING btree (city);

CREATE INDEX IF NOT EXISTS idx_biz_brand ON public.businesses USING btree (brand_id);

CREATE INDEX IF NOT EXISTS idx_leads_brand ON public.leads USING btree (brand_id);

CREATE INDEX IF NOT EXISTS idx_pay_brand ON public.payments USING btree (brand_id);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.dev_tasks USING btree (status, priority);

CREATE INDEX IF NOT EXISTS idx_businesses_phone ON public.businesses USING btree (phone);

CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses USING btree (category);

CREATE INDEX IF NOT EXISTS idx_businesses_source ON public.businesses USING btree (source);

CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads USING btree (status);

CREATE INDEX IF NOT EXISTS idx_jobs_app_id ON public.jobs USING btree (app_id);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs USING btree (status);

CREATE INDEX IF NOT EXISTS idx_courses_app_id ON public.courses USING btree (app_id);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings USING btree (booking_date);

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_trades_symbol ON public.trades USING btree (symbol);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications USING btree (read);

CREATE INDEX IF NOT EXISTS idx_apps_slug ON public.apps USING btree (slug);

CREATE INDEX IF NOT EXISTS idx_apps_status ON public.apps USING btree (status);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles USING btree (role);

CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON public.reviews USING btree (business_id);

CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews USING btree (rating);

CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_businesses_app_id ON public.businesses USING btree (app_id);

CREATE INDEX IF NOT EXISTS businesses_staging_category_idx ON public.businesses_staging USING btree (category);

CREATE INDEX IF NOT EXISTS businesses_staging_city_idx ON public.businesses_staging USING btree (city);

CREATE INDEX IF NOT EXISTS businesses_staging_brand_id_idx ON public.businesses_staging USING btree (brand_id);

CREATE INDEX IF NOT EXISTS businesses_staging_phone_idx ON public.businesses_staging USING btree (phone);

CREATE INDEX IF NOT EXISTS businesses_staging_category_idx1 ON public.businesses_staging USING btree (category);

CREATE INDEX IF NOT EXISTS businesses_staging_source_idx ON public.businesses_staging USING btree (source);

CREATE INDEX IF NOT EXISTS businesses_staging_app_id_idx ON public.businesses_staging USING btree (app_id);

CREATE INDEX IF NOT EXISTS idx_task_queue_agent ON public.task_queue USING btree (agent_slug);

CREATE INDEX IF NOT EXISTS idx_task_queue_priority ON public.task_queue USING btree (priority);

CREATE INDEX IF NOT EXISTS idx_task_queue_dedup ON public.task_queue USING btree (dedup_key);

CREATE INDEX IF NOT EXISTS businesses_city_idx ON public.businesses USING btree (city, rating DESC NULLS LAST) WHERE (status = 'active'::text);

CREATE INDEX IF NOT EXISTS businesses_brand_idx ON public.businesses USING btree (brand_id) WHERE (status = 'active'::text);

CREATE INDEX IF NOT EXISTS idx_events_status ON public.events USING btree (status);

CREATE INDEX IF NOT EXISTS idx_events_type ON public.events USING btree (type);

CREATE INDEX IF NOT EXISTS idx_events_priority ON public.events USING btree (priority);

CREATE INDEX IF NOT EXISTS idx_events_dedup ON public.events USING btree (dedup_key);

CREATE INDEX IF NOT EXISTS idx_events_created ON public.events USING btree (created_at);

CREATE INDEX IF NOT EXISTS businesses_name_trgm_idx ON public.businesses USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS businesses_category_trgm_idx ON public.businesses USING gin (category gin_trgm_ops);

CREATE INDEX IF NOT EXISTS reviews_business_id_idx ON public.reviews USING btree (business_id);

CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON public.reviews USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_queue_status ON public.task_queue USING btree (status);

CREATE INDEX IF NOT EXISTS idx_agent_memory_agent ON public.agent_memory USING btree (agent_slug);

CREATE INDEX IF NOT EXISTS idx_agent_memory_type ON public.agent_memory USING btree (memory_type);

CREATE INDEX IF NOT EXISTS idx_agent_memory_expires ON public.agent_memory USING btree (expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_triggers_unique ON public.agent_triggers USING btree (source_agent, target_agent, trigger_event);

CREATE INDEX IF NOT EXISTS idx_exec_metrics_agent ON public.execution_metrics USING btree (agent_slug);

CREATE INDEX IF NOT EXISTS idx_exec_metrics_status ON public.execution_metrics USING btree (status);

CREATE INDEX IF NOT EXISTS idx_exec_metrics_created ON public.execution_metrics USING btree (created_at);

CREATE UNIQUE INDEX IF NOT EXISTS businesses_name_phone_uniq ON public.businesses USING btree (lower(name), COALESCE(phone, ''::text));

CREATE INDEX IF NOT EXISTS otp_codes_phone_idx ON public.otp_codes USING btree (phone, created_at DESC);

CREATE INDEX IF NOT EXISTS businesses_rated_idx ON public.businesses USING btree (category, rating DESC NULLS LAST) WHERE ((status = 'active'::text) AND (rating IS NOT NULL));

CREATE INDEX IF NOT EXISTS businesses_active_status_idx ON public.businesses USING btree (status) WHERE (status = 'active'::text);

CREATE INDEX IF NOT EXISTS whatsapp_templates_name_idx ON public.whatsapp_templates USING btree (name);

CREATE INDEX IF NOT EXISTS whatsapp_templates_status_idx ON public.whatsapp_templates USING btree (status);


-- === ENABLE RLS (idempotent; secure default-deny for anon/authenticated) ===
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_strategy_framework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.agent_outputs ENABLE ROW LEVEL SECURITY;

-- === POLICIES ===
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='apps' AND policyname='apps_public_read') THEN CREATE POLICY apps_public_read ON public.apps FOR SELECT TO public USING (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='apps' AND policyname='apps_service_write') THEN CREATE POLICY apps_service_write ON public.apps FOR ALL TO public USING (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='categories' AND policyname='categories_public_read') THEN CREATE POLICY categories_public_read ON public.categories FOR SELECT TO public USING (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='content' AND policyname='content_public_read') THEN CREATE POLICY content_public_read ON public.content FOR SELECT TO public USING ((published = true)); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='courses' AND policyname='courses_public_read') THEN CREATE POLICY courses_public_read ON public.courses FOR SELECT TO public USING (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agents' AND policyname='agents_public_read') THEN CREATE POLICY agents_public_read ON public.agents FOR SELECT TO public USING (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='bookings' AND policyname='bookings_public_insert') THEN CREATE POLICY bookings_public_insert ON public.bookings FOR INSERT TO public WITH CHECK (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='bookings' AND policyname='bookings_public_read') THEN CREATE POLICY bookings_public_read ON public.bookings FOR SELECT TO public USING (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='trades' AND policyname='trades_public_read') THEN CREATE POLICY trades_public_read ON public.trades FOR SELECT TO public USING (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='subscriptions' AND policyname='subscriptions_public_insert') THEN CREATE POLICY subscriptions_public_insert ON public.subscriptions FOR INSERT TO public WITH CHECK (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notifications' AND policyname='notifications_public_read') THEN CREATE POLICY notifications_public_read ON public.notifications FOR SELECT TO public USING (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='settings' AND policyname='settings_public_read') THEN CREATE POLICY settings_public_read ON public.settings FOR SELECT TO public USING (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_self_read') THEN CREATE POLICY profiles_self_read ON public.profiles FOR SELECT TO public USING ((auth.uid() = id)); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_self_update') THEN CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE TO public USING ((auth.uid() = id)); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='jobs' AND policyname='jobs_public_read') THEN CREATE POLICY jobs_public_read ON public.jobs FOR SELECT TO public USING (true); END IF; END $$;

CREATE POLICY "Business owners can manage" ON public.businesses FOR ALL TO public USING ((auth.uid() = owner_id));

CREATE POLICY "Public can read businesses" ON public.businesses FOR SELECT TO public USING ((status = 'active'::text));

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='businesses' AND policyname='biz_public_read') THEN CREATE POLICY biz_public_read ON public.businesses FOR SELECT TO public USING (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='businesses' AND policyname='public_read') THEN CREATE POLICY public_read ON public.businesses FOR SELECT TO anon,authenticated USING ((status = 'active'::text)); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agent_outputs' AND policyname='service_role_all_agent_outputs') THEN CREATE POLICY service_role_all_agent_outputs ON public.agent_outputs FOR ALL TO public USING (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='research_logs' AND policyname='service_role_all_research_logs') THEN CREATE POLICY service_role_all_research_logs ON public.research_logs FOR ALL TO public USING (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='backlog' AND policyname='service_role_all_backlog') THEN CREATE POLICY service_role_all_backlog ON public.backlog FOR ALL TO public USING (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='learning_log' AND policyname='service_role_all_learning_log') THEN CREATE POLICY service_role_all_learning_log ON public.learning_log FOR ALL TO public USING (true); END IF; END $$;

CREATE POLICY "Allow insert for admins" ON public.brands FOR INSERT TO authenticated WITH CHECK (((auth.jwt() ->> 'role'::text) = 'admin'::text));

CREATE POLICY "Allow read access for anon and authenticated" ON public.brands FOR SELECT TO public USING (true);

CREATE POLICY "Allow update for admins" ON public.brands FOR UPDATE TO authenticated USING (((auth.jwt() ->> 'role'::text) = 'admin'::text)) WITH CHECK (((auth.jwt() ->> 'role'::text) = 'admin'::text));

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='brands' AND policyname='brands_public_read') THEN CREATE POLICY brands_public_read ON public.brands FOR SELECT TO public USING (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='brands' AND policyname='public_read') THEN CREATE POLICY public_read ON public.brands FOR SELECT TO anon,authenticated USING (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='events' AND policyname='service_all_events') THEN CREATE POLICY service_all_events ON public.events FOR ALL TO public USING (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='task_queue' AND policyname='service_all_task_queue') THEN CREATE POLICY service_all_task_queue ON public.task_queue FOR ALL TO public USING (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agent_memory' AND policyname='service_all_agent_memory') THEN CREATE POLICY service_all_agent_memory ON public.agent_memory FOR ALL TO public USING (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agent_triggers' AND policyname='service_all_agent_triggers') THEN CREATE POLICY service_all_agent_triggers ON public.agent_triggers FOR ALL TO public USING (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='execution_metrics' AND policyname='service_all_execution_metrics') THEN CREATE POLICY service_all_execution_metrics ON public.execution_metrics FOR ALL TO public USING (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='event_config' AND policyname='service_all_event_config') THEN CREATE POLICY service_all_event_config ON public.event_config FOR ALL TO public USING (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='whatsapp_templates' AND policyname='public_read') THEN CREATE POLICY public_read ON public.whatsapp_templates FOR SELECT TO anon,authenticated USING (true); END IF; END $$;

CREATE POLICY "Admins can manage all reviews" ON public.reviews FOR ALL TO public USING ((auth.uid() IN ( SELECT profiles.id FROM profiles WHERE (profiles.role = 'admin'::text))));

CREATE POLICY "Authenticated users can submit reviews" ON public.reviews FOR INSERT TO public WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Public can read approved reviews" ON public.reviews FOR SELECT TO public USING ((is_approved = true));

CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE TO public USING ((user_id = auth.uid()));

CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE TO public USING ((user_id = auth.uid()));

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='public_read') THEN CREATE POLICY public_read ON public.reviews FOR SELECT TO anon,authenticated USING (is_approved); END IF; END $$;

-- === GRANTS ===
GRANT DELETE ON TABLE public.agent_memory TO anon;

GRANT INSERT ON TABLE public.agent_memory TO anon;

GRANT REFERENCES ON TABLE public.agent_memory TO anon;

GRANT SELECT ON TABLE public.agent_memory TO anon;

GRANT TRIGGER ON TABLE public.agent_memory TO anon;

GRANT TRUNCATE ON TABLE public.agent_memory TO anon;

GRANT UPDATE ON TABLE public.agent_memory TO anon;

GRANT DELETE ON TABLE public.agent_outputs TO anon;

GRANT INSERT ON TABLE public.agent_outputs TO anon;

GRANT REFERENCES ON TABLE public.agent_outputs TO anon;

GRANT SELECT ON TABLE public.agent_outputs TO anon;

GRANT TRIGGER ON TABLE public.agent_outputs TO anon;

GRANT TRUNCATE ON TABLE public.agent_outputs TO anon;

GRANT UPDATE ON TABLE public.agent_outputs TO anon;

GRANT DELETE ON TABLE public.agent_triggers TO anon;

GRANT INSERT ON TABLE public.agent_triggers TO anon;

GRANT REFERENCES ON TABLE public.agent_triggers TO anon;

GRANT SELECT ON TABLE public.agent_triggers TO anon;

GRANT TRIGGER ON TABLE public.agent_triggers TO anon;

GRANT TRUNCATE ON TABLE public.agent_triggers TO anon;

GRANT UPDATE ON TABLE public.agent_triggers TO anon;

GRANT DELETE ON TABLE public.apps TO anon;

GRANT INSERT ON TABLE public.apps TO anon;

GRANT REFERENCES ON TABLE public.apps TO anon;

GRANT SELECT ON TABLE public.apps TO anon;

GRANT TRIGGER ON TABLE public.apps TO anon;

GRANT TRUNCATE ON TABLE public.apps TO anon;

GRANT UPDATE ON TABLE public.apps TO anon;

GRANT DELETE ON TABLE public.backlog TO anon;

GRANT INSERT ON TABLE public.backlog TO anon;

GRANT REFERENCES ON TABLE public.backlog TO anon;

GRANT SELECT ON TABLE public.backlog TO anon;

GRANT TRIGGER ON TABLE public.backlog TO anon;

GRANT TRUNCATE ON TABLE public.backlog TO anon;

GRANT UPDATE ON TABLE public.backlog TO anon;

GRANT DELETE ON TABLE public.bookings TO anon;

GRANT INSERT ON TABLE public.bookings TO anon;

GRANT REFERENCES ON TABLE public.bookings TO anon;

GRANT SELECT ON TABLE public.bookings TO anon;

GRANT TRIGGER ON TABLE public.bookings TO anon;

GRANT TRUNCATE ON TABLE public.bookings TO anon;

GRANT UPDATE ON TABLE public.bookings TO anon;

GRANT SELECT ON TABLE public.brands TO anon;

GRANT SELECT ON TABLE public.businesses TO anon;

GRANT DELETE ON TABLE public.businesses_staging TO anon;

GRANT INSERT ON TABLE public.businesses_staging TO anon;

GRANT REFERENCES ON TABLE public.businesses_staging TO anon;

GRANT SELECT ON TABLE public.businesses_staging TO anon;

GRANT TRIGGER ON TABLE public.businesses_staging TO anon;

GRANT TRUNCATE ON TABLE public.businesses_staging TO anon;

GRANT UPDATE ON TABLE public.businesses_staging TO anon;

GRANT DELETE ON TABLE public.categories TO anon;

GRANT INSERT ON TABLE public.categories TO anon;

GRANT REFERENCES ON TABLE public.categories TO anon;

GRANT SELECT ON TABLE public.categories TO anon;

GRANT TRIGGER ON TABLE public.categories TO anon;

GRANT TRUNCATE ON TABLE public.categories TO anon;

GRANT UPDATE ON TABLE public.categories TO anon;

GRANT DELETE ON TABLE public.content TO anon;

GRANT INSERT ON TABLE public.content TO anon;

GRANT REFERENCES ON TABLE public.content TO anon;

GRANT SELECT ON TABLE public.content TO anon;

GRANT TRIGGER ON TABLE public.content TO anon;

GRANT TRUNCATE ON TABLE public.content TO anon;

GRANT UPDATE ON TABLE public.content TO anon;

GRANT DELETE ON TABLE public.content_strategy_framework TO anon;

GRANT INSERT ON TABLE public.content_strategy_framework TO anon;

GRANT REFERENCES ON TABLE public.content_strategy_framework TO anon;

GRANT SELECT ON TABLE public.content_strategy_framework TO anon;

GRANT TRIGGER ON TABLE public.content_strategy_framework TO anon;

GRANT TRUNCATE ON TABLE public.content_strategy_framework TO anon;

GRANT UPDATE ON TABLE public.content_strategy_framework TO anon;

GRANT DELETE ON TABLE public.courses TO anon;

GRANT INSERT ON TABLE public.courses TO anon;

GRANT REFERENCES ON TABLE public.courses TO anon;

GRANT SELECT ON TABLE public.courses TO anon;

GRANT TRIGGER ON TABLE public.courses TO anon;

GRANT TRUNCATE ON TABLE public.courses TO anon;

GRANT UPDATE ON TABLE public.courses TO anon;

GRANT DELETE ON TABLE public.event_config TO anon;

GRANT INSERT ON TABLE public.event_config TO anon;

GRANT REFERENCES ON TABLE public.event_config TO anon;

GRANT SELECT ON TABLE public.event_config TO anon;

GRANT TRIGGER ON TABLE public.event_config TO anon;

GRANT TRUNCATE ON TABLE public.event_config TO anon;

GRANT UPDATE ON TABLE public.event_config TO anon;

GRANT DELETE ON TABLE public.events TO anon;

GRANT INSERT ON TABLE public.events TO anon;

GRANT REFERENCES ON TABLE public.events TO anon;

GRANT SELECT ON TABLE public.events TO anon;

GRANT TRIGGER ON TABLE public.events TO anon;

GRANT TRUNCATE ON TABLE public.events TO anon;

GRANT UPDATE ON TABLE public.events TO anon;

GRANT DELETE ON TABLE public.execution_metrics TO anon;

GRANT INSERT ON TABLE public.execution_metrics TO anon;

GRANT REFERENCES ON TABLE public.execution_metrics TO anon;

GRANT SELECT ON TABLE public.execution_metrics TO anon;

GRANT TRIGGER ON TABLE public.execution_metrics TO anon;

GRANT TRUNCATE ON TABLE public.execution_metrics TO anon;

GRANT UPDATE ON TABLE public.execution_metrics TO anon;

GRANT DELETE ON TABLE public.jobs TO anon;

GRANT INSERT ON TABLE public.jobs TO anon;

GRANT REFERENCES ON TABLE public.jobs TO anon;

GRANT SELECT ON TABLE public.jobs TO anon;

GRANT TRIGGER ON TABLE public.jobs TO anon;

GRANT TRUNCATE ON TABLE public.jobs TO anon;

GRANT UPDATE ON TABLE public.jobs TO anon;

GRANT DELETE ON TABLE public.landing_page_templates TO anon;

GRANT INSERT ON TABLE public.landing_page_templates TO anon;

GRANT REFERENCES ON TABLE public.landing_page_templates TO anon;

GRANT SELECT ON TABLE public.landing_page_templates TO anon;

GRANT TRIGGER ON TABLE public.landing_page_templates TO anon;

GRANT TRUNCATE ON TABLE public.landing_page_templates TO anon;

GRANT UPDATE ON TABLE public.landing_page_templates TO anon;

GRANT DELETE ON TABLE public.learning_log TO anon;

GRANT INSERT ON TABLE public.learning_log TO anon;

GRANT REFERENCES ON TABLE public.learning_log TO anon;

GRANT SELECT ON TABLE public.learning_log TO anon;

GRANT TRIGGER ON TABLE public.learning_log TO anon;

GRANT TRUNCATE ON TABLE public.learning_log TO anon;

GRANT UPDATE ON TABLE public.learning_log TO anon;

GRANT DELETE ON TABLE public.notifications TO anon;

GRANT INSERT ON TABLE public.notifications TO anon;

GRANT REFERENCES ON TABLE public.notifications TO anon;

GRANT SELECT ON TABLE public.notifications TO anon;

GRANT TRIGGER ON TABLE public.notifications TO anon;

GRANT TRUNCATE ON TABLE public.notifications TO anon;

GRANT UPDATE ON TABLE public.notifications TO anon;

GRANT DELETE ON TABLE public.profiles TO anon;

GRANT INSERT ON TABLE public.profiles TO anon;

GRANT REFERENCES ON TABLE public.profiles TO anon;

GRANT SELECT ON TABLE public.profiles TO anon;

GRANT TRIGGER ON TABLE public.profiles TO anon;

GRANT TRUNCATE ON TABLE public.profiles TO anon;

GRANT UPDATE ON TABLE public.profiles TO anon;

GRANT DELETE ON TABLE public.provider_verifications TO anon;

GRANT INSERT ON TABLE public.provider_verifications TO anon;

GRANT REFERENCES ON TABLE public.provider_verifications TO anon;

GRANT SELECT ON TABLE public.provider_verifications TO anon;

GRANT TRIGGER ON TABLE public.provider_verifications TO anon;

GRANT TRUNCATE ON TABLE public.provider_verifications TO anon;

GRANT UPDATE ON TABLE public.provider_verifications TO anon;

GRANT DELETE ON TABLE public.research_logs TO anon;

GRANT INSERT ON TABLE public.research_logs TO anon;

GRANT REFERENCES ON TABLE public.research_logs TO anon;

GRANT SELECT ON TABLE public.research_logs TO anon;

GRANT TRIGGER ON TABLE public.research_logs TO anon;

GRANT TRUNCATE ON TABLE public.research_logs TO anon;

GRANT UPDATE ON TABLE public.research_logs TO anon;

GRANT SELECT ON TABLE public.reviews TO anon;

GRANT DELETE ON TABLE public.service_providers TO anon;

GRANT INSERT ON TABLE public.service_providers TO anon;

GRANT REFERENCES ON TABLE public.service_providers TO anon;

GRANT SELECT ON TABLE public.service_providers TO anon;

GRANT TRIGGER ON TABLE public.service_providers TO anon;

GRANT TRUNCATE ON TABLE public.service_providers TO anon;

GRANT UPDATE ON TABLE public.service_providers TO anon;

GRANT DELETE ON TABLE public.settings TO anon;

GRANT INSERT ON TABLE public.settings TO anon;

GRANT REFERENCES ON TABLE public.settings TO anon;

GRANT SELECT ON TABLE public.settings TO anon;

GRANT TRIGGER ON TABLE public.settings TO anon;

GRANT TRUNCATE ON TABLE public.settings TO anon;

GRANT UPDATE ON TABLE public.settings TO anon;

GRANT DELETE ON TABLE public.subscriptions TO anon;

GRANT INSERT ON TABLE public.subscriptions TO anon;

GRANT REFERENCES ON TABLE public.subscriptions TO anon;

GRANT SELECT ON TABLE public.subscriptions TO anon;

GRANT TRIGGER ON TABLE public.subscriptions TO anon;

GRANT TRUNCATE ON TABLE public.subscriptions TO anon;

GRANT UPDATE ON TABLE public.subscriptions TO anon;

GRANT DELETE ON TABLE public.task_queue TO anon;

GRANT INSERT ON TABLE public.task_queue TO anon;

GRANT REFERENCES ON TABLE public.task_queue TO anon;

GRANT SELECT ON TABLE public.task_queue TO anon;

GRANT TRIGGER ON TABLE public.task_queue TO anon;

GRANT TRUNCATE ON TABLE public.task_queue TO anon;

GRANT UPDATE ON TABLE public.task_queue TO anon;

GRANT DELETE ON TABLE public.trades TO anon;

GRANT INSERT ON TABLE public.trades TO anon;

GRANT REFERENCES ON TABLE public.trades TO anon;

GRANT SELECT ON TABLE public.trades TO anon;

GRANT TRIGGER ON TABLE public.trades TO anon;

GRANT TRUNCATE ON TABLE public.trades TO anon;

GRANT UPDATE ON TABLE public.trades TO anon;

GRANT SELECT ON TABLE public.whatsapp_templates TO anon;

GRANT DELETE ON TABLE public.agent_memory TO authenticated;

GRANT INSERT ON TABLE public.agent_memory TO authenticated;

GRANT REFERENCES ON TABLE public.agent_memory TO authenticated;

GRANT SELECT ON TABLE public.agent_memory TO authenticated;

GRANT TRIGGER ON TABLE public.agent_memory TO authenticated;

GRANT TRUNCATE ON TABLE public.agent_memory TO authenticated;

GRANT UPDATE ON TABLE public.agent_memory TO authenticated;

GRANT DELETE ON TABLE public.agent_outputs TO authenticated;

GRANT INSERT ON TABLE public.agent_outputs TO authenticated;

GRANT REFERENCES ON TABLE public.agent_outputs TO authenticated;

GRANT SELECT ON TABLE public.agent_outputs TO authenticated;

GRANT TRIGGER ON TABLE public.agent_outputs TO authenticated;

GRANT TRUNCATE ON TABLE public.agent_outputs TO authenticated;

GRANT UPDATE ON TABLE public.agent_outputs TO authenticated;

GRANT DELETE ON TABLE public.agent_triggers TO authenticated;

GRANT INSERT ON TABLE public.agent_triggers TO authenticated;

GRANT REFERENCES ON TABLE public.agent_triggers TO authenticated;

GRANT SELECT ON TABLE public.agent_triggers TO authenticated;

GRANT TRIGGER ON TABLE public.agent_triggers TO authenticated;

GRANT TRUNCATE ON TABLE public.agent_triggers TO authenticated;

GRANT UPDATE ON TABLE public.agent_triggers TO authenticated;

GRANT DELETE ON TABLE public.apps TO authenticated;

GRANT INSERT ON TABLE public.apps TO authenticated;

GRANT REFERENCES ON TABLE public.apps TO authenticated;

GRANT SELECT ON TABLE public.apps TO authenticated;

GRANT TRIGGER ON TABLE public.apps TO authenticated;

GRANT TRUNCATE ON TABLE public.apps TO authenticated;

GRANT UPDATE ON TABLE public.apps TO authenticated;

GRANT DELETE ON TABLE public.backlog TO authenticated;

GRANT INSERT ON TABLE public.backlog TO authenticated;

GRANT REFERENCES ON TABLE public.backlog TO authenticated;

GRANT SELECT ON TABLE public.backlog TO authenticated;

GRANT TRIGGER ON TABLE public.backlog TO authenticated;

GRANT TRUNCATE ON TABLE public.backlog TO authenticated;

GRANT UPDATE ON TABLE public.backlog TO authenticated;

GRANT DELETE ON TABLE public.bookings TO authenticated;

GRANT INSERT ON TABLE public.bookings TO authenticated;

GRANT REFERENCES ON TABLE public.bookings TO authenticated;

GRANT SELECT ON TABLE public.bookings TO authenticated;

GRANT TRIGGER ON TABLE public.bookings TO authenticated;

GRANT TRUNCATE ON TABLE public.bookings TO authenticated;

GRANT UPDATE ON TABLE public.bookings TO authenticated;

GRANT SELECT ON TABLE public.brands TO authenticated;

GRANT SELECT ON TABLE public.businesses TO authenticated;

GRANT DELETE ON TABLE public.businesses_staging TO authenticated;

GRANT INSERT ON TABLE public.businesses_staging TO authenticated;

GRANT REFERENCES ON TABLE public.businesses_staging TO authenticated;

GRANT SELECT ON TABLE public.businesses_staging TO authenticated;

GRANT TRIGGER ON TABLE public.businesses_staging TO authenticated;

GRANT TRUNCATE ON TABLE public.businesses_staging TO authenticated;

GRANT UPDATE ON TABLE public.businesses_staging TO authenticated;

GRANT DELETE ON TABLE public.categories TO authenticated;

GRANT INSERT ON TABLE public.categories TO authenticated;

GRANT REFERENCES ON TABLE public.categories TO authenticated;

GRANT SELECT ON TABLE public.categories TO authenticated;

GRANT TRIGGER ON TABLE public.categories TO authenticated;

GRANT TRUNCATE ON TABLE public.categories TO authenticated;

GRANT UPDATE ON TABLE public.categories TO authenticated;

GRANT DELETE ON TABLE public.content TO authenticated;

GRANT INSERT ON TABLE public.content TO authenticated;

GRANT REFERENCES ON TABLE public.content TO authenticated;

GRANT SELECT ON TABLE public.content TO authenticated;

GRANT TRIGGER ON TABLE public.content TO authenticated;

GRANT TRUNCATE ON TABLE public.content TO authenticated;

GRANT UPDATE ON TABLE public.content TO authenticated;

GRANT DELETE ON TABLE public.content_strategy_framework TO authenticated;

GRANT INSERT ON TABLE public.content_strategy_framework TO authenticated;

GRANT REFERENCES ON TABLE public.content_strategy_framework TO authenticated;

GRANT SELECT ON TABLE public.content_strategy_framework TO authenticated;

GRANT TRIGGER ON TABLE public.content_strategy_framework TO authenticated;

GRANT TRUNCATE ON TABLE public.content_strategy_framework TO authenticated;

GRANT UPDATE ON TABLE public.content_strategy_framework TO authenticated;

GRANT DELETE ON TABLE public.courses TO authenticated;

GRANT INSERT ON TABLE public.courses TO authenticated;

GRANT REFERENCES ON TABLE public.courses TO authenticated;

GRANT SELECT ON TABLE public.courses TO authenticated;

GRANT TRIGGER ON TABLE public.courses TO authenticated;

GRANT TRUNCATE ON TABLE public.courses TO authenticated;

GRANT UPDATE ON TABLE public.courses TO authenticated;

GRANT DELETE ON TABLE public.event_config TO authenticated;

GRANT INSERT ON TABLE public.event_config TO authenticated;

GRANT REFERENCES ON TABLE public.event_config TO authenticated;

GRANT SELECT ON TABLE public.event_config TO authenticated;

GRANT TRIGGER ON TABLE public.event_config TO authenticated;

GRANT TRUNCATE ON TABLE public.event_config TO authenticated;

GRANT UPDATE ON TABLE public.event_config TO authenticated;

GRANT DELETE ON TABLE public.events TO authenticated;

GRANT INSERT ON TABLE public.events TO authenticated;

GRANT REFERENCES ON TABLE public.events TO authenticated;

GRANT SELECT ON TABLE public.events TO authenticated;

GRANT TRIGGER ON TABLE public.events TO authenticated;

GRANT TRUNCATE ON TABLE public.events TO authenticated;

GRANT UPDATE ON TABLE public.events TO authenticated;

GRANT DELETE ON TABLE public.execution_metrics TO authenticated;

GRANT INSERT ON TABLE public.execution_metrics TO authenticated;

GRANT REFERENCES ON TABLE public.execution_metrics TO authenticated;

GRANT SELECT ON TABLE public.execution_metrics TO authenticated;

GRANT TRIGGER ON TABLE public.execution_metrics TO authenticated;

GRANT TRUNCATE ON TABLE public.execution_metrics TO authenticated;

GRANT UPDATE ON TABLE public.execution_metrics TO authenticated;

GRANT DELETE ON TABLE public.jobs TO authenticated;

GRANT INSERT ON TABLE public.jobs TO authenticated;

GRANT REFERENCES ON TABLE public.jobs TO authenticated;

GRANT SELECT ON TABLE public.jobs TO authenticated;

GRANT TRIGGER ON TABLE public.jobs TO authenticated;

GRANT TRUNCATE ON TABLE public.jobs TO authenticated;

GRANT UPDATE ON TABLE public.jobs TO authenticated;

GRANT DELETE ON TABLE public.landing_page_templates TO authenticated;

GRANT INSERT ON TABLE public.landing_page_templates TO authenticated;

GRANT REFERENCES ON TABLE public.landing_page_templates TO authenticated;

GRANT SELECT ON TABLE public.landing_page_templates TO authenticated;

GRANT TRIGGER ON TABLE public.landing_page_templates TO authenticated;

GRANT TRUNCATE ON TABLE public.landing_page_templates TO authenticated;

GRANT UPDATE ON TABLE public.landing_page_templates TO authenticated;

GRANT DELETE ON TABLE public.learning_log TO authenticated;

GRANT INSERT ON TABLE public.learning_log TO authenticated;

GRANT REFERENCES ON TABLE public.learning_log TO authenticated;

GRANT SELECT ON TABLE public.learning_log TO authenticated;

GRANT TRIGGER ON TABLE public.learning_log TO authenticated;

GRANT TRUNCATE ON TABLE public.learning_log TO authenticated;

GRANT UPDATE ON TABLE public.learning_log TO authenticated;

GRANT DELETE ON TABLE public.notifications TO authenticated;

GRANT INSERT ON TABLE public.notifications TO authenticated;

GRANT REFERENCES ON TABLE public.notifications TO authenticated;

GRANT SELECT ON TABLE public.notifications TO authenticated;

GRANT TRIGGER ON TABLE public.notifications TO authenticated;

GRANT TRUNCATE ON TABLE public.notifications TO authenticated;

GRANT UPDATE ON TABLE public.notifications TO authenticated;

GRANT DELETE ON TABLE public.profiles TO authenticated;

GRANT INSERT ON TABLE public.profiles TO authenticated;

GRANT REFERENCES ON TABLE public.profiles TO authenticated;

GRANT SELECT ON TABLE public.profiles TO authenticated;

GRANT TRIGGER ON TABLE public.profiles TO authenticated;

GRANT TRUNCATE ON TABLE public.profiles TO authenticated;

GRANT UPDATE ON TABLE public.profiles TO authenticated;

GRANT DELETE ON TABLE public.provider_verifications TO authenticated;

GRANT INSERT ON TABLE public.provider_verifications TO authenticated;

GRANT REFERENCES ON TABLE public.provider_verifications TO authenticated;

GRANT SELECT ON TABLE public.provider_verifications TO authenticated;

GRANT TRIGGER ON TABLE public.provider_verifications TO authenticated;

GRANT TRUNCATE ON TABLE public.provider_verifications TO authenticated;

GRANT UPDATE ON TABLE public.provider_verifications TO authenticated;

GRANT DELETE ON TABLE public.research_logs TO authenticated;

GRANT INSERT ON TABLE public.research_logs TO authenticated;

GRANT REFERENCES ON TABLE public.research_logs TO authenticated;

GRANT SELECT ON TABLE public.research_logs TO authenticated;

GRANT TRIGGER ON TABLE public.research_logs TO authenticated;

GRANT TRUNCATE ON TABLE public.research_logs TO authenticated;

GRANT UPDATE ON TABLE public.research_logs TO authenticated;

GRANT SELECT ON TABLE public.reviews TO authenticated;

GRANT DELETE ON TABLE public.service_providers TO authenticated;

GRANT INSERT ON TABLE public.service_providers TO authenticated;

GRANT REFERENCES ON TABLE public.service_providers TO authenticated;

GRANT SELECT ON TABLE public.service_providers TO authenticated;

GRANT TRIGGER ON TABLE public.service_providers TO authenticated;

GRANT TRUNCATE ON TABLE public.service_providers TO authenticated;

GRANT UPDATE ON TABLE public.service_providers TO authenticated;

GRANT DELETE ON TABLE public.settings TO authenticated;

GRANT INSERT ON TABLE public.settings TO authenticated;

GRANT REFERENCES ON TABLE public.settings TO authenticated;

GRANT SELECT ON TABLE public.settings TO authenticated;

GRANT TRIGGER ON TABLE public.settings TO authenticated;

GRANT TRUNCATE ON TABLE public.settings TO authenticated;

GRANT UPDATE ON TABLE public.settings TO authenticated;

GRANT DELETE ON TABLE public.subscriptions TO authenticated;

GRANT INSERT ON TABLE public.subscriptions TO authenticated;

GRANT REFERENCES ON TABLE public.subscriptions TO authenticated;

GRANT SELECT ON TABLE public.subscriptions TO authenticated;

GRANT TRIGGER ON TABLE public.subscriptions TO authenticated;

GRANT TRUNCATE ON TABLE public.subscriptions TO authenticated;

GRANT UPDATE ON TABLE public.subscriptions TO authenticated;

GRANT DELETE ON TABLE public.task_queue TO authenticated;

GRANT INSERT ON TABLE public.task_queue TO authenticated;

GRANT REFERENCES ON TABLE public.task_queue TO authenticated;

GRANT SELECT ON TABLE public.task_queue TO authenticated;

GRANT TRIGGER ON TABLE public.task_queue TO authenticated;

GRANT TRUNCATE ON TABLE public.task_queue TO authenticated;

GRANT UPDATE ON TABLE public.task_queue TO authenticated;

GRANT DELETE ON TABLE public.trades TO authenticated;

GRANT INSERT ON TABLE public.trades TO authenticated;

GRANT REFERENCES ON TABLE public.trades TO authenticated;

GRANT SELECT ON TABLE public.trades TO authenticated;

GRANT TRIGGER ON TABLE public.trades TO authenticated;

GRANT TRUNCATE ON TABLE public.trades TO authenticated;

GRANT UPDATE ON TABLE public.trades TO authenticated;

GRANT SELECT ON TABLE public.whatsapp_templates TO authenticated;

GRANT DELETE ON TABLE public.agent_memory TO service_role;

GRANT INSERT ON TABLE public.agent_memory TO service_role;

GRANT REFERENCES ON TABLE public.agent_memory TO service_role;

GRANT SELECT ON TABLE public.agent_memory TO service_role;

GRANT TRIGGER ON TABLE public.agent_memory TO service_role;

GRANT TRUNCATE ON TABLE public.agent_memory TO service_role;

GRANT UPDATE ON TABLE public.agent_memory TO service_role;

GRANT DELETE ON TABLE public.agent_outputs TO service_role;

GRANT INSERT ON TABLE public.agent_outputs TO service_role;

GRANT REFERENCES ON TABLE public.agent_outputs TO service_role;

GRANT SELECT ON TABLE public.agent_outputs TO service_role;

GRANT TRIGGER ON TABLE public.agent_outputs TO service_role;

GRANT TRUNCATE ON TABLE public.agent_outputs TO service_role;

GRANT UPDATE ON TABLE public.agent_outputs TO service_role;

GRANT DELETE ON TABLE public.agent_triggers TO service_role;

GRANT INSERT ON TABLE public.agent_triggers TO service_role;

GRANT REFERENCES ON TABLE public.agent_triggers TO service_role;

GRANT SELECT ON TABLE public.agent_triggers TO service_role;

GRANT TRIGGER ON TABLE public.agent_triggers TO service_role;

GRANT TRUNCATE ON TABLE public.agent_triggers TO service_role;

GRANT UPDATE ON TABLE public.agent_triggers TO service_role;

GRANT DELETE ON TABLE public.agents TO service_role;

GRANT INSERT ON TABLE public.agents TO service_role;

GRANT REFERENCES ON TABLE public.agents TO service_role;

GRANT SELECT ON TABLE public.agents TO service_role;

GRANT TRIGGER ON TABLE public.agents TO service_role;

GRANT TRUNCATE ON TABLE public.agents TO service_role;

GRANT UPDATE ON TABLE public.agents TO service_role;

GRANT DELETE ON TABLE public.apps TO service_role;

GRANT INSERT ON TABLE public.apps TO service_role;

GRANT REFERENCES ON TABLE public.apps TO service_role;

GRANT SELECT ON TABLE public.apps TO service_role;

GRANT TRIGGER ON TABLE public.apps TO service_role;

GRANT TRUNCATE ON TABLE public.apps TO service_role;

GRANT UPDATE ON TABLE public.apps TO service_role;

GRANT DELETE ON TABLE public.backlog TO service_role;

GRANT INSERT ON TABLE public.backlog TO service_role;

GRANT REFERENCES ON TABLE public.backlog TO service_role;

GRANT SELECT ON TABLE public.backlog TO service_role;

GRANT TRIGGER ON TABLE public.backlog TO service_role;

GRANT TRUNCATE ON TABLE public.backlog TO service_role;

GRANT UPDATE ON TABLE public.backlog TO service_role;

GRANT DELETE ON TABLE public.bookings TO service_role;

GRANT INSERT ON TABLE public.bookings TO service_role;

GRANT REFERENCES ON TABLE public.bookings TO service_role;

GRANT SELECT ON TABLE public.bookings TO service_role;

GRANT TRIGGER ON TABLE public.bookings TO service_role;

GRANT TRUNCATE ON TABLE public.bookings TO service_role;

GRANT UPDATE ON TABLE public.bookings TO service_role;

GRANT DELETE ON TABLE public.brands TO service_role;

GRANT INSERT ON TABLE public.brands TO service_role;

GRANT REFERENCES ON TABLE public.brands TO service_role;

GRANT SELECT ON TABLE public.brands TO service_role;

GRANT TRIGGER ON TABLE public.brands TO service_role;

GRANT TRUNCATE ON TABLE public.brands TO service_role;

GRANT UPDATE ON TABLE public.brands TO service_role;

GRANT DELETE ON TABLE public.businesses TO service_role;

GRANT INSERT ON TABLE public.businesses TO service_role;

GRANT REFERENCES ON TABLE public.businesses TO service_role;

GRANT SELECT ON TABLE public.businesses TO service_role;

GRANT TRIGGER ON TABLE public.businesses TO service_role;

GRANT TRUNCATE ON TABLE public.businesses TO service_role;

GRANT UPDATE ON TABLE public.businesses TO service_role;

GRANT DELETE ON TABLE public.businesses_staging TO service_role;

GRANT INSERT ON TABLE public.businesses_staging TO service_role;

GRANT REFERENCES ON TABLE public.businesses_staging TO service_role;

GRANT SELECT ON TABLE public.businesses_staging TO service_role;

GRANT TRIGGER ON TABLE public.businesses_staging TO service_role;

GRANT TRUNCATE ON TABLE public.businesses_staging TO service_role;

GRANT UPDATE ON TABLE public.businesses_staging TO service_role;

GRANT DELETE ON TABLE public.categories TO service_role;

GRANT INSERT ON TABLE public.categories TO service_role;

GRANT REFERENCES ON TABLE public.categories TO service_role;

GRANT SELECT ON TABLE public.categories TO service_role;

GRANT TRIGGER ON TABLE public.categories TO service_role;

GRANT TRUNCATE ON TABLE public.categories TO service_role;

GRANT UPDATE ON TABLE public.categories TO service_role;

GRANT DELETE ON TABLE public.content TO service_role;

GRANT INSERT ON TABLE public.content TO service_role;

GRANT REFERENCES ON TABLE public.content TO service_role;

GRANT SELECT ON TABLE public.content TO service_role;

GRANT TRIGGER ON TABLE public.content TO service_role;

GRANT TRUNCATE ON TABLE public.content TO service_role;

GRANT UPDATE ON TABLE public.content TO service_role;

GRANT DELETE ON TABLE public.content_strategy_framework TO service_role;

GRANT INSERT ON TABLE public.content_strategy_framework TO service_role;

GRANT REFERENCES ON TABLE public.content_strategy_framework TO service_role;

GRANT SELECT ON TABLE public.content_strategy_framework TO service_role;

GRANT TRIGGER ON TABLE public.content_strategy_framework TO service_role;

GRANT TRUNCATE ON TABLE public.content_strategy_framework TO service_role;

GRANT UPDATE ON TABLE public.content_strategy_framework TO service_role;

GRANT DELETE ON TABLE public.courses TO service_role;

GRANT INSERT ON TABLE public.courses TO service_role;

GRANT REFERENCES ON TABLE public.courses TO service_role;

GRANT SELECT ON TABLE public.courses TO service_role;

GRANT TRIGGER ON TABLE public.courses TO service_role;

GRANT TRUNCATE ON TABLE public.courses TO service_role;

GRANT UPDATE ON TABLE public.courses TO service_role;

GRANT DELETE ON TABLE public.dev_tasks TO service_role;

GRANT INSERT ON TABLE public.dev_tasks TO service_role;

GRANT REFERENCES ON TABLE public.dev_tasks TO service_role;

GRANT SELECT ON TABLE public.dev_tasks TO service_role;

GRANT TRIGGER ON TABLE public.dev_tasks TO service_role;

GRANT TRUNCATE ON TABLE public.dev_tasks TO service_role;

GRANT UPDATE ON TABLE public.dev_tasks TO service_role;

GRANT DELETE ON TABLE public.event_config TO service_role;

GRANT INSERT ON TABLE public.event_config TO service_role;

GRANT REFERENCES ON TABLE public.event_config TO service_role;

GRANT SELECT ON TABLE public.event_config TO service_role;

GRANT TRIGGER ON TABLE public.event_config TO service_role;

GRANT TRUNCATE ON TABLE public.event_config TO service_role;

GRANT UPDATE ON TABLE public.event_config TO service_role;

GRANT DELETE ON TABLE public.events TO service_role;

GRANT INSERT ON TABLE public.events TO service_role;

GRANT REFERENCES ON TABLE public.events TO service_role;

GRANT SELECT ON TABLE public.events TO service_role;

GRANT TRIGGER ON TABLE public.events TO service_role;

GRANT TRUNCATE ON TABLE public.events TO service_role;

GRANT UPDATE ON TABLE public.events TO service_role;

GRANT DELETE ON TABLE public.execution_metrics TO service_role;

GRANT INSERT ON TABLE public.execution_metrics TO service_role;

GRANT REFERENCES ON TABLE public.execution_metrics TO service_role;

GRANT SELECT ON TABLE public.execution_metrics TO service_role;

GRANT TRIGGER ON TABLE public.execution_metrics TO service_role;

GRANT TRUNCATE ON TABLE public.execution_metrics TO service_role;

GRANT UPDATE ON TABLE public.execution_metrics TO service_role;

GRANT DELETE ON TABLE public.jobs TO service_role;

GRANT INSERT ON TABLE public.jobs TO service_role;

GRANT REFERENCES ON TABLE public.jobs TO service_role;

GRANT SELECT ON TABLE public.jobs TO service_role;

GRANT TRIGGER ON TABLE public.jobs TO service_role;

GRANT TRUNCATE ON TABLE public.jobs TO service_role;

GRANT UPDATE ON TABLE public.jobs TO service_role;

GRANT DELETE ON TABLE public.landing_page_templates TO service_role;

GRANT INSERT ON TABLE public.landing_page_templates TO service_role;

GRANT REFERENCES ON TABLE public.landing_page_templates TO service_role;

GRANT SELECT ON TABLE public.landing_page_templates TO service_role;

GRANT TRIGGER ON TABLE public.landing_page_templates TO service_role;

GRANT TRUNCATE ON TABLE public.landing_page_templates TO service_role;

GRANT UPDATE ON TABLE public.landing_page_templates TO service_role;

GRANT DELETE ON TABLE public.leads TO service_role;

GRANT INSERT ON TABLE public.leads TO service_role;

GRANT REFERENCES ON TABLE public.leads TO service_role;

GRANT SELECT ON TABLE public.leads TO service_role;

GRANT TRIGGER ON TABLE public.leads TO service_role;

GRANT TRUNCATE ON TABLE public.leads TO service_role;

GRANT UPDATE ON TABLE public.leads TO service_role;

GRANT DELETE ON TABLE public.learning_log TO service_role;

GRANT INSERT ON TABLE public.learning_log TO service_role;

GRANT REFERENCES ON TABLE public.learning_log TO service_role;

GRANT SELECT ON TABLE public.learning_log TO service_role;

GRANT TRIGGER ON TABLE public.learning_log TO service_role;

GRANT TRUNCATE ON TABLE public.learning_log TO service_role;

GRANT UPDATE ON TABLE public.learning_log TO service_role;

GRANT DELETE ON TABLE public.notifications TO service_role;

GRANT INSERT ON TABLE public.notifications TO service_role;

GRANT REFERENCES ON TABLE public.notifications TO service_role;

GRANT SELECT ON TABLE public.notifications TO service_role;

GRANT TRIGGER ON TABLE public.notifications TO service_role;

GRANT TRUNCATE ON TABLE public.notifications TO service_role;

GRANT UPDATE ON TABLE public.notifications TO service_role;

GRANT DELETE ON TABLE public.otp_codes TO service_role;

GRANT INSERT ON TABLE public.otp_codes TO service_role;

GRANT REFERENCES ON TABLE public.otp_codes TO service_role;

GRANT SELECT ON TABLE public.otp_codes TO service_role;

GRANT TRIGGER ON TABLE public.otp_codes TO service_role;

GRANT TRUNCATE ON TABLE public.otp_codes TO service_role;

GRANT UPDATE ON TABLE public.otp_codes TO service_role;

GRANT DELETE ON TABLE public.payments TO service_role;

GRANT INSERT ON TABLE public.payments TO service_role;

GRANT REFERENCES ON TABLE public.payments TO service_role;

GRANT SELECT ON TABLE public.payments TO service_role;

GRANT TRIGGER ON TABLE public.payments TO service_role;

GRANT TRUNCATE ON TABLE public.payments TO service_role;

GRANT UPDATE ON TABLE public.payments TO service_role;

GRANT DELETE ON TABLE public.profiles TO service_role;

GRANT INSERT ON TABLE public.profiles TO service_role;

GRANT REFERENCES ON TABLE public.profiles TO service_role;

GRANT SELECT ON TABLE public.profiles TO service_role;

GRANT TRIGGER ON TABLE public.profiles TO service_role;

GRANT TRUNCATE ON TABLE public.profiles TO service_role;

GRANT UPDATE ON TABLE public.profiles TO service_role;

GRANT DELETE ON TABLE public.provider_verifications TO service_role;

GRANT INSERT ON TABLE public.provider_verifications TO service_role;

GRANT REFERENCES ON TABLE public.provider_verifications TO service_role;

GRANT SELECT ON TABLE public.provider_verifications TO service_role;

GRANT TRIGGER ON TABLE public.provider_verifications TO service_role;

GRANT TRUNCATE ON TABLE public.provider_verifications TO service_role;

GRANT UPDATE ON TABLE public.provider_verifications TO service_role;

GRANT DELETE ON TABLE public.research_logs TO service_role;

GRANT INSERT ON TABLE public.research_logs TO service_role;

GRANT REFERENCES ON TABLE public.research_logs TO service_role;

GRANT SELECT ON TABLE public.research_logs TO service_role;

GRANT TRIGGER ON TABLE public.research_logs TO service_role;

GRANT TRUNCATE ON TABLE public.research_logs TO service_role;

GRANT UPDATE ON TABLE public.research_logs TO service_role;

GRANT DELETE ON TABLE public.reviews TO service_role;

GRANT INSERT ON TABLE public.reviews TO service_role;

GRANT REFERENCES ON TABLE public.reviews TO service_role;

GRANT SELECT ON TABLE public.reviews TO service_role;

GRANT TRIGGER ON TABLE public.reviews TO service_role;

GRANT TRUNCATE ON TABLE public.reviews TO service_role;

GRANT UPDATE ON TABLE public.reviews TO service_role;

GRANT DELETE ON TABLE public.service_providers TO service_role;

GRANT INSERT ON TABLE public.service_providers TO service_role;

GRANT REFERENCES ON TABLE public.service_providers TO service_role;

GRANT SELECT ON TABLE public.service_providers TO service_role;

GRANT TRIGGER ON TABLE public.service_providers TO service_role;

GRANT TRUNCATE ON TABLE public.service_providers TO service_role;

GRANT UPDATE ON TABLE public.service_providers TO service_role;

GRANT DELETE ON TABLE public.settings TO service_role;

GRANT INSERT ON TABLE public.settings TO service_role;

GRANT REFERENCES ON TABLE public.settings TO service_role;

GRANT SELECT ON TABLE public.settings TO service_role;

GRANT TRIGGER ON TABLE public.settings TO service_role;

GRANT TRUNCATE ON TABLE public.settings TO service_role;

GRANT UPDATE ON TABLE public.settings TO service_role;

GRANT DELETE ON TABLE public.subscriptions TO service_role;

GRANT INSERT ON TABLE public.subscriptions TO service_role;

GRANT REFERENCES ON TABLE public.subscriptions TO service_role;

GRANT SELECT ON TABLE public.subscriptions TO service_role;

GRANT TRIGGER ON TABLE public.subscriptions TO service_role;

GRANT TRUNCATE ON TABLE public.subscriptions TO service_role;

GRANT UPDATE ON TABLE public.subscriptions TO service_role;

GRANT DELETE ON TABLE public.task_queue TO service_role;

GRANT INSERT ON TABLE public.task_queue TO service_role;

GRANT REFERENCES ON TABLE public.task_queue TO service_role;

GRANT SELECT ON TABLE public.task_queue TO service_role;

GRANT TRIGGER ON TABLE public.task_queue TO service_role;

GRANT TRUNCATE ON TABLE public.task_queue TO service_role;

GRANT UPDATE ON TABLE public.task_queue TO service_role;

GRANT DELETE ON TABLE public.trades TO service_role;

GRANT INSERT ON TABLE public.trades TO service_role;

GRANT REFERENCES ON TABLE public.trades TO service_role;

GRANT SELECT ON TABLE public.trades TO service_role;

GRANT TRIGGER ON TABLE public.trades TO service_role;

GRANT TRUNCATE ON TABLE public.trades TO service_role;

GRANT UPDATE ON TABLE public.trades TO service_role;

GRANT DELETE ON TABLE public.whatsapp_templates TO service_role;

GRANT INSERT ON TABLE public.whatsapp_templates TO service_role;

GRANT REFERENCES ON TABLE public.whatsapp_templates TO service_role;

GRANT SELECT ON TABLE public.whatsapp_templates TO service_role;

GRANT TRIGGER ON TABLE public.whatsapp_templates TO service_role;

GRANT TRUNCATE ON TABLE public.whatsapp_templates TO service_role;

GRANT UPDATE ON TABLE public.whatsapp_templates TO service_role;
