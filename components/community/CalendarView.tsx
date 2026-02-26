'use client';

import { CommunityEvent, RsvpStatus } from '@/lib/community';
import EventCard from './EventCard';
import { useState, useMemo } from 'react';

interface CalendarViewProps {
  events: CommunityEvent[];
  onRsvpChange?: (eventId: string, status: RsvpStatus | null) => void;
  onMonthChange?: (month: number, year: number) => void;
  slug?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView({ events, onRsvpChange, onMonthChange, slug }: CalendarViewProps) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Build a map of day -> events for the current month
  const eventsByDay = useMemo(() => {
    const map = new Map<number, CommunityEvent[]>();
    for (const event of events) {
      const d = new Date(event.startsAt);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate();
        const list = map.get(day) ?? [];
        list.push(event);
        map.set(day, list);
      }
    }
    return map;
  }, [events, month, year]);

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goToPrev = () => {
    const newMonth = month === 0 ? 11 : month - 1;
    const newYear = month === 0 ? year - 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    setSelectedDay(null);
    onMonthChange?.(newMonth + 1, newYear);
  };

  const goToNext = () => {
    const newMonth = month === 11 ? 0 : month + 1;
    const newYear = month === 11 ? year + 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    setSelectedDay(null);
    onMonthChange?.(newMonth + 1, newYear);
  };

  // Events to show in the list below the calendar
  const displayEvents = selectedDay
    ? (eventsByDay.get(selectedDay) ?? [])
    : events.filter((e) => {
        const d = new Date(e.startsAt);
        return d.getMonth() === month && d.getFullYear() === year;
      });

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={goToPrev} className="p-2 hover:bg-gray-100 rounded text-gray-600">&larr;</button>
        <h3 className="text-lg font-semibold text-gray-900">{MONTH_NAMES[month]} {year}</h3>
        <button onClick={goToNext} className="p-2 hover:bg-gray-100 rounded text-gray-600">&rarr;</button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden mb-6">
        {DAY_NAMES.map((name) => (
          <div key={name} className="bg-gray-50 p-2 text-xs font-medium text-gray-500 text-center">
            {name}
          </div>
        ))}
        {cells.map((day, i) => {
          const hasEvents = day ? eventsByDay.has(day) : false;
          const isSelected = day === selectedDay;
          const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();

          return (
            <div
              key={i}
              onClick={() => day && setSelectedDay(isSelected ? null : day)}
              className={`bg-white p-2 min-h-[40px] text-sm cursor-pointer transition-colors ${
                day ? 'hover:bg-teal-50' : ''
              } ${isSelected ? 'bg-teal-50 ring-1 ring-teal-300' : ''}`}
            >
              {day && (
                <div className="flex flex-col items-center">
                  <span className={`${isToday ? 'bg-teal-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs' : 'text-gray-700'}`}>
                    {day}
                  </span>
                  {hasEvents && (
                    <div className="flex gap-0.5 mt-1">
                      {(eventsByDay.get(day) ?? []).slice(0, 3).map((e) => (
                        <div
                          key={e.id}
                          className={`w-1.5 h-1.5 rounded-full ${e.isLocked ? 'bg-gray-300' : 'bg-teal-500'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Event list */}
      <div className="space-y-3">
        {selectedDay && (
          <p className="text-sm text-gray-500 mb-2">
            Events on {MONTH_NAMES[month]} {selectedDay}
          </p>
        )}
        {displayEvents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            {selectedDay ? 'No events on this day.' : 'No events this month.'}
          </p>
        ) : (
          displayEvents.map((event) => (
            <EventCard key={event.id} event={event} onRsvpChange={onRsvpChange} slug={slug} />
          ))
        )}
      </div>
    </div>
  );
}
