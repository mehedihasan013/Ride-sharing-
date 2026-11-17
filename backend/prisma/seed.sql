-- =============================================================================
-- CholoBhairab (চলো ভৈরব) — Idempotent Production/Demo Seed Script (seed.sql)
-- Target: Supabase PostgreSQL 17 (Project: fmhbugcullfemxtevpxw)
-- Seeds:
--   1. All 6 Bhairab Landmarks
--   2. Demo Passengers & 6 Demo Users/Drivers
--   3. 6 Vehicles (EASYBIKE, CNG, BIKE, CAR_MICROBUS)
--   4. 6 Tiered KYC Applications (3 APPROVED, 3 PENDING_VERIFICATION)
--   5. 6 Driver Wallets (193.00, 340.00, 125.00, 35.00 locked out, 850.00, 210.00 BDT)
--   6. Initial Wallet Transactions (PROMOTIONAL_BONUS, BKASH_TOPUP, COMMISSION_DEDUCTION -7.00 BDT)
--   7. 2 Initial Rides (ride_seed_live_1 in BIDDING with 2 ride_bids, ride_seed_completed_1 in COMPLETED)
-- =============================================================================

-- 1. Seed 6 Bhairab Landmarks
INSERT INTO public.bhairab_landmarks (
  id, english_name, bangla_name, category, latitude, longitude, description_bangla, popular_modes
) VALUES
  (
    'bhairab-rail-station',
    'Bhairab Bazar Railway Junction',
    'ভৈরব বাজার রেলওয়ে জংশন',
    'transit_hub',
    24.0487,
    90.9852,
    'ভৈরব এর প্রধান ট্রেন স্টেশন, ঢাকা-চট্টগ্রাম-সিলেট রেলওয়ে সংযোগ',
    ARRAY['EASYBIKE', 'CNG', 'BIKE']::public."VehicleType"[]
  ),
  (
    'meghna-bridge-point',
    'Syed Nazrul Islam Bridge (Meghna Bridge)',
    'সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ গোলচত্বর)',
    'bridge',
    24.0418,
    91.0022,
    'আশুগঞ্জ ও সিলেট হাইওয়ে প্রবেশদ্বার',
    ARRAY['CNG', 'BIKE', 'CAR_MICROBUS']::public."VehicleType"[]
  ),
  (
    'bhairab-bus-stand',
    'Bhairab Central Bus Stand (Kachari Mor)',
    'ভৈরব বাস টার্মিনাল (কাচারি মোড়)',
    'transit_hub',
    24.0535,
    90.9811,
    'ঢাকা-কিশোরগঞ্জ বাস এবং মাইক্রোবাস কাউন্টার',
    ARRAY['EASYBIKE', 'CNG', 'CAR_MICROBUS']::public."VehicleType"[]
  ),
  (
    'bhairab-bazar-ghat',
    'Bhairab Bazar Old River Ghat',
    'ভৈরব বাজার পুরাতন নদী ঘাট',
    'commercial',
    24.0425,
    90.9840,
    'মেঘনা নদী তীরবর্তী প্রধান পাইকারি বাজার ও ট্রলার ঘাট',
    ARRAY['EASYBIKE', 'CNG']::public."VehicleType"[]
  ),
  (
    'chandiber-mor',
    'Chandiber Mor & Upazila Hospital',
    'চণ্ডীবের মোড় (উপজেলা স্বাস্থ্য কমপ্লেক্স)',
    'hospital',
    24.0620,
    90.9785,
    'ভৈরব ৫০ শয্যা বিশিষ্ট হাসপাতাল ও আবাসিক এলাকা',
    ARRAY['EASYBIKE', 'CNG', 'BIKE']::public."VehicleType"[]
  ),
  (
    'shimulkandi-mor',
    'Shimulkandi Mor',
    'শিমুলকান্দি মোড়',
    'residential',
    24.0750,
    90.9650,
    'ভৈরব-কুলিয়ারচর আঞ্চলিক সড়ক সংযোগ',
    ARRAY['CNG', 'EASYBIKE', 'BIKE']::public."VehicleType"[]
  )
