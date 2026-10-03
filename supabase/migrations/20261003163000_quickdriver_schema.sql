-- ==============================================================================
-- QuickDriver Schema Migration
-- Project: Marketplace Core (xpfmqpmhmcouwzebfwhb)
-- Tables: qd_profiles, qd_drivers, qd_trips, qd_trip_videos
-- ==============================================================================

-- 1. User Profiles for QuickDriver (Role routing: customer, driver, admin)
CREATE TABLE IF NOT EXISTS public.qd_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text NOT NULL UNIQUE,
  full_name text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'driver', 'admin')),
  avatar_url text,
  wallet_balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.qd_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'qd_profiles' AND policyname = 'qd_profiles_select'
  ) THEN
    CREATE POLICY qd_profiles_select ON public.qd_profiles
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'qd_profiles' AND policyname = 'qd_profiles_insert_own'
  ) THEN
    CREATE POLICY qd_profiles_insert_own ON public.qd_profiles
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'qd_profiles' AND policyname = 'qd_profiles_update_own'
  ) THEN
    CREATE POLICY qd_profiles_update_own ON public.qd_profiles
      FOR UPDATE TO authenticated USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'qd_profiles' AND policyname = 'qd_profiles_service'
  ) THEN
    CREATE POLICY qd_profiles_service ON public.qd_profiles
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. Drivers Registry & Realtime Location
CREATE TABLE IF NOT EXISTS public.qd_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name text NOT NULL,
  phone text NOT NULL,
  rating numeric NOT NULL DEFAULT 4.9,
  total_rides integer NOT NULL DEFAULT 0,
  is_online boolean NOT NULL DEFAULT false,
  kyc_status text NOT NULL DEFAULT 'approved' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
  car_preference text NOT NULL DEFAULT 'all',
  current_lat numeric,
  current_lng numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qd_drivers_user ON public.qd_drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_qd_drivers_online ON public.qd_drivers(is_online);

ALTER TABLE public.qd_drivers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'qd_drivers' AND policyname = 'qd_drivers_select'
  ) THEN
    CREATE POLICY qd_drivers_select ON public.qd_drivers
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'qd_drivers' AND policyname = 'qd_drivers_manage_own'
  ) THEN
    CREATE POLICY qd_drivers_manage_own ON public.qd_drivers
      FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'qd_drivers' AND policyname = 'qd_drivers_service'
  ) THEN
    CREATE POLICY qd_drivers_service ON public.qd_drivers
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. Trips Engine (Booking, Status Machine, OTP, Video Verifications)
CREATE TABLE IF NOT EXISTS public.qd_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES public.qd_drivers(id) ON DELETE SET NULL,
  service text NOT NULL CHECK (service IN ('instant', 'hourly', 'daily', 'outstation', 'corporate')),
  service_title text NOT NULL,
  pickup text NOT NULL,
  pickup_lat numeric,
  pickup_lng numeric,
  drop_location text NOT NULL,
  drop_lat numeric,
  drop_lng numeric,
  fare_total numeric NOT NULL,
  fare_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'finding' CHECK (status IN ('finding', 'assigned', 'arrived', 'ongoing', 'completed', 'cancelled')),
  otp text NOT NULL DEFAULT '1234',
  video_before_url text,
  video_after_url text,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  tip numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qd_trips_customer ON public.qd_trips(customer_id);
CREATE INDEX IF NOT EXISTS idx_qd_trips_driver ON public.qd_trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_qd_trips_status ON public.qd_trips(status);

ALTER TABLE public.qd_trips ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'qd_trips' AND policyname = 'qd_trips_select_customer'
  ) THEN
    CREATE POLICY qd_trips_select_customer ON public.qd_trips
      FOR SELECT TO authenticated USING (auth.uid() = customer_id OR auth.uid() IN (SELECT user_id FROM public.qd_drivers WHERE id = driver_id) OR status = 'finding');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'qd_trips' AND policyname = 'qd_trips_insert_customer'
  ) THEN
    CREATE POLICY qd_trips_insert_customer ON public.qd_trips
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'qd_trips' AND policyname = 'qd_trips_update_parties'
  ) THEN
    CREATE POLICY qd_trips_update_parties ON public.qd_trips
      FOR UPDATE TO authenticated USING (
        auth.uid() = customer_id OR
        auth.uid() IN (SELECT user_id FROM public.qd_drivers WHERE id = driver_id) OR
        status = 'finding'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'qd_trips' AND policyname = 'qd_trips_service'
  ) THEN
    CREATE POLICY qd_trips_service ON public.qd_trips
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 4. 30-Second Pre/Post Vehicle Inspection Video Registry
CREATE TABLE IF NOT EXISTS public.qd_trip_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES public.qd_trips(id) ON DELETE CASCADE NOT NULL,
  driver_id uuid REFERENCES public.qd_drivers(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('before', 'after')),
  video_url text NOT NULL,
  duration_sec integer NOT NULL DEFAULT 30,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qd_videos_trip ON public.qd_trip_videos(trip_id);

ALTER TABLE public.qd_trip_videos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'qd_trip_videos' AND policyname = 'qd_videos_select'
  ) THEN
    CREATE POLICY qd_videos_select ON public.qd_trip_videos
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'qd_trip_videos' AND policyname = 'qd_videos_insert'
  ) THEN
    CREATE POLICY qd_videos_insert ON public.qd_trip_videos
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'qd_trip_videos' AND policyname = 'qd_videos_service'
  ) THEN
    CREATE POLICY qd_videos_service ON public.qd_trip_videos
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Enable Realtime publication for live dispatches and ride tracking
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.qd_trips;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.qd_drivers;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
