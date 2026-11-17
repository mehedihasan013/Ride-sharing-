import React, { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  AdminLiveEvent,
  KycApplication,
  OverviewResponse,
} from './types/admin';
import { FALLBACK_KYC, FALLBACK_OVERVIEW } from './data/mockFallback';
import { DispatchRadar } from './views/DispatchRadar';
import { KycCenter } from './views/KycCenter';
import { WalletLedger } from './views/WalletLedger';
import { LandmarksCorridor } from './views/LandmarksCorridor';
import { SafetyConsole } from './views/SafetyConsole';
import {
  MapPin,
  Radar,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  Volume2,
  VolumeX,
  Wallet,
} from 'lucide-react';

const API_BASE = 'http://localhost:4000';

type ActiveTab = 'dispatch' | 'kyc' | 'wallet' | 'landmarks' | 'safety';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dispatch');
  const [overview, setOverview] = useState<OverviewResponse>(FALLBACK_OVERVIEW);
  const [kycList, setKycList] = useState<KycApplication[]>(FALLBACK_KYC);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'emerald' | 'amber' | 'crimson' | 'bkash';
  } | null>(null);

  const [liveEvents, setLiveEvents] = useState<AdminLiveEvent[]>([
    {
      id: 'init_ev_1',
      type: 'RIDE_REQUESTED',
      payload: {
        messageBangla:
          'ভৈরব বাজার রেলওয়ে জংশন থেকে মেঘনা ব্রিজ পর্যন্ত নতুন ইজিবাইক রাইড রিকোয়েস্ট (প্রস্তাবিত ভাড়া: ৳৮০)',
      },
      timestamp: Date.now() - 45000,
    },
    {
      id: 'init_ev_2',
      type: 'NEW_BID',
      payload: {
        messageBangla: 'চালক মোঃ রফিকুল ইসলাম পাল্টা ভাড়া প্রস্তাব করেছেন: ৳৯০ টাকা (৩ মিনিট দূরে)',
      },
      timestamp: Date.now() - 25000,
    },
  ]);

  const socketRef = useRef<Socket | null>(null);
  const soundEnabledRef = useRef<boolean>(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const showToast = useCallback(
    (text: string, type: 'emerald' | 'amber' | 'crimson' | 'bkash' = 'emerald') => {
      setToastMessage({ text, type });
      setTimeout(() => {
        setToastMessage((prev) => (prev?.text === text ? null : prev));
      }, 4000);
    },
    []
  );

  // Play subtle radar chime on incoming socket event using Web Audio API
  const playTelemetryTone = useCallback((isSos = false) => {
    if (!soundEnabledRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isSos ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(isSos ? 660 : 520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(isSos ? 880 : 740, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // Ignore audio autoplay restrictions
    }
  }, []);

  // Fetch Overview from Backend
  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/overview`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success) {
        setOverview(data);
      }
    } catch {
      // Keep fallback data if backend is offline
    }
  }, []);

  // Fetch KYC Applications from Backend
  const fetchKyc = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/kyc`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && Array.isArray(data.applications)) {
        setKycList(data.applications);
      }
    } catch {
      // Keep fallback KYC data if backend is offline
    }
  }, []);

  // Initial Data Load & Socket.io Connection
  useEffect(() => {
    fetchOverview();
    fetchKyc();

    const socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('admin:subscribe');
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('admin:snapshot', (snapshot: { onlineDrivers?: any[]; activeRides?: any[] }) => {
      if (snapshot) {
        setOverview((prev) => ({
          ...prev,
          onlineDrivers: snapshot.onlineDrivers || prev.onlineDrivers,
          activeRides: snapshot.activeRides || prev.activeRides,
        }));
      }
    });

    socket.on(
      'admin:event',
      (eventData: { type: string; payload: any; timestamp?: number }) => {
        const newEv: AdminLiveEvent = {
          id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: eventData.type,
          payload: eventData.payload,
          timestamp: eventData.timestamp || Date.now(),
        };

        setLiveEvents((prev) => [newEv, ...prev.slice(0, 39)]);
        playTelemetryTone(eventData.type === 'SOS_ALERT');

        if (eventData.type === 'SOS_ALERT') {
          showToast(
            '🚨 জরুরি ৯৯৯ SOS অ্যালার্ট শনাক্ত হয়েছে! তাৎক্ষণিক ব্যবস্থা নিন।',
            'crimson'
          );
        } else if (eventData.type === 'RIDE_REQUESTED') {
          showToast(
            eventData.payload?.voicePromptBangla ||
              '⚡ নতুন ভৈরব রাইড রিকোয়েস্ট ও বাংলা ভয়েস ব্রডকাস্ট শুরু হয়েছে!',
            'emerald'
          );
        } else if (eventData.type === 'NEW_BID') {
          showToast(
            `💬 নতুন পাল্টা ভাড়া প্রস্তাব: ৳${eventData.payload?.bid?.bidAmount || ''} টাকা`,
            'amber'
          );
        } else if (eventData.type === 'RIDE_COMPLETED') {
          showToast(
            `✓ ট্রিপ সম্পন্ন! ৮% কমিশন (৳${
              eventData.payload?.commissionDeducted || ''
            }) স্বয়ংক্রিয়ভাবে কর্তন হয়েছে।`,
            'emerald'
          );
        } else if (eventData.type === 'WALLET_TOPUP') {
          showToast('৳ বিকাশ ওয়ালেট রিচার্জ সফল হয়েছে!', 'bkash');
        }

        fetchOverview();
        if (eventData.type === 'KYC_UPDATED') {
          fetchKyc();
        }
      }
    );

    return () => {
      socket.disconnect();
    };
  }, [fetchOverview, fetchKyc, playTelemetryTone, showToast]);

  // Action: Simulate Live Bhairab Ride
  const handleSimulateRide = async () => {
    setIsSimulating(true);
    setActiveTab('dispatch');
    try {
      const res = await fetch(`${API_BASE}/admin/simulate-ride`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        showToast(
          data.messageBangla || '⚡ লাইভ ভৈরব রাইড এবং বিডিং সিমুলেশন শুরু হয়েছে!',
          'emerald'
        );
        await fetchOverview();
      } else {
        throw new Error('Offline simulation fallback');
      }
    } catch {
      // Local interactive fallback if backend is not reachable
      showToast('⚡ লোকাল ডেমো রাইড ও বিডিং সিমুলেশন শুরু হয়েছে!', 'amber');
    } finally {
      setTimeout(() => setIsSimulating(false), 4200);
    }
  };

  // Action: Trigger 999 SOS Test
  const handleTriggerSosTest = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/rides/demo/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: false }),
      });
      if (res.ok) {
        await fetchOverview();
        setActiveTab('safety');
        showToast('🚨 ৯৯৯ জরুরি SOS টেস্ট অ্যালার্ট সক্রিয় করা হয়েছে!', 'crimson');
        return;
      }
    } catch {
      // Fallback local SOS state
    }
    setOverview((prev) => ({
      ...prev,
      stats: { ...prev.stats, activeSosCount: prev.stats.activeSosCount + 1 },
      activeRides: prev.activeRides.map((r, idx) =>
        idx === 0 ? { ...r, sosActive: true } : r
      ),
    }));
    setActiveTab('safety');
    showToast('🚨 ৯৯৯ জরুরি SOS টেস্ট অ্যালার্ট সক্রিয় করা হয়েছে!', 'crimson');
  };

  // Action: Resolve SOS
  const handleResolveSos = async (rideId: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/rides/${rideId}/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: true }),
      });
      if (res.ok) {
        await fetchOverview();
        showToast('✓ SOS বিপদ সংকেত সমাধান করা হয়েছে (Resolved)', 'emerald');
        return;
      }
    } catch {
      // Fallback resolve
    }
    setOverview((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        activeSosCount: Math.max(0, prev.stats.activeSosCount - 1),
      },
      activeRides: prev.activeRides.map((r) =>
        r.id === rideId ? { ...r, sosActive: false } : r
      ),
    }));
    showToast('✓ SOS বিপদ সংকেত সমাধান করা হয়েছে (Resolved)', 'emerald');
  };

  // Action: Update KYC Status
  const handleUpdateKycStatus = async (
    id: string,
    status: 'APPROVED' | 'SUSPENDED',
    note?: string
  ) => {
    try {
      const res = await fetch(`${API_BASE}/admin/kyc/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });
      if (res.ok) {
        await fetchKyc();
        await fetchOverview();
        showToast(
          status === 'APPROVED'
            ? '✓ চালকের KYC আবেদন অনুমোদিত হয়েছে!'
            : '✕ চালকের KYC আবেদন স্থগিত করা হয়েছে।',
          status === 'APPROVED' ? 'emerald' : 'crimson'
        );
        return;
      }
    } catch {
      // Local fallback update
    }
    setKycList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status, note } : item))
    );
    showToast(
      status === 'APPROVED'
        ? '✓ চালকের KYC আবেদন অনুমোদিত হয়েছে!'
        : '✕ চালকের KYC আবেদন স্থগিত করা হয়েছে।',
      status === 'APPROVED' ? 'emerald' : 'crimson'
    );
  };

  // Action: Wallet Top-Up via bKash / Nagad
  const handleTopupWallet = async (
    driverId: string,
    amountBdt: number,
    method: 'BKASH' | 'NAGAD' = 'BKASH'
  ) => {
    try {
      const res = await fetch(`${API_BASE}/admin/wallet/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          amountBdt,
          method,
          trxId: `${method.slice(0, 3)}${Date.now().toString().slice(-6)}`,
        }),
      });
      if (res.ok) {
        await fetchOverview();
        showToast(
          `৳ ${method} রিচার্জ সফল (+৳${amountBdt} BDT)! চালকের বিডিং আনলক হয়েছে।`,
          'bkash'
        );
        return;
      }
    } catch {
      // Local fallback update
    }
    setOverview((prev) => ({
      ...prev,
      onlineDrivers: prev.onlineDrivers.map((d) =>
        d.driverId === driverId
          ? { ...d, walletBalance: d.walletBalance + amountBdt }
          : d
      ),
      wallets: prev.wallets.map((w) =>
        w.driverId === driverId
          ? { ...w, currentBalance: w.currentBalance + amountBdt }
          : w
      ),
    }));
    showToast(
      `৳ ${method} রিচার্জ সফল (+৳${amountBdt} BDT)! চালকের বিডিং আনলক হয়েছে।`,
      'bkash'
    );
  };

  const navItems: {
    id: ActiveTab;
    titleBn: string;
    titleEn: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'dispatch',
      titleBn: 'লাইভ ডিসপ্যাচ রাডার',
      titleEn: 'Live Dispatch & Bidding',
      icon: <Radar className="w-4 h-4" />,
      badge: overview.stats.activeRidesCount,
      badgeColor: 'bg-emerald-500 text-slate-950',
    },
    {
      id: 'kyc',
      titleBn: 'চালক KYC ভেরিফিকেশন',
      titleEn: 'Tiered Driver KYC',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: kycList.filter((k) => k.status === 'PENDING_VERIFICATION').length,
      badgeColor: 'bg-amber-500 text-slate-950',
    },
    {
      id: 'wallet',
      titleBn: 'বিকাশ ওয়ালেট ও ৮% লেজার',
      titleEn: 'bKash Wallet & 8% Ledger',
      icon: <Wallet className="w-4 h-4" />,
      badge: overview.stats.lowBalanceDriversCount,
      badgeColor: 'bg-[#E2136E] text-white',
    },
    {
      id: 'landmarks',
      titleBn: 'ভৈরব ল্যান্ডমার্ক ও ভাড়া',
      titleEn: 'Bhairab Landmarks & Fares',
      icon: <MapPin className="w-4 h-4" />,
      badge: overview.landmarks.length,
      badgeColor: 'bg-slate-700 text-slate-200',
    },
    {
      id: 'safety',
      titleBn: '৯৯৯ জরুরি SOS কনসোল',
      titleEn: '999 Emergency Safety',
      icon: <Siren className="w-4 h-4" />,
      badge: overview.activeRides.filter((r) => r.sosActive).length,
      badgeColor: 'bg-[#F42A41] text-white animate-pulse',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B131E] text-slate-100 flex flex-col">
      {/* Top Command Center Header Bar */}
      <header className="sticky top-0 z-50 bg-[#0B131E]/95 backdrop-blur-xl border-b border-white/10 px-4 lg:px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo & Bilingual Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#006A4E] to-[#10B981] p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-[#0B131E]/30 rounded-[14px] flex items-center justify-center text-xl font-extrabold text-white">
                🛺
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                  চলো ভৈরব ডিসপ্যাচ সেন্টার
                </h1>
                <span className="hidden md:inline-block text-xs font-bold px-2 py-0.5 rounded-md bg-[#006A4E]/40 border border-emerald-500/40 text-emerald-300">
                  CholoBhairab Command Center
                </span>
              </div>
              <p className="text-xs text-slate-400">
                চলো ভৈরব • Bhairab, Kishoreganj-Dhaka Corridor • Multi-Modal InDrive Dispatch
              </p>
            </div>
          </div>

          {/* Right Action Controls & WebSocket Telemetry Status */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Telemetry Connection Badge */}
            <div
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                socketConnected
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  socketConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'
                }`}
              />
              <span>
                {socketConnected
                  ? '🟢 Live Telemetry Connected'
                  : '🔴 Reconnecting (:4000)'}
              </span>
            </div>

            {/* Sound Mute Toggle */}
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="p-2 rounded-xl bg-[#111C2D] hover:bg-slate-800 border border-white/10 text-slate-300"
              title={soundEnabled ? 'Mute Radar Audio' : 'Enable Radar Audio'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {/* Prominent Simulate Live Bhairab Ride Button */}
            <button
              onClick={handleSimulateRide}
              disabled={isSimulating}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#006A4E] to-[#10B981] hover:from-[#00805e] hover:to-[#34d399] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2"
            >
              {isSimulating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>⚡ লাইভ রাইড সিমুলেশন (Simulate Live Bhairab Ride)</span>
            </button>

            {/* 999 SOS Test Button */}
            <button
              onClick={handleTriggerSosTest}
              className="px-3.5 py-2 rounded-xl bg-[#F42A41] hover:bg-rose-600 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-[#F42A41]/30 transition-all flex items-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>🚨 999 SOS Test</span>
            </button>
          </div>
        </div>
      </header>

      {/* Live Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 ${
              toastMessage.type === 'crimson'
                ? 'bg-[#F42A41] text-white border-white/30'
                : toastMessage.type === 'bkash'
                ? 'bg-[#E2136E] text-white border-white/30'
                : toastMessage.type === 'amber'
                ? 'bg-amber-500 text-slate-950 border-amber-300'
                : 'bg-emerald-500 text-slate-950 border-emerald-300'
            }`}
          >
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Content Container with Sidebar Navigation */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 lg:px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Navigation Sidebar */}
        <aside className="lg:col-span-2 space-y-2">
          <div className="glass-card rounded-2xl p-2.5 space-y-1.5 sticky top-20">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              কমান্ড মেনু • Navigation
            </div>

            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between gap-2 ${
                    active
                      ? 'bg-gradient-to-r from-[#006A4E] to-[#10B981]/90 text-white shadow-lg shadow-emerald-950/50 border border-emerald-400/30'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={active ? 'text-white' : 'text-emerald-400'}>
                      {item.icon}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-bold leading-tight truncate">
                        {item.titleBn}
                      </div>
                      <div
                        className={`text-[10px] truncate ${
                          active ? 'text-emerald-100' : 'text-slate-400'
                        }`}
                      >
                        {item.titleEn}
                      </div>
                    </div>
                  </div>

                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Corridor Quick Info Box */}
            <div className="mt-4 pt-3 border-t border-white/10 px-3 py-2 space-y-1.5 text-[11px] text-slate-400">
              <div className="font-bold text-slate-200 flex items-center justify-between">
                <span>ভৈরব করিডোর স্ট্যাটাস</span>
                <span className="text-emerald-400">● সচল</span>
              </div>
              <p>কমিশন রেট: ৮% (প্রিপেইড)</p>
              <p>নূন্যতম ওয়ালেট: ৳৫০ টাকা</p>
              <p className="text-[10px] text-slate-500 pt-1">
                API: http://localhost:4000
              </p>
            </div>
          </div>
        </aside>

        {/* Main Active View Area */}
        <main className="lg:col-span-10 min-w-0">
          {activeTab === 'dispatch' && (
            <DispatchRadar
              stats={overview.stats}
              onlineDrivers={overview.onlineDrivers}
              activeRides={overview.activeRides}
              landmarks={overview.landmarks}
              liveEvents={liveEvents}
              onSimulateRide={handleSimulateRide}
              isSimulating={isSimulating}
              onQuickTopup={(driverId, amt) => handleTopupWallet(driverId, amt, 'BKASH')}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'kyc' && (
            <KycCenter
              applications={kycList}
              onUpdateStatus={handleUpdateKycStatus}
            />
          )}

          {activeTab === 'wallet' && (
            <WalletLedger
              drivers={overview.onlineDrivers}
              wallets={overview.wallets}
              transactions={overview.recentTransactions}
              totalCommissionBdt={overview.stats.totalCommissionBdt}
              totalGmvBdt={overview.stats.totalGmvBdt}
              onTopupWallet={handleTopupWallet}
            />
          )}

          {activeTab === 'landmarks' && (
            <LandmarksCorridor
              landmarks={overview.landmarks}
              apiBaseUrl={API_BASE}
            />
          )}

          {activeTab === 'safety' && (
            <SafetyConsole
              activeRides={overview.activeRides}
              onlineDrivers={overview.onlineDrivers}
              onTriggerDemoSos={handleTriggerSosTest}
              onResolveSos={handleResolveSos}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
