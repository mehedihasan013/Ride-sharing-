import React, { useState } from 'react';
import {
  Car,
  Wallet,
  FileCheck2,
  Volume2,
  MapPin,
  Lock,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Loader2,
  X,
} from 'lucide-react';
import {
  ActiveRideSession,
  BHAIRAB_LANDMARKS,
  BhairabLandmark,
  DriverPersona,
  WalletTransaction,
  calculateHaversineKm,
} from '../types';

import { API_BASE } from '../config';

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

// Shared class strings. Press feedback only; no decorative motion.
const PRESS = 'transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100';
const BTN_PRIMARY = `h-14 w-full rounded-md bg-brand text-on-brand text-[16px] font-semibold flex items-center justify-center gap-2 hover:bg-brand/90 ${PRESS}`;
const BTN_SECONDARY = `h-12 rounded-md border border-line bg-surface text-ink text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-raised ${PRESS}`;
const BTN_BKASH = `rounded-md bg-bkash text-on-brand font-semibold flex items-center justify-center gap-2 hover:bg-bkash/90 ${PRESS}`;
const CARD = 'rounded-lg border border-line bg-surface p-4';
const FIELD = 'h-12 w-full rounded-md border border-line bg-surface px-3 text-[16px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand';
const LABEL = 'block text-[13px] text-ink-2 mb-1';
const MONO = 'font-mono tabular-nums';

const TX_LABEL: Record<WalletTransaction['type'], string> = {
  BKASH_TOPUP: 'bKash রিচার্জ',
  NAGAD_TOPUP: 'Nagad রিচার্জ',
  COMMISSION_DEDUCTION: 'কমিশন',
  PROMOTIONAL_BONUS: 'বোনাস',
};

const km = (a: BhairabLandmark, b: BhairabLandmark) =>
  calculateHaversineKm(a.latitude, a.longitude, b.latitude, b.longitude).toFixed(1);

