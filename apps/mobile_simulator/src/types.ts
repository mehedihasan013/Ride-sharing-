export type VehicleType = 'EASYBIKE' | 'BIKE' | 'CNG' | 'CAR_MICROBUS';

export interface BhairabLandmark {
  id: string;
  englishName: string;
  banglaName: string;
  category: 'transit_hub' | 'bridge' | 'commercial' | 'hospital' | 'residential';
  latitude: number;
  longitude: number;
  descriptionBangla: string;
}

export const BHAIRAB_LANDMARKS: BhairabLandmark[] = [
  {
    id: 'bhairab-rail-station',
    englishName: 'Bhairab Bazar Railway Junction',
    banglaName: 'ভৈরব বাজার রেলওয়ে জংশন',
    category: 'transit_hub',
    latitude: 24.0487,
    longitude: 90.9852,
    descriptionBangla: 'ভৈরব এর প্রধান ট্রেন স্টেশন, ঢাকা-চট্টগ্রাম-সিলেট রেলওয়ে সংযোগ',
  },
  {
    id: 'meghna-bridge-point',
    englishName: 'Syed Nazrul Islam Bridge (Meghna Bridge)',
    banglaName: 'সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ গোলচত্বর)',
    category: 'bridge',
    latitude: 24.0418,
    longitude: 91.0022,
    descriptionBangla: 'আশুগঞ্জ ও সিলেট হাইওয়ে প্রবেশদ্বার',
  },
  {
    id: 'bhairab-bus-stand',
    englishName: 'Bhairab Central Bus Stand (Kachari Mor)',
    banglaName: 'ভৈরব বাস টার্মিনাল (কাচারি মোড়)',
    category: 'transit_hub',
    latitude: 24.0535,
    longitude: 90.9811,
    descriptionBangla: 'ঢাকা-কিশোরগঞ্জ বাস এবং মাইক্রোবাস কাউন্টার',
  },
  {
    id: 'bhairab-bazar-ghat',
    englishName: 'Bhairab Bazar Old River Ghat',
    banglaName: 'ভৈরব বাজার পুরাতন নদী ঘাট',
    category: 'commercial',
    latitude: 24.0425,
    longitude: 90.9840,
    descriptionBangla: 'মেঘনা নদী তীরবর্তী প্রধান পাইকারি বাজার ও ট্রলার ঘাট',
  },
  {
    id: 'chandiber-mor',
    englishName: 'Chandiber Mor & Upazila Hospital',
    banglaName: 'চণ্ডীবের মোড় (উপজেলা স্বাস্থ্য কমপ্লেক্স)',
    category: 'hospital',
    latitude: 24.0620,
    longitude: 90.9785,
    descriptionBangla: 'ভৈরব ৫০ শয্যা বিশিষ্ট হাসপাতাল ও আবাসিক এলাকা',
  },
  {
    id: 'shimulkandi-mor',
    englishName: 'Shimulkandi Mor',
    banglaName: 'শিমুলকান্দি মোড়',
    category: 'residential',
    latitude: 24.0750,
    longitude: 90.9650,
    descriptionBangla: 'ভৈরব-কুলিয়ারচর আঞ্চলিক সড়ক সংযোগ',
  },
];

export interface VehicleOptionMeta {
  type: VehicleType;
  banglaLabel: string;
  englishLabel: string;
  seats: string;
  dotClass: string; // vehicle identity token class
}

export const VEHICLE_OPTIONS: VehicleOptionMeta[] = [
  {
    type: 'EASYBIKE',
    banglaLabel: 'ইজিবাইক',
    englishLabel: 'Easy-Bike (Tomtom)',
    seats: '৪-৬ আসন',
    dotClass: 'bg-easybike',
  },
  {
    type: 'BIKE',
    banglaLabel: 'বাইক',
    englishLabel: 'Motorbike',
    seats: '১ আসন',
    dotClass: 'bg-bike',
  },
  {
    type: 'CNG',
    banglaLabel: 'সিএনজি',
    englishLabel: 'CNG Auto',
    seats: '৩ আসন',
    dotClass: 'bg-cng',
  },
  {
    type: 'CAR_MICROBUS',
    banglaLabel: 'মাইক্রোবাস',
    englishLabel: 'Microbus / Noah',
    seats: '৭-১০ আসন',
    dotClass: 'bg-microbus',
  },
];

