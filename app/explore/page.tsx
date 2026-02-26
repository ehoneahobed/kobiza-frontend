'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  getExploreResults,
  ExploreResults,
  ExploreCommunity,
  ExploreCourse,
  ExploreDownload,
  ExploreCoaching,
  formatPrice,
} from '@/lib/creator';
import { getToken } from '@/lib/auth';

// ── Types ─────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'communities' | 'courses' | 'downloads' | 'coaching';

const TABS: { key: FilterTab; label: string; emoji: string }[] = [
  { key: 'all', label: 'All', emoji: '✦' },
  { key: 'communities', label: 'Communities', emoji: '👥' },
  { key: 'courses', label: 'Courses', emoji: '🎓' },
  { key: 'downloads', label: 'Downloads', emoji: '📦' },
  { key: 'coaching', label: 'Coaching', emoji: '🎯' },
];

// ── Card Components ────────────────────────────────────────────────────────

function CommunityCard({ item }: { item: ExploreCommunity }) {
  const brand = item.creatorProfile.brandColor ?? '#0D9488';
  return (
    <Link
      href={`/${item.creatorProfile.slug}/community?id=${item.id}`}
      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group flex flex-col"
    >
      <div className="h-1.5 w-full" style={{ background: brand }} />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0"
            style={{
              background: item.creatorProfile.logoUrl
                ? `url(${item.creatorProfile.logoUrl}) center/cover`
                : `linear-gradient(135deg, ${brand}, ${brand}cc)`,
            }}
          >
            {!item.creatorProfile.logoUrl && item.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#1F2937] text-sm leading-tight group-hover:text-[#0D9488] transition-colors">
              {item.name}
            </p>
            <p className="text-xs text-[#6B7280] mt-0.5">by {item.creatorProfile.user.name}</p>
          </div>
        </div>
        {item.description && (
          <p className="text-sm text-[#6B7280] line-clamp-2 mb-3 flex-1">{item.description}</p>
        )}
        <div className="flex items-center gap-3 pt-3 border-t border-[#F3F4F6] mt-auto">
          <span className="text-xs text-[#6B7280]">🎓 {item._count.courses} course{item._count.courses !== 1 ? 's' : ''}</span>
          {item._count.membershipTiers > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${brand}15`, color: brand }}>
              Members
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function CourseCard({ item }: { item: ExploreCourse }) {
  const creator = item.community.creatorProfile;
  const brand = creator.brandColor ?? '#0D9488';
  return (
    <Link
      href={`/${creator.slug}/courses/${item.id}`}
      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group flex flex-col"
    >
      <div className="h-1.5 w-full" style={{ background: brand }} />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0"
            style={{
              background: creator.logoUrl
                ? `url(${creator.logoUrl}) center/cover`
                : `linear-gradient(135deg, ${brand}, ${brand}cc)`,
            }}
          >
            {!creator.logoUrl && creator.user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#1F2937] text-sm leading-tight group-hover:text-[#0D9488] transition-colors line-clamp-2">
              {item.title}
            </p>
            <p className="text-xs text-[#6B7280] mt-0.5">by {creator.user.name}</p>
          </div>
        </div>

        {item.description && (
          <p className="text-sm text-[#6B7280] line-clamp-2 mb-3 flex-1">{item.description}</p>
        )}

        <div className="pt-3 border-t border-[#F3F4F6] mt-auto space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <span className="text-xs bg-[#F3F4F6] text-[#6B7280] px-2 py-1 rounded-lg">
                Self-Paced {formatPrice(item.priceSelfPaced, item.currency)}
              </span>
              <span
                className="text-xs px-2 py-1 rounded-lg font-medium"
                style={{ background: `${brand}15`, color: brand }}
              >
                Accountability ★ {formatPrice(item.priceAccountability, item.currency)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#6B7280]">
            <span>📚 {item._count.modules} module{item._count.modules !== 1 ? 's' : ''}</span>
            <span>👥 {item._count.enrollments} enrolled</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function DownloadCard({ item }: { item: ExploreDownload }) {
  const brand = item.creatorProfile.brandColor ?? '#0D9488';
  return (
    <Link
      href={`/${item.creatorProfile.slug}`}
      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group flex flex-col"
    >
      {item.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.coverUrl} alt={item.title} className="w-full h-28 object-cover" />
      ) : (
        <div
          className="h-1.5 w-full"
          style={{ background: brand }}
        />
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0"
            style={{
              background: item.creatorProfile.logoUrl
                ? `url(${item.creatorProfile.logoUrl}) center/cover`
                : `linear-gradient(135deg, ${brand}, ${brand}cc)`,
            }}
          >
            {!item.creatorProfile.logoUrl && item.creatorProfile.user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#1F2937] text-sm leading-tight group-hover:text-[#0D9488] transition-colors line-clamp-2">
              {item.title}
            </p>
            <p className="text-xs text-[#6B7280] mt-0.5">by {item.creatorProfile.user.name}</p>
          </div>
        </div>

        {item.description && (
          <p className="text-sm text-[#6B7280] line-clamp-2 mb-3 flex-1">{item.description}</p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-[#F3F4F6] mt-auto">
          <span className="text-sm font-bold" style={{ color: brand }}>
            {formatPrice(item.price, item.currency)}
          </span>
          <span className="text-xs text-[#6B7280]">
            📥 {item._count.accesses} download{item._count.accesses !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </Link>
  );
}

function CoachingCard({ item }: { item: ExploreCoaching }) {
  const brand = item.creatorProfile.brandColor ?? '#0D9488';
  return (
    <Link
      href={`/${item.creatorProfile.slug}`}
      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group flex flex-col"
    >
      <div className="h-1.5 w-full" style={{ background: brand }} />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0"
            style={{
              background: item.creatorProfile.logoUrl
                ? `url(${item.creatorProfile.logoUrl}) center/cover`
                : `linear-gradient(135deg, ${brand}, ${brand}cc)`,
            }}
          >
            {!item.creatorProfile.logoUrl && item.creatorProfile.user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#1F2937] text-sm leading-tight group-hover:text-[#0D9488] transition-colors line-clamp-2">
              {item.title}
            </p>
            <p className="text-xs text-[#6B7280] mt-0.5">by {item.creatorProfile.user.name}</p>
          </div>
        </div>

        {item.description && (
          <p className="text-sm text-[#6B7280] line-clamp-2 mb-3 flex-1">{item.description}</p>
        )}

        <div className="pt-3 border-t border-[#F3F4F6] mt-auto space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs px-2 py-1 rounded-lg font-medium"
              style={{ background: `${brand}15`, color: brand }}
            >
              {item.type === 'ONE_ON_ONE' ? '1-on-1' : 'Group'}
            </span>
            <span className="text-xs bg-[#F3F4F6] text-[#6B7280] px-2 py-1 rounded-lg">
              ⏱ {item.durationMinutes} min
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: brand }}>
              {formatPrice(item.price, item.currency)}
            </span>
            <span className="text-xs text-[#6B7280]">
              {item._count.sessions} session{item._count.sessions !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Section helpers ────────────────────────────────────────────────────────

function SectionHeader({
  emoji,
  title,
  count,
  tabKey,
  onTabChange,
}: {
  emoji: string;
  title: string;
  count: number;
  tabKey: FilterTab;
  onTabChange: (t: FilterTab) => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-bold text-[#1F2937] text-base flex items-center gap-2">
        <span>{emoji}</span>
        <span>{title}</span>
        <span className="text-[#6B7280] font-normal text-sm">({count})</span>
      </h2>
      {count > 3 && (
        <button
          onClick={() => onTabChange(tabKey)}
          className="text-sm text-[#0D9488] hover:underline font-medium"
        >
          See all →
        </button>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [results, setResults] = useState<ExploreResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [inputValue, setInputValue] = useState(searchParams.get('q') ?? '');
  const [activeTab, setActiveTab] = useState<FilterTab>(
    (searchParams.get('type') as FilterTab) ?? 'all',
  );
  const isLoggedIn = !!getToken();

  const load = useCallback((q: string) => {
    setLoading(true);
    getExploreResults(q || undefined)
      .then(setResults)
      .catch(() => setResults(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(query);
  }, [load, query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputValue.trim();
    setQuery(q);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (activeTab !== 'all') params.set('type', activeTab);
    const qs = params.toString();
    router.replace(qs ? `/explore?${qs}` : '/explore', { scroll: false });
  };

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (tab !== 'all') params.set('type', tab);
    const qs = params.toString();
    router.replace(qs ? `/explore?${qs}` : '/explore', { scroll: false });
  };

  const totalCount = results
    ? results.communities.length +
      results.courses.length +
      results.downloads.length +
      results.coaching.length
    : 0;

  const hasResults = (tab: FilterTab) => {
    if (!results) return false;
    if (tab === 'all') return totalCount > 0;
    if (tab === 'communities') return results.communities.length > 0;
    if (tab === 'courses') return results.courses.length > 0;
    if (tab === 'downloads') return results.downloads.length > 0;
    if (tab === 'coaching') return results.coaching.length > 0;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Nav */}
      <header className="bg-[#1F2937] sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-[#0D9488]">
            Paidli
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/home" className="text-sm text-white/70 hover:text-white transition-colors">
                ← My Learning
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-white/70 hover:text-white transition-colors">
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="text-sm bg-[#0D9488] text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors"
                >
                  Sign up free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-[#1F2937] pb-10 pt-10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-[#0D9488]/20 text-[#0D9488] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <span>✦</span>
            <span>Learn. Be Accountable. Grow.</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Discover creators &amp; products
          </h1>
          <p className="text-white/60 text-base max-w-xl mx-auto mb-8">
            Explore courses with accountability coaching, communities, digital downloads, and
            coaching programs from creators who care about your results.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search creators, courses, topics…"
              className="flex-1 rounded-xl px-4 py-3 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488] bg-white"
            />
            <button
              type="submit"
              className="bg-[#F59E0B] text-white font-semibold px-5 py-3 rounded-xl text-sm hover:bg-amber-500 transition-colors flex-shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="bg-white border-b border-[#F3F4F6] sticky top-14 z-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
            {TABS.map((tab) => {
              const count = results
                ? tab.key === 'all'
                  ? totalCount
                  : tab.key === 'communities'
                  ? results.communities.length
                  : tab.key === 'courses'
                  ? results.courses.length
                  : tab.key === 'downloads'
                  ? results.downloads.length
                  : results.coaching.length
                : 0;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    activeTab === tab.key
                      ? 'border-[#0D9488] text-[#0D9488]'
                      : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
                  }`}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                  {!loading && count > 0 && (
                    <span
                      className={`text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center ${
                        activeTab === tab.key
                          ? 'bg-[#0D9488]/10 text-[#0D9488]'
                          : 'bg-[#F3F4F6] text-[#6B7280]'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-[#1F2937] text-lg">
            {query ? `Results for "${query}"` : 'Explore'}
          </h2>
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setInputValue('');
                router.replace('/explore', { scroll: false });
              }}
              className="text-sm text-[#6B7280] hover:text-[#0D9488] transition-colors"
            >
              Clear ×
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasResults(activeTab) ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-semibold text-[#1F2937] text-lg mb-2">No results found</p>
            <p className="text-[#6B7280] text-sm">
              Try a different search term or filter, or{' '}
              <button
                onClick={() => {
                  setQuery('');
                  setInputValue('');
                  setActiveTab('all');
                  router.replace('/explore');
                }}
                className="text-[#0D9488] hover:underline"
              >
                browse everything
              </button>
            </p>
          </div>
        ) : activeTab === 'all' ? (
          // ── All tab: sectioned view ────────────────────────────────────
          <div className="space-y-10">
            {results!.communities.length > 0 && (
              <div>
                <SectionHeader
                  emoji="👥"
                  title="Communities"
                  count={results!.communities.length}
                  tabKey="communities"
                  onTabChange={handleTabChange}
                />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results!.communities.slice(0, 3).map((item) => (
                    <CommunityCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {results!.courses.length > 0 && (
              <div>
                <SectionHeader
                  emoji="🎓"
                  title="Courses"
                  count={results!.courses.length}
                  tabKey="courses"
                  onTabChange={handleTabChange}
                />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results!.courses.slice(0, 3).map((item) => (
                    <CourseCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {results!.downloads.length > 0 && (
              <div>
                <SectionHeader
                  emoji="📦"
                  title="Downloads"
                  count={results!.downloads.length}
                  tabKey="downloads"
                  onTabChange={handleTabChange}
                />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results!.downloads.slice(0, 3).map((item) => (
                    <DownloadCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {results!.coaching.length > 0 && (
              <div>
                <SectionHeader
                  emoji="🎯"
                  title="Coaching Programs"
                  count={results!.coaching.length}
                  tabKey="coaching"
                  onTabChange={handleTabChange}
                />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results!.coaching.slice(0, 3).map((item) => (
                    <CoachingCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // ── Single type tab: flat grid ─────────────────────────────────
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeTab === 'communities' &&
              results!.communities.map((item) => <CommunityCard key={item.id} item={item} />)}
            {activeTab === 'courses' &&
              results!.courses.map((item) => <CourseCard key={item.id} item={item} />)}
            {activeTab === 'downloads' &&
              results!.downloads.map((item) => <DownloadCard key={item.id} item={item} />)}
            {activeTab === 'coaching' &&
              results!.coaching.map((item) => <CoachingCard key={item.id} item={item} />)}
          </div>
        )}

        {/* Accountability callout — only when there's content */}
        {!loading && totalCount > 0 && (
          <div className="mt-12 bg-gradient-to-r from-[#0D9488] to-teal-700 rounded-2xl p-6 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#F59E0B] text-xl">⚡</span>
                  <h3 className="font-bold text-base">Paidli&apos;s Accountability Track</h3>
                </div>
                <p className="text-white/80 text-sm">
                  Unlike other platforms, Paidli courses offer an Accountability Track — where a
                  real coach reviews your work and gives personalised feedback. Not just videos.
                  Real results.
                </p>
              </div>
              {!isLoggedIn && (
                <Link
                  href="/signup"
                  className="bg-[#F59E0B] text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-amber-500 transition-colors whitespace-nowrap flex-shrink-0"
                >
                  Get started free →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