const RouteStops: React.FC<{
  pickup: string;
  dropoff: string;
  pickupMeta?: React.ReactNode;
  dropoffMeta?: React.ReactNode;
}> = ({ pickup, dropoff, pickupMeta, dropoffMeta }) => (
  <ol className="space-y-3">
    <li className="flex gap-3">
      <span aria-hidden className="mt-1.5 w-2.5 h-2.5 rounded-full bg-brand shrink-0" />
      <div className="min-w-0">
        <div className="text-[12px] text-ink-3">পিকআপ{pickupMeta}</div>
        <div className="text-[16px] font-medium text-ink truncate">{pickup}</div>
      </div>
    </li>
    <li className="flex gap-3">
      <span aria-hidden className="mt-1.5 w-2.5 h-2.5 rounded-sm bg-ink shrink-0" />
      <div className="min-w-0">
        <div className="text-[12px] text-ink-3">গন্তব্য{dropoffMeta}</div>
        <div className="text-[16px] font-medium text-ink truncate">{dropoff}</div>
      </div>
    </li>
  </ol>
);

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
    paidAt: string;
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

  const receiptTime = () =>
    new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

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
          paidAt: receiptTime(),
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
      paidAt: receiptTime(),
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
    setKycSubmittedMsg('এনআইডি ও ওয়ার্ড কাউন্সিলরের প্রত্যয়নপত্র যাচাইয়ের জন্য জমা হয়েছে।');
  };

  const baseOffer = activeRide?.initialOfferFare ?? 80;

  const kycApproved = persona.kycStatus === 'APPROVED';
  const kycStatusLabel = kycSubmittedMsg ? 'জমা হয়েছে' : kycApproved ? 'অনুমোদিত' : 'যাচাই বাকি';
  const kycDot = kycApproved ? 'bg-brand' : kycSubmittedMsg ? 'bg-ink-3' : 'bg-warning';

  const tabs: { id: DriverTab; label: string; Icon: typeof Car }[] = [
    { id: 'RADAR', label: 'ট্রিপ', Icon: Car },
    { id: 'WALLET', label: 'ওয়ালেট', Icon: Wallet },
    { id: 'KYC', label: 'কেওয়াইসি', Icon: FileCheck2 },
  ];

  return (
    <div className="w-[390px] h-[820px] shrink-0 bg-ink rounded-[44px] p-2">
      <div className="relative h-full bg-page rounded-[36px] overflow-hidden flex flex-col text-ink">
        {/* Status bar */}
        <div className="h-10 px-7 shrink-0 flex items-center justify-between bg-surface font-mono text-[12px] text-ink-2">
          <span>9:41</span>
          <span className="flex items-center gap-1.5">
            <span>4G</span>
            <span aria-hidden className="w-6 h-3 rounded-[3px] border border-ink-2 p-px">
              <span className="block h-full w-3/4 rounded-[1px] bg-ink-2" />
            </span>
          </span>
        </div>

        {/* App header: who is driving, and the balance that gates bidding */}
        <header className="px-4 pb-3 pt-1 shrink-0 flex items-center justify-between gap-3 bg-surface border-b border-line">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-ink truncate">{persona.driverName}</h2>
            <p className="text-[13px] text-ink-2 truncate">
              {persona.vehicleModel} · রেটিং <span className={MONO}>{persona.rating}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('WALLET')}
            aria-label={`ওয়ালেট ব্যালেন্স ৳${walletBalance}`}
            className={`h-11 px-3 shrink-0 rounded-md border flex items-center gap-1.5 text-[14px] font-semibold ${MONO} ${PRESS} ${
              isLowBalanceLocked
                ? 'border-danger/40 bg-danger/5 text-danger'
                : 'border-line text-ink hover:bg-raised'
            }`}
          >
            <Wallet className="w-4 h-4" aria-hidden />
            <span>৳{walletBalance}</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto overscroll-contain phone-scroll p-4 space-y-3">
          {activeTab === 'RADAR' && (
            <>
              {/* Online / offline + current stand */}
              <section className={CARD}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-brand' : 'bg-ink-3'}`}
                      />
                      <span className="text-[16px] font-semibold">
                        {isOnline ? 'অনলাইন' : 'অফলাইন'}
                      </span>
                    </div>
                    <p className="text-[13px] text-ink-2 mt-0.5">
                      {isOnline ? 'নতুন ট্রিপ এলে বাংলায় ঘোষণা হবে' : 'ট্রিপ পেতে অনলাইন হোন'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleOnline}
                    aria-pressed={isOnline}
                    className={
                      isOnline
                        ? `${BTN_SECONDARY} px-4 shrink-0`
                        : `h-12 px-5 shrink-0 rounded-md bg-brand text-on-brand text-[14px] font-semibold hover:bg-brand/90 ${PRESS}`
                    }
                  >
                    {isOnline ? 'অফলাইন হোন' : 'অনলাইন হোন'}
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-line">
                  <label htmlFor="driver-landmark" className={`${LABEL} flex items-center gap-1.5`}>
                    <MapPin className="w-4 h-4" aria-hidden />
                    আপনার অবস্থান
                  </label>
                  <select
                    id="driver-landmark"
                    value={currentLandmark.id}
                    onChange={(e) => {
                      const found = BHAIRAB_LANDMARKS.find((l) => l.id === e.target.value);
                      if (found) onChangeDriverLandmark(found);
                    }}
                    className={`${FIELD} cursor-pointer`}
                  >
                    {BHAIRAB_LANDMARKS.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.banglaName}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              {/* Low-balance lockout (< ৳50) */}
              {isLowBalanceLocked && (
                <section role="alert" className="rounded-lg border border-danger/40 bg-danger/5 p-4 space-y-3">
                  <div className="flex gap-3">
                    <Lock className="w-5 h-5 text-danger shrink-0 mt-0.5" aria-hidden />
                    <div>
                      <h3 className="text-[16px] font-semibold text-ink">ব্যালেন্স কম, বিড বন্ধ</h3>
                      <p className="text-[14px] text-ink-2 mt-0.5">
                        বিড করতে কমপক্ষে ৳৫০ লাগবে। এখন আছে{' '}
                        <span className={`${MONO} text-ink font-medium`}>৳{walletBalance}</span>।
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openBkashTokenizedModal(100)}
                      disabled={topupLoading}
                      className={`${BTN_BKASH} h-12 text-[14px]`}
                    >
                      bKash-এ ৳১০০ রিচার্জ
                    </button>
                    <button type="button" onClick={() => setActiveTab('WALLET')} className={BTN_SECONDARY}>
                      ওয়ালেট দেখুন
                    </button>
                  </div>
                </section>
              )}

              {/* Server error (e.g. bid rejected while < ৳50) */}
              {driverErrorBanner && (
                <div role="alert" className="rounded-lg border border-danger/40 bg-danger/5 p-3 flex gap-2 text-[14px] text-ink">
                  <AlertTriangle className="w-5 h-5 text-danger shrink-0" aria-hidden />
                  <span>{driverErrorBanner}</span>
                </div>
              )}

              {/* Trip finished: cash and 8% commission */}
              {lastCommissionSummary && (
                <section className={CARD}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[16px] font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-brand-text" aria-hidden />
                      ট্রিপ শেষ
                    </h3>
                    <button
                      type="button"
                      onClick={onDismissSummary}
                      aria-label="বন্ধ করুন"
                      className={`w-11 h-11 -mr-2 rounded-md flex items-center justify-center text-ink-2 hover:bg-raised ${PRESS}`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <dl className="mt-1 divide-y divide-line text-[14px]">
                    <div className="flex justify-between py-2">
                      <dt className="text-ink-2">নগদ পেয়েছেন</dt>
                      <dd className={MONO}>৳{lastCommissionSummary.cashCollected}</dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-ink-2">কমিশন কাটা হয়েছে (৮%)</dt>
                      <dd className={MONO}>−৳{lastCommissionSummary.commissionDeducted}</dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-ink-2">নতুন ব্যালেন্স</dt>
                      <dd className={`${MONO} font-semibold`}>৳{lastCommissionSummary.newBalance}</dd>
                    </div>
                  </dl>
                </section>
              )}

              {/* Incoming ride request */}
              {activeRide && (activeRide.status === 'SEARCHING' || activeRide.status === 'BIDDING') && (
                <section className="rounded-lg border border-warning/50 bg-surface p-4 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span aria-hidden className="w-2.5 h-2.5 rounded-full bg-warning" />
                      <h3 className="text-[16px] font-semibold">নতুন ট্রিপ</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => onReplayVoiceAlert(activeRide.audioPromptBangla)}
                      className={`${BTN_SECONDARY} px-3`}
                    >
                      <Volume2 className="w-4 h-4" aria-hidden />
                      আবার শুনুন
                    </button>
                  </div>

                  <p className="text-[14px] text-ink-2">“{activeRide.audioPromptBangla}”</p>

                  <RouteStops
                    pickup={activeRide.pickupLandmark.banglaName}
                    dropoff={activeRide.dropoffLandmark.banglaName}
                    pickupMeta={
                      <>
                        {' · '}
                        <span className={MONO}>{km(currentLandmark, activeRide.pickupLandmark)}</span> কিমি দূরে
                      </>
                    }
                    dropoffMeta={
                      <>
                        {' · '}
                        <span className={MONO}>{km(activeRide.pickupLandmark, activeRide.dropoffLandmark)}</span> কিমি যাত্রা
                      </>
                    }
                  />

                  <div className="flex items-end justify-between gap-3 border-t border-line pt-3">
                    <div>
                      <div className="text-[13px] text-ink-2">যাত্রীর প্রস্তাব</div>
                      <div className={`${MONO} text-[24px] font-semibold leading-tight`}>৳{baseOffer}</div>
                    </div>
                    <div className="text-[13px] text-ink-2 truncate">{activeRide.passengerName}</div>
                  </div>

                  {mySubmittedBid && (
                    <p role="status" className="rounded-md bg-raised px-3 py-2 text-[14px] text-ink">
                      আপনার বিড <span className={`${MONO} font-semibold`}>৳{mySubmittedBid.bidAmount}</span> পাঠানো
                      হয়েছে। যাত্রী গ্রহণ করলে ট্রিপ শুরু হবে।
                    </p>
                  )}

                  <button type="button" onClick={() => onSubmitBid(baseOffer)} className={BTN_PRIMARY}>
                    <span className={MONO}>৳{baseOffer}</span>-এ গ্রহণ করুন
                  </button>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[13px] text-ink-2">
                      <span>অথবা পাল্টা ভাড়া দিন</span>
                      {isLowBalanceLocked && (
                        <span className="flex items-center gap-1 text-danger font-medium">
                          <Lock className="w-3.5 h-3.5" aria-hidden />
                          ব্যালেন্স কম
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[10, 20, 30].map((add) => {
                        const targetAmount = baseOffer + add;
                        return (
                          <button
                            key={add}
                            type="button"
                            onClick={() => onSubmitBid(targetAmount)}
                            aria-label={`৳${targetAmount} বিড দিন`}
                            className={`h-14 rounded-md border border-warning/50 bg-warning/5 text-warning flex flex-col items-center justify-center hover:bg-warning/10 ${PRESS}`}
                          >
                            <span className={`${MONO} text-[16px] font-semibold`}>৳{targetAmount}</span>
                            <span className={`${MONO} text-[12px]`}>+{add}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-2">
                      <label htmlFor="custom-bid" className="sr-only">
                        নিজের ভাড়া লিখুন
                      </label>
                      <input
                        id="custom-bid"
                        type="number"
                        inputMode="numeric"
                        placeholder="অন্য ভাড়া, যেমন ৯৫"
                        value={customBidInput}
                        onChange={(e) => setCustomBidInput(e.target.value)}
                        className={`${FIELD} ${MONO}`}
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
                        className={`h-12 px-4 shrink-0 rounded-md border border-warning/50 text-warning text-[14px] font-semibold hover:bg-warning/10 ${PRESS}`}
                      >
                        বিড দিন
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* Active trip */}
              {activeRide && activeRide.status === 'ACCEPTED' && (
                <section className="rounded-lg border border-brand/40 bg-surface p-4 space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span aria-hidden className="w-2.5 h-2.5 rounded-full bg-brand" />
                      <h3 className="text-[16px] font-semibold">যাত্রীকে তুলতে যান</h3>
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div>
                        <div className="text-[13px] text-ink-2">ঠিক হওয়া ভাড়া</div>
                        <div className={`${MONO} text-[24px] font-semibold leading-tight`}>
                          ৳{activeRide.agreedFare}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[13px] text-ink-2">কমিশন (৮%)</div>
                        <div className={`${MONO} text-[14px]`}>
                          ৳{Math.round(((activeRide.agreedFare || 80) * 8) / 100)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <dl className="divide-y divide-line border-y border-line text-[14px]">
                    <div className="flex justify-between gap-3 py-2">
                      <dt className="text-ink-2">যাত্রী</dt>
                      <dd className="font-medium truncate">{activeRide.passengerName}</dd>
                    </div>
                    <div className="flex justify-between gap-3 py-2">
                      <dt className="text-ink-2">মোবাইল</dt>
                      <dd className={MONO}>{activeRide.passengerPhone}</dd>
                    </div>
                  </dl>

                  <RouteStops
                    pickup={activeRide.pickupLandmark.banglaName}
                    dropoff={activeRide.dropoffLandmark.banglaName}
                  />

                  <div className="space-y-2">
                    <button type="button" onClick={onStreamGpsStep} className={`${BTN_SECONDARY} w-full`}>
                      <Navigation className="w-4 h-4" aria-hidden />
                      ম্যাপে গাড়ি এগিয়ে নিন
                    </button>
                    <button type="button" onClick={onCompleteRide} className={BTN_PRIMARY}>
                      ট্রিপ শেষ, <span className={MONO}>৳{activeRide.agreedFare}</span> নগদ নিন
                    </button>
                  </div>
                </section>
              )}

              {/* No trip right now */}
              {(!activeRide || activeRide.status === 'IDLE' || activeRide.status === 'COMPLETED') && (
                <section className={`${CARD} py-6 text-center`}>
                  <h3 className="text-[16px] font-semibold">এখন কোনো ট্রিপ নেই</h3>
                  <p className="text-[14px] text-ink-2 mt-1">
                    {isOnline
                      ? 'বাম পাশের যাত্রী ফোন থেকে রাইড চাইলে এখানে দেখাবে, সাথে বাংলায় ঘোষণা হবে।'
                      : 'অনলাইন হলে নতুন ট্রিপ এখানে দেখাবে।'}
                  </p>
                </section>
              )}
            </>
          )}

          {activeTab === 'WALLET' && (
            <>
              {/* Balance */}
              <section className={`${CARD} space-y-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[13px] text-ink-2">ওয়ালেট ব্যালেন্স</div>
                    <div
                      className={`${MONO} text-[24px] font-semibold leading-tight ${
                        isLowBalanceLocked ? 'text-danger' : 'text-ink'
                      }`}
                    >
                      ৳{walletBalance.toFixed(0)}
                    </div>
                  </div>
                  <span
                    className={`flex items-center gap-1.5 text-[13px] font-medium ${
                      isLowBalanceLocked ? 'text-danger' : 'text-ink-2'
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`w-2.5 h-2.5 rounded-full ${isLowBalanceLocked ? 'bg-danger' : 'bg-brand'}`}
                    />
                    {isLowBalanceLocked ? 'বিড বন্ধ' : 'বিড চালু'}
                  </span>
                </div>

                <div>
                  <div aria-hidden className="h-2 rounded-full bg-raised overflow-hidden">
                    <div
                      className={`h-full ${isLowBalanceLocked ? 'bg-danger' : 'bg-brand'}`}
                      style={{ width: `${Math.min(100, (walletBalance / 200) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[12px] text-ink-3">
                    <span>বিড করতে কমপক্ষে ৳৫০</span>
                    <span>কমিশন প্রতি ট্রিপে ৮%</span>
                  </div>
                </div>
              </section>

              {/* Top-up */}
              <section className={`${CARD} space-y-3`}>
                <h3 className="text-[16px] font-semibold">রিচার্জ</h3>

                <div role="radiogroup" aria-label="পেমেন্ট মাধ্যম" className="grid grid-cols-2 gap-2">
                  {(['BKASH', 'NAGAD'] as const).map((m) => {
                    const selected = paymentMethod === m;
                    const selectedCls = m === 'BKASH' ? 'border-bkash bg-bkash/5 text-bkash' : 'border-ink bg-raised text-ink';
                    return (
                      <button
                        key={m}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setPaymentMethod(m)}
                        className={`h-12 rounded-md border text-[14px] font-semibold ${PRESS} ${
                          selected ? selectedCls : 'border-line text-ink-2 hover:bg-raised'
                        }`}
                      >
                        {m === 'BKASH' ? 'bKash' : 'Nagad'}
                      </button>
                    );
                  })}
                </div>

                <div>
                  <div className={LABEL}>পরিমাণ বেছে নিন</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[100, 200, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        disabled={topupLoading}
                        onClick={() => handleQuickTopup(amt)}
                        className={`h-12 rounded-md border border-line bg-surface text-ink text-[16px] font-medium hover:bg-raised ${MONO} ${PRESS}`}
                      >
                        +৳{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={topupLoading}
                  onClick={() => openBkashTokenizedModal(200)}
                  className={`${BTN_BKASH} h-14 w-full text-[16px]`}
                >
                  <Wallet className="w-5 h-5" aria-hidden />
                  bKash-এ রিচার্জ করুন
                </button>
              </section>

              {/* Ledger */}
              <section className="rounded-lg border border-line bg-surface">
                <div className="px-4 py-3 border-b border-line flex items-center justify-between">
                  <h3 className="text-[16px] font-semibold">লেনদেন</h3>
                  <span className="text-[13px] text-ink-3">
                    <span className={MONO}>{transactions.length}</span>টি
                  </span>
                </div>

                {transactions.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[14px] text-ink-2">
                    এখনো কোনো লেনদেন নেই। রিচার্জ করলে বা ট্রিপ শেষ হলে এখানে দেখাবে।
                  </p>
                ) : (
                  <ul className="divide-y divide-line max-h-[300px] overflow-y-auto overscroll-contain phone-scroll">
                    {transactions.map((tx) => {
                      const isPositive = tx.amount > 0;
                      return (
                        <li key={tx.id} className="px-4 py-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[14px] text-ink truncate">{tx.noteBangla}</div>
                            <div className="text-[12px] text-ink-3 flex gap-1.5 min-w-0">
                              <span className="shrink-0">{TX_LABEL[tx.type] ?? tx.type}</span>
                              {tx.gatewayTrxId && (
                                <span className="font-mono truncate">#{tx.gatewayTrxId}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div
                              className={`${MONO} text-[14px] font-semibold ${
                                isPositive ? 'text-brand-text' : 'text-ink'
                              }`}
                            >
                              {isPositive ? `+৳${tx.amount}` : `−৳${Math.abs(tx.amount)}`}
                            </div>
                            <div className="text-[12px] text-ink-3">
                              ব্যালেন্স <span className={MONO}>৳{tx.balanceAfter}</span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </>
          )}

          {activeTab === 'KYC' && (
            <>
              <section className={`${CARD} space-y-2`}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[16px] font-semibold">কেওয়াইসি যাচাই</h3>
                  <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink-2">
                    <span aria-hidden className={`w-2.5 h-2.5 rounded-full ${kycDot}`} />
                    {kycStatusLabel}
                  </span>
                </div>
                <p className="text-[14px] text-ink-2">
                  ইজিবাইক ও সিএনজি চালকদের এনআইডি এবং ভৈরব পৌরসভার ওয়ার্ড কাউন্সিলরের প্রত্যয়নপত্র লাগবে। বাইক ও
                  মাইক্রোবাস চালকদের বিআরটিএ লাইসেন্সও লাগবে।
                </p>
              </section>

              <form onSubmit={handleKycSubmit} className={`${CARD} space-y-4`}>
                <div>
                  <label htmlFor="kyc-nid" className={LABEL}>
                    এনআইডি নম্বর
                  </label>
                  <input
                    id="kyc-nid"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={nidNumber}
                    onChange={(e) => setNidNumber(e.target.value)}
                    className={`${FIELD} ${MONO}`}
                  />
                </div>

                <div>
                  <label htmlFor="kyc-vehicle" className={LABEL}>
                    গাড়ির মডেল ও পৌরসভা টোকেন নম্বর
                  </label>
                  <input
                    id="kyc-vehicle"
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className={FIELD}
                  />
                </div>

                <div>
                  <label htmlFor="kyc-ward" className={LABEL}>
                    ওয়ার্ড কাউন্সিলরের প্রত্যয়নপত্র বা ইউনিয়ন সনদ
                    <span className="text-ink-3"> · ইজিবাইক, সিএনজি</span>
                  </label>
                  <input
                    id="kyc-ward"
                    type="text"
                    value={wardCert}
                    onChange={(e) => setWardCert(e.target.value)}
                    className={`${FIELD} ${MONO}`}
                  />
                </div>

                <div>
                  <label htmlFor="kyc-brta" className={LABEL}>
                    বিআরটিএ ড্রাইভিং লাইসেন্স
                    <span className="text-ink-3"> · বাইক, মাইক্রোবাস</span>
                  </label>
                  <input
                    id="kyc-brta"
                    type="text"
                    value={brtaLicense}
                    onChange={(e) => setBrtaLicense(e.target.value)}
                    className={`${FIELD} ${MONO}`}
                  />
                </div>

                <button type="submit" className={BTN_PRIMARY}>
                  <FileCheck2 className="w-5 h-5" aria-hidden />
                  জমা দিন
                </button>

                {kycSubmittedMsg && (
                  <p role="status" className="flex gap-2 text-[14px] text-ink">
                    <CheckCircle2 className="w-5 h-5 text-brand-text shrink-0" aria-hidden />
                    <span>{kycSubmittedMsg}</span>
                  </p>
                )}
              </form>
            </>
          )}
        </main>

        {/* Bottom navigation */}
        <nav aria-label="চালক অ্যাপ" className="grid grid-cols-3 shrink-0 border-t border-line bg-surface select-none">
          {tabs.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-current={active ? 'page' : undefined}
                className={`h-16 flex flex-col items-center justify-center gap-1 text-[12px] transition-colors duration-150 ease-out ${
                  active ? 'text-brand-text font-semibold' : 'text-ink-3 hover:text-ink-2'
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* bKash tokenized checkout sheet */}
        {bkashModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bkash-sheet-title"
            className="absolute inset-0 z-30 bg-ink/40 flex flex-col justify-end"
          >
            <div className="bg-surface rounded-t-xl shadow-lg flex flex-col max-h-[90%]">
              <div className="px-4 py-3 border-b border-line flex items-center justify-between">
                <div>
                  <div id="bkash-sheet-title" className="text-[16px] font-semibold text-bkash">
                    bKash
                  </div>
                  <div className="text-[13px] text-ink-2">চলো ভৈরব ওয়ালেট রিচার্জ</div>
                </div>
                <button
                  type="button"
                  onClick={() => setBkashModalOpen(false)}
                  aria-label="বন্ধ করুন"
                  className={`w-11 h-11 -mr-2 rounded-md flex items-center justify-center text-ink-2 hover:bg-raised ${PRESS}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto overscroll-contain phone-scroll">
                {bkashStep === 'CREATING' && (
                  <div role="status" className="py-10 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-bkash mx-auto" aria-hidden />
                    <p className="text-[14px] text-ink-2 mt-3">পেমেন্ট শুরু হচ্ছে…</p>
                  </div>
                )}

                {(bkashStep === 'CHECKOUT' || bkashStep === 'EXECUTING') && (
                  <>
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <div className="text-[13px] text-ink-2">মার্চেন্ট</div>
                        <div className="text-[16px] font-medium">CholoBhairab</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[13px] text-ink-2">পরিমাণ</div>
                        <div className={`${MONO} text-[24px] font-semibold leading-tight`}>৳{bkashAmount}</div>
                      </div>
                    </div>

                    <div role="radiogroup" aria-label="পরিমাণ" className="grid grid-cols-3 gap-2">
                      {[100, 200, 500].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          role="radio"
                          aria-checked={bkashAmount === amt}
                          disabled={bkashStep === 'EXECUTING'}
                          onClick={() => openBkashTokenizedModal(amt)}
                          className={`h-11 rounded-md border text-[14px] font-semibold ${MONO} ${PRESS} ${
                            bkashAmount === amt
                              ? 'border-bkash bg-bkash/5 text-bkash'
                              : 'border-line text-ink-2 hover:bg-raised'
                          }`}
                        >
                          ৳{amt}
                        </button>
                      ))}
                    </div>

                    <dl className="text-[12px] space-y-1">
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-3 shrink-0">Payment ID</dt>
                        <dd className="font-mono text-ink-2 truncate" title={bkashPaymentID}>
                          {bkashPaymentID}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-3 shrink-0">ইনভয়েস</dt>
                        <dd className="font-mono text-ink-2 truncate" title={bkashInvoiceNo}>
                          {bkashInvoiceNo}
                        </dd>
                      </div>
                    </dl>

                    <div>
                      <label htmlFor="bkash-account" className={LABEL}>
                        bKash অ্যাকাউন্ট নম্বর
                      </label>
                      <input
                        id="bkash-account"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        value={bkashAccount}
                        onChange={(e) => setBkashAccount(e.target.value)}
                        className={`${FIELD} ${MONO} focus:border-bkash`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="bkash-otp" className={LABEL}>
                          OTP (৬ সংখ্যা)
                        </label>
                        <input
                          id="bkash-otp"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          value={bkashOtp}
                          onChange={(e) => setBkashOtp(e.target.value)}
                          className={`${FIELD} ${MONO} text-center tracking-[0.2em] focus:border-bkash`}
                        />
                      </div>
                      <div>
                        <label htmlFor="bkash-pin" className={LABEL}>
                          PIN (৫ সংখ্যা)
                        </label>
                        <input
                          id="bkash-pin"
                          type="password"
                          inputMode="numeric"
                          maxLength={5}
                          value={bkashPin}
                          onChange={(e) => setBkashPin(e.target.value)}
                          className={`${FIELD} ${MONO} text-center tracking-[0.2em] focus:border-bkash`}
                        />
                      </div>
                    </div>

                    {bkashUrl && (
                      <a
                        href={bkashUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 h-11 text-[13px] text-ink-2 hover:text-ink underline-offset-2 hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" aria-hidden />
                        আলাদা পেজে bKash চেকআউট খুলুন
                      </a>
                    )}

                    <div className="space-y-2">
                      <button
                        type="button"
                        disabled={bkashStep === 'EXECUTING'}
                        onClick={handleConfirmBkashExecute}
                        className={`${BTN_BKASH} h-14 w-full text-[16px]`}
                      >
                        {bkashStep === 'EXECUTING' ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                            যাচাই হচ্ছে…
                          </>
                        ) : (
                          'পেমেন্ট নিশ্চিত করুন'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setBkashModalOpen(false)}
                        className={`h-12 w-full rounded-md text-[14px] font-medium text-ink-2 hover:bg-raised ${PRESS}`}
                      >
                        বাতিল
                      </button>
                    </div>
                  </>
                )}

                {bkashStep === 'RECEIPT' && bkashReceipt && (
                  <>
                    <div role="status" className="text-center pt-2">
                      <CheckCircle2 className="w-6 h-6 text-brand-text mx-auto" aria-hidden />
                      <p className="text-[16px] font-semibold mt-2">রিচার্জ হয়েছে</p>
                      <p className={`${MONO} text-[24px] font-semibold`}>৳{bkashReceipt.amountBdt}</p>
                    </div>

                    <dl className="divide-y divide-line border-y border-line text-[14px]">
                      <div className="flex justify-between gap-4 py-2.5">
                        <dt className="text-ink-2 shrink-0">TrxID</dt>
                        <dd className="font-mono text-ink truncate">{bkashReceipt.trxID}</dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <dt className="text-ink-2 shrink-0">সময়</dt>
                        <dd className={`${MONO} text-ink`}>{bkashReceipt.paidAt}</dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <dt className="text-ink-2 shrink-0">Payment ID</dt>
                        <dd className="font-mono text-ink-2 truncate">{bkashReceipt.paymentID}</dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <dt className="text-ink-2 shrink-0">ইনভয়েস</dt>
                        <dd className="font-mono text-ink-2 truncate">{bkashReceipt.invoiceNumber}</dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <dt className="text-ink-2 shrink-0">ব্যালেন্স</dt>
                        <dd className={`${MONO} text-ink font-medium`}>
                          ৳{bkashReceipt.prevBalance} → ৳{bkashReceipt.newBalance}
                        </dd>
                      </div>
                    </dl>

                    {bkashReceipt.prevBalance < 50 && bkashReceipt.newBalance >= 50 && (
                      <p className="flex items-center gap-2 text-[14px] text-ink">
                        <span aria-hidden className="w-2.5 h-2.5 rounded-full bg-brand" />
                        এখন আবার বিড করতে পারবেন।
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => setBkashModalOpen(false)}
                      className={BTN_PRIMARY}
                    >
                      ঠিক আছে
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
