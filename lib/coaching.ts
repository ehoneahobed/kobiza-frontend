import { apiFetch } from './api';

// ── Enums ────────────────────────────────────────────────────────────────────

/** Interaction type: 1:1 or Group  (Prisma: CoachingType) */
export type CoachingType = 'ONE_ON_ONE' | 'GROUP';

/** Business model  (Prisma: CoachingFormat) */
export type CoachingFormat =
  | 'SINGLE_SESSION'
  | 'FIXED_PACKAGE'
  | 'SUBSCRIPTION'
  | 'GROUP_COHORT'
  | 'GROUP_OPEN';

// ── Curriculum ────────────────────────────────────────────────────────────────

export interface CurriculumWeek {
  week: number;
  title: string;
  description?: string;
  sessionDurationMinutes?: number; // override the program default for this week's session
  deliverablePrompt?: string;      // what the client should submit after this session
  resources?: string;              // optional reading / links
}

export type CoachingSessionStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export type CoachingEnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

// ── Models ────────────────────────────────────────────────────────────────────

export interface AvailabilityRule {
  id: string;
  programId: string;
  dayOfWeek: number; // 0=Sun … 6=Sat
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  isActive: boolean;
}

export interface BlackoutPeriod {
  id: string;
  creatorProfileId: string;
  programId: string | null;
  startDate: string;
  endDate: string;
  reason: string | null;
}

export interface CoachingCohort {
  id: string;
  programId: string;
  name: string;
  startDate: string;
  endDate: string | null;
  maxParticipants: number | null;
  enrollmentOpen: boolean;
  enrollmentDeadline: string | null;
  _count?: { enrollments: number; sessions: number };
  sessions?: CoachingSession[];
}

export interface CoachingSubmission {
  id: string;
  programId: string;
  enrollmentId: string;
  sessionId: string | null;
  userId: string;
  weekNumber: number | null;
  content: string | null;
  fileUrl: string | null;
  submittedAt: string;
  feedback: string | null;
  feedbackAt: string | null;
  reviewedById: string | null;
  user?: { id: string; name: string; avatarUrl: string | null };
}

export interface CoachingMessage {
  id: string;
  enrollmentId: string;
  senderId: string;
  body: string;
  fileUrl: string | null;
  isRead: boolean;
  sentAt: string;
  editedAt: string | null;
  sender?: { id: string; name: string; avatarUrl: string | null };
}

export interface CoachingProgram {
  id: string;
  creatorProfileId: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  type: CoachingType;    // ONE_ON_ONE | GROUP
  format: CoachingFormat; // SINGLE_SESSION | FIXED_PACKAGE | SUBSCRIPTION | GROUP_COHORT | GROUP_OPEN
  curriculum: CurriculumWeek[] | null;
  sessionDurationMinutes: number | null;
  totalSessions: number | null;
  programWeeks: number | null;
  salesPageContent: string | null;
  durationValue: number | null;
  durationUnit: string | null;       // 'days' | 'weeks' | 'months'
  customDurationText: string | null;
  startDatePolicy: string;           // 'IMMEDIATE' | 'FIXED_DATE' | 'TBD'
  fixedStartDate: string | null;
  sessionsPerWeek: number | null;
  maxParticipants: number | null;
  price: number;
  currency: string;
  meetingPlatform: string | null;
  meetingUrlTemplate: string | null;
  timezone: string;
  bufferMinutes: number;
  advanceBookingDays: number;
  minNoticeHours: number;
  isActive: boolean;
  createdAt: string;
  availabilityRules?: AvailabilityRule[];
  blackoutPeriods?: BlackoutPeriod[];
  cohorts?: CoachingCohort[];
  enrollments?: CoachingEnrollment[];
  _count?: { enrollments: number; sessions: number };
  creatorProfile?: { slug: string; user: { name: string; avatarUrl: string | null } };
}

