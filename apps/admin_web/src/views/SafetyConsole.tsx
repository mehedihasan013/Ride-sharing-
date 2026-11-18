import React, { useState } from 'react';
import { ActiveRide, OnlineDriver } from '../types/admin';
import { Check, CheckCircle2, Copy, Siren } from 'lucide-react';

interface SafetyConsoleProps {
  activeRides: ActiveRide[];
  onlineDrivers: OnlineDriver[];
  onTriggerDemoSos: () => Promise<void>;
  onResolveSos: (rideId: string) => Promise<void>;
}

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

export const SafetyConsole: React.FC<SafetyConsoleProps> = ({
  activeRides,
  onlineDrivers,
  onTriggerDemoSos,
  onResolveSos,
}) => {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const sosRides = activeRides.filter((r) => r.sosActive);

  const handleCopyLink = (token: string) => {
    const shareUrl = `${window.location.origin}/rides/track/${token}`;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleResolve = async (rideId: string) => {
    setResolvingId(rideId);
    try {
      await onResolveSos(rideId);
    } finally {
      setResolvingId(null);
    }
  };

  const copyBtn = (token: string) => (
    <button
      type="button"
      onClick={() => handleCopyLink(token)}
      className="h-8 px-2.5 rounded-md border border-line text-[13px] text-ink hover:bg-raised flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-colors duration-150 ease-out"
    >
      {copiedToken === token ? (
        <>
          <Check className="w-3.5 h-3.5 text-brand-text" aria-hidden /> কপি হয়েছে
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" aria-hidden /> লিংক কপি
        </>
      )}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold text-ink">জরুরি SOS</h2>
          <p className="text-[13px] text-ink-2 mt-1">
            যাত্রী বা চালক অ্যাপে SOS চাপলে তার জিপিএস লোকেশন ও লাইভ ট্র্যাকিং লিংক এখানে আসে।
            ব্যবস্থা নেওয়ার পর সমাধান হিসেবে চিহ্নিত করুন।
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-xs">
            <div className="text-ink-3">ভৈরব থানা কন্ট্রোল রুম</div>
            <div className="font-mono tabular-nums text-sm text-ink mt-0.5">০১৭১৩-৩৭৩৪৮৫ · ৯৯৯</div>
          </div>
          <button
            type="button"
            onClick={onTriggerDemoSos}
            className="h-9 px-3 rounded-md border border-danger/40 text-danger text-[13px] hover:bg-danger/10 flex items-center gap-1.5 transition-colors duration-150 ease-out"
          >
            <Siren className="w-4 h-4" aria-hidden />
            পরীক্ষামূলক SOS
          </button>
        </div>
      </div>

      <section aria-labelledby="sos-heading" className="space-y-3">
        <h3 id="sos-heading" className="text-sm font-semibold text-ink flex items-center gap-2">
          সক্রিয় SOS
          <span className={`font-mono tabular-nums ${sosRides.length > 0 ? 'text-danger' : 'text-ink-3'}`}>
            {sosRides.length}
          </span>
        </h3>

        {sosRides.length === 0 ? (
          <div className="bg-surface border border-line rounded-lg px-4 py-6 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-brand-text shrink-0 mt-0.5" aria-hidden />
            <div>
              <p className="text-sm text-ink">এখন কোনো সক্রিয় SOS নেই</p>
              <p className="text-[13px] text-ink-2 mt-1">
                সব চলমান ট্রিপ স্বাভাবিক আছে। মহড়ার জন্য &ldquo;পরীক্ষামূলক SOS&rdquo; চাপুন।
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {sosRides.map((ride) => {
              const assignedDriver =
                onlineDrivers.find((d) => d.driverId === ride.selectedDriverId) ||
                onlineDrivers[0];
              const trackPath = `/rides/track/${ride.liveTrackingToken}`;
              const resolving = resolvingId === ride.id;

              return (
                <article
                  key={ride.id}
                  role="alert"
                  className="bg-surface border border-danger/60 rounded-lg"
                >
                  <header className="px-4 py-3 border-b border-danger/30 bg-danger/10 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-danger">
                      <span className="pulse-sos h-2 w-2 rounded-full bg-danger" aria-hidden />
                      SOS সক্রিয়
                      {ride.sosTriggeredAt && (
                        <span className="font-mono tabular-nums text-xs font-normal">
                          {formatTime(ride.sosTriggeredAt)}
                        </span>
                      )}
                    </span>
                    <span className="text-xs font-mono text-ink-3">{ride.id}</span>
                  </header>

                  <dl className="px-4 py-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
                    <dt className="text-ink-3">যাত্রী</dt>
                    <dd className="text-ink">
                      {ride.passengerName}{' '}
                      <span className="font-mono tabular-nums text-ink-2">{ride.passengerPhone}</span>
                    </dd>
                    <dt className="text-ink-3">চালক</dt>
                    <dd className="text-ink">
                      {assignedDriver ? (
                        <>
                          {assignedDriver.driverName}{' '}
                          <span className="font-mono tabular-nums text-ink-2">
                            {assignedDriver.driverPhone}
                          </span>
                        </>
                      ) : (
                        <span className="text-ink-3">জানা নেই</span>
                      )}
                    </dd>
                    <dt className="text-ink-3">জিপিএস</dt>
                    <dd className="font-mono tabular-nums text-ink">
                      {ride.pickupLat.toFixed(4)}, {ride.pickupLng.toFixed(4)}
                    </dd>
                    <dt className="text-ink-3">রুট</dt>
                    <dd className="text-ink-2">
                      {ride.pickupAddress} → {ride.dropoffAddress}
                    </dd>
                    <dt className="text-ink-3">ট্র্যাকিং</dt>
                    <dd className="flex items-center justify-between gap-2 min-w-0">
                      <span className="font-mono text-xs text-ink-2 truncate">{trackPath}</span>
                      {copyBtn(ride.liveTrackingToken)}
                    </dd>
                  </dl>

                  <div className="px-4 pb-4">
                    <button
                      type="button"
                      disabled={resolving}
                      onClick={() => handleResolve(ride.id)}
                      className="w-full h-9 rounded-md bg-brand text-on-brand text-[13px] font-medium hover:bg-brand/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 ease-out"
                    >
                      {resolving ? 'সমাধান করা হচ্ছে…' : 'সমাধান হয়েছে'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-surface border border-line rounded-lg" aria-labelledby="tracking-heading">
        <div className="px-4 py-3 border-b border-line">
          <h3 id="tracking-heading" className="text-sm font-semibold text-ink">
            চলমান ট্রিপের ট্র্যাকিং লিংক
          </h3>
          <p className="text-xs text-ink-3 mt-0.5">
            পরিবার বা পুলিশের সাথে শেয়ার করার জন্য লিংক কপি করুন।
          </p>
        </div>

        {activeRides.length === 0 ? (
          <p className="px-4 py-6 text-sm text-ink-2">এখন কোনো চলমান ট্রিপ নেই।</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-xs text-ink-3 border-b border-line">
                  <th className="font-medium px-4 py-2">যাত্রী</th>
                  <th className="font-medium px-4 py-2">রুট</th>
                  <th className="font-medium px-4 py-2">লিংক</th>
                  <th className="font-medium px-4 py-2">
                    <span className="sr-only">কপি</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {activeRides.map((ride) => (
                  <tr key={ride.id}>
                    <td className="px-4 py-2.5">
                      <div className="text-ink flex items-center gap-1.5">
                        {ride.sosActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-danger" aria-label="SOS সক্রিয়" />
                        )}
                        {ride.passengerName}
                      </div>
                      <div className="text-xs font-mono tabular-nums text-ink-3">{ride.passengerPhone}</div>
                    </td>
                    <td className="px-4 py-2.5 text-ink-2">
                      {ride.pickupAddress} → {ride.dropoffAddress}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-ink-2 whitespace-nowrap">
                      /rides/track/{ride.liveTrackingToken}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end">{copyBtn(ride.liveTrackingToken)}</div>
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
