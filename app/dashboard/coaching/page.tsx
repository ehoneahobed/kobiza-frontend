'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  listMyPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  setAvailability,
  createCohort,
  deleteCohort,
  addGroupSession,
  cancelSession,
  getEnrollmentsForProgram,
  getUpcomingSessions,
  updateCurriculum,
  getSubmissionsForProgram,
  reviewWork,
  getCoachingMessages,
  sendCoachingMessage,
  markCoachingMessagesRead,
  CoachingProgram,
  CoachingCohort,
  CoachingEnrollment,
  CoachingSession,
  CoachingSubmission,
  CoachingMessage,
  CoachingFormat,
  CoachingType,
  CurriculumWeek,
  DAY_NAMES,
  formatLabel,
  typeLabel,
  formatCoachingPrice,
  formatSessionTime,
} from '@/lib/coaching';
import { getMyProfile } from '@/lib/creator';

// ── 3-Step Wizard Data ──────────────────────────────────────────────────────

type Delivery = 'ONE_ON_ONE' | 'GROUP';

interface StructureCard {
  id: string;
  icon: string;
  name: string;
  tagline: string;
  format: CoachingFormat;
  type: CoachingType;
  hasCurriculum?: boolean;
}

const ONE_ON_ONE_STRUCTURES: StructureCard[] = [
  { id: 'dropin', icon: '\ud83c\udfaf', name: 'Drop-In', tagline: 'Single session, pay per call', format: 'SINGLE_SESSION', type: 'ONE_ON_ONE' },
  { id: 'package', icon: '\ud83d\udce6', name: 'Session Package', tagline: 'Buy N sessions upfront, book flexibly', format: 'FIXED_PACKAGE', type: 'ONE_ON_ONE' },
  { id: 'program', icon: '\ud83d\udccb', name: 'Structured Program', tagline: 'Week-by-week journey with curriculum & deliverables', format: 'FIXED_PACKAGE', type: 'ONE_ON_ONE', hasCurriculum: true },
  { id: 'retainer', icon: '\ud83d\udd04', name: 'Monthly Retainer', tagline: 'Ongoing monthly access', format: 'SUBSCRIPTION', type: 'ONE_ON_ONE' },
];

const GROUP_STRUCTURES: StructureCard[] = [
  { id: 'event', icon: '\ud83c\udfaa', name: 'Live Event', tagline: 'One group session, anyone can register', format: 'SINGLE_SESSION', type: 'GROUP' },
  { id: 'workshop', icon: '\ud83d\udcc5', name: 'Workshop Series', tagline: 'Fixed set of group sessions', format: 'FIXED_PACKAGE', type: 'GROUP' },
  { id: 'cohort', icon: '\ud83d\udc65', name: 'Cohort Program', tagline: 'Everyone starts together, structured curriculum', format: 'GROUP_COHORT', type: 'GROUP' },
  { id: 'mastermind', icon: '\ud83c\udf10', name: 'Open Mastermind', tagline: 'Ongoing group, join anytime', format: 'GROUP_OPEN', type: 'GROUP' },
];

// ── 3-Step Program Modal ─────────────────────────────────────────────────────

type WizardStep = 'delivery' | 'structure' | 'details';

const EMPTY_DETAILS = {
  title: '',
  description: '',
  salesPageContent: '',
  sessionDurationMinutes: '',
  totalSessions: '',
  programWeeks: '',
  maxParticipants: '',
  price: '0',
  currency: 'USD',
  meetingPlatform: '',
  meetingUrlTemplate: '',
  timezone: 'UTC',
  bufferMinutes: '15',
  advanceBookingDays: '14',
  minNoticeHours: '24',
  durationValue: '',
  durationUnit: 'weeks',
  customDurationText: '',
  startDatePolicy: 'TBD',
  fixedStartDate: '',
};

type DetailsForm = typeof EMPTY_DETAILS;

function ProgramModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: CoachingProgram;
  onSave: (type: CoachingType, format: CoachingFormat, details: DetailsForm, hasCurriculum?: boolean) => Promise<void>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<WizardStep>(initial ? 'details' : 'delivery');
  const [delivery, setDelivery] = useState<Delivery>(initial?.type ?? 'ONE_ON_ONE');
  const [selectedCard, setSelectedCard] = useState<StructureCard | null>(() => {
    if (!initial) return null;
    const cards = initial.type === 'GROUP' ? GROUP_STRUCTURES : ONE_ON_ONE_STRUCTURES;
    return cards.find((c) => c.format === initial.format) ?? cards[0];
  });
  const [details, setDetails] = useState<DetailsForm>(
    initial
      ? {
          title: initial.title,
          description: initial.description ?? '',
          salesPageContent: initial.salesPageContent ?? '',
          sessionDurationMinutes: initial.sessionDurationMinutes != null ? String(initial.sessionDurationMinutes) : '',
          totalSessions: initial.totalSessions ? String(initial.totalSessions) : '',
          programWeeks: initial.programWeeks ? String(initial.programWeeks) : '',
          maxParticipants: initial.maxParticipants ? String(initial.maxParticipants) : '',
          price: String(initial.price),
          currency: initial.currency,
          meetingPlatform: initial.meetingPlatform ?? '',
          meetingUrlTemplate: initial.meetingUrlTemplate ?? '',
          timezone: initial.timezone,
          bufferMinutes: String(initial.bufferMinutes),
          advanceBookingDays: String(initial.advanceBookingDays),
          minNoticeHours: String(initial.minNoticeHours),
          durationValue: initial.durationValue ? String(initial.durationValue) : '',
          durationUnit: initial.durationUnit ?? 'weeks',
          customDurationText: initial.customDurationText ?? '',
          startDatePolicy: initial.startDatePolicy ?? 'TBD',
          fixedStartDate: initial.fixedStartDate ? initial.fixedStartDate.slice(0, 10) : '',
        }
      : EMPTY_DETAILS,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const structures = delivery === 'ONE_ON_ONE' ? ONE_ON_ONE_STRUCTURES : GROUP_STRUCTURES;
  const is1on1 = delivery === 'ONE_ON_ONE';
  const isPackage = selectedCard?.format === 'FIXED_PACKAGE';
  const isGroup = delivery === 'GROUP';
  const needsTotalSessions = selectedCard?.format === 'FIXED_PACKAGE';
  const needsMaxParticipants = isGroup;

  const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500';
  const sel = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500';
  const lbl = 'block text-sm font-medium text-gray-700 mb-1';

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCard) return;
    setSaving(true);
    setError('');
    try {
      await onSave(selectedCard.type, selectedCard.format, details, selectedCard.hasCurriculum);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  const stepIndex = step === 'delivery' ? 0 : step === 'structure' ? 1 : 2;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {initial ? 'Edit Program' : 'New Coaching Program'}
            </h3>
            {!initial && (
              <div className="flex gap-1 mt-2">
                {['delivery', 'structure', 'details'].map((s, i) => (
                  <div
                    key={s}
                    className={`h-1 rounded-full flex-1 transition-colors ${
                      i <= stepIndex ? 'bg-teal-600' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
        </div>

        {/* Step 1: Delivery */}
        {step === 'delivery' && (
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-5">How will you deliver your coaching?</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {([
                { key: 'ONE_ON_ONE' as Delivery, icon: '\ud83d\udc64', name: '1-on-1', desc: 'Private sessions with each client' },
                { key: 'GROUP' as Delivery, icon: '\ud83d\udc65', name: 'Group', desc: 'Multiple people per session' },
              ]).map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => { setDelivery(d.key); setSelectedCard(null); }}
                  className={`text-left p-6 rounded-xl border-2 transition-all ${
                    delivery === d.key
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-3xl block mb-2">{d.icon}</span>
                  <p className="font-bold text-gray-900 mb-0.5">{d.name}</p>
                  <p className="text-xs text-gray-500">{d.desc}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep('structure')}
              className="w-full bg-teal-600 text-white font-semibold py-3 rounded-xl hover:bg-teal-700 transition-colors"
            >
              Continue &rarr;
            </button>
          </div>
        )}

        {/* Step 2: Structure */}
        {step === 'structure' && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <button type="button" onClick={() => setStep('delivery')} className="text-xs text-teal-600 hover:underline">&larr; Back</button>
              <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                {is1on1 ? '\ud83d\udc64 1-on-1' : '\ud83d\udc65 Group'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-5">Choose a structure for your program.</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {structures.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setSelectedCard(card)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    selectedCard?.id === card.id
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl block mb-1">{card.icon}</span>
                  <p className="font-semibold text-gray-900 text-sm">{card.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{card.tagline}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => selectedCard && setStep('details')}
              disabled={!selectedCard}
              className="w-full bg-teal-600 text-white font-semibold py-3 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              Continue &rarr;
            </button>
          </div>
        )}

        {/* Step 3: Details */}
        {step === 'details' && (
          <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {!initial && selectedCard && (
              <div className="flex items-center gap-2 mb-1">
                <button type="button" onClick={() => setStep('structure')} className="text-xs text-teal-600 hover:underline">&larr; Back</button>
                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                  {selectedCard.icon} {selectedCard.name}
                </span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
            )}

            {/* Always shown: Title */}
            <div>
              <label className={lbl}>Program Title *</label>
              <input
                className={inp}
                value={details.title}
                onChange={(e) => setDetails((d) => ({ ...d, title: e.target.value }))}
                required
                placeholder="e.g. 6-Week Career Transformation"
              />
            </div>

            {/* Always shown: Description (short summary) */}
            <div>
              <label className={lbl}>Description</label>
              <textarea
                className={inp}
                rows={2}
                value={details.description}
                onChange={(e) => setDetails((d) => ({ ...d, description: e.target.value }))}
                placeholder="Short summary shown in listings"
              />
            </div>

            {/* Always shown: Sales Page Content */}
            <div>
              <label className={lbl}>Sales Page Content</label>
              <textarea
                className={inp}
                rows={4}
                value={details.salesPageContent}
                onChange={(e) => setDetails((d) => ({ ...d, salesPageContent: e.target.value }))}
                placeholder="Detailed description shown on the public sales page. Supports markdown."
              />
              <p className="text-xs text-gray-400 mt-1">This is what potential clients see before enrolling.</p>
            </div>

            {/* Always shown: Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Price (cents) *</label>
                <input
                  type="number"
                  className={inp}
                  value={details.price}
                  onChange={(e) => setDetails((d) => ({ ...d, price: e.target.value }))}
                  min="0"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  {formatCoachingPrice(parseInt(details.price) || 0, details.currency)}
                  {selectedCard?.format === 'SUBSCRIPTION' ? ' / month' : ''}
                </p>
              </div>
              <div>
                <label className={lbl}>Currency</label>
                <select
                  className={sel}
                  value={details.currency}
                  onChange={(e) => setDetails((d) => ({ ...d, currency: e.target.value }))}
                >
                  {['USD', 'NGN', 'GHS', 'KES', 'EUR', 'GBP'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── SINGLE_SESSION: Session Duration required ── */}
            {selectedCard?.format === 'SINGLE_SESSION' && (
              <>
                <div>
                  <label className={lbl}>Session Duration (min) *</label>
                  <input
                    type="number"
                    className={inp}
                    value={details.sessionDurationMinutes}
                    onChange={(e) => setDetails((d) => ({ ...d, sessionDurationMinutes: e.target.value }))}
                    min="15"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                  Availability is configured after creation.
                </p>
              </>
            )}

            {/* ── FIXED_PACKAGE: Duration, start date, optional session fields ── */}
            {selectedCard?.format === 'FIXED_PACKAGE' && (
              <>
                {/* Duration: value + unit OR custom text */}
                <div>
                  <label className={lbl}>Program Duration</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      className={inp}
                      value={details.durationValue}
                      onChange={(e) => setDetails((d) => ({ ...d, durationValue: e.target.value }))}
                      placeholder="e.g. 8"
                      min="1"
                    />
                    <select
                      className={sel}
                      value={details.durationUnit}
                      onChange={(e) => setDetails((d) => ({ ...d, durationUnit: e.target.value }))}
                    >
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                    </select>
                    <input
                      className={inp}
                      value={details.customDurationText}
                      onChange={(e) => setDetails((d) => ({ ...d, customDurationText: e.target.value }))}
                      placeholder="or custom text"
                    />
                  </div>
                </div>

                {/* Start Date Policy */}
                <div>
                  <label className={lbl}>Start Date</label>
                  <div className="flex gap-3">
                    {([
                      { value: 'IMMEDIATE', label: 'Immediate' },
                      { value: 'FIXED_DATE', label: 'Fixed Date' },
                      { value: 'TBD', label: 'TBD' },
                    ] as const).map((opt) => (
                      <label key={opt.value} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="startDatePolicy"
                          value={opt.value}
                          checked={details.startDatePolicy === opt.value}
                          onChange={() => setDetails((d) => ({ ...d, startDatePolicy: opt.value }))}
                          className="accent-teal-600"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  {details.startDatePolicy === 'FIXED_DATE' && (
                    <input
                      type="date"
                      className={`${inp} mt-2`}
                      value={details.fixedStartDate}
                      onChange={(e) => setDetails((d) => ({ ...d, fixedStartDate: e.target.value }))}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Session Duration (min)</label>
                    <input
                      type="number"
                      className={inp}
                      value={details.sessionDurationMinutes}
                      onChange={(e) => setDetails((d) => ({ ...d, sessionDurationMinutes: e.target.value }))}
                      min="15"
                      placeholder="Can be set later"
                    />
                  </div>
                  <div>
                    <label className={lbl}>Total Sessions</label>
                    <input
                      type="number"
                      className={inp}
                      value={details.totalSessions}
                      onChange={(e) => setDetails((d) => ({ ...d, totalSessions: e.target.value }))}
                      placeholder="Can be set later"
                      min="1"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                  Sessions and curriculum are configured after creation.
                </p>
              </>
            )}

            {/* ── SUBSCRIPTION: Minimal setup ── */}
            {selectedCard?.format === 'SUBSCRIPTION' && (
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                Sessions booked as needed after enrollment. Availability configured after creation.
              </p>
            )}

            {/* ── GROUP_COHORT: Duration + max participants ── */}
            {selectedCard?.format === 'GROUP_COHORT' && (
              <>
                <div>
                  <label className={lbl}>Program Duration</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      className={inp}
                      value={details.durationValue}
                      onChange={(e) => setDetails((d) => ({ ...d, durationValue: e.target.value }))}
                      placeholder="e.g. 8"
                      min="1"
                    />
                    <select
                      className={sel}
                      value={details.durationUnit}
                      onChange={(e) => setDetails((d) => ({ ...d, durationUnit: e.target.value }))}
                    >
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={lbl}>Max Participants</label>
                  <input
                    type="number"
                    className={inp}
                    value={details.maxParticipants}
                    onChange={(e) => setDetails((d) => ({ ...d, maxParticipants: e.target.value }))}
                    placeholder="unlimited"
                    min="1"
                  />
                </div>
                <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                  Cohorts created after program setup.
                </p>
              </>
            )}

            {/* ── GROUP_OPEN: Max participants only ── */}
            {selectedCard?.format === 'GROUP_OPEN' && (
              <>
                <div>
                  <label className={lbl}>Max Participants</label>
                  <input
                    type="number"
                    className={inp}
                    value={details.maxParticipants}
                    onChange={(e) => setDetails((d) => ({ ...d, maxParticipants: e.target.value }))}
                    placeholder="unlimited"
                    min="1"
                  />
                </div>
                <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                  Ongoing group — sessions added as you go.
                </p>
              </>
            )}

            {/* Advanced settings (collapsed) */}
            <details className="border border-gray-200 rounded-xl overflow-hidden">
              <summary className="px-4 py-3 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-50 list-none flex items-center justify-between">
                <span>Advanced settings</span>
                <span className="text-gray-400">&dtri;</span>
              </summary>
              <div className="px-4 pb-4 pt-2 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Timezone</label>
                    <input className={inp} value={details.timezone} onChange={(e) => setDetails((d) => ({ ...d, timezone: e.target.value }))} placeholder="Africa/Lagos" />
                  </div>
                  <div>
                    <label className={lbl}>Meeting Platform</label>
                    <input className={inp} value={details.meetingPlatform} onChange={(e) => setDetails((d) => ({ ...d, meetingPlatform: e.target.value }))} placeholder="Zoom, Google Meet..." />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Meeting URL</label>
                  <input className={inp} value={details.meetingUrlTemplate} onChange={(e) => setDetails((d) => ({ ...d, meetingUrlTemplate: e.target.value }))} placeholder="https://meet.google.com/..." />
                </div>
                {is1on1 && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={lbl}>Buffer (min)</label>
                      <input type="number" className={inp} value={details.bufferMinutes} onChange={(e) => setDetails((d) => ({ ...d, bufferMinutes: e.target.value }))} min="0" />
                    </div>
                    <div>
                      <label className={lbl}>Advance days</label>
                      <input type="number" className={inp} value={details.advanceBookingDays} onChange={(e) => setDetails((d) => ({ ...d, advanceBookingDays: e.target.value }))} min="1" />
                    </div>
                    <div>
                      <label className={lbl}>Min notice (h)</label>
                      <input type="number" className={inp} value={details.minNoticeHours} onChange={(e) => setDetails((d) => ({ ...d, minNoticeHours: e.target.value }))} min="0" />
                    </div>
                  </div>
                )}
              </div>
            </details>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-teal-600 text-white font-semibold py-3 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : initial ? 'Update Program' : 'Create Program'}
              </button>
              {!initial && (
                <button
                  type="button"
                  onClick={() => setStep('structure')}
                  className="px-5 py-3 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Availability Panel ────────────────────────────────────────────────────────

type RuleRow = { dayOfWeek: number; startTime: string; endTime: string; enabled: boolean };

function AvailabilityPanel({ program, slug }: { program: CoachingProgram; slug: string }) {
  const [rows, setRows] = useState<RuleRow[]>(() =>
    DAY_NAMES.map((_, i) => {
      const rule = program.availabilityRules?.find((r) => r.dayOfWeek === i);
      return { dayOfWeek: i, startTime: rule?.startTime ?? '09:00', endTime: rule?.endTime ?? '17:00', enabled: !!rule };
    }),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const rules = rows.filter((r) => r.enabled).map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime }));
    await setAvailability(program.id, rules);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Set your weekly availability in <strong>{program.timezone}</strong> timezone. Clients will only see slots that meet your minimum notice and advance booking rules.
      </p>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={row.enabled}
              onChange={(e) => setRows((prev) => prev.map((r, j) => (j === i ? { ...r, enabled: e.target.checked } : r)))}
              className="w-4 h-4 accent-teal-600"
            />
            <span className="w-10 text-sm font-medium text-gray-700">{DAY_NAMES[row.dayOfWeek]}</span>
            <input type="time" value={row.startTime} onChange={(e) => setRows((prev) => prev.map((r, j) => (j === i ? { ...r, startTime: e.target.value } : r)))} disabled={!row.enabled} className="px-2 py-1 border border-gray-200 rounded text-sm disabled:opacity-40" />
            <span className="text-gray-400 text-sm">&ndash;</span>
            <input type="time" value={row.endTime} onChange={(e) => setRows((prev) => prev.map((r, j) => (j === i ? { ...r, endTime: e.target.value } : r)))} disabled={!row.enabled} className="px-2 py-1 border border-gray-200 rounded text-sm disabled:opacity-40" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="bg-teal-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors">
          {saving ? 'Saving...' : 'Save Availability'}
        </button>
        {saved && <span className="text-sm text-teal-600 font-medium">Saved!</span>}
      </div>
      <p className="text-xs text-gray-400">
        Public booking link:{' '}
        <a href={`${typeof window !== 'undefined' ? window.location.origin : ''}/${slug}/coaching/${program.id}`} target="_blank" rel="noreferrer" className="text-teal-600 underline">
          /{slug}/coaching/{program.id}
        </a>
      </p>
    </div>
  );
}

// ── Curriculum Panel ──────────────────────────────────────────────────────────

function CurriculumPanel({ program, onUpdate }: { program: CoachingProgram; onUpdate: (p: CoachingProgram) => void }) {
  const weekCount = program.totalSessions ?? program.programWeeks ?? 6;
  const [weeks, setWeeks] = useState<CurriculumWeek[]>(() => {
    if (program.curriculum && program.curriculum.length > 0) return program.curriculum;
    return Array.from({ length: weekCount }, (_, i) => ({
      week: i + 1,
      title: '',
      description: '',
      sessionDurationMinutes: undefined,
      deliverablePrompt: '',
      resources: '',
    }));
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const cleaned = weeks.map((w) => ({
      ...w,
      sessionDurationMinutes: w.sessionDurationMinutes || undefined,
      deliverablePrompt: w.deliverablePrompt || undefined,
      resources: w.resources || undefined,
    }));
    const updated = await updateCurriculum(program.id, cleaned);
    onUpdate(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function update(i: number, key: keyof CurriculumWeek, value: string | number | undefined) {
    setWeeks((prev) => prev.map((w, j) => (j === i ? { ...w, [key]: value } : w)));
  }

  const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500';

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
        <strong>How this works:</strong> Define what happens in each week of your program. You can set a different session duration for specific weeks (e.g., Week 1 = 90 min for a deep-dive audit, other weeks = 60 min). Clients will see this curriculum when they enroll.
      </div>

      {weeks.map((week, i) => (
        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 bg-teal-600 text-white rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">
                {week.week}
              </span>
              <input
                className="bg-transparent font-semibold text-sm text-gray-900 border-0 focus:outline-none focus:ring-0 placeholder-gray-400 flex-1"
                placeholder={`Week ${week.week} title...`}
                value={week.title}
                onChange={(e) => update(i, 'title', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="hidden sm:block">Duration:</span>
              <input
                type="number"
                className="w-16 px-2 py-1 border border-gray-200 rounded text-xs text-center"
                placeholder={String(program.sessionDurationMinutes)}
                value={week.sessionDurationMinutes ?? ''}
                onChange={(e) =>
                  update(i, 'sessionDurationMinutes', e.target.value ? parseInt(e.target.value) : undefined)
                }
                min="15"
              />
              <span>min</span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <textarea
              className={inp}
              rows={2}
              placeholder="What will the client learn / work on this week?"
              value={week.description ?? ''}
              onChange={(e) => update(i, 'description', e.target.value)}
            />
            <input
              className={inp}
              placeholder="Deliverable prompt (e.g. 'Submit your brand audit document')"
              value={week.deliverablePrompt ?? ''}
              onChange={(e) => update(i, 'deliverablePrompt', e.target.value)}
            />
            <input
              className={inp}
              placeholder="Resources (optional links or reading)"
              value={week.resources ?? ''}
              onChange={(e) => update(i, 'resources', e.target.value)}
            />
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="bg-teal-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors">
          {saving ? 'Saving...' : 'Save Curriculum'}
        </button>
        {saved && <span className="text-sm text-teal-600 font-medium">Saved!</span>}
      </div>
    </div>
  );
}

// ── Cohorts Panel ─────────────────────────────────────────────────────────────

function CohortsPanel({ program }: { program: CoachingProgram }) {
  const [cohorts, setCohorts] = useState<CoachingCohort[]>(program.cohorts ?? []);
  const [showForm, setShowForm] = useState(false);
  const [newCohort, setNewCohort] = useState({ name: '', startDate: '', endDate: '' });
  const [newSession, setNewSession] = useState<Record<string, string>>({});
  const [cohortSessions, setCohortSessions] = useState<Record<string, CoachingSession[]>>({});
  const [saving, setSaving] = useState(false);

  const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500';

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const cohort = await createCohort(program.id, { name: newCohort.name, startDate: newCohort.startDate, endDate: newCohort.endDate || undefined });
    setCohorts((prev) => [...prev, cohort]);
    setShowForm(false);
    setNewCohort({ name: '', startDate: '', endDate: '' });
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete cohort?')) return;
    await deleteCohort(id);
    setCohorts((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleAddSession(cohortId: string) {
    const startsAt = newSession[cohortId];
    if (!startsAt) return;
    const session = await addGroupSession(cohortId, { startsAt });
    setCohortSessions((prev) => ({ ...prev, [cohortId]: [...(prev[cohortId] ?? []), session] }));
    setNewSession((prev) => ({ ...prev, [cohortId]: '' }));
  }

  async function handleCancelSession(cohortId: string, sessionId: string) {
    if (!confirm('Cancel session?')) return;
    await cancelSession(sessionId);
    setCohortSessions((prev) => ({ ...prev, [cohortId]: (prev[cohortId] ?? []).filter((s) => s.id !== sessionId) }));
  }

  return (
    <div className="space-y-4">
      {cohorts.length === 0 && <p className="text-sm text-gray-500">No cohorts yet. Create one to schedule group sessions.</p>}

      {cohorts.map((cohort) => (
        <div key={cohort.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-sm">{cohort.name}</p>
              <p className="text-xs text-gray-400">{new Date(cohort.startDate).toLocaleDateString()}{cohort.endDate ? ` \u2013 ${new Date(cohort.endDate).toLocaleDateString()}` : ''}</p>
            </div>
            <button onClick={() => handleDelete(cohort.id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
          </div>
          <div className="space-y-1.5">
            {(cohortSessions[cohort.id] ?? cohort.sessions ?? []).map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-600">{formatSessionTime(s.startsAt, s.endsAt)}</span>
                <button onClick={() => handleCancelSession(cohort.id, s.id)} className="text-red-400 text-xs">Cancel</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="datetime-local" className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs" value={newSession[cohort.id] ?? ''} onChange={(e) => setNewSession((prev) => ({ ...prev, [cohort.id]: e.target.value }))} />
            <button onClick={() => handleAddSession(cohort.id)} className="px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700">+ Session</button>
          </div>
        </div>
      ))}

      {showForm ? (
        <form onSubmit={handleCreate} className="border border-teal-200 rounded-xl p-4 space-y-3 bg-teal-50">
          <p className="text-sm font-semibold text-teal-800">New Cohort</p>
          <input className={inp} placeholder="Cohort name (e.g. January 2026)" value={newCohort.name} onChange={(e) => setNewCohort((f) => ({ ...f, name: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Start Date *</label>
              <input type="date" className={inp} value={newCohort.startDate} onChange={(e) => setNewCohort((f) => ({ ...f, startDate: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">End Date</label>
              <input type="date" className={inp} value={newCohort.endDate} onChange={(e) => setNewCohort((f) => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50">{saving ? 'Creating...' : 'Create'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)} className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-teal-400 hover:text-teal-600 transition-colors">+ New Cohort</button>
      )}
    </div>
  );
}

// ── Client Detail Panel ─────────────────────────────────────────────────────

function ClientDetailPanel({
  enrollment,
  program,
  onClose,
}: {
  enrollment: CoachingEnrollment;
  program: CoachingProgram;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'progress' | 'messages'>('progress');
  const [messages, setMessages] = useState<CoachingMessage[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const [submissions, setSubmissions] = useState<CoachingSubmission[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const user = (enrollment as any).user;

  useEffect(() => {
    getSubmissionsForProgram(program.id)
      .then((subs) => setSubmissions(subs.filter((s) => s.userId === enrollment.userId)))
      .catch(() => {});
  }, [program.id, enrollment.userId]);

  useEffect(() => {
    if (tab === 'messages') {
      setLoadingMessages(true);
      getCoachingMessages(enrollment.id)
        .then(setMessages)
        .catch(() => {})
        .finally(() => setLoadingMessages(false));
      markCoachingMessagesRead(enrollment.id).catch(() => {});
    }
  }, [tab, enrollment.id]);

  useEffect(() => {
    if (tab === 'messages') bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, tab]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!msgInput.trim() || sending) return;
    setSending(true);
    try {
      const msg = await sendCoachingMessage(enrollment.id, msgInput.trim());
      setMessages((prev) => [...prev, msg]);
      setMsgInput('');
    } catch { /* silent */ }
    finally { setSending(false); }
  }

  async function handleReview(submissionId: string) {
    if (!feedbackText.trim()) return;
    setSubmittingFeedback(true);
    const updated = await reviewWork(submissionId, feedbackText.trim());
    setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? updated : s)));
    setFeedbackId(null);
    setFeedbackText('');
    setSubmittingFeedback(false);
  }

  const curriculum = (program.curriculum as CurriculumWeek[] | null) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-sm font-bold">
              {user?.name?.[0] ?? '?'}
            </div>
            <div>
              <p className="font-bold text-gray-900">{user?.name ?? 'Client'}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
              <div className="flex gap-2 mt-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${enrollment.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{enrollment.status}</span>
                {enrollment.sessionsIncluded != null && (
                  <span className="text-xs text-gray-400">{enrollment.sessionsUsed}/{enrollment.sessionsIncluded} sessions</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-3">
          {(['progress', 'messages'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`text-sm py-3 px-3 border-b-2 capitalize transition-colors ${tab === t ? 'border-teal-600 text-teal-700 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'progress' && (
            <div className="p-5 space-y-4">
              {curriculum.length > 0 ? (
                curriculum.map((week) => {
                  const weekSubs = submissions.filter((s) => s.weekNumber === week.week);
                  return (
                    <div key={week.week} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 bg-teal-600 text-white rounded-full text-xs font-bold flex items-center justify-center">{week.week}</span>
                        <p className="text-sm font-semibold text-gray-900">{week.title || `Week ${week.week}`}</p>
                      </div>

                      {weekSubs.length > 0 ? (
                        weekSubs.map((sub) => (
                          <div key={sub.id} className={`mt-2 border rounded-lg p-3 ${sub.feedbackAt ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
                            <p className="text-sm text-gray-700">{sub.content}</p>
                            <p className="text-xs text-gray-400 mt-1">Submitted {new Date(sub.submittedAt).toLocaleDateString()}</p>
                            {sub.feedback && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-xs font-medium text-teal-700">Your feedback:</p>
                                <p className="text-sm text-gray-700">{sub.feedback}</p>
                              </div>
                            )}
                            {feedbackId === sub.id ? (
                              <div className="mt-2 space-y-2">
                                <textarea
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  rows={2}
                                  value={feedbackText}
                                  onChange={(e) => setFeedbackText(e.target.value)}
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <button onClick={() => handleReview(sub.id)} disabled={submittingFeedback || !feedbackText.trim()} className="px-3 py-1.5 bg-teal-600 text-white text-xs rounded-lg hover:bg-teal-700 disabled:opacity-50">{submittingFeedback ? 'Sending...' : 'Send'}</button>
                                  <button onClick={() => { setFeedbackId(null); setFeedbackText(''); }} className="px-3 py-1.5 border border-gray-200 text-xs rounded-lg">Cancel</button>
                                </div>
                              </div>
                            ) : !sub.feedbackAt ? (
                              <button onClick={() => { setFeedbackId(sub.id); setFeedbackText(''); }} className="mt-2 text-xs text-teal-600 hover:underline font-medium">+ Give feedback</button>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 mt-1">No submission yet</p>
                      )}
                    </div>
                  );
                })
              ) : submissions.length > 0 ? (
                submissions.map((sub) => (
                  <div key={sub.id} className={`border rounded-xl p-4 ${sub.feedbackAt ? 'border-gray-200' : 'border-amber-200 bg-amber-50'}`}>
                    <p className="text-sm text-gray-700">{sub.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{sub.weekNumber ? `Week ${sub.weekNumber} \u00B7 ` : ''}{new Date(sub.submittedAt).toLocaleDateString()}</p>
                    {sub.feedback && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs font-medium text-teal-700">Your feedback:</p>
                        <p className="text-sm text-gray-700">{sub.feedback}</p>
                      </div>
                    )}
                    {!sub.feedbackAt && (
                      <button onClick={() => { setFeedbackId(sub.id); setFeedbackText(''); }} className="mt-2 text-xs text-teal-600 hover:underline font-medium">+ Give feedback</button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No progress data yet</p>
              )}
            </div>
          )}

          {tab === 'messages' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {loadingMessages && <p className="text-sm text-gray-400 text-center">Loading...</p>}
                {!loadingMessages && messages.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-8">No messages yet. Start a conversation.</p>
                )}
                {messages.map((msg) => {
                  const isCreator = msg.senderId !== enrollment.userId;
                  return (
                    <div key={msg.id} className={`flex ${isCreator ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[75%]">
                        {!isCreator && msg.sender && (
                          <p className="text-xs text-gray-400 mb-1 ml-1">{msg.sender.name}</p>
                        )}
                        <div className={`rounded-2xl px-4 py-2.5 text-sm ${isCreator ? 'bg-teal-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-900 rounded-bl-md'}`}>
                          <p className="whitespace-pre-wrap">{msg.body}</p>
                        </div>
                        <p className={`text-xs text-gray-400 mt-1 ${isCreator ? 'text-right mr-1' : 'ml-1'}`}>
                          {new Date(msg.sentAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 flex gap-3">
                <input
                  type="text"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Type a message..."
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                />
                <button type="submit" disabled={!msgInput.trim() || sending} className="bg-teal-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-700 disabled:opacity-50">
                  {sending ? '...' : 'Send'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Enrollments Panel ─────────────────────────────────────────────────────────

function EnrollmentsPanel({ program }: { program: CoachingProgram }) {
  const [enrollments, setEnrollments] = useState<CoachingEnrollment[]>([]);
  const [submissions, setSubmissions] = useState<CoachingSubmission[]>([]);
  const [tab, setTab] = useState<'clients' | 'submissions'>('clients');
  const [loading, setLoading] = useState(true);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [selectedClient, setSelectedClient] = useState<CoachingEnrollment | null>(null);

  useEffect(() => {
    Promise.all([getEnrollmentsForProgram(program.id), getSubmissionsForProgram(program.id)])
      .then(([e, s]) => { setEnrollments(e); setSubmissions(s); })
      .finally(() => setLoading(false));
  }, [program.id]);

  async function handleReview(submissionId: string) {
    if (!feedbackText.trim()) return;
    setSubmittingFeedback(true);
    const updated = await reviewWork(submissionId, feedbackText.trim());
    setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? updated : s)));
    setFeedbackId(null);
    setFeedbackText('');
    setSubmittingFeedback(false);
  }

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>;

  return (
    <div className="space-y-4">
      {selectedClient && (
        <ClientDetailPanel
          enrollment={selectedClient}
          program={program}
          onClose={() => setSelectedClient(null)}
        />
      )}

      <div className="flex gap-2 border-b border-gray-100 pb-0">
        {(['clients', 'submissions'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`text-xs px-3 py-2 border-b-2 -mb-px font-medium transition-colors capitalize ${tab === t ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {t} {t === 'submissions' ? `(${submissions.filter((s) => !s.feedbackAt).length} pending)` : `(${enrollments.length})`}
          </button>
        ))}
      </div>

      {tab === 'clients' && (
        <>
          {enrollments.length === 0 ? (
            <p className="text-sm text-gray-500">No enrollments yet.</p>
          ) : (
            enrollments.map((e) => {
              const user = e as any;
              return (
                <button
                  key={e.id}
                  onClick={() => setSelectedClient(e)}
                  className="w-full flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold">
                      {user.user?.name?.[0] ?? '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.user?.name ?? '\u2014'}</p>
                      <p className="text-xs text-gray-400">{user.user?.email}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-xs text-gray-500">
                        {e.sessionsIncluded != null ? `${e.sessionsUsed}/${e.sessionsIncluded} sessions` : 'Unlimited'}
                      </p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${e.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{e.status}</span>
                    </div>
                    <span className="text-gray-300">&rsaquo;</span>
                  </div>
                </button>
              );
            })
          )}
        </>
      )}

      {tab === 'submissions' && (
        <>
          {submissions.length === 0 ? (
            <p className="text-sm text-gray-500">No submissions yet.</p>
          ) : (
            submissions.map((s) => (
              <div key={s.id} className={`border rounded-xl p-4 space-y-2 ${!s.feedbackAt ? 'border-amber-200 bg-amber-50' : 'border-gray-200'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {s.user?.name ?? '\u2014'}{s.weekNumber ? ` \u2014 Week ${s.weekNumber}` : ''}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(s.submittedAt).toLocaleDateString()}</p>
                  </div>
                  {!s.feedbackAt ? (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Needs review</span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Reviewed</span>
                  )}
                </div>

                {s.content && (
                  <div className="bg-white border border-gray-100 rounded-lg p-3 text-sm text-gray-700">{s.content}</div>
                )}
                {s.fileUrl && (
                  <a href={s.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-teal-600 hover:underline">View attachment</a>
                )}

                {s.feedback && (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-xs text-teal-800">
                    <span className="font-medium">Your feedback:</span> {s.feedback}
                  </div>
                )}

                {feedbackId === s.id ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      rows={3}
                      placeholder="Write your feedback..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleReview(s.id)} disabled={submittingFeedback || !feedbackText.trim()} className="px-4 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50">{submittingFeedback ? 'Sending...' : 'Send Feedback'}</button>
                      <button onClick={() => { setFeedbackId(null); setFeedbackText(''); }} className="px-4 py-1.5 border border-gray-200 text-xs rounded-lg hover:bg-gray-50">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setFeedbackId(s.id); setFeedbackText(s.feedback ?? ''); }}
                    className="text-xs text-teal-600 hover:underline font-medium"
                  >
                    {s.feedback ? 'Edit feedback' : '+ Give feedback'}
                  </button>
                )}
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}

// ── Program Drawer ────────────────────────────────────────────────────────────

type ProgramTab = 'overview' | 'availability' | 'curriculum' | 'cohorts' | 'enrollments';

function ProgramDrawer({ program, slug, onClose, onUpdate }: { program: CoachingProgram; slug: string; onClose: () => void; onUpdate: (p: CoachingProgram) => void }) {
  const [tab, setTab] = useState<ProgramTab>('overview');
  const [editing, setEditing] = useState(false);
  const is1on1 = program.type === 'ONE_ON_ONE';
  const isPackage = program.format === 'FIXED_PACKAGE';
  const isGroup = !is1on1;

  const tabs: { key: ProgramTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'availability', label: 'Availability' },
    ...(isPackage ? [{ key: 'curriculum' as ProgramTab, label: 'Curriculum' }] : []),
    ...(isGroup ? [{ key: 'cohorts' as ProgramTab, label: 'Cohorts' }] : []),
    { key: 'enrollments', label: 'Enrollments' },
  ];

  return (
    <>
      {editing && (
        <ProgramModal
          initial={program}
          onSave={async (type, format, details) => {
            const updated = await updateProgram(program.id, {
              title: details.title,
              description: details.description || undefined,
              type,
              format,
              ...(details.sessionDurationMinutes ? { sessionDurationMinutes: parseInt(details.sessionDurationMinutes) } : {}),
              totalSessions: details.totalSessions ? parseInt(details.totalSessions) : undefined,
              programWeeks: details.programWeeks ? parseInt(details.programWeeks) : undefined,
              maxParticipants: details.maxParticipants ? parseInt(details.maxParticipants) : undefined,
              price: parseInt(details.price),
              currency: details.currency,
              meetingPlatform: details.meetingPlatform || undefined,
              meetingUrlTemplate: details.meetingUrlTemplate || undefined,
              timezone: details.timezone,
              bufferMinutes: parseInt(details.bufferMinutes),
              advanceBookingDays: parseInt(details.advanceBookingDays),
              minNoticeHours: parseInt(details.minNoticeHours),
              salesPageContent: details.salesPageContent || undefined,
              durationValue: details.durationValue ? parseInt(details.durationValue) : undefined,
              durationUnit: details.durationUnit || undefined,
              customDurationText: details.customDurationText || undefined,
              startDatePolicy: details.startDatePolicy || 'TBD',
              fixedStartDate: details.fixedStartDate || undefined,
            });
            onUpdate(updated);
          }}
          onClose={() => setEditing(false)}
        />
      )}

      <div className="fixed inset-0 z-40 flex justify-end">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="relative bg-white w-full max-w-lg h-full flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                  {formatLabel(program.format)}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                  {typeLabel(program.type)}
                </span>
                {!program.isActive && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Inactive</span>}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{program.title}</h3>
              <p className="text-sm text-gray-500">
                {program.sessionDurationMinutes ? `${program.sessionDurationMinutes} min` : 'Duration TBD'} &middot; {formatCoachingPrice(program.price, program.currency)}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(true)} className="text-xs text-teal-600 border border-teal-200 rounded-lg px-3 py-1.5 hover:bg-teal-50">Edit</button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-3 overflow-x-auto">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`text-sm py-3 px-3 mr-1 border-b-2 whitespace-nowrap transition-colors ${tab === t.key ? 'border-teal-600 text-teal-700 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {tab === 'overview' && (
              <div className="space-y-4">
                {program.description && <p className="text-sm text-gray-600">{program.description}</p>}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Duration', value: program.sessionDurationMinutes ? `${program.sessionDurationMinutes} min` : 'TBD' },
                    { label: 'Price', value: formatCoachingPrice(program.price, program.currency) },
                    { label: 'Enrollments', value: program._count?.enrollments ?? 0 },
                    { label: 'Sessions', value: program._count?.sessions ?? 0 },
                    ...(program.programWeeks ? [{ label: 'Program Length', value: `${program.programWeeks} weeks` }] : []),
                    ...(program.totalSessions ? [{ label: 'Total sessions', value: program.totalSessions }] : []),
                  ].map((item) => (
                    <div key={item.label + String(item.value)} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-gray-400 text-xs">{item.label}</p>
                      <p className="font-medium">{item.value}</p>
                    </div>
                  ))}
                </div>
                {isPackage && program.curriculum && program.curriculum.length > 0 && (
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-teal-800 mb-2">Curriculum ({program.curriculum.length} weeks)</p>
                    <div className="space-y-1">
                      {program.curriculum.slice(0, 3).map((w) => (
                        <p key={w.week} className="text-xs text-teal-700">Week {w.week}: {w.title || <span className="text-teal-400 italic">untitled</span>}</p>
                      ))}
                      {program.curriculum.length > 3 && <p className="text-xs text-teal-400">+{program.curriculum.length - 3} more weeks</p>}
                    </div>
                    <button onClick={() => setTab('curriculum')} className="text-xs text-teal-600 font-medium mt-2 hover:underline">Edit curriculum &rarr;</button>
                  </div>
                )}
                {isPackage && (!program.curriculum || program.curriculum.length === 0) && (
                  <div className="border-2 border-dashed border-teal-200 rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-500 mb-2">No curriculum defined yet</p>
                    <button onClick={() => setTab('curriculum')} className="text-sm text-teal-600 font-medium hover:underline">+ Build curriculum &rarr;</button>
                  </div>
                )}
              </div>
            )}
            {tab === 'availability' && <AvailabilityPanel program={program} slug={slug} />}
            {tab === 'curriculum' && <CurriculumPanel program={program} onUpdate={onUpdate} />}
            {tab === 'cohorts' && <CohortsPanel program={program} />}
            {tab === 'enrollments' && <EnrollmentsPanel program={program} />}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Format icon helper ──────────────────────────────────────────────────────

function formatIcon(format: CoachingFormat): string {
  const map: Record<CoachingFormat, string> = {
    SINGLE_SESSION: '\ud83c\udfaf',
    FIXED_PACKAGE: '\ud83d\udce6',
    SUBSCRIPTION: '\ud83d\udd04',
    GROUP_COHORT: '\ud83d\udc65',
    GROUP_OPEN: '\ud83c\udf10',
  };
  return map[format] ?? '';
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CoachingDashboardPage() {
  const [programs, setPrograms] = useState<CoachingProgram[]>([]);
  const [upcoming, setUpcoming] = useState<CoachingSession[]>([]);
  const [tab, setTab] = useState<'programs' | 'upcoming'>('programs');
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<CoachingProgram | null>(null);

  useEffect(() => {
    Promise.all([listMyPrograms(), getMyProfile()])
      .then(([progs, profile]) => { setPrograms(progs); setSlug(profile?.slug ?? ''); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'upcoming') getUpcomingSessions().then(setUpcoming);
  }, [tab]);

  async function handleCreate(type: CoachingType, format: CoachingFormat, details: DetailsForm) {
    const created = await createProgram({
      title: details.title,
      description: details.description || undefined,
      type,
      format,
      ...(details.sessionDurationMinutes ? { sessionDurationMinutes: parseInt(details.sessionDurationMinutes) } : {}),
      totalSessions: details.totalSessions ? parseInt(details.totalSessions) : undefined,
      programWeeks: details.programWeeks ? parseInt(details.programWeeks) : undefined,
      maxParticipants: details.maxParticipants ? parseInt(details.maxParticipants) : undefined,
      price: parseInt(details.price),
      currency: details.currency,
      meetingPlatform: details.meetingPlatform || undefined,
      meetingUrlTemplate: details.meetingUrlTemplate || undefined,
      timezone: details.timezone,
      bufferMinutes: parseInt(details.bufferMinutes),
      advanceBookingDays: parseInt(details.advanceBookingDays),
      minNoticeHours: parseInt(details.minNoticeHours),
      salesPageContent: details.salesPageContent || undefined,
      durationValue: details.durationValue ? parseInt(details.durationValue) : undefined,
      durationUnit: details.durationUnit || undefined,
      customDurationText: details.customDurationText || undefined,
      startDatePolicy: details.startDatePolicy || 'TBD',
      fixedStartDate: details.fixedStartDate || undefined,
    });
    setPrograms((prev) => [created, ...prev]);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this program?')) return;
    await deleteProgram(id);
    setPrograms((prev) => prev.filter((p) => p.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {showCreate && <ProgramModal onSave={handleCreate} onClose={() => setShowCreate(false)} />}
      {selected && (
        <ProgramDrawer
          program={selected}
          slug={slug}
          onClose={() => setSelected(null)}
          onUpdate={(updated) => {
            setPrograms((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            setSelected(updated);
          }}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coaching</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage programs, availability, curriculum &amp; sessions</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/coaching/calendar" className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">Calendar</Link>
            <button onClick={() => setShowCreate(true)} className="bg-teal-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">+ New Program</button>
          </div>
        </div>

        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {([{ key: 'programs', label: 'Programs' }, { key: 'upcoming', label: 'Upcoming Sessions' }] as const).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t.key ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t.label}</button>
          ))}
        </div>

        {tab === 'programs' && (
          <>
            {programs.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-3xl mb-3">\ud83c\udf93</p>
                <p className="text-gray-600 font-medium">No coaching programs yet</p>
                <p className="text-sm text-gray-400 mt-1 mb-4">Create your first program to start accepting clients</p>
                <button onClick={() => setShowCreate(true)} className="bg-teal-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-teal-700">+ New Program</button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {programs.map((program) => {
                  const hasCurriculum = program.curriculum && program.curriculum.length > 0;
                  return (
                    <div key={program.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-teal-200 transition-all cursor-pointer group" onClick={() => setSelected(program)}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-1 flex-wrap">
                          <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                            {formatIcon(program.format)} {formatLabel(program.format)}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                            {typeLabel(program.type)}
                          </span>
                          {!program.isActive && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Inactive</span>}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(program.id); }} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-sm transition-opacity">Delete</button>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{program.title}</h3>
                      {program.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{program.description}</p>}
                      {hasCurriculum && (
                        <div className="flex items-center gap-1 text-xs text-teal-600 mb-3">
                          <span>{program.curriculum!.length}-week curriculum</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">{program.sessionDurationMinutes ? `${program.sessionDurationMinutes} min` : 'Duration TBD'}</span>
                        <span className="font-semibold text-teal-700">{formatCoachingPrice(program.price, program.currency)}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100 flex gap-3 text-xs text-gray-400">
                        <span>{program._count?.enrollments ?? 0} enrolled</span>
                        <span>{program._count?.sessions ?? 0} sessions</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === 'upcoming' && (
          <>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-12">No upcoming sessions.</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((session) => (
                  <div key={session.id} className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{session.program?.title ?? '\u2014'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatSessionTime(session.startsAt, session.endsAt)}</p>
                      {session.enrollment?.user && <p className="text-xs text-teal-600 mt-0.5">with {session.enrollment.user.name}</p>}
                      {session.weekNumber && <p className="text-xs text-gray-400 mt-0.5">Week {session.weekNumber}</p>}
                    </div>
                    {session.meetingUrl && (
                      <a href={session.meetingUrl} target="_blank" rel="noreferrer" className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700">Join</a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