export interface CoachingSession {
  id: string;
  programId: string;
  cohortId: string | null;
  enrollmentId: string | null;
  startsAt: string;
  endsAt: string;
  timezone: string;
  meetingUrl: string | null;
  status: CoachingSessionStatus;
  notes: string | null;
  recordingUrl: string | null;
  actionItems: unknown;
  cancelledAt: string | null;
  cancelReason: string | null;
  originalStartsAt: string | null;
  weekNumber: number | null;
  durationOverrideMinutes: number | null;
  program?: Pick<CoachingProgram, 'id' | 'title' | 'type' | 'format'>;
  enrollment?: CoachingEnrollment & { user: { id: string; name: string; avatarUrl: string | null } };
  attendees?: SessionAttendee[];
  _count?: { attendees: number };
}

export interface CoachingEnrollment {
  id: string;
  programId: string;
  userId: string;
  cohortId: string | null;
  format: CoachingFormat;
  status: CoachingEnrollmentStatus;
  sessionsIncluded: number | null;
  sessionsUsed: number;
  packageExpiresAt: string | null;
  paymentRef: string | null;
  enrolledAt: string;
  program?: CoachingProgram;
  cohort?: CoachingCohort | null;
  sessions?: CoachingSession[];
  submissions?: CoachingSubmission[];
  messages?: CoachingMessage[];
}

export interface SessionAttendee {
  id: string;
  sessionId: string;
  enrollmentId: string;
  userId: string;
  attended: boolean;
  user?: { id: string; name: string; avatarUrl: string | null };
}

export interface AvailableSlot {
  startsAt: string;
  endsAt: string;
}

// ── Public endpoints ──────────────────────────────────────────────────────────

export async function listProgramsBySlug(slug: string): Promise<CoachingProgram[]> {
  return apiFetch(`/coaching/by-slug/${slug}`);
}

export async function getProgramPublic(programId: string): Promise<CoachingProgram> {
  return apiFetch(`/coaching/programs/${programId}/public`);
}

export async function getAvailableSlots(programId: string, date: string): Promise<AvailableSlot[]> {
  return apiFetch(`/coaching/programs/${programId}/slots?date=${date}`);
}

export async function getAvailableMonth(
  programId: string,
  year: number,
  month: number,
): Promise<string[]> {
  return apiFetch(`/coaching/programs/${programId}/slots/month?year=${year}&month=${month}`);
}

export async function listPublicCohorts(programId: string): Promise<CoachingCohort[]> {
  return apiFetch(`/coaching/programs/${programId}/cohorts`);
}

// ── Creator endpoints ─────────────────────────────────────────────────────────

export async function listMyPrograms(): Promise<CoachingProgram[]> {
  return apiFetch('/coaching/programs/mine');
}

export async function getProgram(programId: string): Promise<CoachingProgram> {
  return apiFetch(`/coaching/programs/${programId}`);
}

