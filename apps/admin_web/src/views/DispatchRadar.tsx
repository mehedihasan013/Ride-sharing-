import React, { useState } from 'react';
import {
  ActiveRide,
  AdminLiveEvent,
  BhairabLandmarkData,
  OnlineDriver,
  OverviewStats,
  VehicleType,
} from '../types/admin';
import { BhairabMap } from '../components/BhairabMap';
import {
  Activity,
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  Mic,
  Navigation2,
  PhoneCall,
  Radio,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  Volume2,
  Wallet,
} from 'lucide-react';

interface DispatchRadarProps {
  stats: OverviewStats;
  onlineDrivers: OnlineDriver[];
  activeRides: ActiveRide[];
  landmarks: BhairabLandmarkData[];
  liveEvents: AdminLiveEvent[];
  onSimulateRide: () => void;
  isSimulating: boolean;
  onQuickTopup: (driverId: string, amountBdt: number) => Promise<void>;
  onNavigateTab: (tab: 'dispatch' | 'kyc' | 'wallet' | 'landmarks' | 'safety') => void;
}

const VEHICLE_BADGE: Record<VehicleType, { label: string; emoji: string; cls: string }> = {
  EASYBIKE: {
    label: 'ইজিবাইক • Easy-Bike',
    emoji: '🛺',
    cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  CNG: {
    label: 'সিএনজি • CNG',
    emoji: '🛺',
    cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  },
  BIKE: {
    label: 'বাইক • Bike',
    emoji: '🏍️',
    cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  CAR_MICROBUS: {
    label: 'মাইক্রোবাস • Microbus',
    emoji: '🚐',
    cls: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
};

export const DispatchRadar: React.FC<DispatchRadarProps> = ({
  stats,
  onlineDrivers,
  activeRides,
  landmarks,
  liveEvents,
  onSimulateRide,
  isSimulating,
  onQuickTopup,
  onNavigateTab,
}) => {
  const [vehicleFilter, setVehicleFilter] = useState<VehicleType | 'ALL'>('ALL');
  const [speakingRideId, setSpeakingRideId] = useState<string | null>(null);

  const speakBanglaPrompt = (ride: ActiveRide) => {
    const text =
      ride.voiceBroadcastBangla ||
      `নতুন ট্রিপ রিকোয়েস্ট: ${ride.pickupAddress} থেকে ${ride.dropoffAddress}, যাত্রীর প্রস্তাবিত ভাড়া ${ride.initialOfferFare} টাকা।`;

    setSpeakingRideId(ride.id);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'bn-BD';
      utterance.rate = 0.95;
      utterance.onend = () => setSpeakingRideId(null);
      utterance.onerror = () => setSpeakingRideId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setSpeakingRideId(null), 3000);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Online Fleet */}
        <div className="glass-card glass-card-hover rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                অনলাইন ফ্লিট • Online Fleet
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-white">
                  {stats.onlineDriversCount}
                </span>
                <span className="text-xs text-slate-400">সক্রিয় চালক (Active)</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 font-medium">
              🛺 ইজিবাইক: {stats.vehicleBreakdown?.EASYBIKE ?? 2}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 font-medium">
              🛺 সিএনজি: {stats.vehicleBreakdown?.CNG ?? 2}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 font-medium">
              🏍️ বাইক: {stats.vehicleBreakdown?.BIKE ?? 1}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 font-medium">
              🚐 মাইক্রো: {stats.vehicleBreakdown?.CAR_MICROBUS ?? 1}
            </span>
          </div>
        </div>

        {/* Card 2: Active Bidding Rides */}
        <div className="glass-card glass-card-hover rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                চলমান বিডিং রাইড • Active Bidding
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-white">
                  {stats.activeRidesCount}
                </span>
                <span className="text-xs text-amber-300 font-medium">
                  • সম্পন্ন: {stats.completedRidesCount} ট্রিপ
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Radio className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">InDrive হ্যাগলিং ও ভয়েস ব্রডকাস্ট</span>
            <button
              onClick={onSimulateRide}
              disabled={isSimulating}
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSimulating ? 'চলছে...' : 'সিমুলেট করুন'}</span>
            </button>
          </div>
        </div>

        {/* Card 3: Platform 8% Commission Revenue & GMV */}
        <div className="glass-card glass-card-hover rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#E2136E]">
                ৮% কমিশন আয় • 8% Commission
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-white">
                  ৳{stats.totalCommissionBdt.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-emerald-400 font-semibold">BDT</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#E2136E]/15 border border-[#E2136E]/30 flex items-center justify-center text-[#E2136E]">
              <Banknote className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              মোট ভাড়া লেনদেন (GMV):{' '}
              <strong className="text-slate-200">৳{stats.totalGmvBdt.toLocaleString('en-IN')}</strong>
            </span>
            <button
              onClick={() => onNavigateTab('wallet')}
              className="text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>লেজার →</span>
            </button>
          </div>
        </div>

        {/* Card 4: Low-Balance / Pending KYC Alerts */}
        <div className="glass-card glass-card-hover rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                সতর্কতা ও KYC • Fleet Alerts
              </p>
              <div className="flex items-baseline gap-3 mt-1">
                <div>
                  <span className="text-2xl font-extrabold text-rose-400">
                    {stats.lowBalanceDriversCount}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">লো-ব্যালেন্স (&lt;৫০৳)</span>
                </div>
                <span className="text-slate-600">|</span>
                <div>
                  <span className="text-2xl font-extrabold text-amber-400">
                    {stats.pendingKycCount}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">অপেক্ষমাণ KYC</span>
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <button
              onClick={() => onNavigateTab('wallet')}
              className="text-rose-400 hover:text-rose-300 font-semibold"
            >
              🔒 বিকাশ রিচার্জ আনলক
            </button>
            <button
              onClick={() => onNavigateTab('kyc')}
              className="text-amber-400 hover:text-amber-300 font-semibold"
            >
              📋 KYC যাচাই করুন →
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Grid: Left 8 Cols (Map + Fleet Matrix) | Right 4 Cols (Live InDrive Bidding & Voice Feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Map & Active Fleet Status */}
        <div className="lg:col-span-8 space-y-5">
          <BhairabMap
            landmarks={landmarks}
            drivers={onlineDrivers}
            activeRides={activeRides}
            selectedVehicleFilter={vehicleFilter}
            onSelectVehicleFilter={setVehicleFilter}
          />

          {/* Online Drivers Quick Telemetry Matrix */}
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>অনলাইন চালক ও প্রিপেইড ওয়ালেট ম্যাট্রিক্স</span>
                  <span className="text-xs font-normal text-slate-400">
                    • Live Bhairab Fleet Telemetry
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  ৫০ টাকার নিচে ব্যালেন্স থাকলে চালক নতুন ট্রিপে বিড করতে পারবেন না (Prepaid Commission Lock)
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('wallet')}
                className="px-3 py-1.5 rounded-xl bg-[#E2136E]/15 hover:bg-[#E2136E]/25 text-pink-300 border border-[#E2136E]/30 text-xs font-semibold transition-all"
              >
                ৳ সম্পূর্ণ বিকাশ লেজার
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {onlineDrivers.map((driver) => {
                const badge = VEHICLE_BADGE[driver.vehicleType] || VEHICLE_BADGE.EASYBIKE;
                const isLow = driver.walletBalance < 50;
                return (
                  <div
                    key={driver.driverId}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isLow
                        ? 'bg-rose-950/25 border-rose-500/40'
                        : 'bg-[#0E1726]/90 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.cls}`}
                        >
                          {badge.emoji} {badge.label.split('•')[0]}
                        </span>
                        <span className="text-xs font-semibold text-amber-400">
                          ★ {driver.rating}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white truncate mt-1">
                        {driver.driverName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {driver.vehicleModel} • 📞 {driver.driverPhone}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-sm font-extrabold ${
                          isLow ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        ৳{driver.walletBalance.toFixed(0)} BDT
                      </div>
                      {isLow ? (
                        <button
                          onClick={() => onQuickTopup(driver.driverId, 100)}
                          className="mt-1 px-2.5 py-1 rounded-lg bg-[#E2136E] hover:bg-[#c81060] text-white text-[11px] font-bold shadow-md shadow-[#E2136E]/30 transition-all"
                        >
                          +৳১০০ বিকাশ আনলক
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-400/90 font-medium">
                          ✓ বিডিং সক্রিয়
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: InDrive Real-Time Bidding & Voice Feed */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Active Bidding Cards & Bangla Voice Broadcast */}
          <div className="glass-card rounded-2xl p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    ইনড্রাইভ লাইভ বিডিং ও ভয়েস ফিড
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    InDrive Fare Negotiation &amp; Bangla TTS
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {activeRides.length} সক্রিয়
              </span>
            </div>

            <div className="mt-3 space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {activeRides.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl bg-slate-900/50 border border-white/5">
                  <Radio className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">
                    এই মুহূর্তে কোনো চলমান বিডিং নেই
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    উপরে &ldquo;⚡ লাইভ রাইড সিমুলেশন&rdquo; বাটনে ক্লিক করে ভৈরব রাইড ও বিডিং দেখুন!
                  </p>
                </div>
              ) : (
                activeRides.map((ride) => {
                  const badge = VEHICLE_BADGE[ride.vehicleType] || VEHICLE_BADGE.EASYBIKE;
                  const voiceText =
                    ride.voiceBroadcastBangla ||
                    `নতুন ট্রিপ রিকোয়েস্ট: ${ride.pickupAddress} থেকে ${ride.dropoffAddress}, যাত্রীর প্রস্তাবিত ভাড়া ${ride.initialOfferFare} টাকা।`;

                  return (
                    <div
                      key={ride.id}
                      className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                        ride.sosActive
                          ? 'bg-rose-950/30 border-rose-500/60'
                          : ride.status === 'COMPLETED'
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : 'bg-[#0D1624] border-white/10'
                      }`}
                    >
                      {/* Ride Header */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.cls}`}
                        >
                          {badge.emoji} {badge.label}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ride.sosActive
                              ? 'bg-rose-500 text-white animate-pulse'
                              : ride.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : ride.status === 'ACCEPTED'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {ride.sosActive ? '🚨 999 SOS' : ride.status}
                        </span>
                      </div>

                      {/* Passenger & Route */}
                      <div className="text-xs space-y-1">
                        <div className="font-bold text-white flex items-center justify-between">
                          <span>👤 {ride.passengerName}</span>
                          <span className="text-slate-400 font-normal flex items-center gap-1">
                            <PhoneCall className="w-3 h-3" /> {ride.passengerPhone}
                          </span>
                        </div>
                        <div className="text-slate-300 flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">●</span>
                          <span>পিকআপ: {ride.pickupAddress}</span>
                        </div>
                        <div className="text-slate-300 flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">🏁</span>
                          <span>গন্তব্য: {ride.dropoffAddress}</span>
                        </div>
                      </div>

                      {/* Bangla Voice Prompt Transcript Box */}
                      <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/25 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                            <Volume2 className="w-3.5 h-3.5" /> বাংলা ভয়েস ব্রডকাস্ট (TTS)
                          </span>
                          <button
                            onClick={() => speakBanglaPrompt(ride)}
                            className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-[10px] font-semibold transition-all"
                          >
                            {speakingRideId === ride.id ? '🔊 বাজছে...' : '🔊 ভয়েস শুনুন'}
                          </button>
                        </div>
                        <p className="text-emerald-100/90 font-bangla leading-relaxed italic">
                          &ldquo;{voiceText}&rdquo;
                        </p>
                      </div>

                      {/* Fare Offer & Counter-Bids */}
                      <div className="pt-1 border-t border-white/5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">যাত্রীর প্রস্তাবিত ভাড়া:</span>
                          <span className="font-bold text-white text-sm">
                            ৳{ride.initialOfferFare} BDT
                          </span>
                        </div>
                        {ride.finalAgreedFare && (
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="text-emerald-400 font-semibold">
                              চূড়ান্ত গৃহীত ভাড়া (৮% কমিশন: ৳
                              {Math.round(ride.finalAgreedFare * 0.08)}):
                            </span>
                            <span className="font-extrabold text-emerald-400 text-sm">
                              ৳{ride.finalAgreedFare} BDT
                            </span>
                          </div>
                        )}

                        {/* Driver Counter-Bids List */}
                        {ride.bids && ride.bids.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            <p className="text-[11px] font-semibold text-amber-300">
                              চালকদের পাল্টা প্রস্তাব (Driver Counter-Bids • {ride.bids.length}):
                            </p>
                            {ride.bids.map((bid) => {
                              const isAccepted = ride.selectedDriverId === bid.driverId;
                              return (
                                <div
                                  key={bid.id}
                                  className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between ${
                                    isAccepted
                                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                                      : 'bg-amber-500/10 border-amber-500/25 text-amber-100'
                                  }`}
                                >
                                  <div>
                                    <span className="font-bold">{bid.driverName}</span>
                                    <span className="text-[10px] text-amber-300 ml-1.5">
                                      ★ {bid.ratingAvg} • {bid.etaMinutes} মিনিট দূরে
                                    </span>
                                  </div>
                                  <div className="font-extrabold text-amber-400">
                                    ৳{bid.bidAmount}{' '}
                                    {isAccepted && (
                                      <span className="text-emerald-300 text-[10px] ml-1">
                                        ✓ গৃহীত
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Real-Time Socket Event Stream */}
          <div className="glass-card rounded-2xl p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  লাইভ ইভেন্ট স্ট্রিম • Socket Telemetry
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {liveEvents.length} events
              </span>
            </div>

            <div className="mt-3 space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {liveEvents.map((ev) => {
                let badgeCls = 'bg-slate-800 text-slate-300 border-white/10';
                if (ev.type === 'RIDE_REQUESTED')
                  badgeCls = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                if (ev.type === 'NEW_BID')
                  badgeCls = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                if (ev.type === 'BID_ACCEPTED' || ev.type === 'RIDE_COMPLETED')
                  badgeCls = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
                if (ev.type === 'WALLET_TOPUP')
                  badgeCls = 'bg-[#E2136E]/20 text-pink-300 border-[#E2136E]/40';
                if (ev.type === 'SOS_ALERT')
                  badgeCls = 'bg-rose-500/25 text-rose-300 border-rose-500/50';

                return (
                  <div
                    key={ev.id}
                    className="p-2.5 rounded-xl bg-[#0D1624] border border-white/5 text-xs flex items-start justify-between gap-2"
                  >
                    <div className="space-y-1 min-w-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${badgeCls}`}
                      >
                        {ev.type}
                      </span>
                      <p className="text-slate-200 font-bangla leading-snug break-words">
                        {ev.payload?.messageBangla ||
                          ev.payload?.voicePromptBangla ||
                          ev.payload?.transaction?.noteBangla ||
                          ev.payload?.ride?.pickupAddress ||
                          JSON.stringify(ev.payload).slice(0, 90)}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(ev.timestamp).toLocaleTimeString('en-US', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
