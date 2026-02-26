'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getEarnings,
  getPayouts,
  connectOnboard,
  getConnectStatus,
  Earnings,
  PayoutRecord,
  ConnectStatus,
} from '@/lib/billing';
import { Button } from '@/components/ui/Button';

const PRODUCT_LABELS: Record<string, string> = {
  course: 'Courses',
  membership: 'Memberships',
  download: 'Downloads',
  coaching: 'Coaching',
};

const PAYOUT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PAID: 'bg-teal-100 text-[#0D9488]',
  FAILED: 'bg-red-100 text-[#EF4444]',
  CANCELLED: 'bg-gray-100 text-[#6B7280]',
};

export default function EarningsPage() {
  const router = useRouter();
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    Promise.all([getEarnings(), getPayouts(), getConnectStatus()])
      .then(([e, p, c]) => {
        setEarnings(e);
        setPayouts(p);
        setConnectStatus(c);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { url } = await connectOnboard();
      window.location.href = url;
    } catch (err: any) {
      alert(err.message ?? 'Failed to start onboarding.');
      setConnecting(false);
    }
  };

  const fmt = (cents: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(cents / 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1F2937] mb-6">Earnings</h1>

      {/* Connect CTA */}
      {connectStatus && !connectStatus.connected && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-[#1F2937] mb-2">Connect with Stripe</h2>
          <p className="text-sm text-[#6B7280] mb-4">
            Set up Stripe Connect to receive payouts directly to your bank account.
          </p>
          <Button onClick={handleConnect} loading={connecting}>
            Set Up Payouts
          </Button>
        </div>
      )}

      {connectStatus?.connected && !connectStatus.payoutsEnabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-[#1F2937] mb-2">Complete Stripe Setup</h2>
          <p className="text-sm text-[#6B7280] mb-4">
            Your Stripe account is connected but payouts are not yet enabled. Complete the onboarding.
          </p>
          <Button onClick={handleConnect} loading={connecting}>
            Continue Setup
          </Button>
        </div>
      )}

      {/* Summary Cards */}
      {earnings && (
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-[#6B7280] mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-[#1F2937]">
              {fmt(earnings.totalRevenue, earnings.currency)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-[#6B7280] mb-1">Platform Fees</p>
            <p className="text-2xl font-bold text-[#EF4444]">
              -{fmt(earnings.totalFees, earnings.currency)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-[#6B7280] mb-1">Net Earnings</p>
            <p className="text-2xl font-bold text-[#0D9488]">
              {fmt(earnings.netEarnings, earnings.currency)}
            </p>
          </div>
        </div>
      )}

      {/* Breakdown by product type */}
      {earnings && Object.keys(earnings.breakdown).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="font-semibold text-[#1F2937] mb-4">Revenue by Product</h2>
          <div className="space-y-3">
            {Object.entries(earnings.breakdown).map(([type, data]) => (
              <div key={type} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#1F2937]">{PRODUCT_LABELS[type] ?? type}</p>
                  <p className="text-xs text-[#6B7280]">{data.count} sales</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#1F2937]">
                    {fmt(data.revenue, earnings.currency)}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    -{fmt(data.fees, earnings.currency)} fees
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payout History */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-[#1F2937] mb-4">Payout History</h2>
        {payouts.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No payouts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F3F4F6] text-left text-[#6B7280]">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Period</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-b border-[#F3F4F6]">
                    <td className="py-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 font-semibold">{fmt(p.amountCents, p.currency)}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYOUT_STATUS_COLORS[p.status] ?? ''}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 text-[#6B7280]">
                      {p.periodStart && p.periodEnd
                        ? `${new Date(p.periodStart).toLocaleDateString()} – ${new Date(p.periodEnd).toLocaleDateString()}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
