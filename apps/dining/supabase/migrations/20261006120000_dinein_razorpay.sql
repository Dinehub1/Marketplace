-- Dine-in advance payments through Razorpay, and the guards that make them mean something.
--
-- Until now the app created the booking with an amount it chose, "paid" through a mock gateway,
-- and marked its own transaction 'success' with the public anon key, which every policy here
-- allowed. The dinein-checkout edge function now prices the booking from the offer row, creates
-- the Razorpay order and confirms the booking after verifying the payment, using the service role.
-- These guards stop the anon/authenticated roles from doing any of that themselves.
--
-- Deliberately not covered yet (step 2): the final-bill payment (restaurant_transactions rows with
-- a restaurant_payment_id) and the event tables, which still run their mock flows from the app.

-- 1. Where the Razorpay ids live.
alter table public.restaurant_transactions
  add column if not exists razorpay_order_id text unique,
  add column if not exists razorpay_payment_id text unique;

-- 2. Offers are read-only to the app. Nothing in the app writes them (updateOfferCurrentUses has
--    no callers), and an offer row is where the cover charge, i.e. the price, comes from.
drop policy if exists "Allow all operations on dinein_offers" on public.dinein_offers;
create policy "Offers are readable" on public.dinein_offers
  for select to anon, authenticated using (true);

-- 3. Bookings: the app may create and cancel, but never confirm, and never set what is owed.
create or replace function public.guard_restaurant_booking()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status is distinct from 'pending' or new.confirmed_at is not null then
      raise exception 'bookings are confirmed by the server' using errcode = '42501';
    end if;
    if coalesce(new.advance_payment, 0) > 0 then
      raise exception 'paid bookings are created by the dinein-checkout function' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    raise exception 'bookings are confirmed by the server' using errcode = '42501';
  end if;
  if new.advance_payment is distinct from old.advance_payment
     or new.total_cover_charge is distinct from old.total_cover_charge
     or new.cover_charge_per_person is distinct from old.cover_charge_per_person
     or new.confirmed_at is distinct from old.confirmed_at then
    raise exception 'booking amounts are set by the server' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_restaurant_booking on public.restaurant_booking;
create trigger guard_restaurant_booking
  before insert or update on public.restaurant_booking
  for each row execute function public.guard_restaurant_booking();

-- 4. Transactions: advance payments (purpose 'advance_payment' with no restaurant_payment_id) and
--    the Razorpay ids belong to the server alone.
create or replace function public.guard_restaurant_transaction()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return coalesce(new, old);
  end if;

  if tg_op in ('UPDATE', 'DELETE')
     and old.purpose = 'advance_payment' and old.restaurant_payment_id is null then
    raise exception 'advance payments are recorded by the server' using errcode = '42501';
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    if new.purpose = 'advance_payment' and new.restaurant_payment_id is null then
      raise exception 'advance payments are recorded by the server' using errcode = '42501';
    end if;
    if new.razorpay_order_id is not null or new.razorpay_payment_id is not null then
      raise exception 'Razorpay ids are recorded by the server' using errcode = '42501';
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists guard_restaurant_transaction on public.restaurant_transactions;
create trigger guard_restaurant_transaction
  before insert or update or delete on public.restaurant_transactions
  for each row execute function public.guard_restaurant_transaction();
