-- link_my_profile linked every users row sharing the caller's number, which fails on the unique
-- auth_user_id when the same person was stored twice (e.g. as +91XXXXXXXXXX and +91-XXXXXXXXXX;
-- two people on 2026-10-06). Link exactly one: the row holding the most table bookings, then the
-- most recently updated. The duplicates themselves are left in place for a deliberate merge.
create or replace function public.link_my_profile()
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  auth_phone text;
  key text;
  target uuid;
  profile public.users;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  select * into profile from public.users where auth_user_id = uid;
  if found then
    return profile;
  end if;

  select phone into auth_phone from auth.users where id = uid;
  key := public.phone_key(auth_phone);
  if key is null or length(key) <> 10 then
    raise exception 'this account has no phone number' using errcode = '22023';
  end if;

  select u.id into target
    from public.users u
   where public.phone_key(u.phone_number) = key and u.auth_user_id is null
   order by (select count(*) from public.restaurant_booking b where b.user_id = u.id) desc,
            u.updated_at desc nulls last
   limit 1
   for update;

  if target is not null then
    update public.users
       set auth_user_id = uid, is_verified = true, updated_at = now()
     where id = target
    returning * into profile;
    return profile;
  end if;

  insert into public.users (phone_number, full_name, is_verified, role, is_active, auth_user_id)
  values ('+91' || key, 'User ' || right(key, 4), true, 'user', true, uid)
  returning * into profile;
  return profile;
end;
$$;

revoke all on function public.link_my_profile() from public, anon;
grant execute on function public.link_my_profile() to authenticated;