export interface DriverPersona {
  driverId: string;
  driverName: string;
  englishName: string;
  driverPhone: string;
  vehicleType: VehicleType;
  vehicleModel: string;
  registrationNumber: string;
  nidNumber: string;
  wardCertNumber: string;
  brtaLicenseNo: string;
  rating: number;
  landmarkId: string;
  lat: number;
  lng: number;
  walletBalance: number;
  kycStatus: 'APPROVED' | 'PENDING_VERIFICATION';
}

export const DRIVER_PERSONAS: DriverPersona[] = [
  {
    driverId: 'driver_demo_1',
    driverName: 'মোঃ রফিকুল ইসলাম',
    englishName: 'Md. Rafiqul Islam',
    driverPhone: '01811223301',
    vehicleType: 'EASYBIKE',
    vehicleModel: 'ভৈরব ইজিবাইক (টমটম) #১২',
    registrationNumber: 'ভৈরব-পৌর-টমটম-০১১২',
    nidNumber: '19884811120001',
    wardCertNumber: 'ভৈরব পৌরসভা ওয়ার্ড নং ০৪ প্রত্যয়নপত্র #২০২৬-১০৪',
    brtaLicenseNo: 'প্রযোজ্য নয় (পৌরসভা লাইসেন্স)',
    rating: 4.9,
    landmarkId: 'bhairab-rail-station',
    lat: 24.0487,
    lng: 90.9852,
    walletBalance: 193.0,
    kycStatus: 'APPROVED',
  },
  {
    driverId: 'driver_demo_4',
    driverName: 'আনোয়ার মিয়া',
    englishName: 'Anwar Mia (Low Balance Lockout)',
    driverPhone: '01611223304',
    vehicleType: 'EASYBIKE',
    vehicleModel: 'বোরাক ইজিবাইক ভৈরব #০৮',
    registrationNumber: 'ভৈরব-পৌর-টমটম-০২০৮',
    nidNumber: '19854811120033',
    wardCertNumber: 'ভৈরব পৌরসভা ওয়ার্ড নং ০২ প্রত্যয়নপত্র #২০২৬-৩১২',
    brtaLicenseNo: 'প্রযোজ্য নয় (পৌরসভা লাইসেন্স)',
    rating: 4.6,
    landmarkId: 'bhairab-bazar-ghat',
    lat: 24.0425,
    lng: 90.9840,
    walletBalance: 35.0,
    kycStatus: 'PENDING_VERIFICATION',
  },
];

export interface BaseFareEstimate {
  vehicleType: VehicleType;
  distanceKm: number;
  estimatedMinutes: number;
  suggestedFareBdt: number;
  minimumFareBdt: number;
}

export interface IncomingBid {
  bidId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  ratingAvg: number;
  vehicleModel: string;
  bidAmount: number;
  etaMinutes: number;
  timestamp: number;
}

export interface ActiveRideSession {
  rideId: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  vehicleType: VehicleType;
  pickupLandmark: BhairabLandmark;
  dropoffLandmark: BhairabLandmark;
  initialOfferFare: number;
  agreedFare?: number;
  status: 'IDLE' | 'SEARCHING' | 'BIDDING' | 'ACCEPTED' | 'COMPLETED';
  bids: IncomingBid[];
  assignedDriver?: {
    driverId: string;
    driverName: string;
    driverPhone: string;
    vehicleModel: string;
    etaMinutes: number;
    rating: number;
  };
  driverLat: number;
  driverLng: number;
  liveTrackingToken: string;
  audioPromptBangla: string;
  sosActive: boolean;
  commissionDeductedBdt?: number;
}

export interface WalletTransaction {
  id: string;
  driverId: string;
  driverName?: string;
  type: 'BKASH_TOPUP' | 'NAGAD_TOPUP' | 'COMMISSION_DEDUCTION' | 'PROMOTIONAL_BONUS';
  amount: number;
  balanceAfter: number;
  referenceRideId?: string;
  gatewayTrxId?: string;
  noteBangla: string;
  createdAt: string;
}

export interface IntercityCorridorRoute {
  id: string;
  corridorNameBangla: string;
  corridorNameEnglish: string;
  pickupHubBangla: string;
  destinationBangla: string;
  distanceKm: number;
  durationText: string;
  departureSchedule: string[];
  seatFareBdt: number;
  fullMicrobusFareBdt: number;
  availableSeats: number;
}

