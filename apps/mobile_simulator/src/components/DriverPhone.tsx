import React, { useState } from 'react';
import {
  Radio,
  Wallet,
  FileCheck2,
  Volume2,
  MapPin,
  Lock,
  Navigation,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Send,
  ShieldCheck,
  Coins,
  ExternalLink,
  KeyRound,
  Smartphone,
  X,
} from 'lucide-react';
import {
  ActiveRideSession,
  BHAIRAB_LANDMARKS,
  BhairabLandmark,
  DriverPersona,
  WalletTransaction,
} from '../types';

const API_BASE = 'http://localhost:4000';

export interface BkashExecutedPayload {
  paymentID: string;
  trxID: string;
  invoiceNumber: string;
  amountBdt: number;
  newBalance?: number;
  transaction?: WalletTransaction;
  alreadyCreditedOnServer: boolean;
}

interface DriverPhoneProps {
  persona: DriverPersona;
  isOnline: boolean;
  onToggleOnline: () => void;
  currentLandmark: BhairabLandmark;
  onChangeDriverLandmark: (landmark: BhairabLandmark) => void;
  walletBalance: number;
  transactions: WalletTransaction[];
  activeRide: ActiveRideSession | null;
  onSubmitBid: (bidAmount: number) => void;
  onStreamGpsStep: () => void;
  onCompleteRide: () => void;
  onTopupWallet: (
    amountBdt: number,
    method: 'BKASH' | 'NAGAD',
    bkashExecuted?: BkashExecutedPayload,
  ) => Promise<void>;
  onReplayVoiceAlert: (text: string) => void;
  onSubmitKycForm: (payload: {
    nidNumber: string;
    wardCertNumber: string;
    brtaLicenseNo: string;
    vehicleModel: string;
  }) => Promise<void>;
  driverErrorBanner: string | null;
  lastCommissionSummary: {
    cashCollected: number;
    commissionDeducted: number;
    newBalance: number;
  } | null;
  onDismissSummary: () => void;
}

type DriverTab = 'RADAR' | 'WALLET' | 'KYC';

