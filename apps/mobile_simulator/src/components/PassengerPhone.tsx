import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  ShieldAlert,
  Sparkles,
  Star,
  PhoneCall,
  Share2,
  CheckCircle2,
  ArrowUpDown,
  Clock,
  Car,
  Compass,
  Minus,
  Plus,
  Copy,
  Check,
  Radio,
  RotateCcw,
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

  // Wire 999 SOS button to POST http://localhost:4000/rides/${rideId || 'demo'}/sos (falling back to /admin/rides/demo/sos)
  const handleSosButtonClick = async () => {
    const rideId = activeRide?.rideId || 'demo';
    const resolvedState = Boolean(activeRide?.sosActive);
    onTriggerSos();

    try {
      const res = await fetch(`http://localhost:4000/rides/${rideId || 'demo'}/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: resolvedState }),
      });
      if (!res.ok) {
        throw new Error('Fallback to admin SOS route');
      }
    } catch {
      try {
        await fetch('http://localhost:4000/admin/rides/demo/sos', {
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

  return (
    <div className="w-[390px] h-[820px] rounded-[46px] bg-[#0B131E] border-[7px] border-slate-800 shadow-[0_25px_70px_rgba(0,0,0,0.75)] flex flex-col overflow-hidden relative select-none shrink-0 ring-1 ring-emerald-500/20">
      {/* Smartphone Notch & Status Bar */}
      <div className="pt-2 pb-1.5 px-6 bg-[#070D15] flex items-center justify-between text-[11px] font-semibold text-slate-300 relative z-20">
        <span>9:41 AM</span>
        <div className="w-28 h-5 bg-black rounded-full border border-slate-800/80 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-800" />
          <span className="w-8 h-1 rounded-full bg-slate-800" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-emerald-400 font-bold">5G</span>
          <div className="w-5 h-2.5 border border-slate-400 rounded-sm p-0.5 flex items-center">
            <div className="w-full h-full bg-emerald-400 rounded-[1px]" />
          </div>
        </div>
      </div>

      {/* App Brand Header (Passenger Mode) */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-[#006A4E] via-[#045D46] to-[#0B131E] border-b border-emerald-500/25 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-base shadow-sm">
            🛺
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-bangla font-bold text-sm text-white tracking-tight">
                চলো ভৈরব • যাত্রী অ্যাপ
              </h2>
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                PASSENGER
              </span>
            </div>
            <p className="text-[10px] text-emerald-200/80 font-bangla">
              আব্দুল করিম • 01700000001 • ভৈরব বাজার
            </p>
          </div>
        </div>

        {/* Emergency 999 Quick Pill */}
        <button
          onClick={handleSosButtonClick}
          title="Trigger 999 Emergency SOS"
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
            activeRide?.sosActive
              ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
              : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
          }`}
        >
          <ShieldAlert className="w-3 h-3" />
          <span>৯৯৯ SOS</span>
        </button>
      </div>

      {/* Top Segmented Tab Bar */}
      <div className="grid grid-cols-3 gap-1 p-1.5 bg-[#091019] border-b border-slate-800/80 font-bangla text-[11px]">
        <button
          onClick={() => setActiveTab('RIDE')}
          className={`py-1.5 px-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-1 ${
            activeTab === 'RIDE'
              ? 'bg-[#006A4E] text-white shadow-sm border border-emerald-400/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <span>১. রাইড বুকিং</span>
        </button>
        <button
          onClick={() => setActiveTab('INTERCITY')}
          className={`py-1.5 px-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-1 ${
            activeTab === 'INTERCITY'
              ? 'bg-[#006A4E] text-white shadow-sm border border-emerald-400/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <span>২. ঢাকা ইন্টারসিটি</span>
        </button>
        <button
          onClick={() => setActiveTab('SAFETY')}
          className={`py-1.5 px-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-1 ${
            activeTab === 'SAFETY'
              ? 'bg-rose-600 text-white shadow-sm border border-rose-400/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <span>৩. নিরাপত্তা ও ৯৯৯</span>
        </button>
      </div>

      {/* Scrollable Phone Viewport Body */}
      <div className="flex-1 overflow-y-auto phone-scroll p-3 space-y-2.5 bg-[#0B131E]">
        {activeTab === 'RIDE' && (
          <>
            {/* Interactive Leaflet Mini-Map */}
            <BhairabMiniMap
              pickup={pickup}
              dropoff={dropoff}
              driverLat={driverLat}
              driverLng={driverLng}
              driverName={driverName}
              vehicleType={selectedVehicle}
              rideStatus={activeRide?.status || 'IDLE'}
              sosActive={activeRide?.sosActive}
              heightClass="h-[162px]"
            />

            {/* Pickup & Dropoff Bhairab Landmark Selectors */}
            <div className="bg-[#111C2D] border border-slate-800 rounded-2xl p-2.5 space-y-2 relative">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] text-slate-400 font-bangla">
                    পিকআপ স্থান (Pickup Landmark)
                  </label>
                  <select
                    value={pickup.id}
                    disabled={activeRide !== null && activeRide.status !== 'IDLE'}
                    onChange={(e) => {
                      const found = BHAIRAB_LANDMARKS.find((l) => l.id === e.target.value);
                      if (found) onSelectPickup(found);
                    }}
                    className="w-full bg-transparent text-xs font-bangla font-semibold text-white focus:outline-none truncate cursor-pointer"
                  >
                    {BHAIRAB_LANDMARKS.map((l) => (
                      <option key={l.id} value={l.id} className="bg-[#0B131E] text-white">
                        {l.banglaName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-800/80 my-1 relative">
                <button
                  type="button"
                  onClick={onSwapLocations}
                  disabled={activeRide !== null && activeRide.status !== 'IDLE'}
                  title="Swap Pickup and Dropoff"
                  className="absolute right-1 -top-3.5 w-6 h-6 rounded-full bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-colors"
                >
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center shrink-0">
                  <Navigation className="w-3 h-3 text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] text-slate-400 font-bangla">
                    গন্তব্য স্থান (Dropoff Landmark)
                  </label>
                  <select
                    value={dropoff.id}
                    disabled={activeRide !== null && activeRide.status !== 'IDLE'}
                    onChange={(e) => {
                      const found = BHAIRAB_LANDMARKS.find((l) => l.id === e.target.value);
                      if (found) onSelectDropoff(found);
                    }}
                    className="w-full bg-transparent text-xs font-bangla font-semibold text-white focus:outline-none truncate cursor-pointer"
                  >
                    {BHAIRAB_LANDMARKS.map((l) => (
                      <option key={l.id} value={l.id} className="bg-[#0B131E] text-white">
                        {l.banglaName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {currentEstimate && (
                <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-bangla">
                  <span>📏 দূরত্ব: {currentEstimate.distanceKm} কিমি</span>
                  <span>⏱️ সম্ভাব্য সময়: ~{currentEstimate.estimatedMinutes} মিনিট</span>
                  <span className="text-emerald-400 font-semibold">
                    প্রস্তাবিত: ৳{currentEstimate.suggestedFareBdt}
                  </span>
                </div>
              )}
            </div>

            {/* Multi-Modal Vehicle Selector */}
            <div className="grid grid-cols-4 gap-1.5">
              {VEHICLE_OPTIONS.map((v) => {
                const est = fareEstimates.find((e) => e.vehicleType === v.type);
                const isSelected = selectedVehicle === v.type;
                return (
                  <button
                    key={v.type}
                    type="button"
                    disabled={activeRide !== null && activeRide.status !== 'IDLE'}
                    onClick={() => onSelectVehicle(v.type)}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                        : 'bg-[#111C2D] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-lg leading-none">{v.emoji}</span>
                    <span className="font-bangla font-bold text-[11px] mt-1">{v.banglaLabel}</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      ৳{est?.suggestedFareBdt ?? 80}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* STATE 1: IDLE / FARE NEGOTIATION OFFER BOX */}
            {(!activeRide || activeRide.status === 'IDLE') && (
              <div className="bg-gradient-to-b from-[#111C2D] to-[#0D1726] border border-slate-800 rounded-2xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> InDrive Fare Negotiation
                    </span>
                    <h3 className="font-bangla font-bold text-xs text-slate-200">
                      আপনার প্রস্তাবিত ভাড়া নির্ধারণ করুন
                    </h3>
                  </div>
                  <span className="text-[10px] font-bangla text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
                    সর্বনিম্ন ৳{currentEstimate?.minimumFareBdt ?? 20}
                  </span>
                </div>

                {/* -৳5 / +৳5 Adjuster */}
                <div className="flex items-center justify-between bg-[#0B131E] border border-slate-800 rounded-xl p-2">
                  <button
                    type="button"
                    onClick={() => onAdjustOfferFare(-5)}
                    className="w-11 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs flex items-center justify-center gap-0.5 transition-all"
                  >
                    <Minus className="w-3.5 h-3.5" /> ৳৫
                  </button>

                  <div className="text-center">
                    <div className="text-2xl font-extrabold text-emerald-400 tracking-tight">
                      ৳{offerFare}
                    </div>
                    <div className="text-[10px] font-bangla text-slate-400">
                      নগদ পেমেন্ট (Cash Only)
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAdjustOfferFare(5)}
                    className="w-11 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-300 font-bold text-xs flex items-center justify-center gap-0.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> ৳৫
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onRequestRide}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#006A4E] to-[#10B981] hover:from-[#047857] hover:to-[#34D399] active:scale-[0.99] text-white font-bangla font-bold text-sm shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 transition-all"
                >
                  <span>⚡ রাইড রিকোয়েস্ট পাঠান (Request Ride)</span>
                </button>
              </div>
            )}

            {/* STATE 2: SEARCHING & LIVE INCOMING DRIVER BIDS SHEET */}
            {activeRide && (activeRide.status === 'SEARCHING' || activeRide.status === 'BIDDING') && (
              <div className="bg-[#111C2D] border border-amber-500/40 rounded-2xl p-3 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    <span className="font-bangla font-bold text-xs text-amber-300">
                      {activeRide.bids.length === 0
                        ? 'আশেপাশের চালকদের কাছে রিকোয়েস্ট পাঠানো হয়েছে...'
                        : `লাইভ চালকের পাল্টা বিড (${activeRide.bids.length}টি)`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onResetRide}
                    className="text-[10px] text-slate-400 hover:text-rose-400 font-bangla underline"
                  >
                    বাতিল করুন
                  </button>
                </div>

                <div className="text-[11px] font-bangla text-slate-300 bg-[#0B131E] p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span>আপনার প্রস্তাবিত ভাড়া:</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    ৳{activeRide.initialOfferFare}
                  </span>
                </div>

                {activeRide.bids.length === 0 ? (
                  <div className="py-4 text-center space-y-1">
                    <Radio className="w-6 h-6 text-amber-400 mx-auto animate-spin" />
                    <p className="font-bangla text-xs text-slate-300">
                      ডানদিকের Driver Phone থেকে বিড করুন!
                    </p>
                    <p className="text-[10px] text-slate-400 font-bangla">
                      ভৈরব বাজার ৪ কিমি ব্যাসার্ধের চালকরা ভয়েস অ্যালার্ট পেয়েছেন
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeRide.bids.map((bid) => (
                      <div
                        key={bid.bidId}
                        className="bg-[#0B131E] border border-amber-500/50 rounded-xl p-2.5 flex items-center justify-between gap-2 animate-fadeIn"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bangla font-bold text-xs text-white truncate">
                              {bid.driverName}
                            </span>
                            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-bold flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              {bid.ratingAvg}
                            </span>
                          </div>
                          <p className="text-[10px] font-bangla text-slate-400 truncate">
                            {bid.vehicleModel} • ETA {bid.etaMinutes} মিনিট
                          </p>
                          <div className="text-xs font-extrabold text-amber-400">
                            প্রস্তাবিত বিড: ৳{bid.bidAmount}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onAcceptBid(bid)}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bangla font-bold text-xs shrink-0 shadow-md transition-all"
                        >
                          ✓ গ্রহণ করুন (Accept ৳{bid.bidAmount})
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STATE 3: ACTIVE RIDE ASSIGNED */}
            {activeRide && activeRide.status === 'ACCEPTED' && activeRide.assignedDriver && (
              <div className="bg-gradient-to-b from-[#0E221D] to-[#111C2D] border border-emerald-500/50 rounded-2xl p-3 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bangla font-bold">
                    ✓ চালক নির্ধারিত • যাত্রাপথে আছেন
                  </span>
                  <span className="text-xs font-extrabold text-emerald-400">
                    চূড়ান্ত ভাড়া: ৳{activeRide.agreedFare}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-[#0B131E]/90 p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <div className="font-bangla font-bold text-xs text-white flex items-center gap-1.5">
                      <span>{activeRide.assignedDriver.driverName}</span>
                      <span className="text-[10px] text-amber-400 font-bold">
                        ★ {activeRide.assignedDriver.rating}
                      </span>
                    </div>
                    <p className="text-[10px] font-bangla text-slate-400">
                      {activeRide.assignedDriver.vehicleModel}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-mono">
                      📞 {activeRide.assignedDriver.driverPhone}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 font-bangla text-[10px] font-bold">
                      ETA {activeRide.assignedDriver.etaMinutes} মিনিট
                    </span>
                  </div>
                </div>

                {/* Shareable WhatsApp Live Tracking Token + 999 SOS */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyWhatsAppLink}
                    className="py-2 px-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-bangla font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    {copiedTracking ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">লিংক কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>WhatsApp ট্র্যাকিং শেয়ার</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSosButtonClick}
                    className={`py-2 px-2.5 rounded-xl text-[10px] font-bangla font-bold flex items-center justify-center gap-1.5 transition-all ${
                      activeRide.sosActive
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>🚨 999 SOS অ্যালার্ট</span>
                  </button>
                </div>

                <div className="text-[10px] font-mono text-slate-400 bg-[#0B131E] px-2.5 py-1.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <span className="truncate">
                    🔗 cholobhairab.bd/track/{activeRide.liveTrackingToken}
                  </span>
                  <Copy
                    onClick={handleCopyWhatsAppLink}
                    className="w-3 h-3 text-slate-400 hover:text-white cursor-pointer shrink-0 ml-1"
                  />
                </div>
              </div>
            )}

            {/* STATE 4: COMPLETED RIDE RECEIPT */}
            {activeRide && activeRide.status === 'COMPLETED' && (
              <div className="bg-gradient-to-b from-emerald-950/60 to-[#111C2D] border border-emerald-500/50 rounded-2xl p-3 space-y-2.5 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div>
                  <h3 className="font-bangla font-bold text-sm text-white">
                    ভ্রমণ সফলভাবে সম্পন্ন হয়েছে!
                  </h3>
                  <p className="text-[11px] font-bangla text-slate-300">
                    চলো ভৈরব এর সাথে ভ্রমণের জন্য ধন্যবাদ
                  </p>
                </div>

                <div className="bg-[#0B131E] rounded-xl p-2.5 border border-slate-800 text-left space-y-1 text-[11px] font-bangla">
                  <div className="flex justify-between">
                    <span className="text-slate-400">চালক:</span>
                    <span className="text-white font-semibold">
                      {activeRide.assignedDriver?.driverName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">রুট:</span>
                    <span className="text-slate-200 truncate max-w-[190px]">
                      {activeRide.pickupLandmark.banglaName.split('(')[0]} →{' '}
                      {activeRide.dropoffLandmark.banglaName.split('(')[0]}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-400">পরিশোধিত নগদ ভাড়া:</span>
                    <span className="text-emerald-400 font-extrabold text-sm">
                      ৳{activeRide.agreedFare}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onResetRide}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bangla font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>নতুন রাইড বুক করুন</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* TAB 2: INTERCITY CORRIDOR CARPOOL & MICROBUS */}
        {activeTab === 'INTERCITY' && (
          <div className="space-y-2.5 font-bangla">
            <div className="bg-gradient-to-r from-[#006A4E]/40 to-[#111C2D] border border-emerald-500/30 rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs text-white">
                  ভৈরব ইন্টারসিটি হাইওয়ে কারপুল ও মাইক্রোবাস
                </h3>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                ঢাকা, কিশোরগঞ্জ ও ব্রাহ্মণবাড়িয়া রুটে সিট শেয়ারিং (৳৩০০/সিট) অথবা ফুল নোয়াই/হাইয়েস রিজার্ভ করুন।
              </p>
            </div>

            {/* Route Cards */}
            <div className="space-y-2">
              {INTERCITY_CORRIDORS.map((corridor) => {
                const isSelected = corridor.id === selectedCorridorId;
                return (
                  <div
                    key={corridor.id}
                    onClick={() => {
                      setSelectedCorridorId(corridor.id);
                      setSelectedTime(corridor.departureSchedule[0]);
                      setBookedIntercityTicket(null);
                    }}
                    className={`p-2.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500 shadow-md'
                        : 'bg-[#111C2D] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">
                        {corridor.corridorNameBangla}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                        {corridor.distanceKm} কিমি
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      পিকআপ: {corridor.pickupHubBangla} • সময়: {corridor.durationText}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-amber-300 font-bold">
                        💺 সিট শেয়ার: ৳{corridor.seatFareBdt}/সিট
                      </span>
                      <span className="text-emerald-300 font-bold">
                        🚐 ফুল মাইক্রোবাস: ৳{corridor.fullMicrobusFareBdt}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Booking Mode & Seat Count */}
            <div className="bg-[#111C2D] border border-slate-800 rounded-2xl p-3 space-y-2.5">
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setBookingMode('SEAT_SHARE')}
                  className={`py-2 rounded-xl font-bold border transition-all ${
                    bookingMode === 'SEAT_SHARE'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-[#0B131E] border-slate-800 text-slate-400'
                  }`}
                >
                  💺 সিট কারপুল (৳{selectedCorridor.seatFareBdt})
                </button>
                <button
                  type="button"
                  onClick={() => setBookingMode('FULL_RESERVE')}
                  className={`py-2 rounded-xl font-bold border transition-all ${
                    bookingMode === 'FULL_RESERVE'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-[#0B131E] border-slate-800 text-slate-400'
                  }`}
                >
                  🚐 ফুল রিজার্ভ (৳{selectedCorridor.fullMicrobusFareBdt})
                </button>
              </div>

              {bookingMode === 'SEAT_SHARE' && (
                <div className="flex items-center justify-between bg-[#0B131E] p-2 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-300">যাত্রী আসন সংখ্যা:</span>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSeatCount(num)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold ${
                          seatCount === num
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" /> সম্ভাব্য যাত্রার সময়সূচী:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCorridor.departureSchedule.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTime(slot)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border ${
                        selectedTime === slot
                          ? 'bg-emerald-600/30 border-emerald-400 text-white'
                          : 'bg-[#0B131E] border-slate-800 text-slate-400'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleBookIntercity}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#006A4E] to-[#10B981] text-white font-bold text-xs shadow-lg"
              >
                ✓ ইন্টারসিটি বুকিং নিশ্চিত করুন (মোট ৳{intercityTotalFare})
              </button>

              {bookedIntercityTicket && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-[11px] space-y-1">
                  <div className="font-bold text-emerald-300 flex items-center justify-between">
                    <span>🎉 বুকিং নিশ্চিত হয়েছে!</span>
                    <span className="font-mono">{bookedIntercityTicket.ticketNo}</span>
                  </div>
                  <p className="text-slate-200">{bookedIntercityTicket.corridor}</p>
                  <p className="text-slate-400">
                    ধরণ: {bookedIntercityTicket.mode} • সময়: {bookedIntercityTicket.time}
                  </p>
                  <p className="text-emerald-400 font-bold">
                    নির্ধারিত ভাড়া: ৳{bookedIntercityTicket.totalBdt} (চালক সোহেল রানা • টয়োটা নোয়াহ)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SAFETY & 999 EMERGENCY CENTER */}
        {activeTab === 'SAFETY' && (
          <div className="space-y-2.5 font-bangla">
            <div className="bg-gradient-to-br from-rose-950/70 to-[#111C2D] border border-rose-500/40 rounded-2xl p-3.5 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="font-bold text-sm text-white">
                জাতীয় জরুরি সেবা ৯৯৯ ও ভৈরব থানা কন্ট্রোল রুম
              </h3>
              <p className="text-[11px] text-slate-300">
                যেকোনো জরুরি পরিস্থিতিতে নিচের বাটনে চাপ দিলে আপনার লাইভ জিপিএস লোকেশন ডিসপ্যাচ সেন্টারে পৌঁছে যাবে।
              </p>
              <button
                type="button"
                onClick={handleSosButtonClick}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-rose-950/80 flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>
                  {activeRide?.sosActive
                    ? '✓ ৯৯৯ SOS অ্যালার্ট সক্রিয় আছে (সমাধান করতে চাপুন)'
                    : '🚨 জরুরি ৯৯৯ SOS অ্যালার্ট পাঠান'}
                </span>
              </button>
            </div>

            <div className="bg-[#111C2D] border border-slate-800 rounded-2xl p-3 space-y-2 text-xs">
              <h4 className="font-bold text-slate-200">ভৈরব নিরাপত্তা হটলাইন তালিকা:</h4>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-300">🚓 ভৈরব মডেল থানা ডিউটি অফিসার</span>
                <span className="font-mono text-emerald-400 font-bold">01320-108944</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-300">🛣️ ভৈরব হাইওয়ে পুলিশ (মেঘনা ব্রিজ)</span>
                <span className="font-mono text-emerald-400 font-bold">01320-185420</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-300">🏥 ভৈরব উপজেলা স্বাস্থ্য কমপ্লেক্স</span>
                <span className="font-mono text-emerald-400 font-bold">999 / 16263</span>
              </div>
            </div>

            <div className="bg-[#111C2D] border border-slate-800 rounded-2xl p-3 space-y-2">
              <h4 className="font-bold text-xs text-emerald-300">
                পরিবারের সাথে লাইভ ট্র্যাকিং শেয়ার (WhatsApp)
              </h4>
              <p className="text-[11px] text-slate-400">
                রাইড চলাকালীন আপনার পরিবারের সদস্যরা অ্যাপ ছাড়াই ব্রাউজারে আপনার ইজিবাইক/সিএনজি লাইভ দেখতে পারবেন।
              </p>
              <button
                type="button"
                onClick={handleCopyWhatsAppLink}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>
                  {copiedTracking ? '✓ ট্র্যাকিং লিংক কপি হয়েছে!' : 'লাইভ ট্র্যাকিং লিংক কপি করুন'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Smartphone Bottom Navigation Bar */}
      <div className="px-4 py-2 bg-[#070D15] border-t border-slate-800/90 grid grid-cols-3 gap-2 text-[10px] font-bangla">
        <button
          onClick={() => setActiveTab('RIDE')}
          className={`flex flex-col items-center gap-0.5 py-1 rounded-xl ${
            activeTab === 'RIDE' ? 'text-emerald-400 font-bold' : 'text-slate-500'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>ভৈরব রাইড</span>
        </button>
        <button
          onClick={() => setActiveTab('INTERCITY')}
          className={`flex flex-col items-center gap-0.5 py-1 rounded-xl ${
            activeTab === 'INTERCITY' ? 'text-emerald-400 font-bold' : 'text-slate-500'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>ইন্টারসিটি</span>
        </button>
        <button
          onClick={() => setActiveTab('SAFETY')}
          className={`flex flex-col items-center gap-0.5 py-1 rounded-xl ${
            activeTab === 'SAFETY' ? 'text-rose-400 font-bold' : 'text-slate-500'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>৯৯৯ নিরাপত্তা</span>
        </button>
      </div>
    </div>
  );
};
