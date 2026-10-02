-- =====================================================================
-- GATTED — Complete Initial Schema
-- Reconstructed from docs/database.md + application code (lib, hooks,
-- supabase/functions). Safe to run on a fresh Supabase project or the
-- local stack (`supabase db reset`).
--
-- Auth model: custom OTP (auth_otps + auth_sessions) is the production
-- path; dev login uses Supabase Auth. `profiles.id` is therefore a plain
-- PK (not hard-FK'd to auth.users) so the OTP edge function can create
-- profiles, while seeded dev users reuse their auth.users id so that
-- auth.uid()-based RLS works.
-- =====================================================================

-- ---------- Extensions ----------
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pgcrypto" with schema extensions;

-- ---------- Enums ----------
do $$ begin
  create type user_role as enum ('admin', 'manager', 'guard', 'resident', 'owner', 'tenant');
exception when duplicate_object then null; end $$;

do $$ begin
  create type visitor_status as enum ('pending', 'approved', 'checked-in', 'checked-out', 'denied');
exception when duplicate_object then null; end $$;

do $$ begin
  create type visitor_type as enum ('expected', 'walk-in', 'delivery', 'service', 'guest');
exception when duplicate_object then null; end $$;

do $$ begin
  create type issue_category as enum ('plumbing', 'electrical', 'cleaning', 'security', 'maintenance', 'parking', 'noise', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type issue_priority as enum ('low', 'medium', 'high', 'urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type issue_status as enum ('open', 'in-progress', 'resolved', 'closed', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type announcement_target as enum ('all', 'block', 'unit', 'role');
exception when duplicate_object then null; end $$;

-- =====================================================================
-- Core tables
-- =====================================================================

create table if not exists profiles (
  id          uuid primary key default gen_random_uuid(),
  phone       varchar not null unique,
  full_name   varchar,
  email       varchar,
  avatar_url  text,
  is_active   boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  constraint profiles_phone_format check (phone ~ '^\+[1-9]\d{1,14}$')
);
create index if not exists idx_profiles_phone on profiles (phone);

create table if not exists societies (
  id           uuid primary key default uuid_generate_v4(),
  name         varchar not null,
  address      text,
  city         varchar,
  state        varchar,
  zip_code     varchar,
  total_blocks int default 0,
  total_units  int default 0,
  settings     jsonb,
  logo_url     text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table if not exists blocks (
  id           uuid primary key default uuid_generate_v4(),
  society_id   uuid references societies (id) on delete cascade,
  name         varchar not null,
  manager_id   uuid references profiles (id) on delete set null,
  total_floors int,
  total_units  int,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  constraint blocks_society_name_unique unique (society_id, name)
);
create index if not exists idx_blocks_society on blocks (society_id);

create table if not exists units (
  id          uuid primary key default uuid_generate_v4(),
  society_id  uuid references societies (id) on delete cascade,
  block_id    uuid references blocks (id) on delete set null,
  owner_id    uuid references profiles (id) on delete set null,
  unit_number varchar not null,
  floor       int,
  area_sqft   numeric,
  unit_type   varchar,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  constraint units_society_block_number_unique unique (society_id, block_id, unit_number)
);
create index if not exists idx_units_block   on units (block_id);
create index if not exists idx_units_owner   on units (owner_id);
create index if not exists idx_units_society on units (society_id);

create table if not exists user_roles (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles (id) on delete cascade,
  society_id  uuid not null references societies (id) on delete cascade,
  unit_id     uuid references units (id) on delete set null,
  role        user_role not null,
  is_active   boolean default true,
  assigned_by uuid references profiles (id) on delete set null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  constraint user_roles_user_society_role_key unique (user_id, society_id, role)
);
create index if not exists idx_user_roles_society on user_roles (society_id);
create index if not exists idx_user_roles_user    on user_roles (user_id);

create table if not exists unit_residents (
  id            uuid primary key default uuid_generate_v4(),
  unit_id       uuid not null references units (id) on delete cascade,
  user_id       uuid not null references profiles (id) on delete cascade,
  resident_type varchar default 'family',
  is_primary    boolean default false,
  move_in_date  date default current_date,
  move_out_date date,
  created_at    timestamptz default now()
);
create index if not exists idx_unit_residents_unit on unit_residents (unit_id);
create index if not exists idx_unit_residents_user on unit_residents (user_id);

-- =====================================================================
-- Feature tables
-- =====================================================================

create table if not exists visitors (
  id                 uuid primary key default uuid_generate_v4(),
  society_id         uuid not null references societies (id) on delete cascade,
  unit_id            uuid references units (id) on delete set null,
  host_id            uuid not null references profiles (id) on delete cascade,
  visitor_name       varchar not null,
  visitor_phone      varchar,
  visitor_email      varchar,
  vehicle_number     varchar,
  visitor_type       visitor_type default 'expected',
  status             visitor_status not null default 'pending',
  expected_date      date,
  expected_time      time,
  purpose            text,
  otp                varchar(6),
  otp_expires_at     timestamptz,
  qr_code            text,
  checked_in_at      timestamptz,
  checked_out_at     timestamptz,
  checked_in_by      uuid references profiles (id) on delete set null,
  checked_out_by     uuid references profiles (id) on delete set null,
  check_in_photo_url text,
  is_recurring       boolean default false,
  recurrence_pattern varchar,
  recurring_type     varchar,
  valid_until        date,
  visitor_count      int default 1,
  rejection_reason   text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);
create index if not exists idx_visitors_society       on visitors (society_id);
create index if not exists idx_visitors_host          on visitors (host_id);
create index if not exists idx_visitors_unit          on visitors (unit_id);
create index if not exists idx_visitors_status        on visitors (status);
create index if not exists idx_visitors_expected_date on visitors (expected_date);
create index if not exists idx_visitors_society_date  on visitors (society_id, expected_date);

create table if not exists issues (
  id          uuid primary key default uuid_generate_v4(),
  society_id  uuid references societies (id) on delete cascade,
  unit_id     uuid references units (id) on delete set null,
  reported_by uuid references profiles (id) on delete set null,
  assigned_to uuid references profiles (id) on delete set null,
  title       varchar not null,
  description text,
  category    issue_category not null,
  priority    issue_priority not null default 'medium',
  status      issue_status not null default 'open',
  photos      text[],
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists idx_issues_society     on issues (society_id);
create index if not exists idx_issues_reported_by on issues (reported_by);
create index if not exists idx_issues_status      on issues (status);

create table if not exists issue_updates (
  id         uuid primary key default uuid_generate_v4(),
  issue_id   uuid not null references issues (id) on delete cascade,
  user_id    uuid not null references profiles (id) on delete cascade,
  comment    text,
  new_status issue_status,
  photos     text[],
  created_at timestamptz default now()
);
create index if not exists idx_issue_updates_issue on issue_updates (issue_id);

create table if not exists announcements (
  id              uuid primary key default uuid_generate_v4(),
  society_id      uuid references societies (id) on delete cascade,
  created_by      uuid references profiles (id) on delete set null,
  title           varchar not null,
  message         text not null,
  attachments     text[],
  target_type     announcement_target default 'all',
  target_block_id uuid references blocks (id) on delete set null,
  target_unit_id  uuid references units (id) on delete set null,
  priority        varchar default 'normal',
  is_active       boolean default true,
  expires_at      timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists idx_announcements_society        on announcements (society_id);
create index if not exists idx_announcements_active         on announcements (is_active);
create index if not exists idx_announcements_society_active on announcements (society_id, is_active);

create table if not exists announcement_reads (
  id              uuid primary key default uuid_generate_v4(),
  announcement_id uuid references announcements (id) on delete cascade,
  user_id         uuid references profiles (id) on delete cascade,
  read_at         timestamptz default now(),
  constraint announcement_reads_announcement_user_key unique (announcement_id, user_id)
);
create index if not exists idx_announcement_reads_announcement on announcement_reads (announcement_id);
create index if not exists idx_announcement_reads_user         on announcement_reads (user_id);

create table if not exists parcels (
  id              uuid primary key default gen_random_uuid(),
  society_id      uuid not null references societies (id) on delete cascade,
  unit_id         uuid not null references units (id) on delete cascade,
  resident_id     uuid references profiles (id) on delete set null,
  courier_name    varchar,
  tracking_number varchar,
  description     text,
  status          varchar not null default 'received' check (status in ('received', 'notified', 'collected')),
  received_by     uuid references profiles (id) on delete set null,
  collected_by    uuid references profiles (id) on delete set null,
  collected_at    timestamptz,
  photo_url       text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_parcels_society on parcels (society_id);
create index if not exists idx_parcels_unit    on parcels (unit_id);
create index if not exists idx_parcels_status  on parcels (status);

create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles (id) on delete cascade,
  title      text not null,
  message    text not null,
  type       text not null,
  read       boolean not null default false,
  metadata   jsonb default '{}'::jsonb,
  society_id uuid references societies (id) on delete cascade,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_notifications_user         on notifications (user_id);
create index if not exists idx_notifications_unread       on notifications (user_id) where read = false;
create index if not exists idx_notifications_society_user on notifications (society_id, user_id);

create table if not exists push_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles (id) on delete cascade,
  token      text not null,
  platform   text not null check (platform in ('ios', 'android', 'web')),
  is_active  boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint push_tokens_user_token_key unique (user_id, token)
);
create index if not exists idx_push_tokens_user on push_tokens (user_id);

create table if not exists guard_shifts (
  id             uuid primary key default uuid_generate_v4(),
  society_id     uuid references societies (id) on delete cascade,
  guard_id       uuid references profiles (id) on delete cascade,
  shift_start    timestamptz not null,
  shift_end      timestamptz,
  handover_notes text,
  handed_over_to uuid references profiles (id) on delete set null,
  created_at     timestamptz default now()
);
create index if not exists idx_guard_shifts_society on guard_shifts (society_id);
create index if not exists idx_guard_shifts_guard   on guard_shifts (guard_id);
create index if not exists idx_guard_shifts_active  on guard_shifts (guard_id, society_id) where shift_end is null;

-- =====================================================================
-- Custom auth tables (OTP-based authentication)
-- =====================================================================

create table if not exists auth_otps (
  id         uuid primary key default gen_random_uuid(),
  phone      varchar not null unique,
  otp_code   varchar(6) not null,
  verified   boolean default false,
  created_at timestamptz default now(),
  expires_at timestamptz not null
);
create index if not exists idx_auth_otps_phone on auth_otps (phone);

create table if not exists auth_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles (id) on delete cascade,
  token        text not null unique,
  device_info  jsonb,
  expires_at   timestamptz not null,
  created_at   timestamptz default now(),
  last_used_at timestamptz default now()
);
create index if not exists idx_auth_sessions_token on auth_sessions (token);
create index if not exists idx_auth_sessions_user  on auth_sessions (user_id);
