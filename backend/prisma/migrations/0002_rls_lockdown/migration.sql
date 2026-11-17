-- =============================================================================
-- CholoBhairab (চলো ভৈরব) — Migration 0002_rls_lockdown
-- Target: Supabase PostgreSQL 17 (Project: fmhbugcullfemxtevpxw)
-- Enables Row-Level Security (RLS) on every public table and revokes direct
-- PostgREST anon/authenticated access so tables are strictly backend-only.
-- =============================================================================

-- 1. Enable Row-Level Security on all 11 public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_kyc_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bkash_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bhairab_landmarks ENABLE ROW LEVEL SECURITY;

-- 2. Revoke direct table privileges from Supabase client roles (anon, authenticated)
-- The NestJS backend connects as postgres / service_role which bypasses RLS safely.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
  END IF;
END $$;
