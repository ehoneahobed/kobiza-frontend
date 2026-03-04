'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getMyPlan,
  createBillingCheckout,
  cancelBillingSubscription,
  resumeBillingSubscription,
  openCustomerPortal,
  getDowngradePreview,
  CreatorPlan,
  PlanTier,
  DowngradePreview,
  PLAN_DETAILS,
} from '@/lib/billing';

const PLAN_ORDER: PlanTier[] = ['FREE', 'STARTER', 'PRO'];

function PlanCard({
  tier,
  currentPlan,
  cancelAtPeriodEnd,
  currentPeriodEnd,
  onUpgrade,
  onCancel,
  onResume,
  loading,
}: {
  tier: PlanTier;
  currentPlan: PlanTier;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  onUpgrade: (plan: PlanTier) => void;
  onCancel: () => void;
  onResume: () => void;
  loading: boolean;
}) {
  const details = PLAN_DETAILS[tier];
  const isCurrent = tier === currentPlan;
  const isDowngrade = PLAN_ORDER.indexOf(tier) < PLAN_ORDER.indexOf(currentPlan);
  const isUpgrade = PLAN_ORDER.indexOf(tier) > PLAN_ORDER.indexOf(currentPlan);

  const endDateStr = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm p-6 flex flex-col border-2 transition-all ${isCurrent
          ? 'border-[#0D9488]'
          : details.highlight
            ? 'border-amber-300'
            : 'border-transparent'
        }`}
    >
      {details.highlight && !isCurrent && (
        <div className="text-xs font-semibold text-amber-600 bg-amber-50 rounded-full px-3 py-1 w-fit mb-3">
          Most Popular
        </div>
      )}
      {isCurrent && (
        <div className="text-xs font-semibold text-[#0D9488] bg-teal-50 rounded-full px-3 py-1 w-fit mb-3">
          Current Plan
        </div>
      )}
      <h3 className="text-xl font-bold text-[#1F2937]">{details.name}</h3>
      <p className="text-3xl font-extrabold text-[#1F2937] mt-2 mb-1">{details.price}</p>
      <ul className="space-y-1.5 text-sm text-[#6B7280] mt-3 mb-6 flex-1">
        <li className="flex items-center gap-2">
          <span className="text-[#0D9488]">✓</span>
          <span>{details.communityLimit}</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="text-[#0D9488]">✓</span>
          <span>{details.fee} platform fee</span>
        </li>
        <li className={`flex items-center gap-2 ${details.aiFeatures ? '' : 'opacity-40'}`}>
          <span>{details.aiFeatures ? '✓' : '✗'}</span>
          <span>AI features</span>
        </li>
      </ul>

      {isCurrent && tier !== 'FREE' && (
        <div className="mt-auto space-y-2">
          {cancelAtPeriodEnd ? (
            <>
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                Cancels {endDateStr ? `on ${endDateStr}` : 'at period end'}. You&apos;ll keep access until then.
              </p>
              <button
                onClick={onResume}
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[#0D9488] text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Resuming…' : 'Resume Subscription'}
              </button>
            </>
          ) : (
            <>
              {endDateStr && (
                <p className="text-xs text-[#6B7280]">Next billing: {endDateStr}</p>
              )}
              <button
                onClick={onCancel}
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-[#6B7280] border border-[#6B7280]/30 hover:border-[#EF4444] hover:text-[#EF4444] transition-colors disabled:opacity-50"
              >
                {loading ? 'Cancelling…' : 'Cancel Plan'}
              </button>
            </>
          )}
        </div>
      )}

      {isCurrent && tier === 'FREE' && (
        <p className="text-xs text-[#6B7280] mt-auto pt-2">
          No charge. Upgrade anytime to reduce fees and unlock more communities.
        </p>
      )}

      {isUpgrade && (
        <button
          onClick={() => onUpgrade(tier)}
          disabled={loading}
          className="mt-auto w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50 hover:opacity-90"
          style={{ background: tier === 'STARTER' ? '#F59E0B' : '#0D9488' }}
        >
          {loading ? 'Redirecting…' : `Upgrade to ${details.name}`}
        </button>
      )}

      {isDowngrade && (
        <p className="text-xs text-[#6B7280] mt-auto pt-2 text-center">
          Cancel your current plan to switch to this tier.
        </p>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<CreatorPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [downgradePreview, setDowngradePreview] = useState<DowngradePreview | null>(null);

  useEffect(() => {
    getMyPlan()
      .then(setPlan)
      .catch(() => { })
      .finally(() => setLoading(false));

    if (searchParams.get('upgraded') === '1') {
      setToast(`🎉 Welcome to the ${searchParams.get('plan')} plan!`);
    }
  }, [searchParams]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleUpgrade = async (tier: PlanTier) => {
    setActionLoading(true);
    try {
      const { url } = await createBillingCheckout(tier);
      if (url) window.location.href = url;
    } catch {
      showToast('Failed to start checkout. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      // Fetch downgrade preview to warn about archived communities
      const preview = await getDowngradePreview('FREE');
      if (preview.atRisk.length > 0) {
        setDowngradePreview(preview);
        setActionLoading(false);
        return; // Show modal instead of confirm()
      }

      if (!confirm('Cancel your plan? You\'ll keep access until the end of your billing period.')) {
        setActionLoading(false);
        return;
      }

      await cancelBillingSubscription();
      const updated = await getMyPlan();
      setPlan(updated);
      showToast('Subscription cancelled. Access continues until the billing period ends.');
    } catch {
      showToast('Failed to cancel. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDowngrade = async () => {
    setActionLoading(true);
    setDowngradePreview(null);
    try {
      await cancelBillingSubscription();
      const updated = await getMyPlan();
      setPlan(updated);
      showToast('Subscription cancelled. Excess communities will be archived at the end of the billing period.');
    } catch {
      showToast('Failed to cancel. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await resumeBillingSubscription();
      const updated = await getMyPlan();
      setPlan(updated);
      showToast('Subscription resumed! 🎉');
    } catch {
      showToast('Failed to resume. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#1F2937] text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Downgrade Warning Modal */}
      {downgradePreview && downgradePreview.atRisk.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-[#1F2937] mb-2">Communities will be archived</h3>
            <p className="text-sm text-[#6B7280] mb-4">
              Downgrading to the Free plan allows only {downgradePreview.limit} community.
              The following {downgradePreview.atRisk.length === 1 ? 'community' : 'communities'} will be
              archived when your billing period ends:
            </p>
            <ul className="space-y-2 mb-4">
              {downgradePreview.atRisk.map((c) => (
                <li key={c.id} className="flex items-center gap-2 bg-red-50 text-red-800 rounded-lg px-3 py-2 text-sm font-medium">
                  <span className="text-red-400">&#x2717;</span>
                  {c.name}
                </li>
              ))}
            </ul>
            <p className="text-xs text-[#6B7280] mb-4">
              No data will be deleted. Upgrade again anytime to restore your archived communities.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDowngradePreview(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#6B7280] border border-[#6B7280]/30 hover:bg-gray-50 transition-colors"
              >
                Keep My Plan
              </button>
              <button
                onClick={confirmDowngrade}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Cancelling...' : 'Cancel Anyway'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1F2937]">Plan & Billing</h1>
        <p className="text-[#6B7280] mt-1 text-sm">
          Choose the right plan for your creator business. Lower fees mean more money in your pocket.
        </p>
      </div>

      {/* Current plan summary banner */}
      {plan && (
        <div className="bg-[#0D9488]/5 border border-[#0D9488]/20 rounded-xl p-4 mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#1F2937]">
              You&apos;re on the <span className="text-[#0D9488]">{PLAN_DETAILS[plan.plan].name}</span> plan
            </p>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Platform fee: {plan.platformFeePercent}% per sale ·{' '}
              {plan.communityLimit === Infinity
                ? 'Unlimited communities'
                : `Up to ${plan.communityLimit} ${plan.communityLimit === 1 ? 'community' : 'communities'}`}
            </p>
          </div>
          {plan.plan !== 'FREE' && plan.currentPeriodEnd && (
            <p className="text-xs text-[#6B7280] flex-shrink-0">
              {plan.cancelAtPeriodEnd ? 'Cancels' : 'Renews'}{' '}
              {new Date(plan.currentPeriodEnd).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {PLAN_ORDER.map((tier) => (
          <PlanCard
            key={tier}
            tier={tier}
            currentPlan={plan?.plan ?? 'FREE'}
            cancelAtPeriodEnd={plan?.cancelAtPeriodEnd ?? false}
            currentPeriodEnd={plan?.currentPeriodEnd ?? null}
            onUpgrade={handleUpgrade}
            onCancel={handleCancel}
            onResume={handleResume}
            loading={actionLoading}
          />
        ))}
      </div>

      {/* Payment Methods & Invoices */}
      {plan?.stripeCustomerId && (
        <div className="mt-8 bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-[#1F2937] mb-2">Payment Methods & Invoices</h2>
          <p className="text-sm text-[#6B7280] mb-4">
            Manage your payment methods, view invoices, and update billing information through the Stripe Customer Portal.
          </p>
          <button
            onClick={async () => {
              try {
                const { url } = await openCustomerPortal();
                if (url) window.location.href = url;
              } catch {
                showToast('Failed to open billing portal. Please try again.');
              }
            }}
            className="bg-[#0D9488] text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-teal-700 transition-colors"
          >
            Manage Payment Methods
          </button>
        </div>
      )}

      {/* Fee calculator */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-[#1F2937] mb-4">What does the platform fee mean?</h2>
        <p className="text-sm text-[#6B7280] mb-4">
          For every sale you make on Kobiza, a small percentage is retained by the platform. Here&apos;s how it plays out across plans:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#6B7280] border-b border-[#F3F4F6]">
                <th className="pb-2 font-medium">Plan</th>
                <th className="pb-2 font-medium">Fee</th>
                <th className="pb-2 font-medium">On $100 sale</th>
                <th className="pb-2 font-medium">On $500 sale</th>
                <th className="pb-2 font-medium">On $1,000 sale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {PLAN_ORDER.map((tier) => {
                const d = PLAN_DETAILS[tier];
                const feeNum = parseInt(d.fee);
                const isCurrent = tier === (plan?.plan ?? 'FREE');
                return (
                  <tr key={tier} className={isCurrent ? 'bg-teal-50/50' : ''}>
                    <td className="py-2.5 font-medium text-[#1F2937]">
                      {d.name} {isCurrent && <span className="text-xs text-[#0D9488]">(you)</span>}
                    </td>
                    <td className="py-2.5 text-[#6B7280]">{feeNum}%</td>
                    <td className="py-2.5 text-[#1F2937]">${(100 * (1 - feeNum / 100)).toFixed(0)} to you</td>
                    <td className="py-2.5 text-[#1F2937]">${(500 * (1 - feeNum / 100)).toFixed(0)} to you</td>
                    <td className="py-2.5 text-[#1F2937]">${(1000 * (1 - feeNum / 100)).toFixed(0)} to you</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
