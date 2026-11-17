import React, { useState } from 'react';
import { ActiveRide, OnlineDriver } from '../types/admin';
import {
  AlertOctagon,
  CheckCircle2,
  Copy,
  ExternalLink,
  MapPin,
  PhoneCall,
  Share2,
  ShieldAlert,
  Siren,
} from 'lucide-react';

interface SafetyConsoleProps {
  activeRides: ActiveRide[];
  onlineDrivers: OnlineDriver[];
  onTriggerDemoSos: () => Promise<void>;
  onResolveSos: (rideId: string) => Promise<void>;
}

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

  return (
    <div className="space-y-6">
      {/* 999 Emergency Response Header Banner */}
      <div className="glass-card rounded-2xl p-5 border-2 border-[#F42A41]/50 bg-gradient-to-r from-[#2A0E17] via-[#181528] to-[#111C2D]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F42A41]/25 border border-[#F42A41] text-rose-200 text-xs font-extrabold">
              <Siren className="w-4 h-4 text-[#F42A41]" />
              <span>জাতীয় জরুরি সেবা ৯৯৯ ও ভৈরব থানা কন্ট্রোল রুম • Emergency SOS Console</span>
            </div>
            <h2 className="text-xl font-extrabold text-white">
              রাতের হাইওয়ে ও মেঘনা ব্রিজ করিডোর নিরাপত্তা মনিটরিং
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              যাত্রী বা চালক অ্যাপের <strong className="text-rose-300">🚨 999 SOS বাটন</strong> চাপলে
              তাৎক্ষণিকভাবে জিপিএস লোকেশন, হোয়াটসঅ্যাপ লাইভ ট্র্যাকিং লিংক (`/rides/track/:token`) এবং ভৈরব
              থানা ডিউটি অফিসার হটলাইনে অ্যালার্ট চলে যায়।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="p-3 rounded-xl bg-[#0B131E]/90 border border-rose-500/30">
              <div className="text-[10px] uppercase tracking-wider text-rose-400 font-bold">
                ভৈরব থানা পুলিশ কন্ট্রোল রুম
              </div>
              <div className="text-sm font-extrabold text-white mt-0.5">📞 ০১৭১৩-৩৭৩৪৮৫ / ৯৯৯</div>
              <div className="text-[10px] text-slate-400">২৪/৭ হাইওয়ে টহল সংযুক্ত</div>
            </div>

            <button
              onClick={onTriggerDemoSos}
              className="py-3 px-4 rounded-xl bg-[#F42A41] hover:bg-rose-600 text-white text-xs font-extrabold shadow-lg shadow-[#F42A41]/30 transition-all flex items-center gap-2"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>🚨 999 SOS টেস্ট অ্যালার্ট ট্রিগার করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active SOS Alerts Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#F42A41]" />
            <span>সক্রিয় জরুরি SOS অ্যালার্ট ({sosRides.length})</span>
          </h3>
        </div>

        {sosRides.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center border border-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-base font-bold text-white">
              ভৈরব করিডোরে এই মুহূর্তে কোনো সক্রিয় SOS বিপদ সংকেত নেই
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              সকল সক্রিয় ট্রিপ নিরাপদে পর্যবেক্ষণ করা হচ্ছে। জরুরি মহড়া পরীক্ষা করতে উপরের &ldquo;🚨 999 SOS
              টেস্ট অ্যালার্ট&rdquo; বাটনে ক্লিক করুন।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sosRides.map((ride) => {
              const assignedDriver =
                onlineDrivers.find((d) => d.driverId === ride.selectedDriverId) ||
                onlineDrivers[0];
              const trackPath = `/rides/track/${ride.liveTrackingToken}`;

              return (
                <div
                  key={ride.id}
                  className="glass-card rounded-2xl p-5 border-2 border-[#F42A41] bg-gradient-to-b from-rose-950/40 to-[#111C2D] space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-[#F42A41] text-white text-xs font-extrabold animate-pulse flex items-center gap-1.5">
                      <Siren className="w-3.5 h-3.5" /> 🚨 সক্রিয় 999 SOS বিপদ সংকেত!
                    </span>
                    <span className="text-xs font-mono text-rose-300">ID: {ride.id}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#0B131E]/90 border border-white/10">
                      <div className="text-[10px] uppercase text-slate-400 font-bold">
                        যাত্রীর তথ্য (Passenger)
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {ride.passengerName}
                      </div>
                      <div className="text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                        <PhoneCall className="w-3.5 h-3.5" /> {ride.passengerPhone}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0B131E]/90 border border-white/10">
                      <div className="text-[10px] uppercase text-slate-400 font-bold">
                        চালক ও যানবাহন (Driver)
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {assignedDriver?.driverName || 'মোঃ রফিকুল ইসলাম'}
                      </div>
                      <div className="text-amber-400 font-semibold mt-1 flex items-center gap-1">
                        <PhoneCall className="w-3.5 h-3.5" />{' '}
                        {assignedDriver?.driverPhone || '01711-223344'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0B131E]/90 border border-rose-500/30 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>
                        সর্বশেষ জিপিএস অবস্থান: {ride.pickupLat.toFixed(4)}°N,{' '}
                        {ride.pickupLng.toFixed(4)}°E
                      </span>
                    </div>
                    <div className="text-slate-300">
                      রুট: {ride.pickupAddress} → {ride.dropoffAddress}
                    </div>
                  </div>

                  {/* WhatsApp Live Tracking Link Preview */}
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
                        <Share2 className="w-3 h-3" /> হোয়াটসঅ্যাপ লাইভ ট্র্যাকিং লিংক (WhatsApp Share)
                      </div>
                      <div className="text-xs font-mono text-slate-200 truncate mt-0.5">
                        {trackPath}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyLink(ride.liveTrackingToken)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-xs font-bold shrink-0 flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedToken === ride.liveTrackingToken ? 'কপি হয়েছে!' : 'কপি লিংক'}</span>
                    </button>
                  </div>

                  {/* Resolve SOS Action Button */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      disabled={resolvingId === ride.id}
                      onClick={() => handleResolve(ride.id)}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {resolvingId === ride.id
                          ? 'সমাধান করা হচ্ছে...'
                          : '✓ সমাধান করুন (Resolve SOS)'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Active Rides Live Tracking Tokens Table */}
      <div className="glass-card rounded-2xl p-5 border border-white/10">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-emerald-400" />
          <span>সকল চলমান ট্রিপের লাইভ ট্র্যাকিং টোকেন ও নিরাপত্তা প্রিভিউ (`/rides/track/:token`)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeRides.map((ride) => (
            <div
              key={ride.id}
              className="p-3.5 rounded-xl bg-[#0B131E] border border-white/10 flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0">
                <div className="font-bold text-white truncate">
                  {ride.passengerName} ({ride.passengerPhone})
                </div>
                <div className="text-slate-400 truncate mt-0.5">
                  {ride.pickupAddress} → {ride.dropoffAddress}
                </div>
                <div className="font-mono text-emerald-400 text-[11px] mt-1">
                  /rides/track/{ride.liveTrackingToken}
                </div>
              </div>
              <button
                onClick={() => handleCopyLink(ride.liveTrackingToken)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-semibold shrink-0"
              >
                {copiedToken === ride.liveTrackingToken ? '✓ কপিড' : 'শেয়ার লিংক'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
