'use client';

import { useState } from 'react';
import { createCheckoutSession, enrollFree } from '@/lib/payments';
import { formatPrice } from '@/lib/creator';

interface Course {
  id: string;
  title: string;
  description: string | null;
  coverUrl?: string | null;
  priceSelfPaced: number;
  priceAccountability: number;
  currency: string;
}

interface Props {
  course: Course;
  brand: string;
}

type Step = 'idle' | 'select-track' | 'select-gateway' | 'loading';

export default function CourseCard({ course, brand }: Props) {
  const [step, setStep] = useState<Step>('idle');
  const [track, setTrack] = useState<'self_paced' | 'accountability'>('self_paced');
  const [error, setError] = useState('');

  const isFree = (t: 'self_paced' | 'accountability') =>
    t === 'self_paced' ? course.priceSelfPaced === 0 : course.priceAccountability === 0;

  const handleTrackSelect = (t: 'self_paced' | 'accountability') => {
    setTrack(t);
    if (isFree(t)) {
      handleFreeEnroll(t);
    } else {
      setStep('select-gateway');
    }
  };

  const handleFreeEnroll = async (t: 'self_paced' | 'accountability') => {
    setStep('loading');
    setError('');
    try {
      await enrollFree(course.id, t);
      window.location.href = `/payment/success?type=course&free=1`;
    } catch (e: any) {
      setError(e.message ?? 'Enrollment failed.');
      setStep('select-track');
    }
  };

  const handleGatewayCheckout = async (gateway: 'stripe' | 'paystack') => {
    setStep('loading');
    setError('');
    try {
      const res = await createCheckoutSession({
        productId: course.id,
        productType: 'course',
        track,
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
      <div className="bg-white rounded-xl border border-[#F3F4F6] overflow-hidden">
        {course.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.coverUrl} alt={course.title} className="w-full h-36 object-cover" />
        )}
        <div className="p-5">
        <h3 className="font-semibold text-[#1F2937] mb-1">{course.title}</h3>
        {course.description && (
          <p className="text-sm text-[#6B7280] mb-4 line-clamp-2">{course.description}</p>
        )}
        {/* Dual-track pricing */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-lg border border-[#F3F4F6] p-3 text-center">
            <p className="text-xs text-[#6B7280] mb-1">Self-Paced</p>
            <p className="font-bold text-[#1F2937]">
              {formatPrice(course.priceSelfPaced, course.currency)}
            </p>
          </div>
          <div
            className="rounded-lg p-3 text-center"
            style={{ background: `${brand}15`, border: `1px solid ${brand}` }}
          >
            <p className="text-xs mb-1" style={{ color: brand }}>Accountability</p>
            <p className="font-bold text-[#1F2937]">
              {formatPrice(course.priceAccountability, course.currency)}
            </p>
          </div>
        </div>
        <button
          onClick={() => setStep('select-track')}
          className="w-full py-2.5 rounded-lg font-semibold text-[#1F2937] bg-[#F59E0B] hover:bg-amber-400 transition-colors"
        >
          Enroll Now
        </button>
        </div>
      </div>

      {/* Modal */}
      {step !== 'idle' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            {step === 'select-track' && (
              <>
                <h2 className="text-lg font-bold text-[#1F2937] mb-1">Choose Your Track</h2>
                <p className="text-sm text-[#6B7280] mb-5">
                  Pick how you want to experience <span className="font-medium">{course.title}</span>.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => handleTrackSelect('self_paced')}
                    className="rounded-xl border border-[#F3F4F6] p-4 text-left hover:border-[#0D9488] transition-colors"
                  >
                    <p className="font-semibold text-[#1F2937] mb-1">Self-Paced</p>
                    <p className="text-xs text-[#6B7280] mb-3">Learn at your own pace</p>
                    <p className="font-bold text-[#1F2937]">
                      {formatPrice(course.priceSelfPaced, course.currency)}
                    </p>
                  </button>
                  <button
                    onClick={() => handleTrackSelect('accountability')}
                    className="rounded-xl border border-[#0D9488] bg-teal-50/40 p-4 text-left hover:bg-teal-50 transition-colors"
                  >
                    <p className="font-semibold text-[#0D9488] mb-1">Accountability ★</p>
                    <p className="text-xs text-[#6B7280] mb-3">Submit work, get feedback</p>
                    <p className="font-bold text-[#1F2937]">
                      {formatPrice(course.priceAccountability, course.currency)}
                    </p>
                  </button>
                </div>
                {error && <p className="text-sm text-[#EF4444] mb-3">{error}</p>}
                <button
                  onClick={() => setStep('idle')}
                  className="w-full py-2 text-sm text-[#6B7280] hover:text-[#1F2937]"
                >
                  Cancel
                </button>
              </>
            )}

            {step === 'select-gateway' && (
              <>
                <h2 className="text-lg font-bold text-[#1F2937] mb-1">Choose Payment Method</h2>
                <p className="text-sm text-[#6B7280] mb-5">
                  Pay{' '}
                  <span className="font-bold text-[#1F2937]">
                    {formatPrice(
                      track === 'self_paced' ? course.priceSelfPaced : course.priceAccountability,
                      course.currency,
                    )}
                  </span>{' '}
                  for the {track === 'accountability' ? 'Accountability' : 'Self-Paced'} track.
                </p>
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
                  onClick={() => setStep('select-track')}
                  className="w-full py-2 text-sm text-[#6B7280] hover:text-[#1F2937]"
                >
                  ← Back
                </button>
              </>
            )}

            {step === 'loading' && (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="w-10 h-10 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
                <p className="text-[#6B7280] text-sm">Preparing checkout…</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
