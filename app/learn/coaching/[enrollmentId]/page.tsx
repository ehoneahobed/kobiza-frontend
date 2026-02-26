'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMe, AuthUser } from '@/lib/auth';
import {
  getEnrollmentView,
  getCoachingMessages,
  sendCoachingMessage,
  markCoachingMessagesRead,
  getAvailableMonth,
  getAvailableSlots,
  book1on1,
  submitWork,
  CoachingEnrollment,
  CoachingMessage,
  CoachingSession,
  CoachingSubmission,
  CurriculumWeek,
  AvailableSlot,
  formatSessionTime,
  formatCoachingPrice,
  formatLabel,
  typeLabel,
} from '@/lib/coaching';

type Tab = 'curriculum' | 'sessions' | 'messages';

const STATUS_CHIP: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
  COMPLETED: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Completed' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-600', label: 'Cancelled' },
  EXPIRED: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Expired' },
  PAUSED: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Paused' },
};

// ── Default tab by format ────────────────────────────────────────────────────

function getDefaultTab(enrollment: CoachingEnrollment): Tab {
  const format = enrollment.format;
  const hasCurriculum = enrollment.program?.curriculum &&
    Array.isArray(enrollment.program.curriculum) &&
    (enrollment.program.curriculum as CurriculumWeek[]).length > 0;

  if (format === 'SINGLE_SESSION') return 'sessions';
  if (format === 'FIXED_PACKAGE' || format === 'SUBSCRIPTION') {
    return hasCurriculum ? 'curriculum' : 'messages';
  }
  // GROUP_COHORT, GROUP_OPEN
  return 'sessions';
}

