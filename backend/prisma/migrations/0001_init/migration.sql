-- =============================================================================
-- CholoBhairab (চলো ভৈরব) — Migration 0001_init
-- Target: Supabase PostgreSQL 17 (Project: fmhbugcullfemxtevpxw)
-- 100% Idempotent DDL for Enums, Tables, Constraints, Foreign Keys & Indexes
-- =============================================================================

-- 1. Create Enums Idempotently
DO $$ BEGIN
  CREATE TYPE public."Role" AS ENUM ('PASSENGER', 'DRIVER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public."VehicleType" AS ENUM ('BIKE', 'CNG', 'EASYBIKE', 'CAR_MICROBUS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public."DriverStatus" AS ENUM (
    'PENDING_VERIFICATION',
    'APPROVED',
    'SUSPENDED',
    'ONLINE',
    'OFFLINE',
    'ON_TRIP'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public."RideStatus" AS ENUM (
    'SEARCHING',
    'BIDDING',
    'ACCEPTED',
    'ARRIVING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public."BidStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public."PaymentMethod" AS ENUM ('CASH', 'BKASH', 'NAGAD');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public."TransactionType" AS ENUM (
    'PROMOTIONAL_BONUS',
    'BONUS',
    'BKASH_TOPUP',
    'NAGAD_TOPUP',
    'COMMISSION_DEDUCTION',
    'PENALTY'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public."BkashPaymentStatus" AS ENUM (
    'INITIATED',
    'COMPLETED',
    'CANCELLED',
    'FAILED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public."BkashMode" AS ENUM ('MOCK', 'SANDBOX');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create Tables Idempotently

-- 2.1 public.users
CREATE TABLE IF NOT EXISTS public.users (
  id                TEXT PRIMARY KEY,
  phone_number      TEXT NOT NULL UNIQUE,
  full_name         TEXT NOT NULL,
  role              public."Role" NOT NULL DEFAULT 'PASSENGER',
  emergency_contact TEXT,
  profile_photo_url TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 public.drivers
CREATE TABLE IF NOT EXISTS public.drivers (
  id                       TEXT PRIMARY KEY,
  user_id                  TEXT NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  nid_number               TEXT NOT NULL UNIQUE,
  nid_front_url            TEXT,
  nid_back_url             TEXT,
  brta_license_no          TEXT,
  union_councilor_cert_url TEXT,
  status                   public."DriverStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
  rating_avg               DOUBLE PRECISION NOT NULL DEFAULT 5.0,
  total_trips              INTEGER NOT NULL DEFAULT 0,
  current_lat              DOUBLE PRECISION,
  current_lng              DOUBLE PRECISION,
  last_location_update     TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 public.vehicles
CREATE TABLE IF NOT EXISTS public.vehicles (
  id                  TEXT PRIMARY KEY,
  driver_id           TEXT NOT NULL UNIQUE REFERENCES public.drivers(id) ON DELETE CASCADE,
  type                public."VehicleType" NOT NULL,
  registration_number TEXT,
  model_name          TEXT NOT NULL,
  color               TEXT NOT NULL,
  capacity            INTEGER NOT NULL DEFAULT 1,
  vehicle_photo_url   TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 public.driver_kyc_applications
CREATE TABLE IF NOT EXISTS public.driver_kyc_applications (
  id                   TEXT PRIMARY KEY,
  driver_id            TEXT NOT NULL UNIQUE REFERENCES public.drivers(id) ON DELETE CASCADE,
  full_name            TEXT NOT NULL,
  phone_number         TEXT NOT NULL,
  nid_number           TEXT NOT NULL,
  vehicle_type         public."VehicleType" NOT NULL,
  vehicle_model        TEXT NOT NULL,
  registration_number  TEXT NOT NULL,
  brta_license_no      TEXT NOT NULL,
  union_councilor_cert TEXT NOT NULL,
  ward_no              TEXT NOT NULL,
  status               public."DriverStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
  note                 TEXT,
  submitted_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 public.driver_wallets
CREATE TABLE IF NOT EXISTS public.driver_wallets (
  id              TEXT PRIMARY KEY,
  driver_id       TEXT NOT NULL UNIQUE REFERENCES public.drivers(id) ON DELETE CASCADE,
  current_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  locked_balance  NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  last_topup_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 public.wallet_transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id                TEXT PRIMARY KEY,
  wallet_id         TEXT NOT NULL REFERENCES public.driver_wallets(id) ON DELETE CASCADE,
  driver_id         TEXT,
  type              public."TransactionType" NOT NULL,
  amount            NUMERIC(10, 2) NOT NULL,
  balance_after     NUMERIC(10, 2) NOT NULL,
  reference_ride_id TEXT,
  gateway_trx_id    TEXT UNIQUE,
  note              TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.7 public.bkash_payments
CREATE TABLE IF NOT EXISTS public.bkash_payments (
  id              TEXT PRIMARY KEY,
  payment_id      TEXT NOT NULL UNIQUE,
  driver_id       TEXT NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  amount_bdt      NUMERIC(10, 2) NOT NULL,
  invoice_number  TEXT NOT NULL UNIQUE,
  status          public."BkashPaymentStatus" NOT NULL DEFAULT 'INITIATED',
  mode            public."BkashMode" NOT NULL DEFAULT 'MOCK',
  payer_reference TEXT,
  trx_id          TEXT UNIQUE,
  bkash_url       TEXT,
  customer_msisdn TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

-- 2.8 public.rides
CREATE TABLE IF NOT EXISTS public.rides (
  id                          TEXT PRIMARY KEY,
  passenger_id                TEXT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  driver_id                   TEXT REFERENCES public.drivers(id) ON DELETE SET NULL,
  vehicle_type                public."VehicleType" NOT NULL,
  pickup_lat                  DOUBLE PRECISION NOT NULL,
  pickup_lng                  DOUBLE PRECISION NOT NULL,
  pickup_address              TEXT NOT NULL,
  dropoff_lat                 DOUBLE PRECISION NOT NULL,
  dropoff_lng                 DOUBLE PRECISION NOT NULL,
  dropoff_address             TEXT NOT NULL,
  initial_offer_fare          NUMERIC(10, 2) NOT NULL,
  final_agreed_fare           NUMERIC(10, 2),
  platform_commission_percent NUMERIC(5, 2) NOT NULL DEFAULT 8.00,
  platform_commission_amount  NUMERIC(10, 2),
  audio_prompt_bangla         TEXT,
  status                      public."RideStatus" NOT NULL DEFAULT 'SEARCHING',
  payment_method              public."PaymentMethod" NOT NULL DEFAULT 'CASH',
  is_cash_collected           BOOLEAN NOT NULL DEFAULT FALSE,
  live_tracking_token         TEXT NOT NULL UNIQUE,
  is_sos_triggered            BOOLEAN NOT NULL DEFAULT FALSE,
  is_intercity                BOOLEAN NOT NULL DEFAULT FALSE,
  scheduled_departure         TIMESTAMPTZ,
  booked_seats                INTEGER NOT NULL DEFAULT 1,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.9 public.ride_bids
CREATE TABLE IF NOT EXISTS public.ride_bids (
  id          TEXT PRIMARY KEY,
  ride_id     TEXT NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  driver_id   TEXT NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  bid_amount  NUMERIC(10, 2) NOT NULL,
  eta_minutes INTEGER NOT NULL DEFAULT 5,
  status      public."BidStatus" NOT NULL DEFAULT 'PENDING',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.10 public.sos_events
CREATE TABLE IF NOT EXISTS public.sos_events (
  id           TEXT PRIMARY KEY,
  ride_id      TEXT NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  triggered_by TEXT NOT NULL DEFAULT 'PASSENGER',
  resolved     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ
);

-- 2.11 public.bhairab_landmarks
CREATE TABLE IF NOT EXISTS public.bhairab_landmarks (
  id                 TEXT PRIMARY KEY,
  english_name       TEXT NOT NULL,
  bangla_name        TEXT NOT NULL,
  category           TEXT NOT NULL,
  latitude           DOUBLE PRECISION NOT NULL,
  longitude          DOUBLE PRECISION NOT NULL,
  description_bangla TEXT,
  popular_modes      public."VehicleType"[] NOT NULL DEFAULT ARRAY[]::public."VehicleType"[],
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Indexes Idempotently
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_location ON public.drivers(current_lat, current_lng);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON public.vehicles(type);
CREATE INDEX IF NOT EXISTS idx_driver_kyc_status ON public.driver_kyc_applications(status);
CREATE INDEX IF NOT EXISTS idx_driver_kyc_vehicle_type ON public.driver_kyc_applications(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_driver_wallets_balance ON public.driver_wallets(current_balance);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_created ON public.wallet_transactions(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON public.wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_ride ON public.wallet_transactions(reference_ride_id);
CREATE INDEX IF NOT EXISTS idx_bkash_payments_driver_created ON public.bkash_payments(driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bkash_payments_status ON public.bkash_payments(status);
CREATE INDEX IF NOT EXISTS idx_rides_status_created ON public.rides(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rides_passenger ON public.rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON public.rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_ride_bids_ride_status ON public.ride_bids(ride_id, status);
CREATE INDEX IF NOT EXISTS idx_ride_bids_driver ON public.ride_bids(driver_id);
CREATE INDEX IF NOT EXISTS idx_sos_events_ride_resolved ON public.sos_events(ride_id, resolved);
CREATE INDEX IF NOT EXISTS idx_bhairab_landmarks_category ON public.bhairab_landmarks(category);
