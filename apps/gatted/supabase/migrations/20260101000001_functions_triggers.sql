-- =====================================================================
-- GATTED — Functions & Triggers
-- =====================================================================

-- ---------- updated_at maintenance ----------
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Auth helpers (SECURITY DEFINER → bypass RLS, no recursion) ----------
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid() and role = 'admin' and is_active
  );
$$;

create or replace function public.user_in_society(soc uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid() and society_id = soc and is_active
  );
$$;

create or replace function public.has_society_role(soc uuid, roles user_role[])
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid()
      and society_id = soc
      and role = any(roles)
      and is_active
  );
$$;

-- Current user's roles/societies (documented helper)
create or replace function public.get_user_context()
returns table (role user_role, society_id uuid, unit_id uuid)
language sql security definer stable set search_path = public as $$
  select role, society_id, unit_id
  from user_roles
  where user_id = auth.uid() and is_active;
$$;

-- ---------- Visitor OTP auto-generation ----------
create or replace function public.generate_visitor_otp()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.otp is null then
    new.otp := lpad((floor(random() * 1000000))::int::text, 6, '0');
    new.otp_expires_at := coalesce(new.otp_expires_at, now() + interval '24 hours');
  end if;
  return new;
end;
$$;

-- ---------- Notification triggers ----------
create or replace function public.notify_visitor_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into notifications (user_id, title, message, type, society_id, metadata)
    values (
      new.host_id,
      case new.status
        when 'checked-in'  then 'Visitor checked in'
        when 'checked-out' then 'Visitor checked out'
        when 'denied'      then 'Visitor denied'
        when 'approved'    then 'Visitor approved'
        else 'Visitor update'
      end,
      coalesce(new.visitor_name, 'A visitor') || ' is now ' || new.status,
      case new.status
        when 'checked-in'  then 'visitor_checkin'
        when 'checked-out' then 'visitor_checkout'
        when 'denied'      then 'visitor_denied'
        else 'system'
      end,
      new.society_id,
      jsonb_build_object('visitor_id', new.id, 'status', new.status)
    );
  end if;
  return new;
end;
$$;

create or replace function public.notify_issue_changes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.status is distinct from old.status) and new.reported_by is not null then
    insert into notifications (user_id, title, message, type, society_id, metadata)
    values (
      new.reported_by,
      'Issue updated',
      coalesce(new.title, 'Your issue') || ' is now ' || new.status,
      'issue_update',
      new.society_id,
      jsonb_build_object('issue_id', new.id, 'status', new.status)
    );
  end if;
  return new;
end;
$$;

create or replace function public.notify_parcel_received()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target_user uuid;
begin
  target_user := coalesce(new.resident_id, (select owner_id from units where id = new.unit_id));
  if target_user is not null then
    insert into notifications (user_id, title, message, type, society_id, metadata)
    values (
      target_user,
      'Parcel received',
      'A parcel' || coalesce(' from ' || new.courier_name, '') || ' is waiting at the gate',
      'parcel_received',
      new.society_id,
      jsonb_build_object('parcel_id', new.id)
    );
  end if;
  return new;
end;
$$;

