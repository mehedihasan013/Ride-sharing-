import React, { useState } from 'react';
import {
  OnlineDriver,
  WalletRecord,
  WalletTransactionRecord,
} from '../types/admin';
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Gift,
  Lock,
  PlusCircle,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Wallet,
} from 'lucide-react';

interface WalletLedgerProps {
  drivers: OnlineDriver[];
  wallets: WalletRecord[];
  transactions: WalletTransactionRecord[];
  totalCommissionBdt: number;
  totalGmvBdt: number;
  onTopupWallet: (
    driverId: string,
    amountBdt: number,
    method: 'BKASH' | 'NAGAD'
  ) => Promise<void>;
}

export const WalletLedger: React.FC<WalletLedgerProps> = ({
  drivers,
  wallets,
  transactions,
  totalCommissionBdt,
  totalGmvBdt,
  onTopupWallet,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'BKASH' | 'NAGAD'>('BKASH');
  const [loadingDriverId, setLoadingDriverId] = useState<string | null>(null);
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});

  // Merge wallet balance with driver details
  const enrichedWallets = drivers.map((driver) => {
    const w = wallets.find((item) => item.driverId === driver.driverId);
    const balance = w ? w.currentBalance : driver.walletBalance;
    return {
      ...driver,
      currentBalance: balance,
      lastTopupAt: w?.lastTopupAt,
    };
  });

  const handlePresetTopup = async (driverId: string, amount: number) => {
    setLoadingDriverId(driverId);
    try {
      await onTopupWallet(driverId, amount, selectedMethod);
    } finally {
      setLoadingDriverId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: bKash / Nagad Prepaid Mechanics */}
      <div className="glass-card rounded-2xl p-5 border border-[#E2136E]/30 bg-gradient-to-r from-[#111C2D] via-[#241227] to-[#111C2D]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E2136E]/20 border border-[#E2136E]/40 text-pink-300 text-xs font-bold">
              <Wallet className="w-3.5 h-3.5" />
              <span>বিকাশ ও নগদ প্রিপেইড ওয়ালেট • 8% Auto-Commission Ledger</span>
            </div>
            <h2 className="text-xl font-extrabold text-white">
              ক্যাশ-ফার্স্ট রাইড ও ৮% স্বয়ংক্রিয় কমিশন ডিডাকশন সিস্টেম
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              ভৈরবে ৯৫% যাত্রী চালককে সরাসরি নগদ টাকা (Cash) পরিশোধ করেন। প্রতি ট্রিপ শেষে চুক্তিকৃত ভাড়ার{' '}
              <strong className="text-emerald-300">৮% প্ল্যাটফর্ম কমিশন</strong> চালকের প্রিপেইড ওয়ালেট থেকে
              স্বয়ংক্রিয়ভাবে কেটে নেওয়া হয়। ওয়ালেট ব্যালেন্স{' '}
              <strong className="text-rose-400">৫০ টাকার নিচে নামলে</strong> চালকের বিডিং সাময়িক লক হয়ে যায়।
            </p>
          </div>

          {/* Payment Gateway Selector & KPI Summary */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="p-3 rounded-xl bg-[#0B131E]/90 border border-white/10 text-right">
              <div className="text-[11px] text-slate-400">মোট প্ল্যাটফর্ম কমিশন (৮%)</div>
              <div className="text-2xl font-extrabold text-emerald-400">
                ৳{totalCommissionBdt.toLocaleString('en-IN')} BDT
              </div>
              <div className="text-[10px] text-slate-400">
                মোট GMV: ৳{totalGmvBdt.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-2 rounded-xl bg-[#0B131E]/90 border border-white/10 flex flex-col gap-1.5">
              <span className="text-[10px] text-slate-400 font-semibold px-1">
                গেটওয়ে নির্বাচন (Top-Up Gateway):
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedMethod('BKASH')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    selectedMethod === 'BKASH'
                      ? 'bg-[#E2136E] text-white shadow-lg shadow-[#E2136E]/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  ৳ bKash পেমেন্ট
                </button>
                <button
                  onClick={() => setSelectedMethod('NAGAD')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    selectedMethod === 'NAGAD'
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  ৳ Nagad নগদ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Wallet Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>চালকদের প্রিপেইড ওয়ালেট ব্যালেন্স ও ইনস্ট্যান্ট রিচার্জ</span>
            <span className="text-xs font-normal text-slate-400">• Driver Prepaid Wallets</span>
          </h3>
          <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
            <ShieldAlert className="w-4 h-4" /> নূন্যতম বিডিং ব্যালেন্স: ৳৫০ টাকা
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {enrichedWallets.map((driver) => {
            const isLocked = driver.currentBalance < 50;
            const isLoading = loadingDriverId === driver.driverId;
            const customVal = customAmounts[driver.driverId] || 150;

            return (
              <div
                key={driver.driverId}
                className={`glass-card rounded-2xl p-5 flex flex-col justify-between transition-all ${
                  isLocked
                    ? 'border-2 border-[#F42A41] bg-gradient-to-b from-rose-950/35 to-[#111C2D]'
                    : 'border border-white/10'
                }`}
              >
                <div>
                  {/* Top Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-800 text-slate-200 border border-white/10">
                      {driver.vehicleType === 'EASYBIKE' && '🛺 ইজিবাইক'}
                      {driver.vehicleType === 'CNG' && '🛺 সিএনজি'}
                      {driver.vehicleType === 'BIKE' && '🏍️ বাইক'}
                      {driver.vehicleType === 'CAR_MICROBUS' && '🚐 মাইক্রোবাস'}
                    </span>

                    {isLocked ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#F42A41]/25 text-rose-200 border border-[#F42A41] flex items-center gap-1 animate-pulse">
                        <Lock className="w-3 h-3" /> 🔒 বিডিং লকড - নূন্যতম ৫০ টাকা প্রয়োজন
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> বিডিং সক্রিয় (Active)
                      </span>
                    )}
                  </div>

                  {/* Driver Info & Current Balance */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-base font-extrabold text-white">{driver.driverName}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        📞 {driver.driverPhone} • {driver.vehicleModel}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                        বর্তমান ব্যালেন্স
                      </span>
                      <span
                        className={`text-2xl font-extrabold ${
                          isLocked ? 'text-[#F42A41]' : 'text-emerald-400'
                        }`}
                      >
                        ৳{driver.currentBalance.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar relative to 50 BDT minimum */}
                  <div className="mt-3">
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isLocked ? 'bg-[#F42A41]' : 'bg-emerald-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(10, (driver.currentBalance / 300) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Instant Top-Up Controls */}
                <div className="mt-4 pt-3.5 border-t border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">
                      ৳ বিকাশ রিচার্জ (bKash Top-Up):
                    </span>
                    <span className="text-[11px] text-pink-400 font-bold">
                      {selectedMethod === 'BKASH' ? 'bKash মার্চেন্ট' : 'Nagad মার্চেন্ট'}
                    </span>
                  </div>

                  {/* Preset Amount Buttons: 100, 200, 500 BDT */}
                  <div className="grid grid-cols-3 gap-2">
                    {[100, 200, 500].map((amt) => (
                      <button
                        key={amt}
                        disabled={isLoading}
                        onClick={() => handlePresetTopup(driver.driverId, amt)}
                        className="py-2 px-2 rounded-xl bg-[#E2136E]/20 hover:bg-[#E2136E] text-pink-200 hover:text-white border border-[#E2136E]/40 text-xs font-extrabold transition-all flex items-center justify-center gap-1 shadow-sm"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>+৳{amt}</span>
                      </button>
                    ))}
                  </div>

                  {/* Direct Instant Action Button */}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={20}
                      step={50}
                      value={customVal}
                      onChange={(e) =>
                        setCustomAmounts((prev) => ({
                          ...prev,
                          [driver.driverId]: Number(e.target.value),
                        }))
                      }
                      className="w-24 px-2.5 py-2 rounded-xl bg-[#0B131E] border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-[#E2136E]"
                    />
                    <button
                      disabled={isLoading}
                      onClick={() => handlePresetTopup(driver.driverId, customVal)}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#E2136E] hover:bg-[#c81060] text-white text-xs font-extrabold shadow-lg shadow-[#E2136E]/25 transition-all flex items-center justify-center gap-1.5"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>
                        ৳ বিকাশ রিচার্জ ({customVal} BDT)
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Transaction Ledger Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
        <div className="px-5 py-4 bg-[#0E1726] border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-400" />
              <span>ওয়ালেট লেনদেন ও ৮% কমিশন লেজার (Full Transaction Ledger)</span>
            </h3>
            <p className="text-xs text-slate-400">
              BKASH_TOPUP, COMMISSION_DEDUCTION (8%), এবং PROMOTIONAL_BONUS এর রিয়েল-টাইম হিসাব
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono">
            মোট এন্ট্রি: {transactions.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0B131E] text-slate-400 border-b border-white/10 uppercase text-[11px]">
                <th className="py-3 px-4">লেনদেন আইডি (Trx ID)</th>
                <th className="py-3 px-4">চালক (Driver)</th>
                <th className="py-3 px-4">ধরন (Type)</th>
                <th className="py-3 px-4">বিবরণ (Bangla Note)</th>
                <th className="py-3 px-4 text-right">পরিমাণ (Amount)</th>
                <th className="py-3 px-4 text-right">পরবর্তী ব্যালেন্স (Balance After)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((tx) => {
                const drv = drivers.find((d) => d.driverId === tx.driverId);
                const isPositive = tx.amount >= 0;

                return (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-300">
                      <div>{tx.gatewayTrxId || tx.id}</div>
                      {tx.referenceRideId && (
                        <div className="text-[10px] text-slate-500">Ride: {tx.referenceRideId}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {drv ? drv.driverName : tx.driverId}
                    </td>
                    <td className="py-3 px-4">
                      {tx.type === 'BKASH_TOPUP' || tx.type === 'NAGAD_TOPUP' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E2136E]/20 text-pink-300 border border-[#E2136E]/40 font-bold text-[10px]">
                          <ArrowUpRight className="w-3 h-3" /> {tx.type}
                        </span>
                      ) : tx.type === 'COMMISSION_DEDUCTION' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[10px]">
                          <ArrowDownRight className="w-3 h-3" /> COMMISSION (8%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px]">
                          <Gift className="w-3 h-3" /> PROMO_BONUS
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bangla text-slate-200">{tx.noteBangla}</td>
                    <td
                      className={`py-3 px-4 text-right font-extrabold text-sm ${
                        isPositive ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {isPositive ? `+৳${tx.amount}` : `-৳${Math.abs(tx.amount)}`}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white">
                      ৳{Number(tx.balanceAfter).toFixed(1)} BDT
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
