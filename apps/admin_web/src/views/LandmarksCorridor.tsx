import React, { useEffect, useState } from 'react';
import { BaseFareEstimate, BhairabLandmarkData } from '../types/admin';
import {
  Calculator,
  Clock,
  Compass,
  MapPin,
  Navigation,
  Route,
  Sparkles,
} from 'lucide-react';

interface LandmarksCorridorProps {
  landmarks: BhairabLandmarkData[];
  apiBaseUrl: string;
}

const VEHICLE_DETAILS = {
  EASYBIKE: {
    titleBn: 'ইজিবাইক / অটো টমটম',
    titleEn: 'Municipal Easy-Bike',
    emoji: '🛺',
    descBn: 'ভৈরব বাজার, রেল স্টেশন ও মহল্লার ভেতর সাশ্রয়ী যাতায়াত',
    accent: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300',
  },
  BIKE: {
    titleBn: 'মোটরবাইক রাইড',
    titleEn: 'Fast Commuter Bike',
    emoji: '🏍️',
    descBn: 'দ্রুত ১ জন যাত্রীর জন্য মেঘনা ব্রিজ ও বাস স্ট্যান্ড সংযোগ',
    accent: 'border-amber-500/40 bg-amber-950/20 text-amber-300',
  },
  CNG: {
    titleBn: 'সিএনজি অটোরিকশা',
    titleEn: 'CNG Auto-Rickshaw',
    emoji: '🛺',
    descBn: 'ভৈরব-কুলিয়ারচর-কিশোরগঞ্জ আঞ্চলিক সড়ক ও পরিবার ভ্রমণ',
    accent: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300',
  },
  CAR_MICROBUS: {
    titleBn: 'মাইক্রোবাস / প্রাইভেট কার',
    titleEn: 'Intercity Microbus / Noah',
    emoji: '🚐',
    descBn: 'ভৈরব-ঢাকা এয়ারপোর্ট, নরসিংদী ও সিলেট রিজার্ভ ট্রিপ',
    accent: 'border-purple-500/40 bg-purple-950/20 text-purple-300',
  },
};