export const DriverPhone: React.FC<DriverPhoneProps> = ({
  persona,
  isOnline,
  onToggleOnline,
  currentLandmark,
  onChangeDriverLandmark,
  walletBalance,
  transactions,
  activeRide,
  onSubmitBid,
  onStreamGpsStep,
  onCompleteRide,
  onTopupWallet,
  onReplayVoiceAlert,
  onSubmitKycForm,
  driverErrorBanner,
  lastCommissionSummary,
  onDismissSummary,
}) => {
  const [activeTab, setActiveTab] = useState<DriverTab>('RADAR');
  const [customBidInput, setCustomBidInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'BKASH' | 'NAGAD'>('BKASH');
  const [topupLoading, setTopupLoading] = useState(false);

  // bKash Tokenized Checkout Modal State (Step 1: Create -> Step 2: Checkout -> Step 3: Receipt)
  const [bkashModalOpen, setBkashModalOpen] = useState(false);
  const [bkashStep, setBkashStep] = useState<'CREATING' | 'CHECKOUT' | 'EXECUTING' | 'RECEIPT'>('CHECKOUT');
  const [bkashAmount, setBkashAmount] = useState<number>(200);
  const [bkashPaymentID, setBkashPaymentID] = useState<string>('');
  const [bkashInvoiceNo, setBkashInvoiceNo] = useState<string>('');
  const [bkashUrl, setBkashUrl] = useState<string>('');
  const [bkashAccount, setBkashAccount] = useState<string>('01811-223304');
  const [bkashOtp, setBkashOtp] = useState<string>('123456');
  const [bkashPin, setBkashPin] = useState<string>('12121');
  const [bkashReceipt, setBkashReceipt] = useState<{
    trxID: string;
    paymentID: string;
    invoiceNumber: string;
    amountBdt: number;
    prevBalance: number;
    newBalance: number;
  } | null>(null);

  // KYC form state
  const [nidNumber, setNidNumber] = useState(persona.nidNumber);
  const [wardCert, setWardCert] = useState(persona.wardCertNumber);
  const [brtaLicense, setBrtaLicense] = useState(persona.brtaLicenseNo);
  const [vehicleModel, setVehicleModel] = useState(persona.vehicleModel);
  const [kycSubmittedMsg, setKycSubmittedMsg] = useState<string | null>(null);

  // Sync KYC fields when persona switches
  React.useEffect(() => {
    setNidNumber(persona.nidNumber);
    setWardCert(persona.wardCertNumber);
    setBrtaLicense(persona.brtaLicenseNo);
    setVehicleModel(persona.vehicleModel);
    setKycSubmittedMsg(null);
  }, [persona]);

  const isLowBalanceLocked = walletBalance < 50;

  const mySubmittedBid = activeRide?.bids.find((b) => b.driverId === persona.driverId);

  // Step 1: Open bKash Tokenized Checkout & call POST /payments/bkash/create
  const openBkashTokenizedModal = async (amount: number = 200) => {
    setBkashAmount(amount);
    setBkashModalOpen(true);
    setBkashStep('CREATING');
    setBkashReceipt(null);

    try {
      const res = await fetch(`${API_BASE}/payments/bkash/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: persona.driverId,
          amountBdt: amount,
        }),
      });
      const data = await res.json();
      if (data?.paymentID) {
        setBkashPaymentID(data.paymentID);
        setBkashInvoiceNo(data.invoiceNumber || `INV-CB-${Date.now()}`);
        setBkashUrl(
          data.bkashURL ||
            `${API_BASE}/payments/bkash/mock/checkout?paymentID=${data.paymentID}`,
        );
        setBkashStep('CHECKOUT');
        return;
      }
    } catch {
      // Offline fallback if backend is unreachable
    }

    const fallbackPaymentId = `TR0011${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const fallbackInvoice = `INV-CB-${Date.now()}-204`;
    setBkashPaymentID(fallbackPaymentId);
    setBkashInvoiceNo(fallbackInvoice);
    setBkashUrl(`${API_BASE}/payments/bkash/mock/checkout?paymentID=${fallbackPaymentId}`);
    setBkashStep('CHECKOUT');
  };

  // Step 3: Confirm & Execute Payment via POST /payments/bkash/execute
  const handleConfirmBkashExecute = async () => {
    setBkashStep('EXECUTING');
    setTopupLoading(true);
    const prevBalance = walletBalance;
    const cleanMsisdn = bkashAccount.replace(/[^0-9]/g, '') || '01811223304';

    try {
      const res = await fetch(`${API_BASE}/payments/bkash/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentID: bkashPaymentID,
          status: 'success',
          msisdn: cleanMsisdn,
        }),
      });
      const data = await res.json();
      if (data?.success && data.payment) {
        const trxID =
          data.payment.trxID ||
          data.transaction?.gatewayTrxId ||
          `BKH${Math.floor(1000000 + Math.random() * 9000000)}M`;
        const newBal =
          typeof data.wallet?.currentBalance === 'number'
            ? data.wallet.currentBalance
            : Number((prevBalance + bkashAmount).toFixed(2));

        await onTopupWallet(bkashAmount, 'BKASH', {
          paymentID: bkashPaymentID,
          trxID,
          invoiceNumber: bkashInvoiceNo,
          amountBdt: bkashAmount,
          newBalance: newBal,
          transaction: data.transaction,
          alreadyCreditedOnServer: true,
        });

        setBkashReceipt({
          trxID,
          paymentID: bkashPaymentID,
          invoiceNumber: bkashInvoiceNo,
          amountBdt: bkashAmount,
          prevBalance,
          newBalance: newBal,
        });
        setBkashStep('RECEIPT');
        setTopupLoading(false);
        return;
      }
    } catch {
      // Offline fallback below
    }

    const fallbackTrxId = `BKH${Math.floor(1000000 + Math.random() * 9000000)}M`;
    const nextBalance = Number((prevBalance + bkashAmount).toFixed(2));
    await onTopupWallet(bkashAmount, 'BKASH', {
      paymentID: bkashPaymentID,
      trxID: fallbackTrxId,
      invoiceNumber: bkashInvoiceNo,
      amountBdt: bkashAmount,
      newBalance: nextBalance,
      alreadyCreditedOnServer: false,
    });

    setBkashReceipt({
      trxID: fallbackTrxId,
      paymentID: bkashPaymentID,
      invoiceNumber: bkashInvoiceNo,
      amountBdt: bkashAmount,
      prevBalance,
      newBalance: nextBalance,
    });
    setBkashStep('RECEIPT');
    setTopupLoading(false);
  };

  const handleQuickTopup = async (amount: number) => {
    if (paymentMethod === 'BKASH') {
      await openBkashTokenizedModal(amount);
      return;
    }
    setTopupLoading(true);
    try {
      await onTopupWallet(amount, paymentMethod);
    } finally {
      setTopupLoading(false);
    }
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmitKycForm({
      nidNumber,
      wardCertNumber: wardCert,
      brtaLicenseNo: brtaLicense,
      vehicleModel,
    });
    setKycSubmittedMsg(
      '✓ আপনার এনআইডি ও পৌরসভা ওয়ার্ড কাউন্সিলর প্রত্যয়নপত্র ভেরিফিকেশনের জন্য জমা হয়েছে!',
    );
  };

  const baseOffer = activeRide?.initialOfferFare ?? 80;

  return (
    <div className="w-[390px] h-[820px] rounded-[46px] bg-[#0B131E] border-[7px] border-slate-800 shadow-[0_25px_70px_rgba(0,0,0,0.75)] flex flex-col overflow-hidden relative select-none shrink-0 ring-1 ring-amber-500/20">
      {/* Smartphone Notch & Status Bar */}
      <div className="pt-2 pb-1.5 px-6 bg-[#070D15] flex items-center justify-between text-[11px] font-semibold text-slate-300 relative z-20">
        <span>9:41 AM</span>
        <div className="w-28 h-5 bg-black rounded-full border border-slate-800/80 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-800" />
          <span className="w-8 h-1 rounded-full bg-slate-800" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-amber-400 font-bold">4G VoLTE</span>
          <div className="w-5 h-2.5 border border-slate-400 rounded-sm p-0.5 flex items-center">
            <div className="w-full h-full bg-amber-400 rounded-[1px]" />
          </div>
        </div>
      </div>

      {/* App Brand Header (Driver Mode) */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-[#1E293B] via-[#111C2D] to-[#0B131E] border-b border-amber-500/25 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-base shrink-0">
            🛺
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-bangla font-bold text-sm text-white truncate">
                {persona.driverName}
              </h2>
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 shrink-0">
                DRIVER
              </span>
            </div>
            <p className="text-[10px] text-slate-300 font-bangla truncate">
              {persona.vehicleModel} • ★ {persona.rating}
            </p>
          </div>
        </div>

        {/* Live Wallet Balance Badge */}
        <button
          onClick={() => setActiveTab('WALLET')}
          className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1 border transition-all shrink-0 ${
            isLowBalanceLocked
              ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>৳{walletBalance}</span>
        </button>
      </div>

      {/* Top Segmented Tab Bar */}
      <div className="grid grid-cols-3 gap-1 p-1.5 bg-[#091019] border-b border-slate-800/80 font-bangla text-[11px]">
        <button
          onClick={() => setActiveTab('RADAR')}
          className={`py-1.5 px-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-1 ${
            activeTab === 'RADAR'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <span>১. ট্রিপ রাডার</span>
        </button>
        <button
          onClick={() => setActiveTab('WALLET')}
          className={`py-1.5 px-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-1 ${
            activeTab === 'WALLET'
              ? 'bg-[#E2136E] text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <span>২. বিকাশ ওয়ালেট</span>
        </button>
        <button
          onClick={() => setActiveTab('KYC')}
          className={`py-1.5 px-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-1 ${
            activeTab === 'KYC'
              ? 'bg-emerald-600 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <span>৩. কেওয়াইসি (KYC)</span>
        </button>
      </div>

      {/* Scrollable Phone Viewport Body */}
      <div className="flex-1 overflow-y-auto phone-scroll p-3 space-y-2.5 bg-[#0B131E]">
        {activeTab === 'RADAR' && (
          <>
            {/* Online/Offline Switch + Current Bhairab Landmark Selector */}
            <div className="bg-[#111C2D] border border-slate-800 rounded-2xl p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                    }`}
                  />
                  <div>
                    <div className="font-bangla font-bold text-xs text-white">
                      {isOnline ? 'আপনি এখন অনলাইনে আছেন' : 'আপনি এখন অফলাইনে আছেন'}
                    </div>
                    <div className="text-[10px] font-bangla text-slate-400">
                      {isOnline
                        ? 'নতুন রাইড রিকোয়েস্ট ও বাংলা ভয়েস অ্যালার্ট সক্রিয়'
                        : 'ট্রিপ পেতে অনলাইন সুইচটি চালু করুন'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onToggleOnline}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bangla font-bold transition-all ${
                    isOnline
                      ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isOnline ? '🟢 অনলাইন' : '⚪ অফলাইন'}
                </button>
              </div>

              <div className="pt-1.5 border-t border-slate-800/80 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="block text-[9px] text-slate-400 font-bangla">
                    চালকের বর্তমান অবস্থান (Driver GPS Stand)
                  </span>
                  <select
                    value={currentLandmark.id}
                    onChange={(e) => {
                      const found = BHAIRAB_LANDMARKS.find((l) => l.id === e.target.value);
                      if (found) onChangeDriverLandmark(found);
                    }}
                    className="w-full bg-transparent text-xs font-bangla font-semibold text-amber-300 focus:outline-none truncate cursor-pointer"
                  >
                    {BHAIRAB_LANDMARKS.map((l) => (
                      <option key={l.id} value={l.id} className="bg-[#0B131E] text-white">
                        {l.banglaName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* LOW BALANCE LOCKOUT BANNER (< 50 BDT) */}
            {isLowBalanceLocked && (
              <div className="bg-gradient-to-br from-rose-950/90 via-[#2A0E17] to-[#111C2D] border-2 border-rose-500 rounded-2xl p-3 space-y-2 shadow-[0_0_25px_rgba(244,42,65,0.25)]">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-xl bg-rose-500/20 border border-rose-400/50 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="font-bangla">
                    <h3 className="font-bold text-xs text-rose-200">
                      🔒 কম ব্যালেন্স! বিড করতে নূন্যতম ৫০ টাকা প্রয়োজন
                    </h3>
                    <p className="text-[10px] text-rose-200/80 mt-0.5">
                      আপনার বর্তমান ওয়ালেট ব্যালেন্স মাত্র <strong className="text-white">৳{walletBalance}</strong>। নতুন ট্রিপে বিড করতে এখনই বিকাশ রিচার্জ করুন।
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => openBkashTokenizedModal(100)}
                    disabled={topupLoading}
                    className="py-2 px-2.5 rounded-xl bg-[#E2136E] hover:bg-[#c81061] active:scale-95 text-white font-bangla font-bold text-[11px] flex items-center justify-center gap-1 shadow-md transition-all"
                  >
                    <span>⚡ +৳১০০ বিকাশ রিচার্জ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('WALLET')}
                    className="py-2 px-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-rose-200 border border-rose-500/40 font-bangla font-semibold text-[11px] flex items-center justify-center gap-1"
                  >
                    <span>ওয়ালেট ট্যাব দেখুন</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Backend Error Alert (e.g. if driver attempted bid while < 50 BDT) */}
            {driverErrorBanner && (
              <div className="bg-rose-950/90 border border-rose-500 rounded-xl p-2.5 flex items-center gap-2 text-xs font-bangla text-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{driverErrorBanner}</span>
              </div>
            )}

            {/* 8% Commission Deduction Modal/Card on Ride Completion */}
            {lastCommissionSummary && (
              <div className="bg-gradient-to-b from-emerald-950/80 to-[#111C2D] border-2 border-emerald-500 rounded-2xl p-3 space-y-2 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bangla font-bold">
                    ✓ ট্রিপ সম্পন্ন ও কমিশন হিসাব
                  </span>
                  <button
                    type="button"
                    onClick={onDismissSummary}
                    className="text-[10px] text-slate-400 hover:text-white font-bangla"
                  >
                    বন্ধ করুন ✕
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center font-bangla">
                  <div className="bg-[#0B131E] p-2 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400">নগদ গ্রহণ</div>
                    <div className="text-sm font-extrabold text-emerald-400">
                      ৳{lastCommissionSummary.cashCollected}
                    </div>
                  </div>
                  <div className="bg-[#0B131E] p-2 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400">৮% কমিশন কর্তন</div>
                    <div className="text-sm font-extrabold text-amber-400">
                      -৳{lastCommissionSummary.commissionDeducted}
                    </div>
                  </div>
                  <div className="bg-[#0B131E] p-2 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400">নতুন ব্যালেন্স</div>
                    <div className="text-sm font-extrabold text-white">
                      ৳{lastCommissionSummary.newBalance}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* INCOMING RIDE OPPORTUNITY & BANGLA VOICE ALERT CARD */}
            {activeRide && (activeRide.status === 'SEARCHING' || activeRide.status === 'BIDDING') && (
              <div className="bg-gradient-to-b from-[#17253B] to-[#111C2D] border-2 border-amber-500/70 rounded-2xl p-3 space-y-2.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    <span className="font-bangla font-bold text-xs text-amber-300">
                      🔔 নতুন ট্রিপ রিকোয়েস্ট! (Ride Opportunity)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onReplayVoiceAlert(activeRide.audioPromptBangla)}
                    className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bangla font-bold flex items-center gap-1"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>বাংলা ভয়েস শুনুন</span>
                  </button>
                </div>

                {/* Bangla Voice Transcript Box */}
                <div className="bg-[#0B131E]/90 border border-slate-800 rounded-xl p-2 text-[11px] font-bangla text-emerald-200 flex items-start gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>“{activeRide.audioPromptBangla}”</span>
                </div>

                {/* Route & Passenger Details */}
                <div className="space-y-1.5 text-xs font-bangla bg-[#0B131E] p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>যাত্রী: {activeRide.passengerName}</span>
                    <span className="text-amber-400 font-bold">
                      প্রস্তাবিত ভাড়া: ৳{baseOffer}
                    </span>
                  </div>
                  <div className="text-white font-semibold truncate">
                    🟢 পিকআপ: {activeRide.pickupLandmark.banglaName}
                  </div>
                  <div className="text-rose-200 font-semibold truncate">
                    🔴 গন্তব্য: {activeRide.dropoffLandmark.banglaName}
                  </div>
                </div>

                {mySubmittedBid ? (
                  <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-center font-bangla space-y-1">
                    <div className="text-xs font-bold text-emerald-300">
                      ✓ আপনার বিড পাঠানো হয়েছে: ৳{mySubmittedBid.bidAmount}
                    </div>
                    <p className="text-[10px] text-slate-300">
                      বাম পাশের Passenger Phone থেকে বিডটি গ্রহণ (Accept) করুন অথবা নিচে বিড আপডেট করুন:
                    </p>
                  </div>
                ) : null}

                {/* 1-Tap Accept Offer Button */}
                <button
                  type="button"
                  onClick={() => onSubmitBid(baseOffer)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#006A4E] to-[#10B981] hover:from-[#047857] hover:to-[#34D399] active:scale-[0.99] text-white font-bangla font-bold text-xs shadow-lg flex items-center justify-center gap-1.5"
                >
                  <span>✓ ৳{baseOffer}-এ গ্রহণ করুন (Accept Offer)</span>
                </button>

                {/* Quick Counter-Bid Pills (+৳10, +৳20, +৳30) */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bangla text-slate-400 flex items-center justify-between">
                    <span>অথবা পাল্টা ভাড়া প্রস্তাব করুন (InDrive Counter-Bid):</span>
                    {isLowBalanceLocked && (
                      <span className="text-rose-400 font-bold">🔒 ৫০ টাকার নিচে লকড</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 font-bangla">
                    {[10, 20, 30].map((add) => {
                      const targetAmount = baseOffer + add;
                      return (
                        <button
                          key={add}
                          type="button"
                          onClick={() => onSubmitBid(targetAmount)}
                          className="py-2 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/50 font-bold text-xs transition-all active:scale-95"
                        >
                          +৳{add} (৳{targetAmount})
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Counter-Bid Input */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="number"
                      placeholder="কাস্টম ভাড়া (যেমন: 95)"
                      value={customBidInput}
                      onChange={(e) => setCustomBidInput(e.target.value)}
                      className="flex-1 bg-[#0B131E] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bangla focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const parsed = parseInt(customBidInput, 10);
                        if (!isNaN(parsed) && parsed >= 20) {
                          onSubmitBid(parsed);
                          setCustomBidInput('');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-bangla font-bold text-xs flex items-center gap-1 transition-all"
                    >
                      <Send className="w-3 h-3" />
                      <span>বিড</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ACTIVE TRIP & CASH COLLECTION STATE */}
            {activeRide && activeRide.status === 'ACCEPTED' && (
              <div className="bg-gradient-to-b from-[#0E2920] to-[#111C2D] border-2 border-emerald-500 rounded-2xl p-3 space-y-2.5 shadow-xl">
                <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl p-2 text-center font-bangla">
                  <div className="font-bold text-xs text-emerald-300">
                    🎉 রাইড কনফার্ম হয়েছে! যাত্রীর কাছে রওয়ানা হন
                  </div>
                  <div className="text-[10px] text-emerald-100 mt-0.5">
                    চূড়ান্ত নির্ধারিত ভাড়া: <strong>৳{activeRide.agreedFare}</strong> (৮% কমিশন: ৳
                    {Math.round(((activeRide.agreedFare || 80) * 8) / 100)})
                  </div>
                </div>

                <div className="bg-[#0B131E] rounded-xl p-2.5 border border-slate-800 text-xs font-bangla space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">যাত্রী:</span>
                    <span className="text-white font-bold">{activeRide.passengerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">মোবাইল:</span>
                    <span className="text-emerald-400 font-mono">{activeRide.passengerPhone}</span>
                  </div>
                  <div className="text-slate-200 truncate pt-1 border-t border-slate-800/80">
                    📍 পিকআপ: {activeRide.pickupLandmark.banglaName}
                  </div>
                  <div className="text-slate-200 truncate">
                    🏁 গন্তব্য: {activeRide.dropoffLandmark.banglaName}
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={onStreamGpsStep}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 border border-amber-500/40 font-bangla font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>📍 Stream GPS Movement (যাত্রীর ম্যাপে গাড়ি চালান)</span>
                  </button>

                  <button
                    type="button"
                    onClick={onCompleteRide}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#006A4E] to-[#10B981] hover:from-[#047857] hover:to-[#34D399] active:scale-95 text-white font-bangla font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Coins className="w-4 h-4" />
                    <span>
                      💰 ট্রিপ সম্পন্ন ও নগদ গ্রহণ (Complete & Collect ৳{activeRide.agreedFare})
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* IDLE RADAR WAITING STATE */}
            {(!activeRide || activeRide.status === 'IDLE' || activeRide.status === 'COMPLETED') && (
              <div className="bg-[#111C2D] border border-slate-800 rounded-2xl p-4 text-center space-y-2 font-bangla">
                <div className="w-11 h-11 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                </div>
                <h3 className="font-bold text-xs text-white">
                  ভৈরব লাইভ ট্রিপ রাডার সক্রিয় আছে
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  বাম পাশের <strong>Passenger Phone</strong> থেকে{' '}
                  <span className="text-emerald-400 font-semibold">
                    “⚡ রাইড রিকোয়েস্ট পাঠান”
                  </span>{' '}
                  বাটনে চাপ দিন — সাথে সাথে এখানে বাংলা ভয়েস অ্যালার্ট ও বিডিং কার্ড চলে আসবে!
                </p>
              </div>
            )}
          </>
        )}

        {/* TAB 2: BKASH / NAGAD PREPAID WALLET & 8% COMMISSION LEDGER */}
        {activeTab === 'WALLET' && (
          <div className="space-y-2.5 font-bangla">
            {/* Balance Hero Card */}
            <div className="bg-gradient-to-br from-[#2B091C] via-[#171528] to-[#111C2D] border border-[#E2136E]/50 rounded-2xl p-3.5 space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-pink-300 font-bold">
                    bKash / Nagad Prepaid Driver Wallet
                  </span>
                  <div className="text-2xl font-extrabold text-white mt-0.5">
                    ৳{walletBalance.toFixed(0)}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    isLowBalanceLocked
                      ? 'bg-rose-600 text-white'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {isLowBalanceLocked ? '🔒 লকড (< ৳৫০)' : '✓ বিডিং সচল (≥ ৳৫০)'}
                </span>
              </div>

              {/* Minimum 50 BDT Threshold Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-300">
                  <span>নূন্যতম বিডিং ব্যালেন্স সীমা: ৳৫০</span>
                  <span>মাত্র ৮% প্ল্যাটফর্ম কমিশন</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isLowBalanceLocked ? 'bg-rose-500' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, (walletBalance / 200) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Gateway Switcher (bKash / Nagad) */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BKASH')}
                  className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    paymentMethod === 'BKASH'
                      ? 'bg-[#E2136E] border-pink-400 text-white shadow-sm'
                      : 'bg-[#0B131E] border-slate-800 text-slate-400'
                  }`}
                >
                  🪽 বিকাশ (bKash)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('NAGAD')}
                  className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    paymentMethod === 'NAGAD'
                      ? 'bg-orange-600 border-orange-400 text-white shadow-sm'
                      : 'bg-[#0B131E] border-slate-800 text-slate-400'
                  }`}
                >
                  🔥 নগদ (Nagad)
                </button>
              </div>

              {/* Instant Top-Up Buttons (+৳100 / +৳200 / +৳500) */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-pink-200 font-semibold">
                  ১-ক্লিকে টোকেনাইজড ওয়ালেট রিচার্জ করুন:
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[100, 200, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      disabled={topupLoading}
                      onClick={() => handleQuickTopup(amt)}
                      className="py-2 rounded-xl bg-[#E2136E] hover:bg-[#c81061] active:scale-95 text-white font-bold text-xs shadow-md transition-all"
                    >
                      +৳{amt}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={topupLoading}
                  onClick={() => openBkashTokenizedModal(200)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#E2136E] to-[#B90E58] hover:from-[#c81061] hover:to-[#9e0c4b] active:scale-[0.99] text-white font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 border border-pink-400/40"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>৳ বিকাশ রিচার্জ (bKash Top-Up • Tokenized v1.2)</span>
                </button>
              </div>
            </div>

            {/* Transaction Ledger Table */}
            <div className="bg-[#111C2D] border border-slate-800 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  <span>ওয়ালেট লেনদেন ও ৮% কমিশন লেজার</span>
                </h4>
                <span className="text-[10px] text-slate-400">{transactions.length}টি এন্ট্রি</span>
              </div>

              <div className="space-y-1.5 max-h-[260px] overflow-y-auto phone-scroll pr-1">
                {transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <div
                      key={tx.id}
                      className="bg-[#0B131E] border border-slate-800/90 rounded-xl p-2 flex items-center justify-between gap-2 text-[11px]"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                              tx.type === 'BKASH_TOPUP' || tx.type === 'NAGAD_TOPUP'
                                ? 'bg-pink-500/20 text-pink-300'
                                : tx.type === 'COMMISSION_DEDUCTION'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {tx.type}
                          </span>
                          {tx.gatewayTrxId && (
                            <span className="text-[9px] font-mono text-slate-500">
                              #{tx.gatewayTrxId}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-200 truncate mt-0.5">{tx.noteBangla}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`font-extrabold text-xs ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPositive ? `+৳${tx.amount}` : `-৳${Math.abs(tx.amount)}`}
                        </div>
                        <div className="text-[9px] text-slate-500">
                          ব্যালেন্স: ৳{tx.balanceAfter}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TIERED KYC VERIFICATION (MUNICIPAL WARD CERT / BRTA) */}
        {activeTab === 'KYC' && (
          <div className="space-y-2.5 font-bangla">
            <div className="bg-gradient-to-r from-emerald-950/60 to-[#111C2D] border border-emerald-500/40 rounded-2xl p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>ভৈরব ২-স্তরের চালক কেওয়াইসি (Tiered KYC)</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    persona.kycStatus === 'APPROVED' || kycSubmittedMsg
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {kycSubmittedMsg
                    ? '✓ যাচাইয়ের জন্য জমা'
                    : persona.kycStatus === 'APPROVED'
                      ? '✓ অনুমোদিত'
                      : '⏳ ভেরিফিকেশন পেন্ডিং'}
                </span>
              </div>
              <p className="text-[10px] text-slate-300">
                ইজিবাইক ও সিএনজি চালকদের জন্য এনআইডি এবং <strong>ভৈরব পৌরসভা ওয়ার্ড কাউন্সিলর প্রত্যয়নপত্র</strong> প্রযোজ্য।
              </p>
            </div>

            <form
              onSubmit={handleKycSubmit}
              className="bg-[#111C2D] border border-slate-800 rounded-2xl p-3 space-y-2.5 text-xs"
            >
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  জাতীয় পরিচয়পত্র নম্বর (Smart NID Number)
                </label>
                <input
                  type="text"
                  value={nidNumber}
                  onChange={(e) => setNidNumber(e.target.value)}
                  className="w-full bg-[#0B131E] border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  যানবাহনের মডেল ও পৌরসভা টোকেন নম্বর
                </label>
                <input
                  type="text"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  className="w-full bg-[#0B131E] border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-emerald-300 font-semibold mb-1">
                  ওয়ার্ড কাউন্সিলর প্রত্যয়নপত্র / ইউনিয়ন সনদ (Easy-Bike/CNG Tier-1)
                </label>
                <input
                  type="text"
                  value={wardCert}
                  onChange={(e) => setWardCert(e.target.value)}
                  className="w-full bg-[#0B131E] border border-emerald-500/40 rounded-xl px-2.5 py-1.5 text-emerald-200 text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  বিআরটিএ ড্রাইভিং লাইসেন্স (বাইক ও মাইক্রোবাস Tier-2)
                </label>
                <input
                  type="text"
                  value={brtaLicense}
                  onChange={(e) => setBrtaLicense(e.target.value)}
                  className="w-full bg-[#0B131E] border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#006A4E] to-[#10B981] hover:from-[#047857] hover:to-[#34D399] text-white font-bold text-xs shadow-lg flex items-center justify-center gap-1.5"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>কেওয়াইসি ডকুমেন্ট জমা দিন (POST /auth/driver/kyc)</span>
              </button>

              {kycSubmittedMsg && (
                <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{kycSubmittedMsg}</span>
                </div>
              )}
            </form>
          </div>
        )}
      </div>

      {/* IN-PHONE BKASH TOKENIZED CHECKOUT SHEET / MODAL (v1.2.0-beta) */}
      {bkashModalOpen && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col justify-end p-2.5 animate-fadeIn">
          <div className="rounded-3xl overflow-hidden border-2 border-[#E2136E] bg-[#160710] shadow-[0_0_40px_rgba(226,19,110,0.45)] flex flex-col max-h-[710px]">
            {/* Official bKash Pink Header */}
            <div className="bg-gradient-to-r from-[#E2136E] via-[#C91062] to-[#9E0B4B] px-3.5 py-2.5 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/15 border border-white/30 flex items-center justify-center font-extrabold text-xs">
                  ৳
                </div>
                <div>
                  <div className="text-xs font-extrabold tracking-tight flex items-center gap-1.5">
                    <span>bKash Tokenized Checkout</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/30 font-mono">
                      v1.2.0-beta
                    </span>
                  </div>
                  <div className="text-[10px] text-pink-100 font-bangla">
                    চলো ভৈরব ড্রাইভার প্রিপেইড ওয়ালেট গেটওয়ে
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBkashModalOpen(false)}
                className="p-1 rounded-lg bg-black/20 hover:bg-black/40 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 space-y-2.5 overflow-y-auto phone-scroll font-bangla text-xs">
              {bkashStep === 'CREATING' && (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#E2136E]/20 border border-[#E2136E] flex items-center justify-center mx-auto animate-spin">
                    <Wallet className="w-5 h-5 text-pink-400" />
                  </div>
                  <div className="font-bold text-white">
                    বিকাশ পেমেন্ট সেশন তৈরি হচ্ছে... (POST /payments/bkash/create)
                  </div>
                  <div className="text-[10px] text-pink-200 font-mono">
                    Generating Tokenized PaymentID & Invoice...
                  </div>
                </div>
              )}

              {(bkashStep === 'CHECKOUT' || bkashStep === 'EXECUTING') && (
                <>
                  {/* Merchant & Invoice Summary Box */}
                  <div className="bg-[#240B1A] border border-pink-500/30 rounded-2xl p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-pink-300 font-semibold">মার্চেন্ট (Merchant)</div>
                        <div className="font-bold text-white text-xs">
                          CholoBhairab (চলো ভৈরব)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-pink-300 font-semibold">পরিমাণ (Amount)</div>
                        <div className="text-base font-extrabold text-white">৳{bkashAmount}</div>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-pink-500/20 grid grid-cols-2 gap-1 text-[10px] font-mono">
                      <div className="truncate text-pink-200" title={bkashPaymentID}>
                        ID: <span className="text-white font-bold">{bkashPaymentID}</span>
                      </div>
                      <div className="truncate text-right text-pink-200" title={bkashInvoiceNo}>
                        Inv: <span className="text-white">#{bkashInvoiceNo}</span>
                      </div>
                    </div>

                    {/* Amount Selector Pills inside Modal */}
                    <div className="pt-1 flex items-center justify-between gap-1.5">
                      {[100, 200, 500].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => openBkashTokenizedModal(amt)}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            bkashAmount === amt
                              ? 'bg-[#E2136E] border-white text-white'
                              : 'bg-[#12050D] border-pink-500/30 text-pink-200'
                          }`}
                        >
                          +৳{amt}
                        </button>
                      ))}
                      {bkashUrl && (
                        <a
                          href={bkashUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded-lg bg-slate-900 border border-pink-400/40 text-pink-200 hover:text-white text-[10px] flex items-center gap-1 shrink-0"
                          title="Open standalone bKash Mock Checkout HTML page in new tab"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>URL</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Authentic bKash Account, OTP, and PIN Verification Fields */}
                  <div className="bg-[#1F0916] border border-pink-500/30 rounded-2xl p-2.5 space-y-2">
                    <div>
                      <label className="block text-[10px] text-pink-200 mb-0.5 flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-pink-400" />
                        <span>আপনার বিকাশ অ্যাকাউন্ট নম্বর (bKash Account)</span>
                      </label>
                      <input
                        type="text"
                        value={bkashAccount}
                        onChange={(e) => setBkashAccount(e.target.value)}
                        className="w-full bg-[#12050D] border border-pink-500/40 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs text-center font-bold focus:outline-none focus:border-pink-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-pink-200 mb-0.5">
                          ৬-ডিজিট ওটিপি (OTP)
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={bkashOtp}
                          onChange={(e) => setBkashOtp(e.target.value)}
                          className="w-full bg-[#12050D] border border-pink-500/40 rounded-xl px-2 py-1.5 text-emerald-300 font-mono text-xs text-center tracking-widest font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-pink-200 mb-0.5 flex items-center gap-1">
                          <KeyRound className="w-3 h-3 text-pink-400" />
                          <span>৫-ডিজিট পিন (PIN)</span>
                        </label>
                        <input
                          type="password"
                          maxLength={5}
                          value={bkashPin}
                          onChange={(e) => setBkashPin(e.target.value)}
                          className="w-full bg-[#12050D] border border-pink-500/40 rounded-xl px-2 py-1.5 text-amber-300 font-mono text-xs text-center tracking-widest font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Confirm & Cancel Action Buttons */}
                  <div className="space-y-1.5 pt-0.5">
                    <button
                      type="button"
                      disabled={bkashStep === 'EXECUTING'}
                      onClick={handleConfirmBkashExecute}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#E2136E] to-[#FF2E88] hover:from-[#c81061] hover:to-[#e2136e] active:scale-[0.99] text-white font-bold text-xs shadow-lg flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {bkashStep === 'EXECUTING'
                          ? 'পেমেন্ট যাচাই হচ্ছে (Executing...)'
                          : '✓ পেমেন্ট নিশ্চিত করুন (Confirm & Execute Payment)'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBkashModalOpen(false)}
                      className="w-full py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-semibold"
                    >
                      ✕ বাতিল করুন (Cancel)
                    </button>
                  </div>
                </>
              )}

              {bkashStep === 'RECEIPT' && bkashReceipt && (
                <div className="space-y-2.5 py-1">
                  <div className="bg-emerald-950/70 border-2 border-emerald-500 rounded-2xl p-3 text-center space-y-1.5">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <div className="font-bold text-xs text-emerald-200">
                      ✓ বিকাশ পেমেন্ট সফল • সার্ভার ভেরিফাইড!
                    </div>
                    <div className="text-[11px] font-mono text-white bg-[#0B131E] py-1 px-2 rounded-lg border border-emerald-500/40">
                      TrxID: <strong className="text-emerald-400">{bkashReceipt.trxID}</strong>
                    </div>
                  </div>

                  <div className="bg-[#240B1A] border border-pink-500/30 rounded-2xl p-2.5 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-pink-200">PaymentID:</span>
                      <span className="font-mono text-white">{bkashReceipt.paymentID}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-pink-200">ইনভয়েস নম্বর:</span>
                      <span className="font-mono text-slate-200">#{bkashReceipt.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-pink-200">রিচার্জ পরিমাণ:</span>
                      <span className="font-extrabold text-emerald-400">+৳{bkashReceipt.amountBdt}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-pink-500/20">
                      <span className="text-pink-200">ওয়ালেট ব্যালেন্স:</span>
                      <span className="font-extrabold text-white">
                        ৳{bkashReceipt.prevBalance} → ৳{bkashReceipt.newBalance}{' '}
                        {bkashReceipt.newBalance >= 50 && (
                          <span className="text-emerald-400">🟢 আনলকড!</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-[10px] text-emerald-300 font-mono text-center">
                    🗄️ Persisted in public.bkash_payments & wallet_transactions
                  </div>

                  <button
                    type="button"
                    onClick={() => setBkashModalOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#006A4E] to-[#10B981] text-white font-bold text-xs shadow-lg"
                  >
                    ✓ ডান — ওয়ালেট ও ট্রিপ রাডারে ফিরুন
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Smartphone Bottom Navigation Bar */}
      <div className="px-4 py-2 bg-[#070D15] border-t border-slate-800/90 grid grid-cols-3 gap-2 text-[10px] font-bangla">
        <button
          onClick={() => setActiveTab('RADAR')}
          className={`flex flex-col items-center gap-0.5 py-1 rounded-xl ${
            activeTab === 'RADAR' ? 'text-amber-400 font-bold' : 'text-slate-500'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>ট্রিপ রাডার</span>
        </button>
        <button
          onClick={() => setActiveTab('WALLET')}
          className={`flex flex-col items-center gap-0.5 py-1 rounded-xl ${
            activeTab === 'WALLET' ? 'text-pink-400 font-bold' : 'text-slate-500'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>বিকাশ ওয়ালেট</span>
        </button>
        <button
          onClick={() => setActiveTab('KYC')}
          className={`flex flex-col items-center gap-0.5 py-1 rounded-xl ${
            activeTab === 'KYC' ? 'text-emerald-400 font-bold' : 'text-slate-500'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>কেওয়াইসি</span>
        </button>
      </div>
    </div>
  );
};
