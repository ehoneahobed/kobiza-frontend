'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCalendar, CoachingSession, formatSessionTime } from '@/lib/coaching';

function getWeekDates(refDate: Date): Date[] {
  const day = refDate.getDay();
  const monday = new Date(refDate);
  monday.setDate(refDate.getDate() - day + 1);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CoachingCalendarPage() {
  const [refDate, setRefDate] = useState(() => new Date());
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [loading, setLoading] = useState(true);

  const weekDates = getWeekDates(refDate);
  const from = weekDates[0];
  const to = weekDates[6];

  useEffect(() => {
    setLoading(true);
    const fromStr = toDateStr(from) + 'T00:00:00.000Z';
    const toStr = toDateStr(to) + 'T23:59:59.999Z';
    getCalendar(fromStr, toStr)
      .then(setSessions)
      .finally(() => setLoading(false));
  }, [refDate.toDateString()]);

  function prevWeek() {
    setRefDate((d) => {
      const n = new Date(d);
      n.setDate(d.getDate() - 7);
      return n;
    });
  }

  function nextWeek() {
    setRefDate((d) => {
      const n = new Date(d);
      n.setDate(d.getDate() + 7);
      return n;
    });
  }

  function sessionsForDay(d: Date) {
    const str = toDateStr(d);
    return sessions.filter((s) => s.startsAt.slice(0, 10) === str);
  }

  const monthLabel = from.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link
            href="/dashboard/coaching"
            className="text-sm text-teal-600 hover:underline mb-1 inline-block"
          >
            ← Back to Programs
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Coaching Calendar</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={prevWeek}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            ←
          </button>
          <span className="text-sm font-medium text-gray-700">{monthLabel}</span>
          <button
            onClick={nextWeek}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            →
          </button>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((d, i) => {
          const isToday = toDateStr(d) === toDateStr(new Date());
          const daySessions = sessionsForDay(d);
          return (
            <div key={i} className="min-h-[120px]">
              {/* Day header */}
              <div className={`text-center mb-2 ${isToday ? 'text-teal-600' : 'text-gray-500'}`}>
                <p className="text-xs font-medium">{DAY_LABELS[i]}</p>
                <div
                  className={`w-7 h-7 mx-auto flex items-center justify-center rounded-full text-sm font-bold ${
                    isToday ? 'bg-teal-600 text-white' : 'text-gray-700'
                  }`}
                >
                  {d.getDate()}
                </div>
              </div>

              {/* Sessions */}
              <div className="space-y-1">
                {loading
                  ? null
                  : daySessions.map((s) => (
                      <div
                        key={s.id}
                        className="bg-teal-50 border border-teal-200 rounded-lg p-1.5 text-xs"
                      >
                        <p className="font-medium text-teal-800 truncate">
                          {s.program?.title ?? 'Session'}
                        </p>
                        <p className="text-teal-600">
                          {new Date(s.startsAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                        {s.enrollment?.user && (
                          <p className="text-teal-500 truncate">{s.enrollment.user.name}</p>
                        )}
                        {s.attendees && s.attendees.length > 0 && (
                          <p className="text-teal-500">{s.attendees.length} attendees</p>
                        )}
                      </div>
                    ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Session list */}
      {sessions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">This Week</h2>
          <div className="space-y-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">{s.program?.title ?? '—'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatSessionTime(s.startsAt, s.endsAt)}
                  </p>
                  {s.enrollment?.user && (
                    <p className="text-xs text-teal-600 mt-0.5">with {s.enrollment.user.name}</p>
                  )}
                  {s.attendees && s.attendees.length > 0 && (
                    <p className="text-xs text-teal-600 mt-0.5">
                      {s.attendees.length} registered
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-700'
                        : s.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {s.status}
                  </span>
                  {s.meetingUrl && (
                    <a
                      href={s.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700"
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

      {!loading && sessions.length === 0 && (
        <div className="mt-8 text-center py-12 bg-gray-50 rounded-2xl">
          <p className="text-3xl mb-2">📅</p>
          <p className="text-gray-500 text-sm">No sessions this week</p>
        </div>
      )}
    </div>
  );
}
