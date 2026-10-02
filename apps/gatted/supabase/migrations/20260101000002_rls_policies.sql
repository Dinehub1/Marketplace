-- =====================================================================
-- GATTED — Row Level Security
-- Uses SECURITY DEFINER helpers (is_admin / user_in_society /
-- has_society_role) so policies never re-query user_roles directly,
-- avoiding the infinite-recursion class of bugs.
-- =====================================================================

alter table profiles           enable row level security;
alter table societies          enable row level security;
alter table blocks             enable row level security;
alter table units              enable row level security;
alter table user_roles         enable row level security;
alter table unit_residents     enable row level security;
alter table visitors           enable row level security;
alter table issues             enable row level security;
alter table issue_updates      enable row level security;
alter table announcements      enable row level security;
alter table announcement_reads enable row level security;
alter table parcels            enable row level security;
alter table notifications      enable row level security;
alter table push_tokens        enable row level security;
alter table guard_shifts       enable row level security;

-- ---------- profiles ----------
drop policy if exists profiles_public_read on profiles;
create policy profiles_public_read on profiles for select using (true);

drop policy if exists profiles_self_insert on profiles;
create policy profiles_self_insert on profiles for insert with check (id = auth.uid() or auth.uid() is null);

drop policy if exists profiles_self_update on profiles;
create policy profiles_self_update on profiles for update using (id = auth.uid() or is_admin());

-- ---------- societies ----------
drop policy if exists societies_read on societies;
create policy societies_read on societies for select using (true);

drop policy if exists societies_admin_manage on societies;
create policy societies_admin_manage on societies for all using (is_admin()) with check (is_admin());

-- ---------- blocks ----------
drop policy if exists blocks_read on blocks;
create policy blocks_read on blocks for select using (true);

drop policy if exists blocks_admin_manage on blocks;
create policy blocks_admin_manage on blocks for all
  using (is_admin() or has_society_role(society_id, array['manager']::user_role[]))
  with check (is_admin() or has_society_role(society_id, array['manager']::user_role[]));

-- ---------- units ----------
drop policy if exists units_read on units;
create policy units_read on units for select using (true);

drop policy if exists units_admin_manage on units;
create policy units_admin_manage on units for all
  using (is_admin() or has_society_role(society_id, array['manager']::user_role[]))
  with check (is_admin() or has_society_role(society_id, array['manager']::user_role[]));

-- ---------- user_roles ----------
drop policy if exists user_roles_self_read on user_roles;
create policy user_roles_self_read on user_roles for select
  using (user_id = auth.uid() or is_admin());

drop policy if exists user_roles_self_insert on user_roles;
create policy user_roles_self_insert on user_roles for insert
  with check (user_id = auth.uid() or is_admin());

drop policy if exists user_roles_admin_update on user_roles;
create policy user_roles_admin_update on user_roles for update
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

drop policy if exists user_roles_admin_delete on user_roles;
create policy user_roles_admin_delete on user_roles for delete using (is_admin());

-- ---------- unit_residents ----------
drop policy if exists unit_residents_self_read on unit_residents;
create policy unit_residents_self_read on unit_residents for select
  using (
    user_id = auth.uid()
    or exists (select 1 from units u where u.id = unit_residents.unit_id and user_in_society(u.society_id))
  );

drop policy if exists unit_residents_staff_manage on unit_residents;
create policy unit_residents_staff_manage on unit_residents for all
  using (
    is_admin()
    or exists (select 1 from units u where u.id = unit_residents.unit_id
               and has_society_role(u.society_id, array['manager']::user_role[]))
  )
  with check (
    is_admin()
    or user_id = auth.uid()
    or exists (select 1 from units u where u.id = unit_residents.unit_id
               and has_society_role(u.society_id, array['manager']::user_role[]))
  );

-- ---------- visitors ----------
drop policy if exists visitors_read on visitors;
create policy visitors_read on visitors for select
  using (
    host_id = auth.uid()
    or has_society_role(society_id, array['guard','manager','admin']::user_role[])
  );

drop policy if exists visitors_insert on visitors;
create policy visitors_insert on visitors for insert
  with check (
    host_id = auth.uid()
    or has_society_role(society_id, array['guard','manager','admin']::user_role[])
  );

drop policy if exists visitors_update on visitors;
create policy visitors_update on visitors for update
  using (
    host_id = auth.uid()
    or has_society_role(society_id, array['guard','manager','admin']::user_role[])
  )
  with check (
    host_id = auth.uid()
    or has_society_role(society_id, array['guard','manager','admin']::user_role[])
  );

