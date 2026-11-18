import React, { useState } from 'react';
import {
  ActiveRide,
  AdminLiveEvent,
  BhairabLandmarkData,
  OnlineDriver,
  OverviewStats,
  VehicleType,
} from '../types/admin';
import { BhairabMap, RIDE_STATUS_LABEL, VehicleLabel } from '../components/BhairabMap';
import { Check, Lock, Volume2 } from 'lucide-react';

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

const EVENT_LABEL: Record<string, string> = {
  RIDE_REQUESTED: 'রাইড অনুরোধ',
  NEW_BID: 'পাল্টা প্রস্তাব',
  BID_ACCEPTED: 'প্রস্তাব গৃহীত',
  RIDE_COMPLETED: 'ট্রিপ সম্পন্ন',
  WALLET_TOPUP: 'রিচার্জ',
  KYC_UPDATED: 'KYC',
  SOS_ALERT: 'SOS',
  DRIVER_ONLINE: 'চালক অনলাইন',
  DRIVER_LOCATION: 'লোকেশন',
};

const statusDot = (ride: ActiveRide) =>
  ride.sosActive
    ? 'bg-danger'
    : ride.status === 'SEARCHING' || ride.status === 'BIDDING'
    ? 'bg-warning'
    : ride.status === 'COMPLETED' || ride.status === 'CANCELLED'
    ? 'bg-ink-3'
    : 'bg-brand-text';

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const bdt = (n: number) => `৳${n.toLocaleString('en-IN')}`;

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

  const kpis: {
    label: string;
    value: string | number;
    sub?: string;
    onClick?: () => void;
  }[] = [
    { label: 'অনলাইন চালক', value: stats.onlineDriversCount },
    {
      label: 'চলমান রাইড',
      value: stats.activeRidesCount,
      sub: `${stats.completedRidesCount} সম্পন্ন`,
    },
    {
      label: 'কমিশন আয় (৮%)',
      value: bdt(stats.totalCommissionBdt),
      sub: `GMV ${bdt(stats.totalGmvBdt)}`,
      onClick: () => onNavigateTab('wallet'),
    },
    {
      label: 'কম ব্যালেন্স',
      value: stats.lowBalanceDriversCount,
      sub: '৳৫০-এর নিচে',
      onClick: () => onNavigateTab('wallet'),
    },
    {
      label: 'অপেক্ষমাণ KYC',
      value: stats.pendingKycCount,
      onClick: () => onNavigateTab('kyc'),
    },
  ];

  return (
    <div className="space-y-4">
      {/* KPI row: numbers only, one quiet strip */}
      <div className="flex flex-wrap gap-px bg-line border border-line rounded-lg overflow-hidden">
        {kpis.map((kpi) => {
          const body = (
            <>
              <div className="text-xs text-ink-3">{kpi.label}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-semibold font-mono tabular-nums text-ink">
                  {kpi.value}
                </span>
                {kpi.sub && (
                  <span className="text-xs font-mono tabular-nums text-ink-3">{kpi.sub}</span>
                )}
              </div>
            </>
          );
          const cell = 'flex-1 basis-40 bg-surface px-4 py-3 text-left';
          return kpi.onClick ? (
            <button
              key={kpi.label}
              type="button"
              onClick={kpi.onClick}
              className={`${cell} hover:bg-raised transition-colors duration-150 ease-out`}
            >
              {body}
            </button>
          ) : (
            <div key={kpi.label} className={cell}>
              {body}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: map + drivers */}
        <div className="lg:col-span-8 space-y-4 min-w-0">
          <BhairabMap
            landmarks={landmarks}
            drivers={onlineDrivers}
            activeRides={activeRides}
            selectedVehicleFilter={vehicleFilter}
            onSelectVehicleFilter={setVehicleFilter}
          />

          <section className="bg-surface border border-line rounded-lg" aria-labelledby="drivers-heading">
            <div className="px-4 py-3 border-b border-line flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h3 id="drivers-heading" className="text-sm font-semibold text-ink">
                  অনলাইন চালক
                </h3>
                <p className="text-xs text-ink-3 mt-0.5">
                  ব্যালেন্স ৳৫০-এর নিচে থাকলে চালক নতুন ট্রিপে বিড করতে পারেন না।
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('wallet')}
                className="text-[13px] text-brand-text hover:text-ink transition-colors duration-150 ease-out"
              >
                ওয়ালেট লেজার দেখুন
              </button>
            </div>

            {onlineDrivers.length === 0 ? (
              <p className="px-4 py-6 text-sm text-ink-2">
                এখন কোনো চালক অনলাইনে নেই। চালক অ্যাপে অনলাইন হলে এখানে দেখাবে।
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-xs text-ink-3 border-b border-line">
                      <th className="font-medium px-4 py-2">চালক</th>
                      <th className="font-medium px-4 py-2">যান</th>
                      <th className="font-medium px-4 py-2">ফোন</th>
                      <th className="font-medium px-4 py-2 text-right">রেটিং</th>
                      <th className="font-medium px-4 py-2 text-right">ব্যালেন্স</th>
                      <th className="font-medium px-4 py-2 text-right">
                        <span className="sr-only">রিচার্জ</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {onlineDrivers.map((driver) => {
                      const isLow = driver.walletBalance < 50;
                      return (
                        <tr key={driver.driverId}>
                          <td className="px-4 py-2.5">
                            <div className="text-ink font-medium">{driver.driverName}</div>
                            <div className="text-xs text-ink-3">{driver.vehicleModel}</div>
                          </td>
                          <td className="px-4 py-2.5 text-ink-2">
                            <VehicleLabel type={driver.vehicleType} />
                          </td>
                          <td className="px-4 py-2.5 font-mono tabular-nums text-ink-2 whitespace-nowrap">
                            {driver.driverPhone}
                          </td>
                          <td className="px-4 py-2.5 font-mono tabular-nums text-ink-2 text-right">
                            {driver.rating}
                          </td>
                          <td className="px-4 py-2.5 text-right whitespace-nowrap">
                            <span
                              className={`font-mono tabular-nums ${isLow ? 'text-danger' : 'text-ink'}`}
                            >
                              ৳{driver.walletBalance.toFixed(0)}
                            </span>
                            {isLow && (
                              <div className="text-xs text-danger flex items-center justify-end gap-1">
                                <Lock className="w-3 h-3" aria-hidden /> বিড বন্ধ
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {isLow && (
                              <button
                                type="button"
                                onClick={() => onQuickTopup(driver.driverId, 100)}
                                className="h-8 px-2.5 rounded-md border border-line text-[13px] text-ink hover:bg-raised transition-colors duration-150 ease-out whitespace-nowrap"
                              >
                                +৳১০০ রিচার্জ
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right: bids and event log */}
        <div className="lg:col-span-4 flex flex-col gap-4 min-w-0">
          <section className="bg-surface border border-line rounded-lg" aria-labelledby="bids-heading">
            <div className="px-4 py-3 border-b border-line flex items-baseline justify-between">
              <h3 id="bids-heading" className="text-sm font-semibold text-ink">
                ভাড়া দর কষাকষি
              </h3>
              <span className="text-xs text-ink-3">
                <span className="font-mono tabular-nums">{activeRides.length}</span> রাইড
              </span>
            </div>

            {activeRides.length === 0 ? (
              <div className="px-4 py-6 space-y-3">
                <p className="text-sm text-ink-2">এখন কোনো রাইডে দর কষাকষি চলছে না।</p>
                <button
                  type="button"
                  onClick={onSimulateRide}
                  disabled={isSimulating}
                  className="h-8 px-3 rounded-md border border-line text-[13px] text-ink hover:bg-raised disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 ease-out"
                >
                  {isSimulating ? 'সিমুলেশন চলছে…' : 'একটি রাইড সিমুলেট করুন'}
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-line max-h-[460px] overflow-y-auto">
                {activeRides.map((ride) => {
                  const voiceText =
                    ride.voiceBroadcastBangla ||
                    `নতুন ট্রিপ রিকোয়েস্ট: ${ride.pickupAddress} থেকে ${ride.dropoffAddress}, যাত্রীর প্রস্তাবিত ভাড়া ${ride.initialOfferFare} টাকা।`;
                  const speaking = speakingRideId === ride.id;

                  return (
                    <li
                      key={ride.id}
                      className={`px-4 py-3 space-y-2 text-[13px] ${ride.sosActive ? 'bg-danger/10' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-ink-2">
                          <VehicleLabel type={ride.vehicleType} />
                        </span>
                        <span
                          className={`flex items-center gap-1.5 ${
                            ride.sosActive ? 'text-danger font-medium' : 'text-ink-2'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusDot(ride)}`} aria-hidden />
                          {ride.sosActive ? 'SOS সক্রিয়' : RIDE_STATUS_LABEL[ride.status] || ride.status}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-ink font-medium">{ride.passengerName}</span>
                          <span className="font-mono tabular-nums text-xs text-ink-3">
                            {ride.passengerPhone}
                          </span>
                        </div>
                        <p className="text-ink-2 mt-0.5">
                          {ride.pickupAddress} → {ride.dropoffAddress}
                        </p>
                      </div>

                      <div className="flex items-start gap-2">
                        <p className="flex-1 text-xs text-ink-2 font-bangla leading-relaxed">
                          &ldquo;{voiceText}&rdquo;
                        </p>
                        <button
                          type="button"
                          onClick={() => speakBanglaPrompt(ride)}
                          className="shrink-0 h-7 px-2 rounded-md border border-line text-xs text-ink-2 hover:text-ink hover:bg-raised flex items-center gap-1 transition-colors duration-150 ease-out"
                        >
                          <Volume2 className="w-3.5 h-3.5" aria-hidden />
                          {speaking ? 'বাজছে…' : 'শুনুন'}
                        </button>
                      </div>

                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-ink-3">যাত্রীর প্রস্তাব</span>
                        <span className="font-mono tabular-nums text-sm text-ink">
                          ৳{ride.initialOfferFare}
                        </span>
                      </div>
                      {ride.finalAgreedFare && (
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="text-ink-3">
                            চূড়ান্ত ভাড়া · কমিশন{' '}
                            <span className="font-mono tabular-nums">
                              ৳{Math.round(ride.finalAgreedFare * 0.08)}
                            </span>
                          </span>
                          <span className="font-mono tabular-nums text-sm text-brand-text">
                            ৳{ride.finalAgreedFare}
                          </span>
                        </div>
                      )}

                      {ride.bids && ride.bids.length > 0 && (
                        <ul className="border-t border-line pt-2 space-y-1">
                          {ride.bids.map((bid) => {
                            const isAccepted = ride.selectedDriverId === bid.driverId;
                            return (
                              <li key={bid.id} className="flex items-baseline justify-between gap-2 text-xs">
                                <span className="min-w-0 truncate">
                                  <span className="text-ink">{bid.driverName}</span>
                                  <span className="text-ink-3">
                                    {' '}
                                    · {bid.ratingAvg} · {bid.etaMinutes} মিনিট দূরে
                                  </span>
                                </span>
                                <span className="shrink-0 flex items-center gap-1.5">
                                  {isAccepted && (
                                    <span className="flex items-center gap-0.5 text-brand-text">
                                      <Check className="w-3 h-3" aria-hidden /> গৃহীত
                                    </span>
                                  )}
                                  <span
                                    className={`font-mono tabular-nums text-[13px] ${
                                      isAccepted ? 'text-brand-text' : 'text-warning'
                                    }`}
                                  >
                                    ৳{bid.bidAmount}
                                  </span>
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="bg-surface border border-line rounded-lg flex-1 flex flex-col" aria-labelledby="events-heading">
            <div className="px-4 py-3 border-b border-line flex items-baseline justify-between">
              <h3 id="events-heading" className="text-sm font-semibold text-ink">
                ইভেন্ট লগ
              </h3>
              <span className="text-xs text-ink-3">
                <span className="font-mono tabular-nums">{liveEvents.length}</span> টি
              </span>
            </div>

            {liveEvents.length === 0 ? (
              <p className="px-4 py-6 text-sm text-ink-2">
                এখনো কোনো ইভেন্ট আসেনি। সার্ভার থেকে নতুন রাইড, বিড বা রিচার্জ এলে এখানে দেখাবে।
              </p>
            ) : (
              <ol className="max-h-[260px] overflow-y-auto py-1 text-xs" aria-live="polite">
                {liveEvents.map((ev) => {
                  const message =
                    ev.payload?.messageBangla ||
                    ev.payload?.voicePromptBangla ||
                    ev.payload?.transaction?.noteBangla ||
                    ev.payload?.ride?.pickupAddress ||
                    JSON.stringify(ev.payload).slice(0, 90);
                  const isSos = ev.type === 'SOS_ALERT';
                  return (
                    <li
                      key={ev.id}
                      className={`grid grid-cols-[auto_6.5rem_1fr] gap-3 px-4 py-1 ${
                        isSos ? 'text-danger' : 'text-ink-2'
                      }`}
                    >
                      <time className="font-mono tabular-nums text-ink-3">
                        {formatTime(ev.timestamp)}
                      </time>
                      <span className={`truncate ${isSos ? 'font-medium' : 'text-ink'}`}>
                        {EVENT_LABEL[ev.type] || ev.type}
                      </span>
                      <span className="truncate font-bangla" title={message}>
                        {message}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