function computeLocalSuggestedFares(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): BaseFareEstimate[] {
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
  const distanceKm = Math.max(0.8, Number((R * c).toFixed(2)));
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

export const LandmarksCorridor: React.FC<LandmarksCorridorProps> = ({
  landmarks,
  apiBaseUrl,
}) => {
  const [pickupId, setPickupId] = useState<string>(
    landmarks[0]?.id || 'bhairab-rail-station'
  );
  const [dropoffId, setDropoffId] = useState<string>(
    landmarks[1]?.id || 'meghna-bridge-point'
  );
  const [estimates, setEstimates] = useState<BaseFareEstimate[]>([]);
  const [loading, setLoading] = useState(false);

  const pickupLandmark =
    landmarks.find((l) => l.id === pickupId) || landmarks[0];
  const dropoffLandmark =
    landmarks.find((l) => l.id === dropoffId) || landmarks[1] || landmarks[0];

  useEffect(() => {
    if (!pickupLandmark || !dropoffLandmark) return;

    let cancelled = false;
    const fetchEstimate = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          pickupLat: String(pickupLandmark.latitude),
          pickupLng: String(pickupLandmark.longitude),
          dropoffLat: String(dropoffLandmark.latitude),
          dropoffLng: String(dropoffLandmark.longitude),
        });
        const res = await fetch(`${apiBaseUrl}/geo/fares/estimate?${params.toString()}`);
        if (!res.ok) throw new Error('Fallback to local calculation');
        const data = await res.json();
        if (!cancelled && data.estimates) {
          setEstimates(data.estimates);
          setLoading(false);
          return;
        }
      } catch {
        // Use local Haversine fallback matching backend GeoService
      }
      if (!cancelled) {
        setEstimates(
          computeLocalSuggestedFares(
            pickupLandmark.latitude,
            pickupLandmark.longitude,
            dropoffLandmark.latitude,
            dropoffLandmark.longitude
          )
        );
        setLoading(false);
      }
    };

    fetchEstimate();
    return () => {
      cancelled = true;
    };
  }, [pickupId, dropoffId, pickupLandmark, dropoffLandmark, apiBaseUrl]);

  return (
    <div className="space-y-6">
      {/* Interactive Corridor Fare Estimator */}
      <div className="glass-card rounded-2xl p-5 border border-emerald-500/25">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <Calculator className="w-3.5 h-3.5" />
              <span>ভৈরব করিডোর ভাড়া ক্যালকুলেটর • Multi-Modal Fare Estimator</span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">
              ল্যান্ডমার্ক টু ল্যান্ডমার্ক ইনড্রাইভ বেসলাইন ভাড়া নির্ণয় (`GET /geo/fares/estimate`)
            </h2>
            <p className="text-xs text-slate-400">
              ভৈরবের অলিগলিতে স্ট্রিট অ্যাড্রেস অসম্পূর্ণ থাকায় যাত্রীরা ল্যান্ডমার্ক ভিত্তিক পিকআপ ও গন্তব্য নির্বাচন করেন
            </p>
          </div>

          {/* Pickup & Dropoff Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-[#0B131E] border border-white/10 rounded-xl px-3 py-2">
              <label className="block text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
                🟢 পিকআপ ল্যান্ডমার্ক (Pickup Hub)
              </label>
              <select
                value={pickupId}
                onChange={(e) => setPickupId(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none mt-0.5 pr-2"
              >
                {landmarks.map((l) => (
                  <option key={l.id} value={l.id} className="bg-[#0B131E] text-white">
                    {l.banglaName}
                  </option>
                ))}
              </select>
            </div>

            <Route className="w-5 h-5 text-amber-400 hidden sm:block" />

            <div className="bg-[#0B131E] border border-white/10 rounded-xl px-3 py-2">
              <label className="block text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                🏁 গন্তব্য ল্যান্ডমার্ক (Dropoff Hub)
              </label>
              <select
                value={dropoffId}
                onChange={(e) => setDropoffId(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none mt-0.5 pr-2"
              >
                {landmarks.map((l) => (
                  <option key={l.id} value={l.id} className="bg-[#0B131E] text-white">
                    {l.banglaName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Estimated Fares Grid for 4 Vehicle Types */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {estimates.map((est) => {
            const meta = VEHICLE_DETAILS[est.vehicleType] || VEHICLE_DETAILS.EASYBIKE;
            const commissionBdt = Math.round(est.suggestedFareBdt * 0.08);

            return (
              <div
                key={est.vehicleType}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${meta.accent}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{meta.emoji}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/30 text-slate-200">
                      ~{est.distanceKm} কিমি • {est.estimatedMinutes} মিনিট
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white mt-2">{meta.titleBn}</h3>
                  <p className="text-[11px] text-slate-400">{meta.titleEn}</p>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{meta.descBn}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-300">প্রস্তাবিত ভাড়া (Suggested):</span>
                    <span className="text-2xl font-extrabold text-white">
                      ৳{est.suggestedFareBdt}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>সর্বনিম্ন ফ্লোর: ৳{est.minimumFareBdt}</span>
                    <span className="text-emerald-400 font-semibold">
                      ৮% কমিশন: ৳{commissionBdt}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {loading && (
          <p className="text-xs text-emerald-400 mt-2 animate-pulse">
            ভাড়া হিসাব করা হচ্ছে...
          </p>
        )}
      </div>

      {/* All 6 Bhairab Pre-Indexed Landmarks Directory */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>ভৈরবের ৬টি প্রধান ট্রানজিট হাব ও ল্যান্ডমার্ক ডিরেক্টরি (Pre-Indexed Landmarks)</span>
          </h3>
          <span className="text-xs text-slate-400">Barikoi GIS + Local Landmark Index</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {landmarks.map((lm) => (
            <div
              key={lm.id}
              className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between border border-white/10"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {lm.category.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-emerald-400" />
                    {lm.latitude.toFixed(4)}°N, {lm.longitude.toFixed(4)}°E
                  </span>
                </div>

                <h4 className="text-base font-extrabold text-white">{lm.banglaName}</h4>
                <p className="text-xs text-slate-400 font-medium">{lm.englishName}</p>
                <p className="text-xs text-slate-300 mt-2.5 p-2.5 rounded-xl bg-[#0B131E] border border-white/5 font-bangla">
                  {lm.descriptionBangla}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                <button
                  onClick={() => setPickupId(lm.id)}
                  className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all ${
                    pickupId === lm.id
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  🟢 পিকআপ সেট করুন
                </button>
                <button
                  onClick={() => setDropoffId(lm.id)}
                  className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all ${
                    dropoffId === lm.id
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  🏁 গন্তব্য সেট করুন
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
