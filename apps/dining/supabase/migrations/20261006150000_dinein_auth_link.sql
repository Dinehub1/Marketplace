-- Real sign-in for Swaad Ghar: Supabase Auth phone OTP, linked to the app's own users rows.
--
-- Until now the OTP was generated, stored and checked on the device (with a 123456 bypass), so the
-- server never knew who anyone was and no policy could say "your own rows". Sign-in now goes
-- through supabase.auth.signInWithOtp / verifyOtp (the code is delivered by the dinein-send-sms
-- hook over WhatsApp), and every session is a real auth.users identity. This links that identity
-- to the existing public.users row, which bookings and payments already reference by id.

alter table public.users
  add column if not exists auth_user_id uuid unique references auth.users (id) on delete set null;

-- Phone numbers in public.users were written by several app versions: +91XXXXXXXXXX,
-- +91-XXXXXXXXXX and bare 10-digit numbers all exist. Indian mobiles are compared on their last
-- ten digits, which is the part every one of those formats agrees on.
create or replace function public.phone_key(raw text)
returns text
language sql
immutable
as $$
  select nullif(right(regexp_replace(coalesce(raw, ''), '\D', '', 'g'), 10), '')
$$;

/**
 * Link the signed-in auth user to their public.users row, creating it on first sign-in.
 * Idempotent: called by the app after every verifyOtp. Only the caller's own row is touched.
 */
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

  update public.users
     set auth_user_id = uid, is_verified = true, updated_at = now()
   where public.phone_key(phone_number) = key and auth_user_id is null
  returning * into profile;
  if found then
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

/** The public.users id of the signed-in caller, or null. For row-level policies. */
create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.users where auth_user_id = auth.uid()
$$;

revoke all on function public.current_app_user_id() from public, anon;
grant execute on function public.current_app_user_id() to authenticated;
