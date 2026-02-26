'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getProgramPublic,
  enrollInProgram,
  getMyEnrollments,
  CoachingProgram,
  CoachingCohort,
  CoachingEnrollment,
  formatLabel,
  typeLabel,
  formatCoachingPrice,
  formatDuration,
  formatStartDatePolicy,
} from '@/lib/coaching';
import { createCheckoutSession } from '@/lib/payments';
import { getToken } from '@/lib/auth';

// ── Cohort Selector (GROUP_COHORT only) ──────────────────────────────────────

function CohortSelector({
  program,
  onSelectCohort,
}: {
  program: CoachingProgram;
  onSelectCohort: (cohortId: string | undefined) => void;
}) {
  const cohorts = program.cohorts ?? [];
  const [selected, setSelected] = useState<string | undefined>(cohorts[0]?.id);

  useEffect(() => {
    onSelectCohort(selected);
  }, [selected, onSelectCohort]);

  if (cohorts.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-3">
        No cohorts available yet. Check back soon.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-900 text-sm mb-2">Choose a cohort</h3>
      {cohorts.map((cohort) => {
        const count = cohort._count?.enrollments ?? 0;
        const isFull = cohort.maxParticipants != null && count >= cohort.maxParticipants;
        const deadline = cohort.enrollmentDeadline ? new Date(cohort.enrollmentDeadline) : null;
        const pastDeadline = deadline && deadline < new Date();
        const disabled = isFull || !!pastDeadline || !cohort.enrollmentOpen;

        return (
          <button
            key={cohort.id}
            type="button"
            disabled={disabled}
            onClick={() => setSelected(cohort.id)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              selected === cohort.id
                ? 'border-teal-600 bg-teal-50'
                : disabled
                  ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                  : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="font-semibold text-gray-900 text-sm">{cohort.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Starts {new Date(cohort.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            {cohort.maxParticipants && (
              <p className="text-xs text-gray-400 mt-0.5">
                {count}/{cohort.maxParticipants} spots filled
              </p>
            )}
            {disabled && (
              <span className="text-xs text-gray-400 mt-1 inline-block">
                {isFull ? 'Full' : 'Closed'}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Sales Page ──────────────────────────────────────────────────────────

export default function CoachingProgramPage() {
  const { slug, programId } = useParams<{ slug: string; programId: string }>();
  const router = useRouter();
  const [program, setProgram] = useState<CoachingProgram | null>(null);
  const [existingEnrollment, setExistingEnrollment] = useState<CoachingEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [selectedCohortId, setSelectedCohortId] = useState<string | undefined>();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const prog = await getProgramPublic(programId);
        setProgram(prog);
        if (getToken()) {
          const enrollments = await getMyEnrollments().catch(() => []);
          const match = enrollments.find((e) => e.programId === programId);
          if (match) setExistingEnrollment(match);
        }
      } catch {
        setError('Program not found or unavailable.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [slug, programId]);

  async function handleEnroll() {
    if (!program) return;
    if (!getToken()) {
      router.push(`/login?next=/${slug}/coaching/${programId}`);
      return;
    }
    setEnrolling(true);
    setError('');
    try {
      const isFree = program.price === 0;
      if (isFree) {
        const enrollment = await enrollInProgram({
          programId: program.id,
          cohortId: selectedCohortId,
        });
        router.push(`/learn/coaching/${enrollment.id}`);
      } else {
        const result = await createCheckoutSession({
          productId: program.id,
          productType: 'coaching',
          gateway: 'stripe',
          cohortId: selectedCohortId,
        });
        const url = (result as any).url ?? (result as any).authorization_url;
        if (url) window.location.href = url;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Enrollment failed. Please try again.');
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !program) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center max-w-sm">
          <p className="text-gray-900 font-semibold mb-4">{error || 'Program not found.'}</p>
          <Link
            href={`/${slug}`}
            className="bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-teal-700"
          >
            Back to profile
          </Link>
        </div>
      </div>
    );
  }

  if (!program) return null;

  const is1on1 = program.type === 'ONE_ON_ONE';
  const isFree = program.price === 0;
  const duration = formatDuration(program);
  const startPolicy = formatStartDatePolicy(program);
  const coachName = program.creatorProfile?.user?.name ?? 'Coach';

  // Build "What's Included" list
  const included: string[] = [];
  if (program.sessionDurationMinutes) {
    included.push(`${program.sessionDurationMinutes}-minute ${is1on1 ? 'private 1:1' : 'group'} sessions`);
  }
  if (program.totalSessions) {
    included.push(`${program.totalSessions} sessions included`);
  }
  included.push('Direct messaging with your coach');
  if (program.meetingPlatform) {
    included.push(`Sessions via ${program.meetingPlatform}`);
  } else {
    included.push('Meeting link shared after enrollment');
  }
  if (startPolicy) {
    included.push(startPolicy);
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Nav */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href={`/${slug}`} className="text-sm text-gray-500 hover:text-teal-600 transition-colors">
            &larr; {coachName}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-900 truncate">{program.title}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        {/* Hero card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div
            className="h-1.5"
            style={{
              background: is1on1
                ? 'linear-gradient(90deg, #0D9488, #38BDF8)'
                : 'linear-gradient(90deg, #F59E0B, #EF4444)',
            }}
          />
          <div className="p-8">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                {formatLabel(program.format)}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                {is1on1 ? '1:1' : 'Group'}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">{program.title}</h1>
            <p className="text-sm text-gray-500 mb-5">By {coachName}</p>

            {/* Key details row */}
            <div className="flex flex-wrap gap-4 text-sm">
              <span className={`font-bold px-3 py-1.5 rounded-lg ${isFree ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'}`}>
                {formatCoachingPrice(program.price, program.currency)}
                {program.format === 'SUBSCRIPTION' ? ' / mo' : ''}
              </span>
              {duration && (
                <span className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700">
                  {duration}
                </span>
              )}
              {startPolicy && (
                <span className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700">
                  {startPolicy}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sales Page Content or Description */}
        {(program.salesPageContent || program.description) && (
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {program.salesPageContent || program.description}
            </div>
          </div>
        )}

        {/* What's Included */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">What&apos;s included</h2>
          <ul className="space-y-3">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 text-xs flex-shrink-0 mt-0.5">
                  &#10003;
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Cohort selector for GROUP_COHORT */}
        {program.format === 'GROUP_COHORT' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <CohortSelector
              program={program}
              onSelectCohort={setSelectedCohortId}
            />
          </div>
        )}

        {/* Enrollment CTA */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
          )}

          {existingEnrollment ? (
            <div className="text-center">
              <p className="text-teal-700 font-semibold mb-3">You&apos;re already enrolled in this program!</p>
              <Link
                href={`/learn/coaching/${existingEnrollment.id}`}
                className="inline-block bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors"
              >
                Go to your program &rarr;
              </Link>
            </div>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="w-full py-4 rounded-xl font-bold text-base transition-colors disabled:opacity-60 bg-amber-400 text-gray-900 hover:bg-amber-500"
            >
              {enrolling
                ? 'Processing...'
                : isFree
                  ? 'Enroll Now — Free'
                  : `Enroll Now — ${formatCoachingPrice(program.price, program.currency)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