drop policy if exists visitors_delete on visitors;
create policy visitors_delete on visitors for delete using (host_id = auth.uid() or is_admin());

-- ---------- issues ----------
drop policy if exists issues_read on issues;
create policy issues_read on issues for select
  using (reported_by = auth.uid() or user_in_society(society_id));

drop policy if exists issues_insert on issues;
create policy issues_insert on issues for insert
  with check (reported_by = auth.uid() and user_in_society(society_id));

drop policy if exists issues_staff_update on issues;
create policy issues_staff_update on issues for update
  using (is_admin() or has_society_role(society_id, array['manager']::user_role[]))
  with check (is_admin() or has_society_role(society_id, array['manager']::user_role[]));

-- ---------- issue_updates ----------
drop policy if exists issue_updates_read on issue_updates;
create policy issue_updates_read on issue_updates for select
  using (exists (select 1 from issues i where i.id = issue_updates.issue_id
                 and (i.reported_by = auth.uid() or user_in_society(i.society_id))));

drop policy if exists issue_updates_insert on issue_updates;
create policy issue_updates_insert on issue_updates for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from issues i where i.id = issue_updates.issue_id and user_in_society(i.society_id))
  );

-- ---------- announcements ----------
drop policy if exists announcements_read on announcements;
create policy announcements_read on announcements for select using (user_in_society(society_id));

drop policy if exists announcements_staff_insert on announcements;
create policy announcements_staff_insert on announcements for insert
  with check (has_society_role(society_id, array['guard','manager','admin']::user_role[]));

drop policy if exists announcements_staff_update on announcements;
create policy announcements_staff_update on announcements for update
  using (has_society_role(society_id, array['manager','admin']::user_role[]))
  with check (has_society_role(society_id, array['manager','admin']::user_role[]));

drop policy if exists announcements_staff_delete on announcements;
create policy announcements_staff_delete on announcements for delete
  using (has_society_role(society_id, array['manager','admin']::user_role[]));

-- ---------- announcement_reads ----------
drop policy if exists announcement_reads_self on announcement_reads;
create policy announcement_reads_self on announcement_reads for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- parcels ----------
drop policy if exists parcels_read on parcels;
create policy parcels_read on parcels for select
  using (
    resident_id = auth.uid()
    or exists (select 1 from units u where u.id = parcels.unit_id and u.owner_id = auth.uid())
    or has_society_role(society_id, array['guard','manager','admin']::user_role[])
  );

drop policy if exists parcels_staff_insert on parcels;
create policy parcels_staff_insert on parcels for insert
  with check (has_society_role(society_id, array['guard','manager','admin']::user_role[]) and status = 'received');

drop policy if exists parcels_staff_update on parcels;
create policy parcels_staff_update on parcels for update
  using (has_society_role(society_id, array['guard','manager','admin']::user_role[]))
  with check (has_society_role(society_id, array['guard','manager','admin']::user_role[]));

-- ---------- notifications ----------
drop policy if exists notifications_select_own on notifications;
create policy notifications_select_own on notifications for select using (user_id = auth.uid());

drop policy if exists notifications_update_own on notifications;
create policy notifications_update_own on notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists notifications_delete_own on notifications;
create policy notifications_delete_own on notifications for delete using (user_id = auth.uid());

drop policy if exists notifications_insert on notifications;
create policy notifications_insert on notifications for insert
  with check (
    user_id = auth.uid()
    or exists (select 1 from user_roles
               where user_id = auth.uid() and role in ('guard','manager','admin') and is_active)
  );

-- ---------- push_tokens ----------
drop policy if exists push_tokens_self on push_tokens;
create policy push_tokens_self on push_tokens for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- guard_shifts ----------
drop policy if exists guard_shifts_read on guard_shifts;
create policy guard_shifts_read on guard_shifts for select
  using (has_society_role(society_id, array['guard','manager','admin']::user_role[]));

drop policy if exists guard_shifts_guard_insert on guard_shifts;
create policy guard_shifts_guard_insert on guard_shifts for insert
  with check (guard_id = auth.uid() and has_society_role(society_id, array['guard','manager','admin']::user_role[]));

drop policy if exists guard_shifts_update on guard_shifts;
create policy guard_shifts_update on guard_shifts for update
  using (guard_id = auth.uid() or has_society_role(society_id, array['manager','admin']::user_role[]))
  with check (guard_id = auth.uid() or has_society_role(society_id, array['manager','admin']::user_role[]));
