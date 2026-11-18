import React, { useEffect, useState } from 'react';
import {
  OnlineDriver,
  WalletRecord,
  WalletTransactionRecord,
} from '../types/admin';
import { ExternalLink, LoaderCircle, Lock, X } from 'lucide-react';
import { VehicleLabel } from '../components/BhairabMap';

import { API_BASE } from '../config';

interface TokenizedCheckoutSession {
  driverId: string;
  driverName: string;
  amountBdt: number;
  paymentID: string;
  invoiceNumber: string;
  bkashURL: string;
  status: 'INITIATED' | 'EXECUTING' | 'COMPLETED';
  trxID?: string;
}

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
  onRefreshOverview?: () => Promise<void>;
}

const SESSION_STATUS: Record<TokenizedCheckoutSession['status'], { label: string; dot: string }> = {
  INITIATED: { label: 'পেমেন্টের অপেক্ষায়', dot: 'bg-warning' },
  EXECUTING: { label: 'প্রক্রিয়াধীন', dot: 'bg-warning' },
  COMPLETED: { label: 'সম্পন্ন', dot: 'bg-brand-text' },
};

const TX_TYPE_LABEL: Record<WalletTransactionRecord['type'], string> = {
  BKASH_TOPUP: 'bKash টপ-আপ',
  NAGAD_TOPUP: 'Nagad টপ-আপ',
  COMMISSION_DEDUCTION: 'কমিশন (৮%)',
  PROMOTIONAL_BONUS: 'বোনাস',
};

