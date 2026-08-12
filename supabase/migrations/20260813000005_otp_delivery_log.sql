-- OTP delivery observability. The send route now logs the raw Nextel response
-- and persists delivery status + the raw response on each otp_codes row, so
-- failed WhatsApp deliveries are debuggable from the DB (and the dev logs).
-- otp_codes stays service-role only — do NOT grant anon/authenticated SELECT,
-- since it holds verification codes.
ALTER TABLE public.otp_codes
  ADD COLUMN IF NOT EXISTS delivered boolean,
  ADD COLUMN IF NOT EXISTS nextel_detail text;
