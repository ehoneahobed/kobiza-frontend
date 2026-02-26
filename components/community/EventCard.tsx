'use client';

import { CommunityEvent, RsvpStatus, RecurrenceType, rsvpEvent, cancelRsvp } from '@/lib/community';
import { useState } from 'react';

interface EventCardProps {
  event: CommunityEvent;
  onRsvpChange?: (eventId: string, status: RsvpStatus | null) => void;
  slug?: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  ONLINE: 'Online',
  IN_PERSON: 'In Person',
  HYBRID: 'Hybrid',
};

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  NONE: '',
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Every 2 weeks',
  MONTHLY: 'Monthly',
};

function formatEventDate(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const dateStr = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const startTime = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const endTime = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${dateStr} · ${startTime} - ${endTime}`;
}

export default function EventCard({ event, onRsvpChange, slug }: EventCardProps) {
  const [myRsvp, setMyRsvp] = useState<RsvpStatus | null>(event.myRsvp);
  const [loading, setLoading] = useState(false);

  const handleRsvp = async (status: RsvpStatus) => {
    setLoading(true);
    try {
      if (myRsvp === status) {
        await cancelRsvp(event.id);
        setMyRsvp(null);
        onRsvpChange?.(event.id, null);
      } else {
        await rsvpEvent(event.id, status);
        setMyRsvp(status);
        onRsvpChange?.(event.id, status);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const isPast = new Date(event.endsAt) < new Date();
  const isRecurring = event.recurrenceType !== 'NONE' || !!event.parentEventId;

  if (event.isLocked) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-400">🔒</span>
              <h3 className="font-semibold text-gray-500">{event.title}</h3>
            </div>
            <p className="text-sm text-gray-400">{formatEventDate(event.startsAt, event.endsAt)}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {isRecurring && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Recurring</span>}
            <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded">{EVENT_TYPE_LABELS[event.eventType]}</span>
          </div>
        </div>
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
          Upgrade your membership to access this event.
          {slug && (
            <a href={`/${slug}/community`} className="ml-1 underline font-medium">
              View tiers
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 rounded-lg p-4 ${isPast ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{event.title}</h3>
            {isRecurring && (
              <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                {event.recurrenceType !== 'NONE'
                  ? RECURRENCE_LABELS[event.recurrenceType]
                  : 'Recurring'}
              </span>
            )}
            {event.minTierOrder > 0 && (
              <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded">Premium</span>
            )}
          </div>
          <p className="text-sm text-gray-500">{formatEventDate(event.startsAt, event.endsAt)}</p>
          {event.location && (
            <p className="text-sm text-gray-500 mt-1">
              📍 {event.locationUrl ? (
                <a href={event.locationUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                  {event.location}
                </a>
              ) : event.location}
            </p>
          )}
        </div>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{EVENT_TYPE_LABELS[event.eventType]}</span>
      </div>

      {event.description && (
        <p className="text-sm text-gray-700 mt-2 line-clamp-3">{event.description}</p>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          {event.rsvpCount.going} going{event.rsvpCount.maybe > 0 ? ` · ${event.rsvpCount.maybe} maybe` : ''}
          {event.maxAttendees && ` · ${event.maxAttendees} max`}
        </div>

        {!isPast && (
          <div className="flex gap-2">
            {(['GOING', 'MAYBE', 'NOT_GOING'] as RsvpStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => handleRsvp(status)}
                disabled={loading}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                  myRsvp === status
                    ? status === 'GOING'
                      ? 'bg-teal-600 text-white'
                      : status === 'MAYBE'
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'GOING' ? 'Going' : status === 'MAYBE' ? 'Maybe' : 'Not Going'}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
