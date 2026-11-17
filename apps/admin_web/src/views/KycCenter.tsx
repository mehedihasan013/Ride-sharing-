import React, { useState } from 'react';
import { KycApplication, KycStatus, VehicleType } from '../types/admin';
import {
  Award,
  CheckCircle2,
  Clock,
  FileBadge,
  FileCheck2,
  IdCard,
  Phone,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

interface KycCenterProps {
  applications: KycApplication[];
  onUpdateStatus: (id: string, status: 'APPROVED' | 'SUSPENDED', note?: string) => Promise<void>;
}

const VEHICLE_CHIP: Record<VehicleType, { label: string; emoji: string; cls: string }> = {
  EASYBIKE: {
    label: 'ইজিবাইক (Easy-Bike)',
    emoji: '🛺',
    cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  CNG: {
    label: 'সিএনজি (CNG Auto)',
    emoji: '🛺',
    cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  },
  BIKE: {
    label: 'মোটরবাইক (Motorbike)',
    emoji: '🏍️',
    cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  CAR_MICROBUS: {
    label: 'মাইক্রোবাস (Microbus)',
    emoji: '🚐',
    cls: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
};

export const KycCenter: React.FC<KycCenterProps> = ({ applications, onUpdateStatus }) => {
  const [filter, setFilter] = useState<'ALL' | KycStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredApps = applications.filter((app) => {
    const matchesStatus = filter === 'ALL' || app.status === filter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      app.fullName.toLowerCase().includes(q) ||
      app.phoneNumber.toLowerCase().includes(q) ||
      app.nidNumber.toLowerCase().includes(q) ||
      app.registrationNumber.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleAction = async (id: string, status: 'APPROVED' | 'SUSPENDED') => {
    setProcessingId(id);
    try {
      await onUpdateStatus(
        id,
        status,
        status === 'APPROVED'
          ? 'ভৈরব ডিসপ্যাচ অ্যাডমিন কর্তৃক যাচাইকৃত ও অনুমোদিত'
          : 'ডকুমেন্ট অসম্পূর্ণতার কারণে সাময়িক স্থগিত'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const counts = {
    ALL: applications.length,
    PENDING_VERIFICATION: applications.filter((a) => a.status === 'PENDING_VERIFICATION').length,
    APPROVED: applications.filter((a) => a.status === 'APPROVED').length,
    SUSPENDED: applications.filter((a) => a.status === 'SUSPENDED').length,
  };

  return (
    <div className="space-y-5">
      {/* Top Tiered KYC Policy Banner */}
      <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 bg-gradient-to-r from-[#111C2D] via-[#0F222A] to-[#111C2D]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>দ্বি-স্তরীয় চালক যাচাইকরণ • Tiered Bhairab Driver KYC Architecture</span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">
              চালক নিবন্ধন ও পৌর প্রত্যয়নপত্র যাচাইকরণ কেন্দ্র (Driver KYC Center)
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              ভৈরবের স্থানীয় বাস্তবতা অনুযায়ী ইজিবাইক ও সিএনজি চালকদের জন্য{' '}
              <strong className="text-emerald-300">
                জাতীয় পরিচয়পত্র (NID) + পৌর ওয়ার্ড কাউন্সিলর / ইউনিয়ন পরিষদ প্রত্যয়নপত্র
              </strong>{' '}
              এবং মোটরবাইক ও মাইক্রোবাস চালকদের জন্য{' '}
              <strong className="text-amber-300">NID + BRTA ড্রাইভিং লাইসেন্স</strong> বাধ্যতামূলক।
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-3 rounded-xl bg-[#0B131E]/80 border border-emerald-500/30">
              <div className="text-[11px] font-bold text-emerald-400">
                🛺 টিয়ার-১ (ইজিবাইক / সিএনজি)
              </div>
              <div className="text-xs text-slate-200 font-semibold mt-0.5">
                ওয়ার্ড কাউন্সিলর প্রত্যয়নপত্র
              </div>
              <div className="text-[10px] text-slate-400">NID + পৌর টোকেন ও ছবিসহ গ্যারান্টর</div>
            </div>
            <div className="p-3 rounded-xl bg-[#0B131E]/80 border border-amber-500/30">
              <div className="text-[11px] font-bold text-amber-400">
                🏍️ টিয়ার-২ (বাইক / মাইক্রোবাস)
              </div>
              <div className="text-xs text-slate-200 font-semibold mt-0.5">
                BRTA ড্রাইভিং লাইসেন্স
              </div>
              <div className="text-[10px] text-slate-400">NID + ডিজিটাল ব্লুবুক ও ফিটনেস</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'ALL', label: 'সব আবেদন (All)', count: counts.ALL },
              {
                id: 'PENDING_VERIFICATION',
                label: 'অপেক্ষমাণ (Pending Verification)',
                count: counts.PENDING_VERIFICATION,
              },
              { id: 'APPROVED', label: 'অনুমোদিত (Approved)', count: counts.APPROVED },
              { id: 'SUSPENDED', label: 'স্থগিত (Suspended)', count: counts.SUSPENDED },
            ] as const
          ).map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  active
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'bg-[#0B131E] text-slate-300 hover:bg-slate-800 border border-white/10'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                    active ? 'bg-slate-950/25 text-slate-950' : 'bg-white/10 text-slate-200'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[260px] flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নাম, মোবাইল, NID বা রেজিস্ট্রেশন খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0B131E] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Driver KYC Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredApps.map((app) => {
          const vChip = VEHICLE_CHIP[app.vehicleType] || VEHICLE_CHIP.EASYBIKE;
          const isEasyBikeOrCng = app.vehicleType === 'EASYBIKE' || app.vehicleType === 'CNG';

          return (
            <div
              key={app.id}
              className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between border border-white/10"
            >
              <div className="space-y-3.5">
                {/* Top Status & Vehicle Row */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${vChip.cls}`}
                  >
                    {vChip.emoji} {vChip.label}
                  </span>

                  {app.status === 'PENDING_VERIFICATION' && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> অপেক্ষমাণ • Pending
                    </span>
                  )}
                  {app.status === 'APPROVED' && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> অনুমোদিত • Approved
                    </span>
                  )}
                  {app.status === 'SUSPENDED' && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> স্থগিত • Suspended
                    </span>
                  )}
                </div>

                {/* Driver Identity */}
                <div>
                  <h3 className="text-base font-extrabold text-white">{app.fullName}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      {app.phoneNumber}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">{app.wardNo || 'ভৈরব পৌরসভা'}</span>
                  </div>
                </div>

                {/* Vehicle & NID Details Box */}
                <div className="p-3 rounded-xl bg-[#0B131E]/90 border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <IdCard className="w-3.5 h-3.5 text-cyan-400" /> জাতীয় পরিচয়পত্র (NID):
                    </span>
                    <span className="font-mono font-bold text-slate-100">{app.nidNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">যানবাহনের মডেল:</span>
                    <span className="font-semibold text-slate-200">{app.vehicleModel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">রেজিস্ট্রেশন / পৌর প্লেট:</span>
                    <span className="font-semibold text-emerald-300">
                      {app.registrationNumber}
                    </span>
                  </div>
                </div>

                {/* Tiered Document Badge */}
                <div
                  className={`p-3 rounded-xl border ${
                    isEasyBikeOrCng
                      ? 'bg-emerald-950/25 border-emerald-500/30'
                      : 'bg-amber-950/25 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-1">
                    {isEasyBikeOrCng ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" /> ওয়ার্ড কাউন্সিলর প্রত্যয়নপত্র (Tier-1
                        Municipal)
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <FileBadge className="w-3.5 h-3.5" /> BRTA ড্রাইভিং লাইসেন্স (Tier-2
                        Motorized)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 font-medium">
                    {app.unionCouncilorCert ||
                      (app.brtaLicenseNo
                        ? `BRTA লাইসেন্স নং: ${app.brtaLicenseNo}`
                        : 'পৌর প্রত্যয়নপত্র সংযুক্ত')}
                  </p>
                  {app.brtaLicenseNo && app.unionCouncilorCert && (
                    <p className="text-[11px] text-amber-300 mt-1">
                      + BRTA লাইসেন্স: {app.brtaLicenseNo}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2.5">
                <button
                  onClick={() => handleAction(app.id, 'APPROVED')}
                  disabled={processingId === app.id || app.status === 'APPROVED'}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    app.status === 'APPROVED'
                      ? 'bg-emerald-500/15 text-emerald-400/60 border border-emerald-500/20 cursor-default'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                  }`}
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>✓ অনুমোদন (Approve)</span>
                </button>

                <button
                  onClick={() => handleAction(app.id, 'SUSPENDED')}
                  disabled={processingId === app.id || app.status === 'SUSPENDED'}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    app.status === 'SUSPENDED'
                      ? 'bg-rose-500/15 text-rose-400/60 border border-rose-500/20 cursor-default'
                      : 'bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>✕ স্থগিত (Suspend)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