export const WalletLedger: React.FC<WalletLedgerProps> = ({
  drivers,
  wallets,
  transactions,
  totalCommissionBdt,
  totalGmvBdt,
  onTopupWallet,
  onRefreshOverview,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'BKASH' | 'NAGAD'>('BKASH');
  const [loadingDriverId, setLoadingDriverId] = useState<string | null>(null);
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
  const [tokenizedSession, setTokenizedSession] =
    useState<TokenizedCheckoutSession | null>(null);
  const [tokenizedLoading, setTokenizedLoading] = useState<boolean>(false);

  // Listen for popup completion postMessage from /payments/bkash/result
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'BKASH_PAYMENT_COMPLETE' && event.data?.paymentID) {
        const completedPaymentId = String(event.data.paymentID);
        try {
          const res = await fetch(`${API_BASE}/payments/bkash/status/${completedPaymentId}`);
          const data = await res.json();
          if (data?.success && data.payment) {
            setTokenizedSession((prev) =>
              prev && prev.paymentID === completedPaymentId
                ? {
                    ...prev,
                    status: 'COMPLETED',
                    trxID: data.payment.trxID || prev.trxID,
                  }
                : prev
            );
          }
        } catch {
          // Ignore status fetch failure
        }
        if (onRefreshOverview) {
          await onRefreshOverview();
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onRefreshOverview]);

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

  // Start bKash Tokenized Checkout (POST /payments/bkash/create)
  const handleStartTokenizedCheckout = async (
    driverId: string,
    driverName: string,
    amountBdt: number
  ) => {
    const validAmount = Math.max(20, amountBdt || 200);
    setTokenizedLoading(true);
    setLoadingDriverId(driverId);

    try {
      const res = await fetch(`${API_BASE}/payments/bkash/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, amountBdt: validAmount }),
      });
      const data = await res.json();
      if (data?.paymentID) {
        const bkashURL =
          data.bkashURL ||
          `${API_BASE}/payments/bkash/mock/checkout?paymentID=${data.paymentID}`;
        setTokenizedSession({
          driverId,
          driverName,
          amountBdt: validAmount,
          paymentID: data.paymentID,
          invoiceNumber: data.invoiceNumber || `INV-CB-${Date.now()}`,
          bkashURL,
          status: 'INITIATED',
        });
        return;
      }
    } catch {
      // Fallback if backend is unreachable
    } finally {
      setTokenizedLoading(false);
      setLoadingDriverId(null);
    }

    const fallbackPid = `TR0011${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    setTokenizedSession({
      driverId,
      driverName,
      amountBdt: validAmount,
      paymentID: fallbackPid,
      invoiceNumber: `INV-CB-${Date.now()}-200`,
      bkashURL: `${API_BASE}/payments/bkash/mock/checkout?paymentID=${fallbackPid}`,
      status: 'INITIATED',
    });
  };

  // Execute Tokenized Payment directly (POST /payments/bkash/execute)
  const handleExecuteTokenizedCheckout = async () => {
    if (!tokenizedSession) return;
    setTokenizedLoading(true);
    setTokenizedSession((prev) => (prev ? { ...prev, status: 'EXECUTING' } : prev));

    try {
      const res = await fetch(`${API_BASE}/payments/bkash/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentID: tokenizedSession.paymentID,
          status: 'success',
          msisdn: '01811223304',
        }),
      });
      const data = await res.json();
      if (data?.success && data.payment) {
        const trxID =
          data.payment.trxID ||
          data.transaction?.gatewayTrxId ||
          `BKH${Math.floor(1000000 + Math.random() * 9000000)}M`;
        setTokenizedSession((prev) =>
          prev ? { ...prev, status: 'COMPLETED', trxID } : prev
        );
        if (onRefreshOverview) {
          await onRefreshOverview();
        }
        return;
      }
    } catch {
      // Offline fallback below
    } finally {
      setTokenizedLoading(false);
    }

    const fallbackTrxId = `BKH${Math.floor(1000000 + Math.random() * 9000000)}M`;
    await onTopupWallet(
      tokenizedSession.driverId,
      tokenizedSession.amountBdt,
      'BKASH'
    );
    setTokenizedSession((prev) =>
      prev ? { ...prev, status: 'COMPLETED', trxID: fallbackTrxId } : prev
    );
  };

  const isBkash = selectedMethod === 'BKASH';
  const btn =
    'h-8 px-2.5 rounded-md text-[13px] whitespace-nowrap flex items-center justify-center gap-1.5 transition-colors duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed';
  const sessionStatus = tokenizedSession ? SESSION_STATUS[tokenizedSession.status] : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold text-ink">ওয়ালেট ও কমিশন লেজার</h2>
          <p className="text-[13px] text-ink-2 mt-1">
            যাত্রীরা ভাড়া নগদে চালককে দেন। প্রতি ট্রিপ শেষে ভাড়ার ৮% কমিশন চালকের প্রিপেইড
            ওয়ালেট থেকে কাটা হয়। ব্যালেন্স ৳৫০-এর নিচে নামলে চালক নতুন ট্রিপে বিড করতে পারেন না।
          </p>
        </div>
        <dl className="flex gap-8">
          <div>
            <dt className="text-xs text-ink-3">কমিশন আয়</dt>
            <dd className="text-xl font-semibold font-mono tabular-nums text-ink mt-0.5">
              ৳{totalCommissionBdt.toLocaleString('en-IN')}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-3">মোট ভাড়া (GMV)</dt>
            <dd className="text-xl font-semibold font-mono tabular-nums text-ink mt-0.5">
              ৳{totalGmvBdt.toLocaleString('en-IN')}
            </dd>
          </div>
        </dl>
      </div>

      {tokenizedSession && sessionStatus && (
        <section className="bg-surface border border-bkash/50 rounded-lg p-4 space-y-3" aria-label="bKash চেকআউট">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-ink">
                bKash চেকআউট · {tokenizedSession.driverName} ·{' '}
                <span className="font-mono tabular-nums">৳{tokenizedSession.amountBdt}</span>
              </h3>
              <p className="mt-1 text-xs text-ink-2 flex items-center gap-1.5" role="status">
                <span className={`h-1.5 w-1.5 rounded-full ${sessionStatus.dot}`} aria-hidden />
                {sessionStatus.label}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTokenizedSession(null)}
              aria-label="চেকআউট বন্ধ করুন"
              className="h-8 w-8 rounded-md text-ink-3 hover:text-ink hover:bg-raised flex items-center justify-center transition-colors duration-150 ease-out"
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
            <dt className="text-ink-3">paymentID</dt>
            <dd className="font-mono text-ink break-all">{tokenizedSession.paymentID}</dd>
            <dt className="text-ink-3">invoiceNumber</dt>
            <dd className="font-mono text-ink break-all">{tokenizedSession.invoiceNumber}</dd>
            {tokenizedSession.trxID && (
              <>
                <dt className="text-ink-3">trxID</dt>
                <dd className="font-mono text-ink break-all">{tokenizedSession.trxID}</dd>
              </>
            )}
          </dl>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                window.open(
                  tokenizedSession.bkashURL,
                  'bkash_tokenized_checkout',
                  'width=460,height=720'
                )
              }
              className={`${btn} border border-line text-ink hover:bg-raised`}
            >
              <ExternalLink className="w-3.5 h-3.5" aria-hidden />
              টেস্ট চেকআউট খুলুন
            </button>

            {tokenizedSession.status !== 'COMPLETED' && (
              <button
                type="button"
                disabled={tokenizedLoading}
                onClick={handleExecuteTokenizedCheckout}
                className={`${btn} px-3 bg-bkash text-on-brand font-medium hover:bg-bkash/90`}
              >
                {tokenizedLoading && <LoaderCircle className="w-3.5 h-3.5 animate-spin" aria-hidden />}
                পেমেন্ট সম্পন্ন করুন
              </button>
            )}
          </div>
        </section>
      )}

      <section className="bg-surface border border-line rounded-lg" aria-labelledby="wallets-heading">
        <div className="px-4 py-3 border-b border-line flex flex-wrap items-center justify-between gap-3">
          <h3 id="wallets-heading" className="text-sm font-semibold text-ink">
            চালকের ওয়ালেট
          </h3>
          <div className="flex items-center gap-2 text-xs text-ink-3">
            <span>রিচার্জ মাধ্যম</span>
            <div className="flex items-center gap-0.5 p-0.5 rounded-md border border-line" role="group" aria-label="রিচার্জ মাধ্যম">
              {(
                [
                  { id: 'BKASH', label: 'bKash', dot: 'bg-bkash' },
                  { id: 'NAGAD', label: 'Nagad', dot: 'bg-ink-3' },
                ] as const
              ).map((m) => {
                const active = selectedMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedMethod(m.id)}
                    className={`h-7 px-2.5 rounded-md text-[13px] flex items-center gap-1.5 transition-colors duration-150 ease-out ${
                      active ? 'bg-raised text-ink' : 'text-ink-2 hover:text-ink hover:bg-raised'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${m.dot}`} aria-hidden />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {enrichedWallets.length === 0 ? (
          <p className="px-4 py-6 text-sm text-ink-2">
            কোনো চালক অনলাইনে নেই, তাই রিচার্জ করার মতো ওয়ালেট দেখানো যাচ্ছে না।
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-xs text-ink-3 border-b border-line">
                  <th className="font-medium px-4 py-2">চালক</th>
                  <th className="font-medium px-4 py-2">যান</th>
                  <th className="font-medium px-4 py-2 text-right">ব্যালেন্স</th>
                  <th className="font-medium px-4 py-2">রিচার্জ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {enrichedWallets.map((driver) => {
                  const isLocked = driver.currentBalance < 50;
                  const isLoading = loadingDriverId === driver.driverId;
                  const customVal = customAmounts[driver.driverId] || 150;

                  return (
                    <tr key={driver.driverId} className="align-top">
                      <td className="px-4 py-3">
                        <div className="text-ink font-medium">{driver.driverName}</div>
                        <div className="text-xs text-ink-3 font-mono tabular-nums mt-0.5">
                          {driver.driverPhone}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-2">
                        <VehicleLabel type={driver.vehicleType} />
                        <div className="text-xs text-ink-3 mt-0.5">{driver.vehicleModel}</div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div
                          className={`text-base font-mono tabular-nums ${
                            isLocked ? 'text-danger' : 'text-ink'
                          }`}
                        >
                          ৳{driver.currentBalance.toFixed(1)}
                        </div>
                        {isLocked && (
                          <div className="text-xs text-danger flex items-center justify-end gap-1 mt-0.5">
                            <Lock className="w-3 h-3" aria-hidden /> বিড বন্ধ
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {[100, 200, 500].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              disabled={isLoading}
                              onClick={() => handlePresetTopup(driver.driverId, amt)}
                              className={`${btn} border border-line text-ink hover:bg-raised font-mono tabular-nums`}
                            >
                              +৳{amt}
                            </button>
                          ))}

                          <span className="flex items-center gap-1">
                            <input
                              type="number"
                              min={20}
                              step={50}
                              value={customVal}
                              aria-label={`${driver.driverName}: রিচার্জের পরিমাণ (টাকা)`}
                              onChange={(e) =>
                                setCustomAmounts((prev) => ({
                                  ...prev,
                                  [driver.driverId]: Number(e.target.value),
                                }))
                              }
                              className="w-20 h-8 px-2 rounded-md bg-page border border-line text-[13px] font-mono tabular-nums text-ink focus:outline-none focus:border-brand-text"
                            />
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => handlePresetTopup(driver.driverId, customVal)}
                              className={`${btn} px-3 font-medium text-on-brand ${
                                isBkash ? 'bg-bkash hover:bg-bkash/90' : 'bg-brand hover:bg-brand/90'
                              }`}
                            >
                              {isLoading && (
                                <LoaderCircle className="w-3.5 h-3.5 animate-spin" aria-hidden />
                              )}
                              রিচার্জ
                            </button>
                          </span>

                          <button
                            type="button"
                            disabled={isLoading || tokenizedLoading}
                            onClick={() =>
                              handleStartTokenizedCheckout(
                                driver.driverId,
                                driver.driverName,
                                customVal || 200
                              )
                            }
                            className={`${btn} border border-bkash/50 text-ink hover:bg-bkash/10`}
                          >
                            bKash চেকআউট
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-surface border border-line rounded-lg" aria-labelledby="ledger-heading">
        <div className="px-4 py-3 border-b border-line flex items-baseline justify-between gap-2">
          <h3 id="ledger-heading" className="text-sm font-semibold text-ink">
            লেনদেন
          </h3>
          <span className="text-xs text-ink-3">
            <span className="font-mono tabular-nums">{transactions.length}</span> টি এন্ট্রি
          </span>
        </div>

        {transactions.length === 0 ? (
          <p className="px-4 py-6 text-sm text-ink-2">
            এখনো কোনো লেনদেন হয়নি। রিচার্জ বা ট্রিপের কমিশন কাটা হলে এখানে দেখাবে।
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-xs text-ink-3 border-b border-line">
                  <th className="font-medium px-4 py-2">লেনদেন আইডি</th>
                  <th className="font-medium px-4 py-2">চালক</th>
                  <th className="font-medium px-4 py-2">ধরন</th>
                  <th className="font-medium px-4 py-2">বিবরণ</th>
                  <th className="font-medium px-4 py-2 text-right">পরিমাণ</th>
                  <th className="font-medium px-4 py-2 text-right">পরের ব্যালেন্স</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {transactions.map((tx) => {
                  const drv = drivers.find((d) => d.driverId === tx.driverId);
                  const isPositive = tx.amount >= 0;

                  return (
                    <tr key={tx.id} className="hover:bg-raised transition-colors duration-150 ease-out">
                      <td className="px-4 py-2.5 font-mono text-ink-2 whitespace-nowrap">
                        <div>{tx.gatewayTrxId || tx.id}</div>
                        {tx.referenceRideId && (
                          <div className="text-xs text-ink-3">রাইড {tx.referenceRideId}</div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-ink">{drv ? drv.driverName : tx.driverId}</td>
                      <td className="px-4 py-2.5 text-ink-2 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          {tx.type === 'BKASH_TOPUP' && (
                            <span className="h-2 w-2 rounded-full bg-bkash" aria-hidden />
                          )}
                          {TX_TYPE_LABEL[tx.type] || tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-bangla text-ink-2">{tx.noteBangla}</td>
                      <td
                        className={`px-4 py-2.5 text-right font-mono tabular-nums whitespace-nowrap ${
                          isPositive ? 'text-brand-text' : 'text-ink-2'
                        }`}
                      >
                        {isPositive ? `+৳${tx.amount}` : `−৳${Math.abs(tx.amount)}`}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-ink whitespace-nowrap">
                        ৳{Number(tx.balanceAfter).toFixed(1)}
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
  );
};
