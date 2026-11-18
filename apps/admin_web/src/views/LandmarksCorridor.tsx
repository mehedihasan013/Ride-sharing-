import React, { useEffect, useState } from 'react';
import { BaseFareEstimate, BhairabLandmarkData, VehicleType } from '../types/admin';
import { VehicleLabel } from '../components/BhairabMap';

interface LandmarksCorridorProps {
  landmarks: BhairabLandmarkData[];
  apiBaseUrl: string;
}

const VEHICLE_USE: Record<VehicleType, string> = {
  EASYBIKE: 'বাজার, রেল স্টেশন ও মহল্লার ভেতরে কম খরচের যাতায়াত',
  BIKE: 'একজন যাত্রী, মেঘনা ব্রিজ ও বাস স্ট্যান্ডে দ্রুত যাওয়া',
  CNG: 'ভৈরব-কুলিয়ারচর-কিশোরগঞ্জ আঞ্চলিক সড়ক ও পরিবার নিয়ে যাত্রা',
  CAR_MICROBUS: 'ঢাকা এয়ারপোর্ট, নরসিংদী ও সিলেট রিজার্ভ ট্রিপ',
};

const CATEGORY_LABEL: Record<BhairabLandmarkData['category'], string> = {
  transit_hub: 'পরিবহন কেন্দ্র',
  bridge: 'সেতু',
  commercial: 'বাজার',
  hospital: 'হাসপাতাল',
  residential: 'আবাসিক',
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
  const [isLocalEstimate, setIsLocalEstimate] = useState(false);

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
          setIsLocalEstimate(false);
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
        setIsLocalEstimate(true);
        setLoading(false);
      }
    };

    fetchEstimate();
    return () => {
      cancelled = true;
    };
  }, [pickupId, dropoffId, pickupLandmark, dropoffLandmark, apiBaseUrl]);

  const selectCls =
    'h-9 min-w-[14rem] px-2.5 rounded-md bg-page border border-line text-[13px] text-ink focus:outline-none focus:border-brand-text';
  const pickCls = (active: boolean) =>
    `h-8 px-2.5 rounded-md text-[13px] whitespace-nowrap border transition-colors duration-150 ease-out ${
      active ? 'bg-raised border-ink-3 text-ink font-medium' :'border-line text-ink-2 hover:text-ink hover:bg-raised'
    }`;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-ink">ল্যান্ডমার্ক ও ভাড়া</h2>
        <p className="text-[13px] text-ink-2 mt-1 max-w-3xl">
          ভৈরবের অনেক গলির ঠিকানা অসম্পূর্ণ, তাই যাত্রীরা ল্যান্ডমার্ক দিয়ে পিকআপ ও গন্তব্য বেছে নেন।
          দুটি ল্যান্ডমার্ক বেছে নিলে প্রতিটি যানের প্রস্তাবিত ভাড়া দেখাবে।
        </p>
      </div>

      <section className="bg-surface border border-line rounded-lg" aria-labelledby="fare-heading">
        <div className="px-4 py-3 border-b border-line flex flex-wrap items-end justify-between gap-3">
          <h3 id="fare-heading" className="text-sm font-semibold text-ink">
            ভাড়া হিসাব
          </h3>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-ink-3">
              পিকআপ
              <select
                value={pickupId}
                onChange={(e) => setPickupId(e.target.value)}
                className={selectCls}
              >
                {landmarks.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.banglaName}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-3">
              গন্তব্য
              <select
                value={dropoffId}
                onChange={(e) => setDropoffId(e.target.value)}
                className={selectCls}
              >
                {landmarks.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.banglaName}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {estimates.length === 0 ? (
          <p className="px-4 py-6 text-sm text-ink-2">
            {loading ? 'ভাড়া হিসাব করা হচ্ছে…' : 'ভাড়া দেখতে পিকআপ ও গন্তব্য বেছে নিন।'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-xs text-ink-3 border-b border-line">
                  <th className="font-medium px-4 py-2">যান</th>
                  <th className="font-medium px-4 py-2 text-right">দূরত্ব</th>
                  <th className="font-medium px-4 py-2 text-right">সময়</th>
                  <th className="font-medium px-4 py-2 text-right">প্রস্তাবিত ভাড়া</th>
                  <th className="font-medium px-4 py-2 text-right">সর্বনিম্ন</th>
                  <th className="font-medium px-4 py-2 text-right">কমিশন (৮%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {estimates.map((est) => (
                  <tr key={est.vehicleType}>
                    <td className="px-4 py-2.5">
                      <div className="text-ink">
                        <VehicleLabel type={est.vehicleType} />
                      </div>
                      <div className="text-xs text-ink-3 mt-0.5">{VEHICLE_USE[est.vehicleType]}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-ink-2 whitespace-nowrap">
                      {est.distanceKm} কিমি
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-ink-2 whitespace-nowrap">
                      {est.estimatedMinutes} মিনিট
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-base text-ink">
                      ৳{est.suggestedFareBdt}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-ink-2">
                      ৳{est.minimumFareBdt}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-ink-2">
                      ৳{Math.round(est.suggestedFareBdt * 0.08)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(loading || isLocalEstimate) && estimates.length > 0 && (
          <p className="px-4 py-2 border-t border-line text-xs text-ink-3" role="status">
            {loading
              ? 'ভাড়া হিসাব করা হচ্ছে…'
              : 'সার্ভারে সংযোগ হয়নি, তাই এই ভাড়া ব্রাউজারে আনুমানিক হিসাব করা হয়েছে।'}
          </p>
        )}
      </section>

      <section className="bg-surface border border-line rounded-lg" aria-labelledby="landmarks-heading">
        <div className="px-4 py-3 border-b border-line flex items-baseline justify-between gap-2">
          <h3 id="landmarks-heading" className="text-sm font-semibold text-ink">
            ল্যান্ডমার্ক
          </h3>
          <span className="text-xs text-ink-3">
            <span className="font-mono tabular-nums">{landmarks.length}</span> টি
          </span>
        </div>

        {landmarks.length === 0 ? (
          <p className="px-4 py-6 text-sm text-ink-2">
            কোনো ল্যান্ডমার্ক লোড হয়নি। সার্ভার চালু আছে কিনা দেখে পাতাটি আবার খুলুন।
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-xs text-ink-3 border-b border-line">
                  <th className="font-medium px-4 py-2">নাম</th>
                  <th className="font-medium px-4 py-2">ধরন</th>
                  <th className="font-medium px-4 py-2">স্থানাংক</th>
                  <th className="font-medium px-4 py-2">
                    <span className="sr-only">ভাড়া হিসাবে ব্যবহার</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {landmarks.map((lm) => (
                  <tr key={lm.id} className="align-top">
                    <td className="px-4 py-3 max-w-md">
                      <div className="text-ink font-medium">{lm.banglaName}</div>
                      <div className="text-xs text-ink-3 mt-0.5 font-bangla">{lm.descriptionBangla}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-2 whitespace-nowrap">
                      {CATEGORY_LABEL[lm.category] || lm.category}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-xs text-ink-2 whitespace-nowrap">
                      {lm.latitude.toFixed(4)}, {lm.longitude.toFixed(4)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          aria-pressed={pickupId === lm.id}
                          onClick={() => setPickupId(lm.id)}
                          className={pickCls(pickupId === lm.id)}
                        >
                          পিকআপ
                        </button>
                        <button
                          type="button"
                          aria-pressed={dropoffId === lm.id}
                          onClick={() => setDropoffId(lm.id)}
                          className={pickCls(dropoffId === lm.id)}
                        >
                          গন্তব্য
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
