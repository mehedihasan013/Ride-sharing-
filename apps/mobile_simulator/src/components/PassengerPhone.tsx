import React, { useState } from 'react';
import {
  ArrowUpDown,
  Bus,
  Check,
  CheckCircle2,
  Copy,
  Minus,
  Navigation,
  Plus,
  Share2,
  ShieldAlert,
  Star,
} from 'lucide-react';
import {
  ActiveRideSession,
  BaseFareEstimate,
  BHAIRAB_LANDMARKS,
  BhairabLandmark,
  IncomingBid,
  INTERCITY_CORRIDORS,
  VEHICLE_OPTIONS,
  VehicleType,
} from '../types';
import { BhairabMiniMap } from './BhairabMiniMap';
import { API_BASE } from '../config';

interface PassengerPhoneProps {
  pickup: BhairabLandmark;
  dropoff: BhairabLandmark;
  onSelectPickup: (landmark: BhairabLandmark) => void;
  onSelectDropoff: (landmark: BhairabLandmark) => void;
  onSwapLocations: () => void;
  selectedVehicle: VehicleType;
  onSelectVehicle: (v: VehicleType) => void;
  fareEstimates: BaseFareEstimate[];
  offerFare: number;
  onAdjustOfferFare: (delta: number) => void;
  activeRide: ActiveRideSession | null;
  onRequestRide: () => void;
  onAcceptBid: (bid: IncomingBid) => void;
  onTriggerSos: () => void;
  onResetRide: () => void;
  driverLat: number;
  driverLng: number;
  driverName: string;
}

type PassengerTab = 'RIDE' | 'INTERCITY' | 'SAFETY';

const shortName = (l: BhairabLandmark) => l.banglaName.split('(')[0].trim();
const vehicleDot = (type: VehicleType) =>
  VEHICLE_OPTIONS.find((v) => v.type === type)?.dotClass ?? 'bg-ink-3';

// Shared control styles. Every pressable inside the phone is at least 44px tall.
const press = 'transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.98]';
const primaryBtn = `h-12 w-full rounded-md bg-brand text-on-brand text-[16px] font-medium flex items-center justify-center gap-2 ${press}`;
const secondaryBtn = `h-11 rounded-md border border-line bg-surface text-ink text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-raised ${press}`;
const iconBtn = `w-11 h-11 shrink-0 rounded-md border border-line bg-surface text-ink-2 flex items-center justify-center hover:bg-raised ${press}`;
const selectedChoice = 'border-brand bg-brand/10 text-ink';
const idleChoice = 'border-line bg-surface text-ink-2 hover:bg-raised';

