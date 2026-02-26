'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPublicCourse, PublicCourse } from '@/lib/courses';
import { createCheckoutSession, enrollFree } from '@/lib/payments';
import { getToken } from '@/lib/auth';
import { formatPrice } from '@/lib/creator';

type Track = 'self_paced' | 'accountability';
type Step = 'idle' | 'select-track' | 'select-gateway' | 'loading';

function formatTotalLessons(course: PublicCourse): string {
  const total = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  return `${total} lesson${total === 1 ? '' : 's'}`;
}

export default function CourseLandingPage() {
  const { slug, courseId } = useParams<{ slug: string; courseId: string }>();
  const router = useRouter();

  const [course, setCourse] = useState<PublicCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('idle');
  const [track, setTrack] = useState<Track>('self_paced');
  const [error, setError] = useState('');
  const [openModuleIdx, setOpenModuleIdx] = useState<number | null>(0);

  const isLoggedIn = !!getToken();

  useEffect(() => {
    getPublicCourse(courseId)
      .then(setCourse)
      .catch(() => router.push(`/${slug}`))
      .finally(() => setLoading(false));
  }, [courseId, slug, router]);

  if (loading || !course) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const creator = course.creatorProfile;
  const brand = creator.brandColor ?? '#0D9488';
  const totalLessons = formatTotalLessons(course);
  const deliverableCount = course.modules
    .flatMap((m) => m.lessons)
    .filter((l) => l.requiresDeliverable).length;

  const isFree = (t: Track) =>
    t === 'self_paced' ? course.priceSelfPaced === 0 : course.priceAccountability === 0;

  const handleTrackSelect = (t: Track) => {
    if (!isLoggedIn) {
      router.push(`/login?next=/${slug}/courses/${courseId}`);
      return;
    }
    setTrack(t);
    if (isFree(t)) {
      handleFreeEnroll(t);
    } else {
      setStep('select-gateway');
    }
  };

  const handleFreeEnroll = async (t: Track) => {
    setStep('loading');
    setError('');
    try {
      await enrollFree(courseId, t);
      router.push(`/payment/success?type=course&free=1`);
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
        productId: courseId,
        productType: 'course',
        track,
        gateway,
      });
      if ('url' in res && res.url) window.location.href = res.url;
      else if ('authorization_url' in res) window.location.href = res.authorization_url;
    } catch (e: any) {
      setError(e.message ?? 'Checkout failed.');
      setStep('select-gateway');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Nav */}
      <header className="bg-[#1F2937] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href={`/${slug}`} className="text-white/60 hover:text-white text-sm transition-colors">
            ← {creator.user.name}
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-white/80 text-sm truncate">{course.title}</span>
          <Link
            href={`/${slug}/community`}
            className="ml-auto text-sm text-white/60 hover:text-white transition-colors"
          >
            Community →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-[#1F2937] pb-10 pt-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ background: brand }}>
              Course
            </span>
            <span className="text-white/40 text-xs">{creator.user.name}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-white/70 text-base max-w-2xl mb-4 leading-relaxed">
              {course.description}
            </p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-white/60">
            <span>🎓 {totalLessons}</span>
            <span>📦 {course.modules.length} module{course.modules.length !== 1 ? 's' : ''}</span>
            <span>👥 {course._count?.enrollments ?? 0} enrolled</span>
            {deliverableCount > 0 && (
              <span style={{ color: brand }}>✅ {deliverableCount} accountability exercise{deliverableCount !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left — curriculum */}
          <div className="lg:col-span-2 space-y-4">
            {/* Creator card */}
            <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                style={{
                  background: creator.logoUrl
                    ? `url(${creator.logoUrl}) center/cover`
                    : `linear-gradient(135deg, ${brand}, ${brand}cc)`,
                }}
              >
                {!creator.logoUrl && creator.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-[#1F2937]">{creator.user.name}</p>
                {creator.bio && (
                  <p className="text-sm text-[#6B7280] mt-0.5 line-clamp-1">{creator.bio}</p>
                )}
              </div>
            </div>

            {/* Course outline */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F3F4F6]">
                <h2 className="font-bold text-[#1F2937]">Course Curriculum</h2>
              </div>
              {course.modules.length === 0 ? (
                <div className="p-8 text-center text-[#6B7280] text-sm">
                  Curriculum coming soon.
                </div>
              ) : (
                <div className="divide-y divide-[#F3F4F6]">
                  {course.modules.map((mod, idx) => (
                    <div key={mod.id}>
                      <button
                        onClick={() => setOpenModuleIdx(openModuleIdx === idx ? null : idx)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#F3F4F6]/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-[#1F2937] text-sm">{mod.title}</p>
                          <p className="text-xs text-[#6B7280] mt-0.5">
                            {mod.lessons.length} lesson{mod.lessons.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <span className="text-[#6B7280] text-xs ml-4">
                          {openModuleIdx === idx ? '▲' : '▼'}
                        </span>
                      </button>
                      {openModuleIdx === idx && mod.lessons.length > 0 && (
                        <div className="bg-[#F3F4F6]/40 divide-y divide-[#F3F4F6]">
                          {mod.lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-center gap-3 px-7 py-3 text-sm"
                            >
                              <span className="text-[#0D9488] text-base">▶</span>
                              <span className="flex-1 text-[#1F2937]">{lesson.title}</span>
                              {lesson.requiresDeliverable && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${brand}15`, color: brand }}>
                                  Exercise
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right — pricing card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-5 sticky top-20">
              <h2 className="font-bold text-[#1F2937] text-lg mb-1">Enroll Now</h2>
              <p className="text-xs text-[#6B7280] mb-5">
                Choose the track that fits how you learn.
              </p>

              {/* Self-Paced */}
              <div className="rounded-xl border-2 border-[#F3F4F6] p-4 mb-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-[#1F2937] text-sm">Self-Paced</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">Learn at your own schedule</p>
                  </div>
                  <p className="font-bold text-[#1F2937] text-lg">
                    {formatPrice(course.priceSelfPaced, course.currency)}
                  </p>
                </div>
                <ul className="text-xs text-[#6B7280] space-y-1 mb-4">
                  <li>✓ Full course access</li>
                  <li>✓ Lifetime updates</li>
                  <li>✓ Community access</li>
                </ul>
                <button
                  onClick={() => handleTrackSelect('self_paced')}
                  disabled={step === 'loading'}
                  className="w-full py-2.5 rounded-lg font-semibold text-sm border-2 transition-colors hover:text-white disabled:opacity-50"
                  style={{ borderColor: brand, color: brand }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = brand; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = brand; }}
                >
                  {course.priceSelfPaced === 0 ? 'Enroll Free' : 'Buy Self-Paced'}
                </button>
              </div>

              {/* Accountability */}
              <div
                className="rounded-xl border-2 p-4 mb-3"
                style={{ borderColor: brand, background: `${brand}08` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: brand }}>
                      Accountability ★
                    </p>
                    <p className="text-xs text-[#6B7280] mt-0.5">Submit work, get real feedback</p>
                  </div>
                  <p className="font-bold text-[#1F2937] text-lg">
                    {formatPrice(course.priceAccountability, course.currency)}
                  </p>
                </div>
                <ul className="text-xs text-[#6B7280] space-y-1 mb-4">
                  <li>✓ Everything in Self-Paced</li>
                  <li>✓ Submit exercises for review</li>
                  <li>✓ Personalised creator feedback</li>
                </ul>
                <button
                  onClick={() => handleTrackSelect('accountability')}
                  disabled={step === 'loading'}
                  className="w-full py-2.5 rounded-lg font-semibold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: brand }}
                >
                  {course.priceAccountability === 0 ? 'Enroll Free' : 'Buy Accountability'}
                </button>
              </div>

              {error && (
                <p className="text-xs text-[#EF4444] text-center mt-2">{error}</p>
              )}

              {!isLoggedIn && (
                <p className="text-xs text-center text-[#6B7280] mt-3">
                  <Link href="/login" className="text-[#0D9488] hover:underline font-medium">
                    Log in
                  </Link>{' '}
                  or{' '}
                  <Link href="/signup" className="text-[#0D9488] hover:underline font-medium">
                    sign up free
                  </Link>{' '}
                  to enroll.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment gateway modal */}
      {(step === 'select-gateway' || step === 'loading') && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            {step === 'loading' ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="w-10 h-10 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
                <p className="text-[#6B7280] text-sm">Preparing checkout…</p>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-[#1F2937] mb-1">Choose Payment Method</h2>
                <p className="text-sm text-[#6B7280] mb-5">
                  Pay{' '}
                  <strong className="text-[#1F2937]">
                    {formatPrice(
                      track === 'self_paced' ? course.priceSelfPaced : course.priceAccountability,
                      course.currency,
                    )}
                  </strong>{' '}
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
                  onClick={() => setStep('idle')}
                  className="w-full py-2 text-sm text-[#6B7280] hover:text-[#1F2937]"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