export default function CoachingProgramHomePage() {
  const params = useParams();
  const router = useRouter();
  const enrollmentId = params.enrollmentId as string;

  const [user, setUser] = useState<AuthUser | null>(null);
  const [enrollment, setEnrollment] = useState<CoachingEnrollment | null>(null);
  const [messages, setMessages] = useState<CoachingMessage[]>([]);
  const [tab, setTab] = useState<Tab>('sessions');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMe(),
      getEnrollmentView(enrollmentId),
    ])
      .then(([u, e]) => {
        setUser(u);
        setEnrollment(e);
        setTab(getDefaultTab(e));
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [enrollmentId, router]);

  // Load messages when Messages tab is opened
  useEffect(() => {
    if (tab === 'messages' && enrollmentId) {
      getCoachingMessages(enrollmentId)
        .then(setMessages)
        .catch(() => {});
      markCoachingMessagesRead(enrollmentId).catch(() => {});
    }
  }, [tab, enrollmentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!enrollment || !enrollment.program) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900 mb-2">Enrollment not found</p>
          <Link href="/home" className="text-sm text-[#0D9488] hover:underline">Back to home</Link>
        </div>
      </div>
    );
  }

  const program = enrollment.program;
  const curriculum = (program.curriculum as CurriculumWeek[] | null) ?? [];
  const sessions = enrollment.sessions ?? [];
  const submissions = enrollment.submissions ?? [];
  const slug = program.creatorProfile?.slug;
  const coachName = program.creatorProfile?.user?.name ?? 'Coach';
  const statusChip = STATUS_CHIP[enrollment.status] ?? STATUS_CHIP.ACTIVE;

  const hasCurriculum = curriculum.length > 0;

  // Determine current week (first week without a COMPLETED session)
  const completedWeeks = new Set(
    sessions
      .filter((s) => s.status === 'COMPLETED' && s.weekNumber)
      .map((s) => s.weekNumber!),
  );
  const currentWeek = curriculum.length > 0
    ? (curriculum.find((w) => !completedWeeks.has(w.week))?.week ?? curriculum[curriculum.length - 1].week)
    : 1;

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: 'curriculum', label: 'Curriculum', show: hasCurriculum },
    { key: 'sessions', label: 'Sessions', show: true },
    { key: 'messages', label: 'Messages', show: true },
  ];

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Link href="/home" className="hover:text-[#0D9488]">My Learning</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate">{program.title}</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{program.title}</h1>
              <p className="text-sm text-gray-500">
                with{' '}
                {slug ? (
                  <Link href={`/${slug}`} className="text-[#0D9488] hover:underline">{coachName}</Link>
                ) : (
                  coachName
                )}
                {' '}&middot;{' '}{typeLabel(program.type)} &middot; {formatLabel(program.format)}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Status chip */}
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusChip.bg} ${statusChip.text}`}>
                {statusChip.label}
              </span>

              {/* Session credits */}
              {enrollment.sessionsIncluded != null && (
                <span className="text-xs text-gray-500">
                  {enrollment.sessionsUsed}/{enrollment.sessionsIncluded} sessions
                </span>
              )}
            </div>
          </div>

          {/* Credit bar for packages */}
          {enrollment.sessionsIncluded != null && (
            <div className="mt-4">
              <SessionCreditBar used={enrollment.sessionsUsed} total={enrollment.sessionsIncluded} />
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mt-6 -mb-[1px]">
            {tabs.filter((t) => t.show).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border transition-colors ${
                  tab === t.key
                    ? 'bg-white border-gray-200 border-b-white text-[#0D9488]'
                    : 'bg-transparent border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {tab === 'curriculum' && hasCurriculum && (
          <CurriculumTab
            curriculum={curriculum}
            sessions={sessions}
            submissions={submissions}
            currentWeek={currentWeek}
            completedWeeks={completedWeeks}
            enrollmentId={enrollmentId}
            programId={program.id}
            slug={slug}
            onSubmissionAdded={(s) => setEnrollment((prev) => prev ? { ...prev, submissions: [...(prev.submissions ?? []), s] } : prev)}
          />
        )}
        {tab === 'sessions' && (
          <SessionsTab
            sessions={sessions}
            enrollment={enrollment}
            slug={slug}
            programId={program.id}
            currentWeek={currentWeek}
            onSessionBooked={(s) => setEnrollment((prev) => prev ? {
              ...prev,
              sessions: [...(prev.sessions ?? []), s],
              sessionsUsed: prev.sessionsUsed + (prev.format === 'FIXED_PACKAGE' ? 1 : 0),
            } : prev)}
          />
        )}
        {tab === 'messages' && (
          <MessagesTab
            messages={messages}
            userId={user?.id ?? ''}
            enrollmentId={enrollmentId}
            onNewMessage={(m) => setMessages((prev) => [...prev, m])}
          />
        )}
      </div>
    </div>
  );
}

// ── Session Credit Bar ──────────────────────────────────────────────────────

function SessionCreditBar({ used, total }: { used: number; total: number }) {
  const pct = total === 0 ? 0 : Math.min(Math.round((used / total) * 100), 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: pct >= 100 ? '#6B7280' : 'linear-gradient(90deg, #0D9488, #F59E0B)',
          }}
        />
      </div>
      <span className="text-xs text-gray-500 flex-shrink-0">
        {used} of {total} sessions used
      </span>
    </div>
  );
}

// ── Curriculum Tab ──────────────────────────────────────────────────────────

function CurriculumTab({
  curriculum,
  sessions,
  submissions,
  currentWeek,
  completedWeeks,
  enrollmentId,
  programId,
  slug,
  onSubmissionAdded,
}: {
  curriculum: CurriculumWeek[];
  sessions: CoachingSession[];
  submissions: CoachingSubmission[];
  currentWeek: number;
  completedWeeks: Set<number>;
  enrollmentId: string;
  programId: string;
  slug?: string;
  onSubmissionAdded: (s: CoachingSubmission) => void;
}) {
  const [openWeek, setOpenWeek] = useState<number>(currentWeek);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [submitContent, setSubmitContent] = useState('');

  async function handleSubmit(weekNumber: number) {
    if (!submitContent.trim()) return;
    setSubmitting(weekNumber);
    try {
      const sub = await submitWork(enrollmentId, { weekNumber, content: submitContent });
      onSubmissionAdded(sub);
      setSubmitContent('');
    } catch {
      // silent
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="space-y-3">
      {curriculum.map((week) => {
        const isCompleted = completedWeeks.has(week.week);
        const isCurrent = week.week === currentWeek;
        const weekSession = sessions.find((s) => s.weekNumber === week.week);
        const weekSubmissions = submissions.filter((s) => s.weekNumber === week.week);
        const hasSubmission = weekSubmissions.length > 0;
        const hasFeedback = weekSubmissions.some((s) => s.feedback);
        const isOpen = openWeek === week.week;

        return (
          <div key={week.week} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Accordion header */}
            <button
              onClick={() => setOpenWeek(isOpen ? -1 : week.week)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg flex-shrink-0">
                {isCompleted ? '\u2705' : isCurrent ? '\ud83d\udfe2' : '\u25cb'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">
                  Week {week.week}{week.title ? `: ${week.title}` : ''}
                </p>
                {week.description && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{week.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {weekSession?.status === 'COMPLETED' && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Session done</span>
                )}
                {hasSubmission && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${hasFeedback ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}>
                    {hasFeedback ? 'Feedback received' : 'Submitted'}
                  </span>
                )}
              </div>
              <span className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                &#9660;
              </span>
            </button>

            {/* Accordion body */}
            {isOpen && (
              <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
                {week.description && (
                  <p className="text-sm text-gray-600">{week.description}</p>
                )}
                {week.resources && (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-700 mb-1">Resources</p>
                    <p className="whitespace-pre-wrap">{week.resources}</p>
                  </div>
                )}
                {/* Session status */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Session</p>
                  {weekSession ? (
                    <div className="text-sm">
                      {weekSession.status === 'COMPLETED' ? (
                        <p className="text-green-600 font-medium">
                          Completed {new Date(weekSession.startsAt).toLocaleDateString()}
                        </p>
                      ) : weekSession.status === 'SCHEDULED' ? (
                        <div className="flex items-center gap-2">
                          <p className="text-gray-900">{formatSessionTime(weekSession.startsAt, weekSession.endsAt)}</p>
                          {weekSession.meetingUrl && (
                            <a href={weekSession.meetingUrl} target="_blank" rel="noopener noreferrer"
                              className="text-xs bg-[#0D9488] text-white px-2.5 py-1 rounded-lg hover:bg-teal-700">
                              Join
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500">Session {weekSession.status.toLowerCase()}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No session scheduled — book one in the Sessions tab</p>
                  )}
                </div>
                {/* Deliverable */}
                {week.deliverablePrompt && (
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-amber-700 mb-1">Deliverable</p>
                    <p className="text-sm text-amber-800 mb-3">{week.deliverablePrompt}</p>
                    {weekSubmissions.length > 0 ? (
                      <div className="space-y-2">
                        {weekSubmissions.map((sub) => (
                          <div key={sub.id} className="bg-white rounded-lg p-3 border border-amber-200">
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{sub.content}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Submitted {new Date(sub.submittedAt).toLocaleDateString()}
                            </p>
                            {sub.feedback && (
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <p className="text-xs font-medium text-teal-700 mb-1">Coach feedback:</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{sub.feedback}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          rows={3}
                          className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                          placeholder="Write your submission..."
                          value={submitContent}
                          onChange={(e) => setSubmitContent(e.target.value)}
                        />
                        <button
                          onClick={() => handleSubmit(week.week)}
                          disabled={submitting === week.week || !submitContent.trim()}
                          className="bg-[#0D9488] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50"
                        >
                          {submitting === week.week ? 'Submitting...' : 'Submit work'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Calendar Helpers ─────────────────────────────────────────────────────────

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildCalendarGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month - 1, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const grid: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(new Date(year, month - 1, d));
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

// ── Inline Booking Calendar ──────────────────────────────────────────────────

function InlineBookingCalendar({
  programId,
  enrollmentId,
  onBooked,
}: {
  programId: string;
  enrollmentId: string;
  onBooked: (session: CoachingSession) => void;
}) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [availableDays, setAvailableDays] = useState<Set<string>>(new Set());
  const [loadingDays, setLoadingDays] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoadingDays(true);
    getAvailableMonth(programId, viewYear, viewMonth)
      .then((days) => setAvailableDays(new Set(days)))
      .finally(() => setLoadingDays(false));
  }, [programId, viewYear, viewMonth]);

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);
    getAvailableSlots(programId, selectedDate)
      .then(setSlots)
      .finally(() => setLoadingSlots(false));
  }, [programId, selectedDate]);

  function prevMonth() {
    if (viewMonth === 1) { setViewYear((y) => y - 1); setViewMonth(12); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 12) { setViewYear((y) => y + 1); setViewMonth(1); }
    else setViewMonth((m) => m + 1);
  }

  async function handleBook() {
    if (!selectedSlot) return;
    setBooking(true);
    setError('');
    try {
      const session = await book1on1(enrollmentId, selectedSlot.startsAt);
      onBooked(session);
      setSelectedSlot(null);
      setSelectedDate(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking failed.');
    } finally {
      setBooking(false);
    }
  }

  const calGrid = buildCalendarGrid(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500">&larr;</button>
          <span className="font-semibold text-gray-900 text-sm">{monthLabel}</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500">&rarr;</button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
          ))}
        </div>
        {loadingDays ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {calGrid.map((d, i) => {
              if (!d) return <div key={i} />;
              const dateStr = toDateStr(d);
              const isPast = d < new Date(toDateStr(new Date()));
              const isAvail = availableDays.has(dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === toDateStr(new Date());
              return (
                <button
                  key={i}
                  disabled={isPast || !isAvail}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`w-full aspect-square rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                    isSelected
                      ? 'bg-teal-600 text-white'
                      : isAvail && !isPast
                        ? 'bg-white text-teal-700 hover:bg-teal-50 cursor-pointer'
                        : isPast
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-400 cursor-not-allowed'
                  } ${isToday && !isSelected ? 'ring-1 ring-teal-400' : ''}`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Slots */}
      {selectedDate && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            {new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h4>
          {loadingSlots ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">No slots available.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot, i) => {
                const time = new Date(slot.startsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                const isSel = selectedSlot?.startsAt === slot.startsAt;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      isSel
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'border-gray-200 text-gray-700 hover:border-teal-400'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirm */}
      {selectedSlot && (
        <div>
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-3">{error}</div>}
          <div className="bg-gray-50 rounded-xl p-3 mb-3 text-sm text-gray-700">
            {formatSessionTime(selectedSlot.startsAt, selectedSlot.endsAt)}
          </div>
          <button
            onClick={handleBook}
            disabled={booking}
            className="w-full py-3 rounded-xl font-bold text-sm bg-[#0D9488] text-white hover:bg-teal-700 disabled:opacity-60 transition-colors"
          >
            {booking ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sessions Tab ────────────────────────────────────────────────────────────

function SessionsTab({
  sessions,
  enrollment,
  slug,
  programId,
  currentWeek,
  onSessionBooked,
}: {
  sessions: CoachingSession[];
  enrollment: CoachingEnrollment;
  slug?: string;
  programId: string;
  currentWeek: number;
  onSessionBooked: (s: CoachingSession) => void;
}) {
  const now = new Date();
  const past = sessions.filter((s) => new Date(s.endsAt) < now || s.status === 'COMPLETED');
  const upcoming = sessions.filter((s) => new Date(s.startsAt) >= now && s.status === 'SCHEDULED');
  const canBook = enrollment.status === 'ACTIVE' && (
    enrollment.format === 'SINGLE_SESSION' ||
    enrollment.format === 'FIXED_PACKAGE' ||
    enrollment.format === 'SUBSCRIPTION'
  );
  const remaining = enrollment.sessionsIncluded != null
    ? enrollment.sessionsIncluded - enrollment.sessionsUsed
    : null;
  const hasSessionDuration = enrollment.program?.sessionDurationMinutes != null;

  // Welcome states
  const isNew = sessions.length === 0;

  return (
    <div className="space-y-6">
      {/* Credit bar */}
      {enrollment.sessionsIncluded != null && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <SessionCreditBar used={enrollment.sessionsUsed} total={enrollment.sessionsIncluded} />
        </div>
      )}

      {/* Welcome state for new enrollments */}
      {isNew && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 text-center">
          {enrollment.format === 'SINGLE_SESSION' ? (
            <>
              <p className="font-semibold text-teal-800 mb-1">Book your session below</p>
              <p className="text-sm text-teal-600">Pick a time that works for you.</p>
            </>
          ) : enrollment.format === 'FIXED_PACKAGE' || enrollment.format === 'SUBSCRIPTION' ? (
            <>
              <p className="font-semibold text-teal-800 mb-1">Welcome! You&apos;re enrolled.</p>
              <p className="text-sm text-teal-600">
                {hasSessionDuration
                  ? 'Book your first session below, or send your coach a message to get started.'
                  : 'Send your coach a message to get started.'}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-teal-800 mb-1">Welcome to the group!</p>
              <p className="text-sm text-teal-600">Check below for upcoming group sessions.</p>
            </>
          )}
        </div>
      )}

      {/* Upcoming sessions */}
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3">Upcoming</h3>
          <div className="space-y-2">
            {upcoming.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {new Date(s.startsAt).getDate()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{formatSessionTime(s.startsAt, s.endsAt)}</p>
                  {s.weekNumber && <p className="text-xs text-gray-500">Week {s.weekNumber}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {s.meetingUrl && (
                    <a
                      href={s.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#0D9488] text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-teal-700"
                    >
                      Join
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inline calendar booking */}
      {canBook && (remaining === null || remaining > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">
            {remaining != null ? `Book a session (${remaining} remaining)` : 'Book a session'}
          </h3>
          {hasSessionDuration ? (
            <InlineBookingCalendar
              programId={programId}
              enrollmentId={enrollment.id}
              onBooked={onSessionBooked}
            />
          ) : (
            <div className="text-center py-6 text-gray-400">
              <p className="text-sm mb-1">Your coach hasn&apos;t configured session booking yet.</p>
              <p className="text-xs">Use the Messages tab to coordinate scheduling.</p>
            </div>
          )}
        </div>
      )}

      {/* Past sessions */}
      {past.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3">Past</h3>
          <div className="space-y-2">
            {past.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 opacity-75">
                <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {new Date(s.startsAt).getDate()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{formatSessionTime(s.startsAt, s.endsAt)}</p>
                  <div className="flex gap-2 mt-0.5">
                    {s.weekNumber && <span className="text-xs text-gray-400">Week {s.weekNumber}</span>}
                    <span className={`text-xs font-medium ${s.status === 'COMPLETED' ? 'text-green-600' : s.status === 'CANCELLED' ? 'text-red-500' : 'text-gray-500'}`}>
                      {s.status === 'COMPLETED' ? 'Completed' : s.status === 'CANCELLED' ? 'Cancelled' : s.status}
                    </span>
                  </div>
                </div>
                {s.notes && (
                  <span className="text-xs text-gray-400 flex-shrink-0">Has notes</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && !canBook && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-1">No sessions yet</p>
        </div>
      )}
    </div>
  );
}

// ── Messages Tab ────────────────────────────────────────────────────────────

function MessagesTab({
  messages,
  userId,
  enrollmentId,
  onNewMessage,
}: {
  messages: CoachingMessage[];
  userId: string;
  enrollmentId: string;
  onNewMessage: (m: CoachingMessage) => void;
}) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const msg = await sendCoachingMessage(enrollmentId, input.trim());
      onNewMessage(msg);
      setInput('');
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ minHeight: '500px' }}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-1">No messages yet</p>
            <p className="text-sm">Start a conversation with your coach</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderId === userId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] ${isMe ? 'order-1' : ''}`}>
                {!isMe && msg.sender && (
                  <p className="text-xs text-gray-400 mb-1 ml-1">{msg.sender.name}</p>
                )}
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm ${
                    isMe
                      ? 'bg-[#0D9488] text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-900 rounded-bl-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                </div>
                <p className={`text-xs text-gray-400 mt-1 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                  {new Date(msg.sentAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                  {' '}&middot;{' '}
                  {new Date(msg.sentAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-gray-200 p-4 flex gap-3">
        <input
          type="text"
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="bg-[#0D9488] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