export const INTERCITY_CORRIDORS: IntercityCorridorRoute[] = [
  {
    id: 'bhairab-dhaka-airport',
    corridorNameBangla: 'ভৈরব → ঢাকা (উত্তরা / এয়ারপোর্ট / মহাখালী)',
    corridorNameEnglish: 'Bhairab → Dhaka Highway Express',
    pickupHubBangla: 'ভৈরব দুর্জয় মোড় / বাস টার্মিনাল',
    destinationBangla: 'ঢাকা এয়ারপোর্ট / কুড়িল বিশ্বরোড',
    distanceKm: 85,
    durationText: '২ ঘণ্টা ১০ মিনিট',
    departureSchedule: ['সকাল ৭:৩০', 'সকাল ১০:০০', 'দুপুর ২:৩০', 'বিকাল ৫:০০', 'রাত ৮:৩০'],
    seatFareBdt: 300,
    fullMicrobusFareBdt: 2400,
    availableSeats: 4,
  },
  {
    id: 'bhairab-kishoreganj-sadar',
    corridorNameBangla: 'ভৈরব → কিশোরগঞ্জ সদর (গাইটাল / গুরুদয়াল কলেজ)',
    corridorNameEnglish: 'Bhairab → Kishoreganj District HQ',
    pickupHubBangla: 'ভৈরব বাস টার্মিনাল (কাচারি মোড়)',
    destinationBangla: 'কিশোরগঞ্জ সদর হাসপাতাল / স্টেশন রোড',
    distanceKm: 56,
    durationText: '১ ঘণ্টা ২৫ মিনিট',
    departureSchedule: ['সকাল ৮:০০', 'সকাল ১১:৩০', 'বিকাল ৩:৩০', 'সন্ধ্যা ৬:৩০'],
    seatFareBdt: 220,
    fullMicrobusFareBdt: 1800,
    availableSeats: 3,
  },
  {
    id: 'bhairab-brahmanbaria-sylhet',
    corridorNameBangla: 'ভৈরব → আশুগঞ্জ / ব্রাহ্মণবাড়িয়া বিশ্বরোড',
    corridorNameEnglish: 'Bhairab → Ashuganj / Brahmanbaria Corridor',
    pickupHubBangla: 'সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ গোলচত্বর)',
    destinationBangla: 'ব্রাহ্মণবাড়িয়া বিশ্বরোড মোড় / সদর',
    distanceKm: 24,
    durationText: '৩৫ মিনিট',
    departureSchedule: ['প্রতি ৩০ মিনিট পর পর', 'সকাল ৭:০০ - রাত ১০:০০'],
    seatFareBdt: 150,
    fullMicrobusFareBdt: 1200,
    availableSeats: 6,
  },
];

export function calculateHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export function calculateLocalSuggestedFares(
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number,
): BaseFareEstimate[] {
  const distanceKm = Math.max(0.8, calculateHaversineKm(pickupLat, pickupLng, dropoffLat, dropoffLng));
  const estimatedMinutes = Math.round(distanceKm * 3.5);

  return [
    {
      vehicleType: 'EASYBIKE',
      distanceKm,
      estimatedMinutes,
      minimumFareBdt: 20,
      suggestedFareBdt: Math.round(Math.max(20, 15 + distanceKm * 18)),
    },
    {
      vehicleType: 'BIKE',
      distanceKm,
      estimatedMinutes: Math.round(distanceKm * 2.5),
      minimumFareBdt: 30,
      suggestedFareBdt: Math.round(Math.max(30, 25 + distanceKm * 22)),
    },
    {
      vehicleType: 'CNG',
      distanceKm,
      estimatedMinutes,
      minimumFareBdt: 40,
      suggestedFareBdt: Math.round(Math.max(40, 35 + distanceKm * 30)),
    },
    {
      vehicleType: 'CAR_MICROBUS',
      distanceKm,
      estimatedMinutes,
      minimumFareBdt: 250,
      suggestedFareBdt: Math.round(Math.max(250, 200 + distanceKm * 50)),
    },
  ];
}

export function playNotificationChime(muted: boolean) {
  if (muted || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.setValueAtTime(880, now + 0.14); // A5
    gain1.gain.setValueAtTime(0.14, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);
  } catch {
    // Ignore audio context autoplay errors
  }
}

export function speakBanglaVoicePrompt(text: string, muted: boolean) {
  playNotificationChime(muted);
  if (muted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'bn-BD';
    utterance.rate = 0.98;
    utterance.pitch = 1.02;

    const voices = window.speechSynthesis.getVoices();
    const banglaVoice = voices.find(
      (v) => v.lang.toLowerCase().includes('bn') || v.name.toLowerCase().includes('bangla') || v.name.toLowerCase().includes('bengali'),
    );
    if (banglaVoice) {
      utterance.voice = banglaVoice;
    }
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech synthesis errors
  }
}
