'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getMyEnrollments, CoachingEnrollment } from '@/lib/coaching';

function SuccessContent() {
  const params = useSearchParams();
  const type = params.get('type');
  const courseId = params.get('courseId');
  const slug = params.get('slug');
  const downloadableId = params.get('downloadableId');
  const programId = params.get('programId');
  const isFree = params.get('free') === '1';

  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);

  // For coaching, find the enrollment so we can link to the enrollment page
  useEffect(() => {
    if (type === 'coaching' && programId) {
      getMyEnrollments()
        .then((enrollments) => {
          const match = enrollments.find((e) => e.programId === programId);
          if (match) setEnrollmentId(match.id);
        })
        .catch(() => {});
    }
  }, [type, programId]);

  const heading =
    type === 'membership'
      ? isFree
        ? "You've joined the community!"
        : 'Membership activated!'
      : type === 'download'
      ? 'Download unlocked!'
      : type === 'coaching'
      ? "You're enrolled!"
      : isFree
      ? "You're enrolled!"
      : 'Payment successful!';

  const body =
    type === 'membership'
      ? 'Welcome! You now have access to all the benefits of this community.'
      : type === 'download'
      ? "Your purchase is confirmed. Click below to download your file."
      : type === 'coaching'
      ? 'Welcome to the program! Access your coaching dashboard below.'
      : "Your enrollment is confirmed. You're ready to start learning!";

  // Primary CTA
  let primaryHref: string;
  let primaryLabel: string;

  if (type === 'course' && courseId) {
    primaryHref = `/learn/${courseId}`;
    primaryLabel = 'Start Learning \u2192';
  } else if (type === 'membership' && slug) {
    primaryHref = `/${slug}/community`;
    primaryLabel = 'Go to Community \u2192';
  } else if (type === 'download' && slug && downloadableId) {
    primaryHref = `/${slug}/downloads/${downloadableId}`;
    primaryLabel = 'Download Now \u2192';
  } else if (type === 'coaching' && enrollmentId) {
    primaryHref = `/learn/coaching/${enrollmentId}`;
    primaryLabel = 'Go to Your Program \u2192';
  } else if (type === 'coaching' && slug && programId) {
    // Fallback if enrollment lookup hasn't resolved yet
    primaryHref = `/${slug}/coaching/${programId}`;
    primaryLabel = 'View Program \u2192';
  } else {
    primaryHref = '/home';
    primaryLabel = 'Go to My Learning \u2192';
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-[#0D9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#1F2937] mb-2">{heading}</h1>
        <p className="text-[#6B7280] mb-8">{body}</p>
        <div className="flex flex-col gap-3">
          <Link
            href={primaryHref}
            className="w-full py-3 rounded-xl bg-[#0D9488] text-white font-semibold hover:bg-teal-700 transition-colors"
          >
            {primaryLabel}
          </Link>
          <Link
            href="/home"
            className="w-full py-3 rounded-xl border border-[#F3F4F6] text-[#6B7280] font-medium hover:border-[#0D9488] transition-colors"
          >
            My Learning Hub
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
