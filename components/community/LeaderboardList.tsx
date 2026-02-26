'use client';

import { LeaderboardEntry } from '@/lib/community';

const MEDALS = ['🥇', '🥈', '🥉'];
const LEVEL_COLORS = [
  'bg-gray-200 text-gray-600',
  'bg-blue-100 text-blue-600',
  'bg-teal-100 text-[#0D9488]',
  'bg-amber-100 text-amber-600',
  'bg-orange-100 text-orange-600',
];

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="w-8 h-8 rounded-full object-cover" />;
  }
  return (
    <div className="w-8 h-8 rounded-full bg-[#0D9488]/10 flex items-center justify-center text-xs font-semibold text-[#0D9488]">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

interface Props {
  entries: LeaderboardEntry[];
  compact?: boolean;
}

export default function LeaderboardList({ entries, compact }: Props) {
  const shown = compact ? entries.slice(0, 5) : entries;

  if (shown.length === 0) {
    return <p className="text-sm text-[#6B7280] text-center py-4">No activity yet this month.</p>;
  }

  return (
    <div className="space-y-2">
      {shown.map((entry) => (
        <div key={entry.id} className="flex items-center gap-3">
          <span className="w-6 text-center text-sm flex-shrink-0">
            {entry.rank <= 3 ? MEDALS[entry.rank - 1] : <span className="text-[#6B7280]">{entry.rank}</span>}
          </span>
          <Avatar name={entry.name} avatarUrl={entry.avatarUrl} />
          <span className="flex-1 text-sm font-medium text-[#1F2937] truncate">{entry.name}</span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${LEVEL_COLORS[Math.min(entry.level - 1, 4)]}`}
          >
            Lv{entry.level}
          </span>
          <span className="text-xs font-semibold text-[#6B7280] flex-shrink-0 w-12 text-right">
            +{entry.points}
          </span>
        </div>
      ))}
    </div>
  );
}
