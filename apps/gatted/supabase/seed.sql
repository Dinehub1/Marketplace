-- =====================================================================
-- GATTED — Seed data (development)
-- Creates 4 Supabase Auth users matching the in-app dev-login buttons
-- (guard/resident/manager/admin @test.com, password: test1234), their
-- profiles, a demo society with blocks + units, and role assignments.
-- Re-runnable: all inserts are idempotent.
-- =====================================================================

-- Fixed IDs so re-seeding is stable
-- admin    00000000-0000-0000-0000-000000000001
-- manager  00000000-0000-0000-0000-000000000002
-- guard    00000000-0000-0000-0000-000000000003
-- resident 00000000-0000-0000-0000-000000000004

-- ---------- Supabase Auth users (email + password) ----------
-- Note: token columns are set to '' (not NULL) — GoTrue's login query
-- fails with "Database error querying schema" if they are NULL.
insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change,
  email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token,
  created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin@test.com',    crypt('test1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dev Admin"}',    '', '', '', '', '', '', '', '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'manager@test.com',  crypt('test1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dev Manager"}',  '', '', '', '', '', '', '', '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'guard@test.com',    crypt('test1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dev Guard"}',    '', '', '', '', '', '', '', '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'resident@test.com', crypt('test1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dev Resident"}', '', '', '', '', '', '', '', '', now(), now())
on conflict (id) do nothing;

-- ---------- Auth identities (required for email login) ----------
insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '{"sub":"00000000-0000-0000-0000-000000000001","email":"admin@test.com"}',    'email', now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '{"sub":"00000000-0000-0000-0000-000000000002","email":"manager@test.com"}',  'email', now(), now()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '{"sub":"00000000-0000-0000-0000-000000000003","email":"guard@test.com"}',    'email', now(), now()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', '{"sub":"00000000-0000-0000-0000-000000000004","email":"resident@test.com"}', 'email', now(), now())
on conflict (provider_id, provider) do nothing;

-- ---------- Profiles (id matches auth.users.id) ----------
insert into profiles (id, phone, full_name, email) values
  ('00000000-0000-0000-0000-000000000001', '+919999000001', 'Dev Admin',    'admin@test.com'),
  ('00000000-0000-0000-0000-000000000002', '+919999000002', 'Dev Manager',  'manager@test.com'),
  ('00000000-0000-0000-0000-000000000003', '+919999000003', 'Dev Guard',    'guard@test.com'),
  ('00000000-0000-0000-0000-000000000004', '+919999000004', 'Dev Resident', 'resident@test.com')
on conflict (id) do nothing;

-- ---------- Demo society ----------
insert into societies (id, name, address, city, state, total_blocks, total_units) values
  ('10000000-0000-0000-0000-000000000001', 'Green Valley Residency', '12 MG Road', 'Bengaluru', 'Karnataka', 2, 4)
on conflict (id) do nothing;

-- ---------- Blocks ----------
insert into blocks (id, society_id, name, total_floors, total_units) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'A', 5, 2),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'B', 5, 2)
on conflict (id) do nothing;

-- ---------- Units ----------
insert into units (id, society_id, block_id, owner_id, unit_number, floor) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'A-101', 1),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', null, 'A-102', 1),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', null, 'B-201', 2),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', null, 'B-202', 2)
on conflict (id) do nothing;

-- ---------- Role assignments ----------
insert into user_roles (user_id, society_id, unit_id, role) values
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', null,                                   'admin'),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', null,                                   'manager'),
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', null,                                   'guard'),
  ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'resident')
on conflict (user_id, society_id, role) do nothing;

-- ---------- Resident family link ----------
insert into unit_residents (unit_id, user_id, resident_type, is_primary) values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'owner', true)
on conflict do nothing;
