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
  MapIcon,
  MapPin,
  ShieldCheck,
  Siren,
  Volume2,
  VolumeX,
  Wallet,
} from 'lucide-react';

import { API_BASE, adminHeaders, getAdminKey, setAdminKey } from './config';

type ActiveTab = 'dispatch' | 'kyc' | 'wallet' | 'landmarks' | 'safety';
type ToastType = 'emerald' | 'amber' | 'crimson' | 'bkash';

const TOAST_DOT: Record<ToastType, string> = {
  emerald: 'bg-brand-text',
  amber: 'bg-warning',
  crimson: 'bg-danger',
  bkash: 'bg-bkash',
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dispatch');
  const [overview, setOverview] = useState<OverviewResponse>(FALLBACK_OVERVIEW);
  const [kycList, setKycList] = useState<KycApplication[]>(FALLBACK_KYC);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  // Set when the server rejects our admin key (403); shows the key form instead of the console.
  const [needsAdminKey, setNeedsAdminKey] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: ToastType;
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
    (text: string, type: ToastType = 'emerald') => {
      setToastMessage({ text, type });
      setTimeout(() => {
        setToastMessage((prev) => (prev?.text === text ? null : prev));
      }, 4000);
    },
    []
  );

  // Short chime on incoming socket events (Web Audio API); SOS uses a harsher tone
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
      const res = await fetch(`${API_BASE}/admin/overview`, { headers: adminHeaders() });
      if (res.status === 403) return setNeedsAdminKey(true);
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
      const res = await fetch(`${API_BASE}/admin/kyc`, { headers: adminHeaders() });
      if (res.status === 403) return setNeedsAdminKey(true);
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
      auth: { adminKey: getAdminKey() },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('admin:subscribe', (ack?: { success?: boolean }) => {
        if (ack?.success === false) setNeedsAdminKey(true);
      });
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
          showToast('জরুরি SOS এসেছে। এখনই ব্যবস্থা নিন।', 'crimson');
        } else if (eventData.type === 'RIDE_REQUESTED') {
          showToast(
            eventData.payload?.voicePromptBangla || 'নতুন রাইডের অনুরোধ এসেছে।',
            'emerald'
          );
        } else if (eventData.type === 'NEW_BID') {
          showToast(
            `নতুন পাল্টা প্রস্তাব: ৳${eventData.payload?.bid?.bidAmount || ''}`,
            'amber'
          );
        } else if (eventData.type === 'RIDE_COMPLETED') {
          showToast(
            `ট্রিপ সম্পন্ন। ৮% কমিশন ৳${eventData.payload?.commissionDeducted || ''} কাটা হয়েছে।`,
            'emerald'
          );
        } else if (eventData.type === 'WALLET_TOPUP') {
          showToast('বিকাশ রিচার্জ সফল হয়েছে।', 'bkash');
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
        headers: adminHeaders(),
      });
      if (res.status === 403) {
        showToast('এই সার্ভারে সিমুলেশন বন্ধ আছে।', 'amber');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        showToast(data.messageBangla || 'রাইড সিমুলেশন শুরু হয়েছে।', 'emerald');
        await fetchOverview();
      } else {
        throw new Error('Offline simulation fallback');
      }
    } catch {
      showToast('সার্ভারে সংযোগ হয়নি, সিমুলেশন শুরু করা যায়নি। সার্ভার চালু আছে কিনা দেখুন।', 'amber');
    } finally {
      setTimeout(() => setIsSimulating(false), 4200);
    }
  };

  // Action: Trigger 999 SOS Test
  const handleTriggerSosTest = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/rides/demo/sos`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ resolved: false }),
      });
      if (res.status === 403) return setNeedsAdminKey(true);
      if (res.ok) {
        await fetchOverview();
        setActiveTab('safety');
        showToast('পরীক্ষামূলক SOS চালু করা হয়েছে।', 'crimson');
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
    showToast('পরীক্ষামূলক SOS চালু করা হয়েছে।', 'crimson');
  };

  // Action: Resolve SOS
  const handleResolveSos = async (rideId: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/rides/${rideId}/sos`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ resolved: true }),
      });
      if (res.status === 403) return setNeedsAdminKey(true);
      if (res.ok) {
        await fetchOverview();
        showToast('SOS সমাধান করা হয়েছে।', 'emerald');
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
    showToast('SOS সমাধান করা হয়েছে।', 'emerald');
  };

  // Action: Update KYC Status
  const handleUpdateKycStatus = async (
    id: string,
    status: 'APPROVED' | 'SUSPENDED',
    note?: string
  ) => {
    const kycToast = () =>
      showToast(
        status === 'APPROVED'
          ? 'KYC আবেদন অনুমোদিত হয়েছে।'
          : 'KYC আবেদন স্থগিত করা হয়েছে।',
        status === 'APPROVED' ? 'emerald' : 'amber'
      );
    try {
      const res = await fetch(`${API_BASE}/admin/kyc/${id}/status`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ status, note }),
      });
      if (res.status === 403) return setNeedsAdminKey(true);
      if (res.ok) {
        await fetchKyc();
        await fetchOverview();
        kycToast();
        return;
      }
    } catch {
      // Local fallback update
    }
    setKycList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status, note } : item))
    );
    kycToast();
  };

  // Action: Wallet Top-Up via bKash / Nagad
  const handleTopupWallet = async (
    driverId: string,
    amountBdt: number,
    method: 'BKASH' | 'NAGAD' = 'BKASH'
  ) => {
    const topupToast = () =>
      showToast(
        `${method === 'BKASH' ? 'bKash' : 'Nagad'} রিচার্জ সফল: +৳${amountBdt}`,
        method === 'BKASH' ? 'bkash' : 'emerald'
      );
    try {
      const res = await fetch(`${API_BASE}/admin/wallet/topup`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({
          driverId,
          amountBdt,
          method,
          trxId: `${method.slice(0, 3)}${Date.now().toString().slice(-6)}`,
        }),
      });
      if (res.status === 403) return setNeedsAdminKey(true);
      if (res.ok) {
        await fetchOverview();
        topupToast();
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
    topupToast();
  };

  const sosCount = overview.activeRides.filter((r) => r.sosActive).length;

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    count?: number;
    countCls?: string;
  }[] = [
    {
      id: 'dispatch',
      label: 'ডিসপ্যাচ',
      icon: <MapIcon className="w-4 h-4" aria-hidden />,
      count: overview.stats.activeRidesCount,
    },
    {
      id: 'kyc',
      label: 'চালক যাচাই (KYC)',
      icon: <ShieldCheck className="w-4 h-4" aria-hidden />,
      count: kycList.filter((k) => k.status === 'PENDING_VERIFICATION').length,
      countCls: 'text-warning',
    },
    {
      id: 'wallet',
      label: 'ওয়ালেট ও লেজার',
      icon: <Wallet className="w-4 h-4" aria-hidden />,
      count: overview.stats.lowBalanceDriversCount,
      countCls: 'text-warning',
    },
    {
      id: 'landmarks',
      label: 'ল্যান্ডমার্ক ও ভাড়া',
      icon: <MapPin className="w-4 h-4" aria-hidden />,
    },
    {
      id: 'safety',
      label: 'জরুরি SOS',
      icon: <Siren className="w-4 h-4" aria-hidden />,
      count: sosCount,
      countCls: 'text-danger font-medium',
    },
  ];

  if (needsAdminKey) {
    return (
      <main className="min-h-screen bg-page text-ink flex items-center justify-center p-4">
        <form
          className="w-full max-w-sm bg-surface border border-line rounded-lg p-6"
          onSubmit={(e) => {
            e.preventDefault();
            const key = new FormData(e.currentTarget).get('adminKey');
            setAdminKey(typeof key === 'string' ? key.trim() : '');
            window.location.reload();
          }}
        >
          <h1 className="text-base font-semibold">চলো ভৈরব ডিসপ্যাচ</h1>
          <p className="mt-1 text-sm text-ink-2">
            {getAdminKey() ? 'অ্যাডমিন কী সঠিক নয়। আবার দিন।' : 'চালিয়ে যেতে অ্যাডমিন কী দিন।'}
          </p>
          <label htmlFor="adminKey" className="mt-5 block text-sm text-ink-2">
            অ্যাডমিন কী
          </label>
          <input
            id="adminKey"
            name="adminKey"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            className="mt-1.5 w-full h-10 rounded-md bg-page border border-line px-3 font-mono text-sm text-ink focus:border-brand-text outline-none"
          />
          <button
            type="submit"
            className="mt-4 w-full h-10 rounded-md bg-brand text-on-brand text-sm font-medium hover:bg-brand/90 transition-colors duration-150 ease-out"
          >
            প্রবেশ করুন
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col">
      <header className="sticky top-0 z-50 bg-page border-b border-line">
        <div className="min-h-14 px-4 lg:px-6 py-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <div className="flex items-center gap-5 min-w-0">
            <h1 className="text-base font-semibold text-ink whitespace-nowrap">
              চলো ভৈরব <span className="font-normal text-ink-3">ডিসপ্যাচ</span>
            </h1>
            <div className="flex items-center gap-2 text-xs min-w-0" role="status">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${socketConnected ? 'bg-brand-text' : 'bg-warning'}`}
                aria-hidden
              />
              <span className="text-ink-2 whitespace-nowrap">
                {socketConnected ? 'সংযুক্ত' : 'আবার সংযোগ করা হচ্ছে…'}
              </span>
              <span className="font-mono text-ink-3 truncate">{API_BASE}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? 'ইভেন্টের শব্দ বন্ধ করুন' : 'ইভেন্টের শব্দ চালু করুন'}
              title={soundEnabled ? 'শব্দ বন্ধ করুন' : 'শব্দ চালু করুন'}
              className="h-9 w-9 rounded-md border border-line text-ink-2 hover:text-ink hover:bg-raised flex items-center justify-center transition-colors duration-150 ease-out"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" aria-hidden />
              ) : (
                <VolumeX className="w-4 h-4 text-ink-3" aria-hidden />
              )}
            </button>

            <button
              type="button"
              onClick={handleTriggerSosTest}
              className="h-9 px-3 rounded-md border border-danger/40 text-danger text-[13px] hover:bg-danger/10 flex items-center gap-1.5 transition-colors duration-150 ease-out"
            >
              <Siren className="w-4 h-4" aria-hidden />
              পরীক্ষামূলক SOS
            </button>

            <button
              type="button"
              onClick={handleSimulateRide}
              disabled={isSimulating}
              className="h-9 px-3 rounded-md bg-brand text-on-brand text-[13px] font-medium hover:bg-brand/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 ease-out"
            >
              {isSimulating ? 'সিমুলেশন চলছে…' : 'রাইড সিমুলেট করুন'}
            </button>
          </div>
        </div>
      </header>

      <div aria-live="polite" className="fixed bottom-4 right-4 z-[1100] max-w-sm">
        {toastMessage && (
          <div
            className={`px-4 py-3 rounded-lg bg-raised border shadow-lg text-[13px] text-ink flex items-start gap-2.5 ${
              toastMessage.type === 'crimson' ? 'border-danger/50' : 'border-line'
            }`}
          >
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TOAST_DOT[toastMessage.type]}`}
              aria-hidden
            />
            <span className="font-bangla">{toastMessage.text}</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <aside className="lg:w-56 lg:shrink-0 border-b lg:border-b-0 lg:border-r border-line">
          <div className="lg:sticky lg:top-14">
            <nav className="p-2 flex lg:flex-col gap-0.5 overflow-x-auto" aria-label="প্রধান মেনু">
              {navItems.map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`h-9 px-3 rounded-md flex items-center gap-2.5 text-[13px] whitespace-nowrap transition-colors duration-150 ease-out ${
                      active
                        ? 'bg-raised text-ink font-medium'
                        : 'text-ink-2 hover:text-ink hover:bg-raised'
                    }`}
                  >
                    <span className={active ? 'text-brand-text' : 'text-ink-3'}>{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {typeof item.count === 'number' && item.count > 0 && (
                      <span className={`font-mono tabular-nums text-xs ${item.countCls || 'text-ink-3'}`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <dl className="hidden lg:grid grid-cols-[1fr_auto] gap-y-1 mx-2 mt-2 px-3 pt-3 border-t border-line text-xs">
              <dt className="text-ink-3">কমিশন</dt>
              <dd className="font-mono tabular-nums text-ink-2">৮%</dd>
              <dt className="text-ink-3">ন্যূনতম ওয়ালেট</dt>
              <dd className="font-mono tabular-nums text-ink-2">৳৫০</dd>
            </dl>
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-4 lg:p-6">
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
              onRefreshOverview={fetchOverview}
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