export const PassengerPhone: React.FC<PassengerPhoneProps> = ({
  pickup,
  dropoff,
  onSelectPickup,
  onSelectDropoff,
  onSwapLocations,
  selectedVehicle,
  onSelectVehicle,
  fareEstimates,
  offerFare,
  onAdjustOfferFare,
  activeRide,
  onRequestRide,
  onAcceptBid,
  onTriggerSos,
  onResetRide,
  driverLat,
  driverLng,
  driverName,
}) => {
  const [activeTab, setActiveTab] = useState<PassengerTab>('RIDE');
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Intercity Corridor booking local state
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>(INTERCITY_CORRIDORS[0].id);
  const [bookingMode, setBookingMode] = useState<'SEAT_SHARE' | 'FULL_RESERVE'>('SEAT_SHARE');
  const [seatCount, setSeatCount] = useState<number>(2);
  const [selectedTime, setSelectedTime] = useState<string>(INTERCITY_CORRIDORS[0].departureSchedule[0]);
  const [bookedIntercityTicket, setBookedIntercityTicket] = useState<{
    ticketNo: string;
    corridor: string;
    mode: string;
    time: string;
    totalBdt: number;
  } | null>(null);

  const currentEstimate =
    fareEstimates.find((e) => e.vehicleType === selectedVehicle) || fareEstimates[0];

  const handleCopyWhatsAppLink = () => {
    const token = activeRide?.liveTrackingToken || 'track_bhairab_live_01';
    const url = `https://cholobhairab.bd/track/${token}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2500);
  };

  // Wire 999 SOS button to POST ${API_BASE}/rides/${rideId || 'demo'}/sos (falling back to /admin/rides/demo/sos)
  const handleSosButtonClick = async () => {
    const rideId = activeRide?.rideId || 'demo';
    const resolvedState = Boolean(activeRide?.sosActive);
    onTriggerSos();

    try {
      const res = await fetch(`${API_BASE}/rides/${rideId || 'demo'}/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: resolvedState }),
      });
      if (!res.ok) {
        throw new Error('Fallback to admin SOS route');
      }
    } catch {
      try {
        await fetch(`${API_BASE}/admin/rides/demo/sos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolved: resolvedState }),
        });
      } catch {
        // Offline mode fallback handled by parent state
      }
    }
  };

  const selectedCorridor =
    INTERCITY_CORRIDORS.find((c) => c.id === selectedCorridorId) || INTERCITY_CORRIDORS[0];

  const intercityTotalFare =
    bookingMode === 'FULL_RESERVE'
      ? selectedCorridor.fullMicrobusFareBdt
      : selectedCorridor.seatFareBdt * seatCount;

  const handleBookIntercity = () => {
    setBookedIntercityTicket({
      ticketNo: `CB-IC-${Math.floor(1000 + Math.random() * 9000)}`,
      corridor: selectedCorridor.corridorNameBangla,
      mode:
        bookingMode === 'FULL_RESERVE'
          ? 'ফুল রিজার্ভ মাইক্রোবাস (৭-১০ সিট)'
          : `শেয়ার্ড কারপুল (${seatCount}টি সিট)`,
      time: selectedTime,
      totalBdt: intercityTotalFare,
    });
  };

  const sosActive = Boolean(activeRide?.sosActive);
  const isIdle = !activeRide || activeRide.status === 'IDLE';
  const isBidding =
    activeRide !== null && (activeRide.status === 'SEARCHING' || activeRide.status === 'BIDDING');

  const routeLine = activeRide && (
    <p className="text-[13px] text-ink-2 truncate">
      {shortName(activeRide.pickupLandmark)} → {shortName(activeRide.dropoffLandmark)}
    </p>
  );

  const shareButton = (
    <button type="button" onClick={handleCopyWhatsAppLink} className={`${secondaryBtn} w-full`}>
      {copiedTracking ? (
        <>
          <Check className="w-4 h-4 text-brand-text" />
          <span>লিংক কপি হয়েছে</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          <span>WhatsApp-এ ট্র্যাকিং লিংক</span>
        </>
      )}
    </button>
  );

  return (
    <div className="w-[390px] h-[820px] shrink-0 bg-ink rounded-[44px] p-2">
      <div className="relative h-full bg-page rounded-[36px] overflow-hidden flex flex-col text-ink font-bangla">
        {/* Status bar */}
        <div className="h-10 px-7 shrink-0 flex items-center justify-between bg-surface font-mono text-[12px] text-ink-2">
          <span>9:41</span>
          <span className="flex items-center gap-1.5">
            <span>4G</span>
            <span aria-hidden className="w-6 h-3 rounded-[3px] border border-ink-2 p-px">
              <span className="block h-full w-3/4 rounded-[1px] bg-ink-2" />
            </span>
          </span>
        </div>

        {/* App header */}
        <header className="px-4 pb-3 pt-1 shrink-0 flex items-center justify-between gap-3 bg-surface">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold leading-tight">চলো ভৈরব</h2>
            <p className="text-[13px] text-ink-3 truncate">আব্দুল করিম</p>
          </div>
          <button
            type="button"
            onClick={handleSosButtonClick}
            aria-pressed={sosActive}
            aria-label={sosActive ? 'SOS চালু আছে, বন্ধ করতে চাপুন' : 'জরুরি ৯৯৯ SOS পাঠান'}
            className={`h-11 px-4 rounded-full border text-[14px] font-medium flex items-center gap-1.5 ${press} ${
              sosActive
                ? 'bg-danger border-danger text-surface pulse-sos'
                : 'bg-surface border-danger/50 text-danger hover:bg-danger/10'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{sosActive ? 'SOS চালু' : 'SOS'}</span>
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 min-h-0 flex flex-col border-t border-line">
          {activeTab === 'RIDE' && (
            <>
              <div className="shrink-0">
                <BhairabMiniMap
                  pickup={pickup}
                  dropoff={dropoff}
                  driverLat={driverLat}
                  driverLng={driverLng}
                  driverName={driverName}
                  vehicleType={selectedVehicle}
                  rideStatus={activeRide?.status || 'IDLE'}
                  sosActive={activeRide?.sosActive}
                  heightClass="h-[208px]"
                />
              </div>

              {/* Bottom sheet over the map */}
              <div className="relative z-10 -mt-4 flex-1 min-h-0 overflow-y-auto overscroll-contain phone-scroll bg-surface rounded-t-xl shadow-lg px-4 pt-2 pb-4">
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" aria-hidden />

                {/* STATE 1: choose route, vehicle and offer a fare */}
                {isIdle && (
                  <div className="space-y-4">
                    <div className="flex items-stretch gap-2">
                      <div className="flex-1 min-w-0 rounded-lg border border-line divide-y divide-line">
                        <label className="flex items-center gap-3 px-3 min-h-[52px]">
                          <span className="w-2.5 h-2.5 rounded-full bg-brand shrink-0" aria-hidden />
                          <span className="flex-1 min-w-0">
                            <span className="block text-[12px] text-ink-3">কোথা থেকে</span>
                            <select
                              value={pickup.id}
                              onChange={(e) => {
                                const found = BHAIRAB_LANDMARKS.find((l) => l.id === e.target.value);
                                if (found) onSelectPickup(found);
                              }}
                              className="w-full bg-transparent text-[16px] font-medium text-ink truncate cursor-pointer focus:outline-none"
                            >
                              {BHAIRAB_LANDMARKS.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.banglaName}
                                </option>
                              ))}
                            </select>
                          </span>
                        </label>
                        <label className="flex items-center gap-3 px-3 min-h-[52px]">
                          <span className="w-2.5 h-2.5 rounded-full bg-ink shrink-0" aria-hidden />
                          <span className="flex-1 min-w-0">
                            <span className="block text-[12px] text-ink-3">কোথায় যাবেন</span>
                            <select
                              value={dropoff.id}
                              onChange={(e) => {
                                const found = BHAIRAB_LANDMARKS.find((l) => l.id === e.target.value);
                                if (found) onSelectDropoff(found);
                              }}
                              className="w-full bg-transparent text-[16px] font-medium text-ink truncate cursor-pointer focus:outline-none"
                            >
                              {BHAIRAB_LANDMARKS.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.banglaName}
                                </option>
                              ))}
                            </select>
                          </span>
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={onSwapLocations}
                        aria-label="পিকআপ ও গন্তব্য অদলবদল করুন"
                        className={`${iconBtn} self-center`}
                      >
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </div>

                    {currentEstimate && (
                      <p className="text-[13px] text-ink-2">
                        <span className="font-mono tabular-nums">{currentEstimate.distanceKm}</span> কিমি ·
                        প্রায় <span className="font-mono tabular-nums">{currentEstimate.estimatedMinutes}</span>{' '}
                        মিনিট
                      </p>
                    )}

                    {/* Vehicle type */}
                    <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="গাড়ির ধরন">
                      {VEHICLE_OPTIONS.map((v) => {
                        const est = fareEstimates.find((e) => e.vehicleType === v.type);
                        const isSelected = selectedVehicle === v.type;
                        return (
                          <button
                            key={v.type}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => onSelectVehicle(v.type)}
                            className={`min-h-[64px] px-1 py-2 rounded-md border flex flex-col items-center justify-center gap-1 ${press} ${
                              isSelected ? selectedChoice : idleChoice
                            }`}
                          >
                            <span className="flex items-center gap-1.5 text-[13px] font-medium">
                              <span className={`w-2 h-2 rounded-full ${v.dotClass}`} aria-hidden />
                              {v.banglaLabel}
                            </span>
                            <span className="font-mono tabular-nums text-[12px] text-ink-3">
                              ৳{est?.suggestedFareBdt ?? 80}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Fare offer */}
                    <div className="rounded-lg bg-raised p-3">
                      <p className="text-[13px] text-ink-2 text-center">আপনার প্রস্তাবিত ভাড়া</p>
                      <div className="mt-1 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => onAdjustOfferFare(-5)}
                          aria-label="৫ টাকা কমান"
                          className={iconBtn}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-mono tabular-nums text-[24px] font-semibold text-ink">
                          ৳{offerFare}
                        </span>
                        <button
                          type="button"
                          onClick={() => onAdjustOfferFare(5)}
                          aria-label="৫ টাকা বাড়ান"
                          className={iconBtn}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="mt-1 text-[12px] text-ink-3 text-center">
                        সর্বনিম্ন{' '}
                        <span className="font-mono tabular-nums">৳{currentEstimate?.minimumFareBdt ?? 20}</span>{' '}
                        · প্রস্তাবিত{' '}
                        <span className="font-mono tabular-nums">৳{currentEstimate?.suggestedFareBdt ?? 80}</span>{' '}
                        · নগদে পরিশোধ
                      </p>
                    </div>

                    <button type="button" onClick={onRequestRide} className={primaryBtn}>
                      রাইডের অনুরোধ পাঠান
                    </button>
                  </div>
                )}

                {/* STATE 2: waiting for and choosing driver bids */}
                {isBidding && activeRide && (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] text-ink-2">আপনার প্রস্তাব</p>
                        <p className="font-mono tabular-nums text-[24px] font-semibold leading-tight">
                          ৳{activeRide.initialOfferFare}
                        </p>
                        {routeLine}
                      </div>
                      <button
                        type="button"
                        onClick={onResetRide}
                        className={`${secondaryBtn} px-4 shrink-0`}
                      >
                        বাতিল
                      </button>
                    </div>

                    {activeRide.bids.length === 0 ? (
                      <div className="rounded-lg border border-line px-4 py-6 text-center">
                        <p className="flex items-center justify-center gap-2 text-[14px] font-medium">
                          <span className="w-2 h-2 rounded-full bg-warning" aria-hidden />
                          চালকদের কাছে অনুরোধ গেছে
                        </p>
                        <p className="mt-1 text-[13px] text-ink-3">
                          কোনো চালক ভাড়া প্রস্তাব করলে এখানে দেখাবে। ডেমোতে ডান পাশের চালক ফোন থেকে বিড দিন।
                        </p>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-[13px] text-ink-2 mb-2">
                          চালকদের প্রস্তাব ·{' '}
                          <span className="font-mono tabular-nums">{activeRide.bids.length}</span>
                        </h3>
                        <ul className="rounded-lg border border-line divide-y divide-line">
                          {activeRide.bids.map((bid) => {
                            const diff = bid.bidAmount - activeRide.initialOfferFare;
                            return (
                              <li key={bid.bidId} className="flex items-center gap-3 p-3">
                                <div className="flex-1 min-w-0">
                                  <p className="flex items-center gap-2 text-[14px] font-medium">
                                    <span className="truncate">{bid.driverName}</span>
                                    <span className="flex items-center gap-0.5 text-[12px] text-ink-3 font-mono tabular-nums">
                                      <Star className="w-3 h-3" aria-hidden />
                                      {bid.ratingAvg}
                                    </span>
                                  </p>
                                  <p className="flex items-center gap-1.5 text-[12px] text-ink-3">
                                    <span
                                      className={`w-2 h-2 rounded-full shrink-0 ${vehicleDot(activeRide.vehicleType)}`}
                                      aria-hidden
                                    />
                                    <span className="truncate">{bid.vehicleModel}</span>
                                    <span className="shrink-0">
                                      · <span className="font-mono tabular-nums">{bid.etaMinutes}</span> মিনিট দূরে
                                    </span>
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-mono tabular-nums text-[20px] font-semibold leading-tight">
                                    ৳{bid.bidAmount}
                                  </p>
                                  {diff !== 0 && (
                                    <p className="font-mono tabular-nums text-[12px] text-warning">
                                      {diff > 0 ? `+৳${diff}` : `−৳${-diff}`}
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onAcceptBid(bid)}
                                  aria-label={`${bid.driverName}-এর ৳${bid.bidAmount} প্রস্তাব গ্রহণ করুন`}
                                  className={`h-11 px-4 shrink-0 rounded-md bg-brand text-on-brand text-[14px] font-medium ${press}`}
                                >
                                  গ্রহণ
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* STATE 3: driver assigned, trip in progress */}
                {activeRide && activeRide.status === 'ACCEPTED' && activeRide.assignedDriver && (
                  <div className="space-y-4">
                    <div>
                      <p className="flex items-center gap-2 text-[16px] font-semibold">
                        <span className="w-2 h-2 rounded-full bg-brand" aria-hidden />
                        চালক আসছেন ·{' '}
                        <span className="font-mono tabular-nums">{activeRide.assignedDriver.etaMinutes}</span> মিনিট
                      </p>
                      {routeLine}
                    </div>

                    <div className="rounded-lg border border-line p-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-[14px] font-medium">
                          <span className="truncate">{activeRide.assignedDriver.driverName}</span>
                          <span className="flex items-center gap-0.5 text-[12px] text-ink-3 font-mono tabular-nums">
                            <Star className="w-3 h-3" aria-hidden />
                            {activeRide.assignedDriver.rating}
                          </span>
                        </p>
                        <p className="flex items-center gap-1.5 text-[12px] text-ink-3">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${vehicleDot(activeRide.vehicleType)}`}
                            aria-hidden
                          />
                          <span className="truncate">{activeRide.assignedDriver.vehicleModel}</span>
                        </p>
                        <p className="mt-1 font-mono tabular-nums text-[13px] text-ink-2">
                          {activeRide.assignedDriver.driverPhone}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[12px] text-ink-3">ভাড়া</p>
                        <p className="font-mono tabular-nums text-[24px] font-semibold leading-tight">
                          ৳{activeRide.agreedFare}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {shareButton}
                      <button
                        type="button"
                        onClick={handleSosButtonClick}
                        aria-pressed={activeRide.sosActive}
                        className={`h-11 rounded-md border text-[14px] font-medium flex items-center justify-center gap-2 ${press} ${
                          activeRide.sosActive
                            ? 'bg-danger border-danger text-surface'
                            : 'bg-surface border-danger/50 text-danger hover:bg-danger/10'
                        }`}
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>{activeRide.sosActive ? 'SOS বন্ধ করুন' : '৯৯৯ SOS'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 rounded-md bg-raised pl-3">
                      <span className="flex-1 truncate font-mono text-[12px] text-ink-2">
                        cholobhairab.bd/track/{activeRide.liveTrackingToken}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyWhatsAppLink}
                        aria-label="ট্র্যাকিং লিংক কপি করুন"
                        className={`w-11 h-11 shrink-0 flex items-center justify-center text-ink-2 rounded-md ${press}`}
                      >
                        {copiedTracking ? <Check className="w-4 h-4 text-brand-text" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* STATE 4: trip finished */}
                {activeRide && activeRide.status === 'COMPLETED' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-brand-text" aria-hidden />
                      <h3 className="text-[20px] font-semibold">যাত্রা শেষ হয়েছে</h3>
                    </div>

                    <div className="rounded-lg bg-raised p-4 text-center">
                      <p className="text-[13px] text-ink-2">চালককে নগদে দিন</p>
                      <p className="font-mono tabular-nums text-[24px] font-semibold">৳{activeRide.agreedFare}</p>
                    </div>

                    <dl className="text-[13px] divide-y divide-line border-y border-line">
                      <div className="flex justify-between gap-4 py-2">
                        <dt className="text-ink-3">চালক</dt>
                        <dd className="font-medium truncate">{activeRide.assignedDriver?.driverName}</dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2">
                        <dt className="text-ink-3">রুট</dt>
                        <dd className="truncate">
                          {shortName(activeRide.pickupLandmark)} → {shortName(activeRide.dropoffLandmark)}
                        </dd>
                      </div>
                    </dl>

                    <button type="button" onClick={onResetRide} className={primaryBtn}>
                      নতুন রাইড
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: intercity seat share and microbus */}
          {activeTab === 'INTERCITY' && (
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain phone-scroll px-4 py-4 space-y-4">
              <div>
                <h3 className="text-[20px] font-semibold">ইন্টারসিটি</h3>
                <p className="text-[13px] text-ink-2">
                  ঢাকা, কিশোরগঞ্জ ও ব্রাহ্মণবাড়িয়া রুটে সিট শেয়ার, অথবা পুরো মাইক্রোবাস রিজার্ভ।
                </p>
              </div>

              <div className="space-y-2" role="radiogroup" aria-label="রুট">
                {INTERCITY_CORRIDORS.map((corridor) => {
                  const isSelected = corridor.id === selectedCorridorId;
                  return (
                    <button
                      key={corridor.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => {
                        setSelectedCorridorId(corridor.id);
                        setSelectedTime(corridor.departureSchedule[0]);
                        setBookedIntercityTicket(null);
                      }}
                      className={`w-full text-left p-3 rounded-lg border ${press} ${
                        isSelected ? selectedChoice : idleChoice
                      }`}
                    >
                      <p className="text-[14px] font-medium text-ink">{corridor.corridorNameBangla}</p>
                      <p className="text-[12px] text-ink-3">
                        {corridor.pickupHubBangla} · {corridor.durationText} ·{' '}
                        <span className="font-mono tabular-nums">{corridor.distanceKm}</span> কিমি
                      </p>
                      <p className="mt-1 text-[13px] text-ink-2">
                        সিট <span className="font-mono tabular-nums">৳{corridor.seatFareBdt}</span> · পুরো গাড়ি{' '}
                        <span className="font-mono tabular-nums">৳{corridor.fullMicrobusFareBdt}</span>
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="বুকিংয়ের ধরন">
                <button
                  type="button"
                  role="radio"
                  aria-checked={bookingMode === 'SEAT_SHARE'}
                  onClick={() => setBookingMode('SEAT_SHARE')}
                  className={`h-11 rounded-md border text-[14px] font-medium ${press} ${
                    bookingMode === 'SEAT_SHARE' ? selectedChoice : idleChoice
                  }`}
                >
                  সিট শেয়ার
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={bookingMode === 'FULL_RESERVE'}
                  onClick={() => setBookingMode('FULL_RESERVE')}
                  className={`h-11 rounded-md border text-[14px] font-medium ${press} ${
                    bookingMode === 'FULL_RESERVE' ? selectedChoice : idleChoice
                  }`}
                >
                  পুরো মাইক্রোবাস
                </button>
              </div>

              {bookingMode === 'SEAT_SHARE' && (
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-ink-2">সিট সংখ্যা</span>
                  <div className="flex gap-2" role="radiogroup" aria-label="সিট সংখ্যা">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        role="radio"
                        aria-checked={seatCount === num}
                        onClick={() => setSeatCount(num)}
                        className={`w-11 h-11 rounded-md border font-mono tabular-nums text-[14px] ${press} ${
                          seatCount === num ? selectedChoice : idleChoice
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[13px] text-ink-2 mb-2">ছাড়ার সময়</p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="ছাড়ার সময়">
                  {selectedCorridor.departureSchedule.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      role="radio"
                      aria-checked={selectedTime === slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`h-11 px-3 rounded-md border text-[13px] ${press} ${
                        selectedTime === slot ? selectedChoice : idleChoice
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" onClick={handleBookIntercity} className={primaryBtn}>
                বুক করুন · <span className="font-mono tabular-nums">৳{intercityTotalFare}</span>
              </button>

              {bookedIntercityTicket && (
                <div className="rounded-lg border border-line p-3 space-y-1 text-[13px]" role="status">
                  <p className="flex items-center justify-between gap-2 font-medium text-[14px]">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-brand-text" aria-hidden />
                      বুকিং হয়েছে
                    </span>
                    <span className="font-mono tabular-nums text-[12px] text-ink-2">
                      {bookedIntercityTicket.ticketNo}
                    </span>
                  </p>
                  <p>{bookedIntercityTicket.corridor}</p>
                  <p className="text-ink-2">
                    {bookedIntercityTicket.mode} · {bookedIntercityTicket.time}
                  </p>
                  <p className="text-ink-2">
                    ভাড়া <span className="font-mono tabular-nums">৳{bookedIntercityTicket.totalBdt}</span> · চালক
                    সোহেল রানা, টয়োটা নোয়াহ
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: safety and 999 */}
          {activeTab === 'SAFETY' && (
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain phone-scroll px-4 py-4 space-y-6">
              <div className="space-y-3">
                <div>
                  <h3 className="text-[20px] font-semibold">জরুরি সাহায্য</h3>
                  <p className="text-[13px] text-ink-2">
                    SOS পাঠালে আপনার লাইভ লোকেশন ৯৯৯ ও ভৈরব থানা কন্ট্রোল রুমে যাবে।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSosButtonClick}
                  aria-pressed={sosActive}
                  className={`h-14 w-full rounded-md border-2 text-[16px] font-medium flex items-center justify-center gap-2 ${press} ${
                    sosActive
                      ? 'bg-danger border-danger text-surface'
                      : 'bg-surface border-danger text-danger hover:bg-danger/10'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span>{sosActive ? 'SOS চালু আছে · বন্ধ করতে চাপুন' : '৯৯৯ SOS পাঠান'}</span>
                </button>
              </div>

              <div>
                <h4 className="text-[13px] text-ink-2 mb-1">ভৈরব হটলাইন</h4>
                <dl className="text-[14px] divide-y divide-line border-y border-line">
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt>ভৈরব মডেল থানা</dt>
                    <dd className="font-mono tabular-nums text-ink-2">01320-108944</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt>হাইওয়ে পুলিশ (মেঘনা ব্রিজ)</dt>
                    <dd className="font-mono tabular-nums text-ink-2">01320-185420</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt>উপজেলা স্বাস্থ্য কমপ্লেক্স</dt>
                    <dd className="font-mono tabular-nums text-ink-2">999 / 16263</dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-2">
                <h4 className="text-[14px] font-medium">পরিবারকে লাইভ লোকেশন দেখান</h4>
                <p className="text-[13px] text-ink-2">
                  রাইড চলার সময় পরিবারের সদস্যরা অ্যাপ ছাড়াই ব্রাউজারে আপনার গাড়ি দেখতে পারবেন।
                </p>
                {shareButton}
              </div>
            </div>
          )}
        </div>

        {/* Bottom navigation */}
        <nav className="shrink-0 grid grid-cols-3 border-t border-line bg-surface pb-2" aria-label="অ্যাপ নেভিগেশন">
          {(
            [
              ['RIDE', 'রাইড', Navigation],
              ['INTERCITY', 'ইন্টারসিটি', Bus],
              ['SAFETY', 'নিরাপত্তা', ShieldAlert],
            ] as const
          ).map(([tab, label, Icon]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              aria-current={activeTab === tab ? 'page' : undefined}
              className={`min-h-[52px] flex flex-col items-center justify-center gap-0.5 text-[12px] transition-colors duration-150 ease-out ${
                activeTab === tab ? 'text-brand-text font-medium' : 'text-ink-3'
              }`}
            >
              <Icon className="w-5 h-5" aria-hidden />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