ON CONFLICT (id) DO UPDATE SET
  english_name       = EXCLUDED.english_name,
  bangla_name        = EXCLUDED.bangla_name,
  category           = EXCLUDED.category,
  latitude           = EXCLUDED.latitude,
  longitude          = EXCLUDED.longitude,
  description_bangla = EXCLUDED.description_bangla,
  popular_modes      = EXCLUDED.popular_modes;

-- 2. Seed Demo Passengers & 6 Demo Driver Users
INSERT INTO public.users (
  id, phone_number, full_name, role, emergency_contact, updated_at
) VALUES
  ('passenger_demo_1', '01700000001', 'আব্দুল করিম (Karim)', 'PASSENGER', '01711998811', NOW()),
  ('passenger_demo_0', '01712345670', 'মাহমুদুল হাসান (Mahmud)', 'PASSENGER', '01712345679', NOW()),
  ('user_driver_1', '01811223301', 'মোঃ রফিকুল ইসলাম (Md. Rafiqul Islam)', 'DRIVER', '01811223399', NOW()),
  ('user_driver_2', '01711223302', 'কামাল হোসেন (Kamal Hossain)', 'DRIVER', '01711223399', NOW()),
  ('user_driver_3', '01911223303', 'জাহিদ হাসান (Jahidul Hasan)', 'DRIVER', '01911223399', NOW()),
  ('user_driver_4', '01611223304', 'আনোয়ার মিয়া (Anwar Mia)', 'DRIVER', '01611223399', NOW()),
  ('user_driver_5', '01711223305', 'সোহেল রানা (Sohel Rana)', 'DRIVER', '01711223398', NOW()),
  ('user_driver_6', '01811223306', 'শফিকুল আলম (Shafiqul Alam)', 'DRIVER', '01811223398', NOW())
ON CONFLICT (id) DO UPDATE SET
  phone_number      = EXCLUDED.phone_number,
  full_name         = EXCLUDED.full_name,
  role              = EXCLUDED.role,
  emergency_contact = EXCLUDED.emergency_contact,
  updated_at        = NOW();

