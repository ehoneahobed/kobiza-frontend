'use client';

import { useState } from 'react';
import { createCheckoutSession } from '@/lib/payments';
import { joinFreeTier } from '@/lib/community';
import { formatPrice } from '@/lib/creator';

interface Tier {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
}

interface Props {
  tier: Tier;
  brand: string;
  slug: string;
}

type Step = 'idle' | 'select-gateway' | 'loading';

function annualSavingsPct(monthly: number, annual: number): number {
  if (!monthly || !annual) return 0;
  return Math.round(((monthly * 12 - annual) / (monthly * 12)) * 100);
}

export default function MembershipCard({ tier, brand, slug }: Props) {
  const hasAnnual = tier.priceAnnual > 0;
  const isFree = tier.priceMonthly === 0;

  // Default to annual if savings ≥ 10% to nudge members toward better value
  const [billing, setBilling] = useState<'monthly' | 'annual'>(
    hasAnnual && annualSavingsPct(tier.priceMonthly, tier.priceAnnual) >= 10 ? 'annual' : 'monthly',
  );
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState('');

  const savings = hasAnnual ? annualSavingsPct(tier.priceMonthly, tier.priceAnnual) : 0;
  const selectedPrice = billing === 'annual' ? tier.priceAnnual : tier.priceMonthly;
  const monthlyEquivalent = hasAnnual && billing === 'annual'
    ? Math.round(tier.priceAnnual / 12)
    : tier.priceMonthly;

  const handleJoin = () => {
    if (isFree) {
      handleFreeJoin();
    } else {
      setStep('select-gateway');
    }
  };

  const handleFreeJoin = async () => {
    setStep('loading');
    setError('');
    try {
      await joinFreeTier(tier.id);
      window.location.href = `/payment/success?type=membership&free=1&slug=${slug}`;
    } catch (e: any) {
      setError(e.message ?? 'Failed to join. Are you logged in?');
      setStep('idle');
    }
  };

  const handleGatewayCheckout = async (gateway: 'stripe' | 'paystack') => {
    setStep('loading');
    setError('');
    try {
      const res = await createCheckoutSession({
        productId: tier.id,
        productType: 'membership',
        billingInterval: billing,
        gateway,
      });

      if ('url' in res && res.url) {
        window.location.href = res.url;
      } else if ('authorization_url' in res) {
        window.location.href = res.authorization_url;
      }
    } catch (e: any) {
      setError(e.message ?? 'Checkout failed. Please try again.');
      setStep('select-gateway');
    }
  };

  return (
    <>
      <div
        className="bg-white rounded-xl border flex flex-col overflow-hidden"
        style={{ borderColor: isFree ? '#E5E7EB' : brand }}
      >
        {/* Paid tier accent + label */}
        {!isFree && (
          <div
            className="h-1 w-full"
            style={{ background: `linear-gradient(90deg, ${brand}, ${brand}aa)` }}
          />
        )}

        <div className="p-5 flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-[#1F2937]">{tier.name}</h3>
            {!isFree && savings >= 5 && hasAnnual && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex-shrink-0">
                Save {savings}%
              </span>
            )}
          </div>

          {tier.description && (
            <p className="text-sm text-[#6B7280] flex-1 mb-4">{tier.description}</p>
          )}

          {/* Billing toggle */}
          {hasAnnual && !isFree && (
            <div className="flex rounded-lg overflow-hidden border border-[#E5E7EB] mb-4 text-sm">
              <button
                onClick={() => setBilling('monthly')}
                className={`flex-1 py-1.5 font-medium transition-colors ${
                  billing === 'monthly'
                    ? 'text-white'
                    : 'text-[#6B7280] hover:text-[#1F2937]'
                }`}
                style={billing === 'monthly' ? { background: brand } : {}}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('annual')}
                className={`flex-1 py-1.5 font-medium transition-colors flex items-center justify-center gap-1 ${
                  billing === 'annual'
                    ? 'text-white'
                    : 'text-[#6B7280] hover:text-[#1F2937]'
                }`}
                style={billing === 'annual' ? { background: brand } : {}}
              >
                Annual
                {savings >= 5 && (
                  <span
                    className={`text-[10px] px-1 rounded font-semibold ${
                      billing === 'annual' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    -{savings}%
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Price display */}
          <div className="mb-4">
            {isFree ? (
              <p className="text-2xl font-bold" style={{ color: brand }}>Free</p>
            ) : (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#1F2937]">
                    {formatPrice(selectedPrice, tier.currency)}
                  </span>
                  <span className="text-sm text-[#6B7280]">
                    /{billing === 'annual' ? 'yr' : 'mo'}
                  </span>
                </div>
                {billing === 'annual' && (
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {formatPrice(monthlyEquivalent, tier.currency)}/mo billed annually
                    {savings >= 5 && (
                      <span className="ml-1 text-emerald-600 font-medium">
                        · {formatPrice(tier.priceMonthly * 12 - tier.priceAnnual, tier.currency)} saved
                      </span>
                    )}
                  </p>
                )}
              </>
            )}
          </div>

          {error && <p className="text-xs text-[#EF4444] mb-3">{error}</p>}

          <button
            onClick={handleJoin}
            disabled={step === 'loading'}
            className="w-full py-2.5 rounded-lg font-semibold text-[#1F2937] transition-all hover:opacity-90 disabled:opacity-60 active:scale-95"
            style={{ background: '#F59E0B' }}
          >
            {step === 'loading'
              ? 'Loading…'
              : isFree
              ? 'Join Free'
              : billing === 'annual'
              ? `Join Annually — ${formatPrice(tier.priceAnnual, tier.currency)}/yr`
              : 'Join Now'}
          </button>
        </div>
      </div>

      {/* Payment gateway modal */}
      {step === 'select-gateway' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-[#1F2937] mb-1">Choose Payment Method</h2>
            <p className="text-sm text-[#6B7280] mb-1">
              Join <span className="font-medium">{tier.name}</span> —{' '}
              <span className="font-bold text-[#1F2937]">
                {formatPrice(selectedPrice, tier.currency)}/{billing === 'annual' ? 'yr' : 'mo'}
              </span>
            </p>
            {billing === 'annual' && savings >= 5 && (
              <p className="text-xs text-emerald-600 mb-5 font-medium">
                You save {formatPrice(tier.priceMonthly * 12 - tier.priceAnnual, tier.currency)} vs monthly billing.
              </p>
            )}
            {billing === 'monthly' && <div className="mb-5" />}
            <div className="space-y-3 mb-4">
              <button
                onClick={() => handleGatewayCheckout('stripe')}
                className="w-full py-3 rounded-xl border border-[#F3F4F6] font-semibold text-[#1F2937] hover:border-[#0D9488] transition-colors flex items-center justify-center gap-2"
              >
                <span>💳</span> Pay with Stripe
              </button>
              <button
                onClick={() => handleGatewayCheckout('paystack')}
                className="w-full py-3 rounded-xl border border-[#F3F4F6] font-semibold text-[#1F2937] hover:border-[#0D9488] transition-colors flex items-center justify-center gap-2"
              >
                <span>🌍</span> Pay with Paystack
              </button>
            </div>
            {error && <p className="text-sm text-[#EF4444] mb-3">{error}</p>}
            <button
              onClick={() => setStep('idle')}
              className="w-full py-2 text-sm text-[#6B7280] hover:text-[#1F2937]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
