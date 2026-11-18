import React, { useState } from 'react';
import { KycApplication, KycStatus } from '../types/admin';
import { Search } from 'lucide-react';
import { VehicleLabel } from '../components/BhairabMap';

interface KycCenterProps {
  applications: KycApplication[];
  onUpdateStatus: (id: string, status: 'APPROVED' | 'SUSPENDED', note?: string) => Promise<void>;
}

const STATUS_META: Record<KycStatus, { label: string; dot: string }> = {
  PENDING_VERIFICATION: { label: 'অপেক্ষমাণ', dot: 'bg-warning' },
  APPROVED: { label: 'অনুমোদিত', dot: 'bg-brand-text' },
  SUSPENDED: { label: 'স্থগিত', dot: 'bg-ink-3' },
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

  const tabs: { id: 'ALL' | KycStatus; label: string }[] = [
    { id: 'ALL', label: 'সব' },
    { id: 'PENDING_VERIFICATION', label: 'অপেক্ষমাণ' },
    { id: 'APPROVED', label: 'অনুমোদিত' },
    { id: 'SUSPENDED', label: 'স্থগিত' },
  ];

  const actionCls =
    'h-8 px-3 rounded-md text-[13px] whitespace-nowrap transition-colors duration-150 ease-out disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-ink">চালক যাচাই (KYC)</h2>
        <p className="text-[13px] text-ink-2 mt-1 max-w-3xl">
          ইজিবাইক ও সিএনজি: NID ও ওয়ার্ড কাউন্সিলর বা ইউনিয়ন পরিষদের প্রত্যয়নপত্র। বাইক ও
          মাইক্রোবাস: NID ও BRTA ড্রাইভিং লাইসেন্স।
        </p>
      </div>

      <section className="bg-surface border border-line rounded-lg" aria-label="KYC আবেদন">
        <div className="px-4 py-3 border-b border-line flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-0.5 p-0.5 rounded-md border border-line" role="group" aria-label="অবস্থা অনুযায়ী ফিল্টার">
            {tabs.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(tab.id)}
                  className={`h-7 px-2.5 rounded-md text-[13px] flex items-center gap-1.5 transition-colors duration-150 ease-out ${
                    active ? 'bg-raised text-ink' : 'text-ink-2 hover:text-ink hover:bg-raised'
                  }`}
                >
                  {tab.label}
                  <span className="font-mono tabular-nums text-xs text-ink-3">{counts[tab.id]}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-ink-3 absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="নাম, মোবাইল, NID বা রেজিস্ট্রেশন"
              aria-label="আবেদন খুঁজুন"
              className="w-full h-8 pl-8 pr-3 rounded-md bg-page border border-line text-[13px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand-text"
            />
          </div>
        </div>

        {filteredApps.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-ink">কোনো আবেদন পাওয়া যায়নি</p>
            <p className="text-[13px] text-ink-2 mt-1">
              {applications.length === 0
                ? 'চালকরা অ্যাপ থেকে আবেদন করলে এখানে দেখাবে।'
                : 'ফিল্টার বা খোঁজার শব্দ বদলে আবার দেখুন।'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-xs text-ink-3 border-b border-line">
                  <th className="font-medium px-4 py-2">চালক</th>
                  <th className="font-medium px-4 py-2">যান</th>
                  <th className="font-medium px-4 py-2">NID</th>
                  <th className="font-medium px-4 py-2">রেজিস্ট্রেশন</th>
                  <th className="font-medium px-4 py-2">কাগজপত্র</th>
                  <th className="font-medium px-4 py-2">অবস্থা</th>
                  <th className="font-medium px-4 py-2">
                    <span className="sr-only">সিদ্ধান্ত</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredApps.map((app) => {
                  const status = STATUS_META[app.status] || STATUS_META.PENDING_VERIFICATION;
                  const busy = processingId === app.id;
                  const docs = [
                    app.unionCouncilorCert,
                    app.brtaLicenseNo ? `BRTA লাইসেন্স ${app.brtaLicenseNo}` : null,
                  ].filter(Boolean) as string[];

                  return (
                    <tr key={app.id} className="align-top">
                      <td className="px-4 py-3">
                        <div className="text-ink font-medium">{app.fullName}</div>
                        <div className="text-xs text-ink-3 mt-0.5">
                          <span className="font-mono tabular-nums">{app.phoneNumber}</span>
                          {' · '}
                          {app.wardNo || 'ভৈরব পৌরসভা'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-2">
                        <VehicleLabel type={app.vehicleType} />
                        <div className="text-xs text-ink-3 mt-0.5">{app.vehicleModel}</div>
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-ink-2 whitespace-nowrap">
                        {app.nidNumber}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-ink-2 whitespace-nowrap">
                        {app.registrationNumber}
                      </td>
                      <td className="px-4 py-3 text-ink-2 max-w-[16rem]">
                        {docs.length > 0 ? (
                          docs.map((d) => <div key={d}>{d}</div>)
                        ) : (
                          <span className="text-ink-3">জমা দেওয়া হয়নি</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-ink-2">
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} aria-hidden />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleAction(app.id, 'APPROVED')}
                            disabled={busy || app.status === 'APPROVED'}
                            className={`${actionCls} bg-brand text-on-brand font-medium hover:bg-brand/90`}
                          >
                            অনুমোদন
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(app.id, 'SUSPENDED')}
                            disabled={busy || app.status === 'SUSPENDED'}
                            className={`${actionCls} border border-line text-ink hover:bg-raised`}
                          >
                            স্থগিত
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
    </div>
  );
};