export async function createProgram(data: {
  title: string;
  description?: string;
  type: CoachingType;
  format: CoachingFormat;
  sessionDurationMinutes?: number;
  totalSessions?: number;
  programWeeks?: number;
  maxParticipants?: number;
  price: number;
  currency?: string;
  meetingPlatform?: string;
  meetingUrlTemplate?: string;
  timezone?: string;
  bufferMinutes?: number;
  advanceBookingDays?: number;
  minNoticeHours?: number;
  isActive?: boolean;
  salesPageContent?: string;
  durationValue?: number;
  durationUnit?: string;
  customDurationText?: string;
  startDatePolicy?: string;
  fixedStartDate?: string;
}): Promise<CoachingProgram> {
  return apiFetch('/coaching/programs', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateProgram(
  id: string,
  data: Partial<Parameters<typeof createProgram>[0]>,
): Promise<CoachingProgram> {
  return apiFetch(`/coaching/programs/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteProgram(id: string): Promise<void> {
  return apiFetch(`/coaching/programs/${id}`, { method: 'DELETE' });
}

export async function setAvailability(
  programId: string,
  rules: { dayOfWeek: number; startTime: string; endTime: string }[],
): Promise<AvailabilityRule[]> {
  return apiFetch(`/coaching/programs/${programId}/availability`, {
    method: 'PUT',
    body: JSON.stringify({ rules }),
  });
}

export async function addBlackout(data: {
  programId?: string;
  startDate: string;
  endDate: string;
  reason?: string;
}): Promise<BlackoutPeriod> {
  return apiFetch('/coaching/blackouts', { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteBlackout(id: string): Promise<void> {
  return apiFetch(`/coaching/blackouts/${id}`, { method: 'DELETE' });
}

export async function createCohort(
  programId: string,
  data: {
    name: string;
    startDate: string;
    endDate?: string;
    maxParticipants?: number;
    enrollmentOpen?: boolean;
    enrollmentDeadline?: string;
  },
): Promise<CoachingCohort> {
  return apiFetch(`/coaching/programs/${programId}/cohorts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCohort(
  cohortId: string,
  data: Partial<Parameters<typeof createCohort>[1]>,
): Promise<CoachingCohort> {
  return apiFetch(`/coaching/cohorts/${cohortId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteCohort(cohortId: string): Promise<void> {
  return apiFetch(`/coaching/cohorts/${cohortId}`, { method: 'DELETE' });
}

export async function addGroupSession(
  cohortId: string,
  data: { startsAt: string; meetingUrl?: string; notes?: string },
): Promise<CoachingSession> {
  return apiFetch(`/coaching/cohorts/${cohortId}/sessions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSession(
  sessionId: string,
  data: { startsAt?: string; meetingUrl?: string; notes?: string; recordingUrl?: string },
): Promise<CoachingSession> {
  return apiFetch(`/coaching/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function cancelSession(sessionId: string, reason?: string): Promise<CoachingSession> {
  return apiFetch(`/coaching/sessions/${sessionId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function rescheduleSession(
  sessionId: string,
  newStartsAt: string,
): Promise<CoachingSession> {
  return apiFetch(`/coaching/sessions/${sessionId}/reschedule`, {
    method: 'POST',
    body: JSON.stringify({ newStartsAt }),
  });
}

export async function addSessionNotes(
  sessionId: string,
  data: { notes?: string; recordingUrl?: string; actionItems?: unknown[] },
): Promise<CoachingSession> {
  return apiFetch(`/coaching/sessions/${sessionId}/notes`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function markAttendance(
  sessionId: string,
  attendees: { userId: string; attended: boolean }[],
): Promise<{ updated: number }> {
  return apiFetch(`/coaching/sessions/${sessionId}/attendance`, {
    method: 'PATCH',
    body: JSON.stringify({ attendees }),
  });
}

export async function getEnrollmentsForProgram(programId: string): Promise<CoachingEnrollment[]> {
  return apiFetch(`/coaching/programs/${programId}/enrollments`);
}

export async function getCalendar(from: string, to: string): Promise<CoachingSession[]> {
  return apiFetch(`/coaching/calendar?from=${from}&to=${to}`);
}

export async function getUpcomingSessions(): Promise<CoachingSession[]> {
  return apiFetch('/coaching/upcoming');
}

// ── Member endpoints ──────────────────────────────────────────────────────────

export async function enrollInProgram(data: {
  programId: string;
  cohortId?: string;
}): Promise<CoachingEnrollment> {
  return apiFetch('/coaching/enroll', { method: 'POST', body: JSON.stringify(data) });
}

export async function getMyEnrollments(): Promise<CoachingEnrollment[]> {
  return apiFetch('/coaching/my-enrollments');
}

export async function getMemberProgramView(
  programId: string,
): Promise<{ program: CoachingProgram; enrollment: CoachingEnrollment | null }> {
  return apiFetch(`/coaching/programs/${programId}/member-view`);
}

export async function book1on1(
  enrollmentId: string,
  startsAt: string,
): Promise<CoachingSession> {
  return apiFetch(`/coaching/enrollments/${enrollmentId}/book`, {
    method: 'POST',
    body: JSON.stringify({ startsAt }),
  });
}

export async function registerForSession(sessionId: string): Promise<SessionAttendee> {
  return apiFetch(`/coaching/sessions/${sessionId}/register`, { method: 'POST' });
}

export async function cancelGroupRegistration(sessionId: string): Promise<void> {
  return apiFetch(`/coaching/sessions/${sessionId}/register`, { method: 'DELETE' });
}

// ── Submission endpoints ──────────────────────────────────────────────────────

export async function submitWork(
  enrollmentId: string,
  data: { weekNumber?: number; sessionId?: string; content?: string; fileUrl?: string },
): Promise<CoachingSubmission> {
  return apiFetch(`/coaching/enrollments/${enrollmentId}/submit`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function reviewWork(
  submissionId: string,
  feedback: string,
): Promise<CoachingSubmission> {
  return apiFetch(`/coaching/submissions/${submissionId}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ feedback }),
  });
}

export async function getMySubmissions(enrollmentId: string): Promise<CoachingSubmission[]> {
  return apiFetch(`/coaching/enrollments/${enrollmentId}/submissions`);
}

export async function getSubmissionsForProgram(programId: string): Promise<CoachingSubmission[]> {
  return apiFetch(`/coaching/programs/${programId}/submissions`);
}

export async function updateCurriculum(
  programId: string,
  curriculum: CurriculumWeek[],
): Promise<CoachingProgram> {
  return apiFetch(`/coaching/programs/${programId}`, {
    method: 'PATCH',
    body: JSON.stringify({ curriculum }),
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Human-readable duration string from program fields */
export function formatDuration(program: Pick<CoachingProgram, 'durationValue' | 'durationUnit' | 'customDurationText' | 'programWeeks'>): string {
  if (program.customDurationText) return program.customDurationText;
  if (program.durationValue && program.durationUnit) {
    const unit = program.durationUnit === 'days' ? 'day' : program.durationUnit === 'weeks' ? 'week' : 'month';
    return `${program.durationValue} ${unit}${program.durationValue !== 1 ? 's' : ''}`;
  }
  if (program.programWeeks) return `${program.programWeeks} week${program.programWeeks !== 1 ? 's' : ''}`;
  return '';
}

/** Human-readable start date policy */
export function formatStartDatePolicy(program: Pick<CoachingProgram, 'startDatePolicy' | 'fixedStartDate'>): string {
  if (program.startDatePolicy === 'IMMEDIATE') return 'Starts immediately';
  if (program.startDatePolicy === 'FIXED_DATE' && program.fixedStartDate) {
    return `Starts ${new Date(program.fixedStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
  return 'Start date discussed after enrollment';
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatSessionTime(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  return `${start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} – ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

export function formatCoachingPrice(cents: number, currency: string): string {
  if (cents === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

/** Label for the business model (CoachingFormat) */
export function formatLabel(format: CoachingFormat): string {
  const map: Record<CoachingFormat, string> = {
    SINGLE_SESSION: 'Single Session',
    FIXED_PACKAGE: 'Package',
    SUBSCRIPTION: 'Subscription',
    GROUP_COHORT: 'Group Cohort',
    GROUP_OPEN: 'Open Group',
  };
  return map[format] ?? format;
}

/** Label for interaction type (CoachingType) */
export function typeLabel(type: CoachingType): string {
  return type === 'ONE_ON_ONE' ? '1:1' : 'Group';
}

/** @deprecated Use explicit type from 3-step wizard instead */
export function typeFromFormat(format: CoachingFormat): CoachingType {
  return format === 'GROUP_COHORT' || format === 'GROUP_OPEN' ? 'GROUP' : 'ONE_ON_ONE';
}

// ── Enrollment view ──────────────────────────────────────────────────────────

export async function getEnrollmentView(enrollmentId: string): Promise<CoachingEnrollment> {
  return apiFetch(`/coaching/enrollments/${enrollmentId}`);
}

// ── Messaging endpoints ──────────────────────────────────────────────────────

export async function sendCoachingMessage(
  enrollmentId: string,
  body: string,
  fileUrl?: string,
): Promise<CoachingMessage> {
  return apiFetch(`/coaching/enrollments/${enrollmentId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body, ...(fileUrl && { fileUrl }) }),
  });
}

export async function getCoachingMessages(enrollmentId: string): Promise<CoachingMessage[]> {
  return apiFetch(`/coaching/enrollments/${enrollmentId}/messages`);
}

export async function markCoachingMessagesRead(enrollmentId: string): Promise<{ updated: number }> {
  return apiFetch(`/coaching/enrollments/${enrollmentId}/messages/read`, { method: 'PATCH' });
}
