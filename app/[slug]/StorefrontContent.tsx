'use client';

import { useState } from 'react';
import Link from 'next/link';
import CourseCard from './CourseCard';
import MembershipCard from './MembershipCard';
import { type StorefrontCommunity, type Course } from '@/lib/creator';
import { type Downloadable, formatDownloadPrice } from '@/lib/downloadables';
import { type CoachingProgram, formatCoachingPrice } from '@/lib/coaching';
import { formatPrice } from '@/lib/courses';

// ── Types ──────────────────────────────────────────────────────────────────

type Tab = 'all' | 'communities' | 'courses' | 'downloads' | 'coaching';

interface Props {
  communities: StorefrontCommunity[];
  standaloneCourses: Course[];
  downloads: Downloadable[];
  coachingPrograms: CoachingProgram[];
  brand: string;
  slug: string;
}

// ── Helper sub-components ──────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-3">
      {children}
    </h2>
  );
}

function CommunityCard({
  community,
  brand,
  slug,
}: {
  community: StorefrontCommunity;
  brand: string;
  slug: string;
}) {
  const classrooms = community.classrooms ?? [];
  const tiers = community.membershipTiers ?? [];

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Top accent bar */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${brand}, ${brand}88)` }} />

      {/* Community header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-bold text-[#1F2937] text-base">{community.name}</h3>
              {(community as any).visibility === 'PRIVATE' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280] font-medium">
                  🔐 Private
                </span>
              )}
              {community.isFeatured && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 font-medium">
                  Featured
                </span>
              )}
            </div>
            {community.description && (
              <p className="text-sm text-[#6B7280] line-clamp-2 mb-2">{community.description}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-[#6B7280]">
              {classrooms.length > 0 && (
                <span>🎓 {classrooms.length} course{classrooms.length !== 1 ? 's' : ''}</span>
              )}
              {tiers.length > 0 && (
                <span>👥 {tiers.length} tier{tiers.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
          <Link
            href={`/${slug}/community?id=${community.id}`}
            className="flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-xl whitespace-nowrap transition-colors hover:opacity-80"
            style={{ color: brand, backgroundColor: `${brand}15` }}
          >
            View →
          </Link>
        </div>
      </div>

      {/* Classroom courses (preview) */}
      {classrooms.length > 0 && (
        <div className="border-t border-[#F3F4F6] p-4">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Classroom</p>
          <div className="space-y-2">
            {classrooms.slice(0, 3).map((entry) => (
              <div key={entry.course.id} className="flex items-center justify-between text-sm">
                <span className="text-[#1F2937] truncate">{entry.course.title}</span>
                <span className="text-xs text-[#0D9488] ml-2 flex-shrink-0">
                  {entry.memberPriceSelfPaced === 0 ? 'Free for members' : formatPrice(entry.course.priceSelfPaced, entry.course.currency)}
                </span>
              </div>
            ))}
            {classrooms.length > 3 && (
              <p className="text-xs text-[#6B7280]">+{classrooms.length - 3} more</p>
            )}
          </div>
        </div>
      )}

      {/* Membership tiers */}
      {tiers.length > 0 && (
        <div className="border-t border-[#F3F4F6] p-4">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">
            Membership
          </p>
          <div
            className={
              tiers.length === 1
                ? 'grid grid-cols-1 gap-3'
                : 'grid grid-cols-1 sm:grid-cols-2 gap-3'
            }
          >
            {tiers.map((tier) => (
              <MembershipCard key={tier.id} tier={tier} brand={brand} slug={slug} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DownloadRow({
  dl,
  slug,
}: {
  dl: Downloadable;
  slug: string;
}) {
  return (
    <Link
      href={`/${slug}/downloads/${dl.id}`}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-4 p-4 group"
    >
      <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-[#0D9488]/10 to-[#38BDF8]/10 flex items-center justify-center text-2xl">
        {dl.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dl.coverUrl} alt={dl.title} className="w-full h-full object-cover" />
        ) : (
          '📥'
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#1F2937] group-hover:text-[#0D9488] transition-colors line-clamp-1 text-sm">
          {dl.title}
        </p>
        {dl.description && (
          <p className="text-xs text-[#6B7280] line-clamp-1 mt-0.5">{dl.description}</p>
        )}
      </div>
      <div className="flex-shrink-0 text-right">
        <p
          className="font-bold text-sm"
          style={{ color: dl.price === 0 ? '#0D9488' : '#F59E0B' }}
        >
          {formatDownloadPrice(dl.price, dl.currency)}
        </p>
        <p className="text-xs text-[#6B7280] mt-0.5">Get →</p>
      </div>
    </Link>
  );
}

function CoachingRow({
  prog,
  slug,
}: {
  prog: CoachingProgram;
  slug: string;
}) {
  const isOneOnOne = prog.type === 'ONE_ON_ONE';
  return (
    <Link
      href={`/${slug}/coaching/${prog.id}`}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-4 p-4 group"
    >
      <div
        className="flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5"
        style={{
          background: isOneOnOne
            ? 'linear-gradient(135deg, #0D9488, #38BDF8)'
            : 'linear-gradient(135deg, #F59E0B, #EF4444)',
        }}
      >
        <span className="text-xl">{isOneOnOne ? '👤' : '👥'}</span>
        <span className="text-white text-[10px] font-semibold">{prog.sessionDurationMinutes}m</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#1F2937] group-hover:text-[#0D9488] transition-colors line-clamp-1 text-sm">
          {prog.title}
        </p>
        <p className="text-xs text-[#6B7280] mt-0.5">
          {isOneOnOne ? '1-on-1 session' : 'Group session'}
          {prog.description && ` · ${prog.description}`}
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p
          className="font-bold text-sm"
          style={{ color: prog.price === 0 ? '#0D9488' : '#F59E0B' }}
        >
          {formatCoachingPrice(prog.price, prog.currency)}
        </p>
        <p className="text-xs text-[#6B7280] mt-0.5">Book →</p>
      </div>
    </Link>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function StorefrontContent({
  communities,
  standaloneCourses,
  downloads,
  coachingPrograms,
  brand,
  slug,
}: Props) {
  const totalItems =
    communities.length + standaloneCourses.length + downloads.length + coachingPrograms.length;

  // Build tabs — only for non-empty sections
  const tabDefs: { id: Tab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: totalItems },
    ...(communities.length > 0
      ? [{ id: 'communities' as Tab, label: 'Communities', count: communities.length }]
      : []),
    ...(standaloneCourses.length > 0
      ? [{ id: 'courses' as Tab, label: 'Courses', count: standaloneCourses.length }]
      : []),
    ...(downloads.length > 0
      ? [{ id: 'downloads' as Tab, label: 'Downloads', count: downloads.length }]
      : []),
    ...(coachingPrograms.length > 0
      ? [{ id: 'coaching' as Tab, label: 'Coaching', count: coachingPrograms.length }]
      : []),
  ];

  // Only render tabs if there are 2+ distinct content types
  const showTabs = tabDefs.length > 2;
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const show = (tab: Tab) => activeTab === 'all' || activeTab === tab;

  if (totalItems === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
        <p className="text-4xl mb-3">🚀</p>
        <p className="font-medium text-[#1F2937] mb-1">Nothing published yet</p>
        <p className="text-sm text-[#6B7280]">Check back soon for courses, downloads, and more.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      {showTabs && (
        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {tabDefs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'bg-white text-[#6B7280] shadow-sm hover:text-[#1F2937]'
                }`}
                style={isActive ? { backgroundColor: brand } : {}}
              >
                {tab.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/25 text-white' : 'bg-[#F3F4F6] text-[#6B7280]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Communities */}
      {show('communities') && communities.length > 0 && (
        <section>
          {activeTab === 'all' && <SectionLabel>Communities</SectionLabel>}
          <div className="space-y-4">
            {communities.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                brand={brand}
                slug={slug}
              />
            ))}
          </div>
        </section>
      )}

      {/* Standalone Courses */}
      {show('courses') && standaloneCourses.length > 0 && (
        <section>
          {activeTab === 'all' && <SectionLabel>Courses</SectionLabel>}
          <div
            className={
              standaloneCourses.length === 1
                ? 'grid grid-cols-1 gap-4'
                : 'grid grid-cols-1 sm:grid-cols-2 gap-4'
            }
          >
            {standaloneCourses.map((course) => (
              <CourseCard key={course.id} course={course} brand={brand} />
            ))}
          </div>
        </section>
      )}

      {/* Downloads */}
      {show('downloads') && downloads.length > 0 && (
        <section>
          {activeTab === 'all' && <SectionLabel>Downloads</SectionLabel>}
          <div className="space-y-3">
            {downloads.map((dl) => (
              <DownloadRow key={dl.id} dl={dl} slug={slug} />
            ))}
          </div>
        </section>
      )}

      {/* Coaching */}
      {show('coaching') && coachingPrograms.length > 0 && (
        <section>
          {activeTab === 'all' && <SectionLabel>Coaching</SectionLabel>}
          <div className="space-y-3">
            {coachingPrograms.map((prog) => (
              <CoachingRow key={prog.id} prog={prog} slug={slug} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