-- ---------- Visitor check-in / check-out RPCs ----------
create or replace function public.checkin_visitor(
  visitor_uuid uuid,
  guard_uuid uuid,
  otp_code text default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v visitors%rowtype;
begin
  select * into v from visitors where id = visitor_uuid;
  if not found then
    return jsonb_build_object('success', false, 'message', 'Visitor not found');
  end if;

  if v.status = 'checked-in' then
    return jsonb_build_object('success', false, 'message', 'Visitor already checked in');
  end if;
  if v.status = 'checked-out' then
    return jsonb_build_object('success', false, 'message', 'Visitor already checked out');
  end if;
  if v.status = 'denied' then
    return jsonb_build_object('success', false, 'message', 'Visitor entry was denied');
  end if;

  if otp_code is not null and v.otp is not null and v.otp <> otp_code then
    return jsonb_build_object('success', false, 'message', 'Invalid OTP');
  end if;

  update visitors
     set status = 'checked-in',
         checked_in_at = now(),
         checked_in_by = guard_uuid,
         updated_at = now()
   where id = visitor_uuid;

  return jsonb_build_object('success', true, 'message', 'Visitor checked in', 'visitor_id', visitor_uuid);
end;
$$;

create or replace function public.checkout_visitor(
  visitor_uuid uuid,
  guard_uuid uuid
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v visitors%rowtype;
begin
  select * into v from visitors where id = visitor_uuid;
  if not found then
    return jsonb_build_object('success', false, 'message', 'Visitor not found');
  end if;
  if v.status <> 'checked-in' then
    return jsonb_build_object('success', false, 'message', 'Visitor is not checked in');
  end if;

  update visitors
     set status = 'checked-out',
         checked_out_at = now(),
         checked_out_by = guard_uuid,
         updated_at = now()
   where id = visitor_uuid;

  return jsonb_build_object('success', true, 'message', 'Visitor checked out', 'visitor_id', visitor_uuid);
end;
$$;

-- ---------- Maintenance ----------
create or replace function public.cleanup_expired_visitors()
returns void language plpgsql set search_path = public as $$
begin
  update visitors
     set status = 'denied',
         rejection_reason = coalesce(rejection_reason, 'Expired'),
         updated_at = now()
   where status in ('pending', 'approved')
     and valid_until is not null
     and valid_until < current_date;
end;
$$;

-- =====================================================================
-- Triggers
-- =====================================================================
drop trigger if exists update_profiles_updated_at on profiles;
create trigger update_profiles_updated_at before update on profiles
  for each row execute function update_updated_at_column();

drop trigger if exists update_societies_updated_at on societies;
create trigger update_societies_updated_at before update on societies
  for each row execute function update_updated_at_column();

drop trigger if exists update_blocks_updated_at on blocks;
create trigger update_blocks_updated_at before update on blocks
  for each row execute function update_updated_at_column();

drop trigger if exists update_units_updated_at on units;
create trigger update_units_updated_at before update on units
  for each row execute function update_updated_at_column();

drop trigger if exists update_user_roles_updated_at on user_roles;
create trigger update_user_roles_updated_at before update on user_roles
  for each row execute function update_updated_at_column();

drop trigger if exists generate_otp_on_insert on visitors;
create trigger generate_otp_on_insert before insert on visitors
  for each row execute function generate_visitor_otp();

drop trigger if exists update_visitors_updated_at on visitors;
create trigger update_visitors_updated_at before update on visitors
  for each row execute function update_updated_at_column();

drop trigger if exists visitor_status_notification on visitors;
create trigger visitor_status_notification after update on visitors
  for each row execute function notify_visitor_status_change();

drop trigger if exists update_issues_updated_at on issues;
create trigger update_issues_updated_at before update on issues
  for each row execute function update_updated_at_column();

drop trigger if exists issue_notification on issues;
create trigger issue_notification after update on issues
  for each row execute function notify_issue_changes();

drop trigger if exists update_announcements_updated_at on announcements;
create trigger update_announcements_updated_at before update on announcements
  for each row execute function update_updated_at_column();

drop trigger if exists update_parcels_updated_at on parcels;
create trigger update_parcels_updated_at before update on parcels
  for each row execute function update_updated_at_column();

drop trigger if exists parcel_notification on parcels;
create trigger parcel_notification after insert on parcels
  for each row execute function notify_parcel_received();

drop trigger if exists update_notifications_updated_at on notifications;
create trigger update_notifications_updated_at before update on notifications
  for each row execute function update_updated_at_column();

drop trigger if exists update_push_tokens_updated_at on push_tokens;
create trigger update_push_tokens_updated_at before update on push_tokens
  for each row execute function update_updated_at_column();