-- 3. Seed 6 Demo Drivers
INSERT INTO public.drivers (
  id, user_id, nid_number, brta_license_no, union_councilor_cert_url,
  status, rating_avg, total_trips, current_lat, current_lng, last_location_update, updated_at
) VALUES
  (
    'driver_demo_1', 'user_driver_1', '19884811120001',
    'প্রযোজ্য নয় (পৌরসভা লাইসেন্স)',
    'ভৈরব পৌরসভা ওয়ার্ড নং ০৪ প্রত্যয়নপত্র #২০২৬-১০৪',
    'APPROVED', 4.9, 142, 24.0487, 90.9852, NOW(), NOW()
  ),
  (
    'driver_demo_2', 'user_driver_2', '19904811120045',
    'DK-0492817-CNG',
    'ভৈরব পৌরসভা ওয়ার্ড নং ০৭ প্রত্যয়নপত্র #২০২৬-২০৯',
    'APPROVED', 4.8, 98, 24.0418, 91.0022, NOW(), NOW()
  ),
  (
    'driver_demo_3', 'user_driver_3', '19964811120089',
    'DL-9981234-MTR',
    'চণ্ডীবের ইউনিয়ন পরিষদ প্রত্যয়নপত্র #২০২৬-০৫৫',
    'PENDING_VERIFICATION', 4.9, 64, 24.0535, 90.9811, NOW(), NOW()
  ),
  (
    'driver_demo_4', 'user_driver_4', '19854811120033',
    'প্রযোজ্য নয় (পৌরসভা লাইসেন্স)',
    'ভৈরব পৌরসভা ওয়ার্ড নং ০২ প্রত্যয়নপত্র #২০২৬-৩১২',
    'PENDING_VERIFICATION', 4.6, 37, 24.0425, 90.9840, NOW(), NOW()
  ),
  (
    'driver_demo_5', 'user_driver_5', '19834811120077',
    'DL-4410982-PRO',
    'ভৈরব পৌরসভা ওয়ার্ড নং ০১ প্রত্যয়নপত্র #২০২৬-০১৯',
    'APPROVED', 5.0, 215, 24.0620, 90.9785, NOW(), NOW()
  ),
  (
    'driver_demo_6', 'user_driver_6', '19924811120061',
    'DK-0774129-CNG',
    'শিমুলকান্দি ইউনিয়ন পরিষদ প্রত্যয়নপত্র #২০২৬-৪০১',
    'PENDING_VERIFICATION', 4.7, 53, 24.0750, 90.9650, NOW(), NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  status               = EXCLUDED.status,
  rating_avg           = EXCLUDED.rating_avg,
  total_trips          = EXCLUDED.total_trips,
  current_lat          = EXCLUDED.current_lat,
  current_lng          = EXCLUDED.current_lng,
  last_location_update = NOW(),
  updated_at           = NOW();

-- 4. Seed 6 Vehicles
INSERT INTO public.vehicles (
  id, driver_id, type, registration_number, model_name, color, capacity, updated_at
) VALUES
  ('veh_demo_1', 'driver_demo_1', 'EASYBIKE', 'ভৈরব-পৌর-টমটম-০১১২', 'ভৈরব ইজিবাইক (টমটম) #১২', 'লাল-হলুদ (Red/Yellow)', 6, NOW()),
  ('veh_demo_2', 'driver_demo_2', 'CNG', 'কিশোরগঞ্জ-থ-১১-৪৫৮২', 'বাজাজ সিএনজি অটোরিকশা (সবুজ)', 'সবুজ (Green)', 3, NOW()),
  ('veh_demo_3', 'driver_demo_3', 'BIKE', 'ঢাকা-মেট্রো-ল-৪২-৮৮১৯', 'বাজাজ পালসার ১৫০ সিসি', 'কালো-নীল (Black/Blue)', 1, NOW()),
  ('veh_demo_4', 'driver_demo_4', 'EASYBIKE', 'ভৈরব-পৌর-টমটম-০২০৮', 'বোরাক ইজিবাইক ভৈরব #০৮', 'নীল (Blue)', 6, NOW()),
  ('veh_demo_5', 'driver_demo_5', 'CAR_MICROBUS', 'ঢাকা-মেট্রো-চ-১৯-৩৩০৪', 'টয়োটা নোয়াহ হাইয়েস (ঢাকা-ভৈরব ইন্টারসিটি)', 'সাদা (Pearl White)', 10, NOW()),
  ('veh_demo_6', 'driver_demo_6', 'CNG', 'কিশোরগঞ্জ-থ-১১-৬০১২', 'টিভিএস কিং সিএনজি ২০০ সিসি', 'সবুজ (Green)', 3, NOW())
ON CONFLICT (id) DO UPDATE SET
  type                = EXCLUDED.type,
  registration_number = EXCLUDED.registration_number,
  model_name          = EXCLUDED.model_name,
  color               = EXCLUDED.color,
  capacity            = EXCLUDED.capacity,
  updated_at          = NOW();

-- 5. Seed 6 Tiered KYC Applications (3 APPROVED, 3 PENDING_VERIFICATION)
INSERT INTO public.driver_kyc_applications (
  id, driver_id, full_name, phone_number, nid_number, vehicle_type,
  vehicle_model, registration_number, brta_license_no, union_councilor_cert,
  ward_no, status, note, submitted_at, updated_at
) VALUES
  (
    'kyc_1',
    'driver_demo_1',
    'মোঃ রফিকুল ইসলাম (Md. Rafiqul Islam)',
    '01811223301',
    '19884811120001',
    'EASYBIKE',
    'ভৈরব ইজিবাইক (টমটম) #১২',
    'ভৈরব-পৌর-টমটম-০১১২',
    'প্রযোজ্য নয় (পৌরসভা লাইসেন্স)',
    'ভৈরব পৌরসভা ওয়ার্ড নং ০৪ প্রত্যয়নপত্র #২০২৬-১০৪',
    'ওয়ার্ড নং ০৪ (ভৈরব বাজার)',
    'APPROVED',
    'পৌরসভা টোকেন ও এনআইডি যাচাইকৃত',
    NOW() - INTERVAL '5 days',
    NOW()
  ),
  (
    'kyc_2',
    'driver_demo_2',
    'কামাল হোসেন (Kamal Hossain)',
    '01711223302',
    '19904811120045',
    'CNG',
    'বাজাজ সিএনজি অটোরিকশা (সবুজ)',
    'কিশোরগঞ্জ-থ-১১-৪৫৮২',
    'DK-0492817-CNG',
    'ভৈরব পৌরসভা ওয়ার্ড নং ০৭ প্রত্যয়নপত্র #২০২৬-২০৯',
    'ওয়ার্ড নং ০৭ (কমলপুর)',
    'APPROVED',
    'বিআরটিএ এবং ওয়ার্ড কাউন্সিলর সনদ যাচাইকৃত',
    NOW() - INTERVAL '4 days',
    NOW()
  ),
  (
    'kyc_3',
    'driver_demo_3',
    'জাহিদ হাসান (Jahidul Hasan)',
    '01911223303',
    '19964811120089',
    'BIKE',
    'বাজাজ পালসার ১৫০ সিসি',
    'ঢাকা-মেট্রো-ল-৪২-৮৮১৯',
    'DL-9981234-MTR',
    'চণ্ডীবের ইউনিয়ন পরিষদ প্রত্যয়নপত্র #২০২৬-০৫৫',
    'ওয়ার্ড নং ০৯ (চণ্ডীবের)',
    'PENDING_VERIFICATION',
    NULL,
    NOW() - INTERVAL '8 hours',
    NOW()
  ),
  (
    'kyc_4',
    'driver_demo_4',
    'আনোয়ার মিয়া (Anwar Mia)',
    '01611223304',
    '19854811120033',
    'EASYBIKE',
    'বোরাক ইজিবাইক ভৈরব #০৮',
    'ভৈরব-পৌর-টমটম-০২০৮',
    'প্রযোজ্য নয় (পৌরসভা লাইসেন্স)',
    'ভৈরব পৌরসভা ওয়ার্ড নং ০২ প্রত্যয়নপত্র #২০২৬-৩১২',
    'ওয়ার্ড নং ০২ (পুরাতন নদী ঘাট)',
    'PENDING_VERIFICATION',
    NULL,
    NOW() - INTERVAL '5 hours',
    NOW()
  ),
  (
    'kyc_5',
    'driver_demo_5',
    'সোহেল রানা (Sohel Rana)',
    '01711223305',
    '19834811120077',
    'CAR_MICROBUS',
    'টয়োটা নোয়াহ হাইয়েস (ঢাকা-ভৈরব ইন্টারসিটি)',
    'ঢাকা-মেট্রো-চ-১৯-৩৩০৪',
    'DL-4410982-PRO',
    'ভৈরব পৌরসভা ওয়ার্ড নং ০১ প্রত্যয়নপত্র #২০২৬-০১৯',
    'ওয়ার্ড নং ০১ (কাচারি মোড়)',
    'APPROVED',
    'ঢাকা-সিলেট হাইওয়ে রুট পারমিট ও বিআরটিএ যাচাইকৃত',
    NOW() - INTERVAL '7 days',
    NOW()
  ),
  (
    'kyc_6',
    'driver_demo_6',
    'শফিকুল আলম (Shafiqul Alam)',
    '01811223306',
    '19924811120061',
    'CNG',
    'টিভিএস কিং সিএনজি ২০০ সিসি',
    'কিশোরগঞ্জ-থ-১১-৬০১২',
    'DK-0774129-CNG',
    'শিমুলকান্দি ইউনিয়ন পরিষদ প্রত্যয়নপত্র #২০২৬-৪০১',
    'শিমুলকান্দি ইউনিয়ন (ওয়ার্ড ০৩)',
    'PENDING_VERIFICATION',
    NULL,
    NOW() - INTERVAL '2 hours',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  status     = EXCLUDED.status,
  note       = EXCLUDED.note,
  updated_at = NOW();

-- 6. Seed 6 Driver Wallets
INSERT INTO public.driver_wallets (
  id, driver_id, current_balance, locked_balance, last_topup_at, updated_at
) VALUES
  ('wallet_driver_1', 'driver_demo_1', 193.00, 0.00, NOW() - INTERVAL '4 hours', NOW()),
  ('wallet_driver_2', 'driver_demo_2', 340.00, 0.00, NOW() - INTERVAL '2 hours', NOW()),
  ('wallet_driver_3', 'driver_demo_3', 125.00, 0.00, NOW() - INTERVAL '6 hours', NOW()),
  ('wallet_driver_4', 'driver_demo_4', 35.00,  0.00, NOW() - INTERVAL '24 hours', NOW()),
  ('wallet_driver_5', 'driver_demo_5', 850.00, 0.00, NOW() - INTERVAL '1 hour', NOW()),
  ('wallet_driver_6', 'driver_demo_6', 210.00, 0.00, NOW() - INTERVAL '5 hours', NOW())
ON CONFLICT (id) DO UPDATE SET
  current_balance = EXCLUDED.current_balance,
  locked_balance  = EXCLUDED.locked_balance,
  last_topup_at   = EXCLUDED.last_topup_at,
  updated_at      = NOW();

-- 7. Seed Initial Wallet Transactions
INSERT INTO public.wallet_transactions (
  id, wallet_id, driver_id, type, amount, balance_after, reference_ride_id, gateway_trx_id, note, created_at
) VALUES
  (
    'tx_seed_bonus_1',
    'wallet_driver_1',
    'driver_demo_1',
    'PROMOTIONAL_BONUS',
    200.00,
    200.00,
    NULL,
    NULL,
    'চলো ভৈরব উদ্বোধনী স্বাগতম বোনাস',
    NOW() - INTERVAL '5 hours'
  ),
  (
    'tx_seed_bkash_2',
    'wallet_driver_2',
    'driver_demo_2',
    'BKASH_TOPUP',
    300.00,
    340.00,
    NULL,
    'BKH982341VA',
    'বিকাশ ওয়ালেট রিচার্জ: ৩০০ টাকা',
    NOW() - INTERVAL '2 hours'
  ),
  (
    'tx_seed_bonus_3',
    'wallet_driver_3',
    'driver_demo_3',
    'PROMOTIONAL_BONUS',
    125.00,
    125.00,
    NULL,
    NULL,
    'চলো ভৈরব স্বাগতম বোনাস',
    NOW() - INTERVAL '6 hours'
  ),
  (
    'tx_seed_bkash_5',
    'wallet_driver_5',
    'driver_demo_5',
    'BKASH_TOPUP',
    500.00,
    850.00,
    NULL,
    'BKH774129KL',
    'বিকাশ ওয়ালেট রিচার্জ: ৫০০ টাকা (ইন্টারসিটি ফ্লিট)',
    NOW() - INTERVAL '90 minutes'
  ),
  (
    'tx_seed_comm_1',
    'wallet_driver_1',
    'driver_demo_1',
    'COMMISSION_DEDUCTION',
    -7.00,
    193.00,
    'ride_seed_completed_1',
    NULL,
    'ট্রিপ কমিশন কর্তন (৮%): ৭ টাকা (ভাড়া ৯০ টাকা)',
    NOW() - INTERVAL '30 minutes'
  )
ON CONFLICT (id) DO UPDATE SET
  amount        = EXCLUDED.amount,
  balance_after = EXCLUDED.balance_after,
  note          = EXCLUDED.note;

-- 8. Seed 2 Initial Rides (1 COMPLETED, 1 Active BIDDING)
INSERT INTO public.rides (
  id, passenger_id, driver_id, vehicle_type,
  pickup_lat, pickup_lng, pickup_address,
  dropoff_lat, dropoff_lng, dropoff_address,
  initial_offer_fare, final_agreed_fare,
  platform_commission_percent, platform_commission_amount,
  audio_prompt_bangla, status, payment_method, is_cash_collected,
  live_tracking_token, is_sos_triggered, created_at, updated_at
) VALUES
  (
    'ride_seed_completed_1',
    'passenger_demo_0',
    'driver_demo_1',
    'EASYBIKE',
    24.0535, 90.9811, 'ভৈরব বাস টার্মিনাল (কাচারি মোড়)',
    24.0425, 90.9840, 'ভৈরব বাজার পুরাতন নদী ঘাট',
    80.00, 90.00,
    8.00, 7.00,
    'নতুন ট্রিপ রিকোয়েস্ট: ভৈরব বাস টার্মিনাল (কাচারি মোড়) থেকে ভৈরব বাজার পুরাতন নদী ঘাট, প্রস্তাবিত ভাড়া ৮০ টাকা',
    'COMPLETED', 'CASH', TRUE,
    'track_bhairab_comp_01', FALSE,
    NOW() - INTERVAL '35 minutes', NOW()
  ),
  (
    'ride_seed_live_1',
    'passenger_demo_1',
    NULL,
    'CNG',
    24.0487, 90.9852, 'ভৈরব বাজার রেলওয়ে জংশন',
    24.0418, 91.0022, 'সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ গোলচত্বর)',
    80.00, NULL,
    8.00, NULL,
    'নতুন ট্রিপ রিকোয়েস্ট: ভৈরব বাজার রেলওয়ে জংশন থেকে সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ গোলচত্বর), প্রস্তাবিত ভাড়া ৮০ টাকা',
    'BIDDING', 'CASH', FALSE,
    'track_bhairab_live_01', FALSE,
    NOW() - INTERVAL '1 minute', NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  status                     = EXCLUDED.status,
  final_agreed_fare          = EXCLUDED.final_agreed_fare,
  platform_commission_amount = EXCLUDED.platform_commission_amount,
  updated_at                 = NOW();

-- 9. Seed Ride Bids for Completed & Active Bidding Rides
INSERT INTO public.ride_bids (
  id, ride_id, driver_id, bid_amount, eta_minutes, status, created_at
) VALUES
  (
    'bid_seed_comp_1',
    'ride_seed_completed_1',
    'driver_demo_1',
    90.00,
    2,
    'ACCEPTED',
    NOW() - INTERVAL '32 minutes'
  ),
  (
    'bid_seed_live_1',
    'ride_seed_live_1',
    'driver_demo_2',
    90.00,
    3,
    'PENDING',
    NOW() - INTERVAL '45 seconds'
  ),
  (
    'bid_seed_live_2',
    'ride_seed_live_1',
    'driver_demo_6',
    85.00,
    4,
    'PENDING',
    NOW() - INTERVAL '20 seconds'
  )
ON CONFLICT (id) DO UPDATE SET
  bid_amount  = EXCLUDED.bid_amount,
  eta_minutes = EXCLUDED.eta_minutes,
  status      = EXCLUDED.status;
