'use client';

import { useMemo, useState } from 'react';
import { DailyActivity } from '@/lib/activity';

function getColor(count: number): string {
  if (count === 0) return '#F3F4F6';
  if (count <= 2) return '#CCFBF1';
  if (count <= 5) return '#5EEAD4';
  if (count <= 9) return '#14B8A6';
  return '#0D9488';
}

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CELL_SIZE = 12;
const GAP = 3;

interface Props {
  data: DailyActivity[];
  className?: string;
}

export default function ActivityHeatmap({ data, className }: Props) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const { grid, totalCount, monthLabels } = useMemo(() => {
    // Build a map of date -> count from sparse data
    const map = new Map<string, number>();
    for (const d of data) {
      map.set(d.date, (map.get(d.date) ?? 0) + d.count);
    }

    // Calculate 364 days ending today
    const today = new Date();
    const days: { date: string; count: number; dayOfWeek: number }[] = [];

    for (let i = 363; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        date: key,
        count: map.get(key) ?? 0,
        dayOfWeek: d.getDay(),
      });
    }

    // Group into weeks (columns)
    const weeks: typeof days[] = [];
    let currentWeek: typeof days = [];

    for (const day of days) {
      // Start a new week on Sunday
      if (day.dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    // Pad the first week to start on Sunday
    while (weeks[0] && weeks[0].length < 7 && weeks[0][0].dayOfWeek !== 0) {
      weeks[0].unshift({ date: '', count: -1, dayOfWeek: (weeks[0][0].dayOfWeek - 1 + 7) % 7 });
    }

    let total = 0;
    for (const d of data) total += d.count;

    // Month labels positioned at week boundaries
    const labels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    for (let w = 0; w < weeks.length; w++) {
      // Find the first valid day in this week
      const firstDay = weeks[w].find((d) => d.date !== '');
      if (!firstDay) continue;
      const month = new Date(firstDay.date).getMonth();
      if (month !== lastMonth) {
        labels.push({ label: MONTH_NAMES[month], weekIndex: w });
        lastMonth = month;
      }
    }

    return { grid: weeks, totalCount: total, monthLabels: labels };
  }, [data]);

  if (data.length === 0) return null;

  const gridWidth = grid.length * (CELL_SIZE + GAP);
  const labelOffset = 32; // space for day labels

  return (
    <div className={`bg-white rounded-2xl shadow-sm p-5 ${className ?? ''}`}>
      <p className="text-sm font-semibold text-[#1F2937] mb-4">
        {totalCount} {totalCount === 1 ? 'activity' : 'activities'} in the last year
      </p>

      <div className="overflow-x-auto">
        <div style={{ minWidth: gridWidth + labelOffset + 16, position: 'relative' }}>
          {/* Month labels */}
          <div className="flex" style={{ paddingLeft: labelOffset, marginBottom: 4 }}>
            {grid.map((_, w) => {
              const ml = monthLabels.find((m) => m.weekIndex === w);
              return (
                <div
                  key={w}
                  style={{ width: CELL_SIZE, marginRight: GAP, flexShrink: 0 }}
                  className="text-[10px] text-[#6B7280]"
                >
                  {ml?.label ?? ''}
                </div>
              );
            })}
          </div>

          {/* Grid + day labels */}
          <div className="flex">
            {/* Day labels column */}
            <div className="flex flex-col" style={{ width: labelOffset, flexShrink: 0 }}>
              {DAY_LABELS.map((label, i) => (
                <div
                  key={i}
                  className="text-[10px] text-[#6B7280] flex items-center"
                  style={{ height: CELL_SIZE, marginBottom: GAP }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="flex">
              {grid.map((week, w) => (
                <div key={w} className="flex flex-col" style={{ marginRight: GAP }}>
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    const cell = week.find((d) => d.dayOfWeek === dayIndex);
                    if (!cell || cell.count === -1) {
                      return (
                        <div
                          key={dayIndex}
                          style={{ width: CELL_SIZE, height: CELL_SIZE, marginBottom: GAP }}
                        />
                      );
                    }
                    return (
                      <div
                        key={dayIndex}
                        style={{
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                          marginBottom: GAP,
                          backgroundColor: getColor(cell.count),
                          borderRadius: 2,
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({
                            text: `${cell.count} ${cell.count === 1 ? 'activity' : 'activities'} on ${cell.date}`,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 8,
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-[10px] text-[#6B7280]">
        <span>Less</span>
        {[0, 1, 3, 6, 10].map((threshold) => (
          <div
            key={threshold}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundColor: getColor(threshold),
              borderRadius: 2,
            }}
          />
        ))}
        <span>More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            zIndex: 50,
          }}
          className="bg-[#1F2937] text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none"
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
