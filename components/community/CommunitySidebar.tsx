'use client';

import Link from 'next/link';
import { QuickLink, LeaderboardEntry } from '@/lib/community';
import LeaderboardList from './LeaderboardList';

interface Props {
  slug: string;
  communityName: string;
  description?: string | null;
  memberCount: number;
  onlineCount?: number;
  courseCount: number;
  quickLinks?: QuickLink[];
  leaderboard: LeaderboardEntry[];
  onTabChange: (tab: string) => void;
}

export default function CommunitySidebar({
  communityName,
  description,
  memberCount,
  onlineCount,
  courseCount,
  quickLinks,
  leaderboard,
  onTabChange,
}: Props) {
  return (
    <aside className="space-y-4">
      {/* Community info card */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-bold text-[#1F2937] text-base mb-1">{communityName}</h2>
        {description && <p className="text-sm text-[#6B7280] mb-4">{description}</p>}

        <div className="flex gap-4 text-center mb-4">
          <button
            onClick={() => onTabChange('members')}
            className="flex-1 hover:bg-[#F3F4F6] rounded-lg p-2 transition-colors"
          >
            <p className="text-xl font-bold text-[#1F2937]">{memberCount}</p>
            <p className="text-xs text-[#6B7280]">Members</p>
          </button>
          {typeof onlineCount === 'number' && onlineCount > 0 && (
            <button
              onClick={() => onTabChange('members')}
              className="flex-1 hover:bg-[#F3F4F6] rounded-lg p-2 transition-colors"
            >
              <p className="text-xl font-bold text-green-600">{onlineCount}</p>
              <p className="text-xs text-[#6B7280] flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                Online
              </p>
            </button>
          )}
          <button
            onClick={() => onTabChange('classroom')}
            className="flex-1 hover:bg-[#F3F4F6] rounded-lg p-2 transition-colors"
          >
            <p className="text-xl font-bold text-[#1F2937]">{courseCount}</p>
            <p className="text-xs text-[#6B7280]">Courses</p>
          </button>
        </div>
      </div>

      {/* Quick links */}
      {quickLinks && quickLinks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">
            Quick Links
          </h3>
          <div className="space-y-2">
            {quickLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-[#0D9488] hover:text-teal-700 hover:underline transition-colors"
              >
                <span>{link.emoji}</span>
                <span>{link.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard preview */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
            Leaderboard (30d)
          </h3>
          <button
            onClick={() => onTabChange('leaderboard')}
            className="text-xs text-[#0D9488] hover:underline"
          >
            See all
          </button>
        </div>
        <LeaderboardList entries={leaderboard} compact />
      </div>
    </aside>
  );
}
