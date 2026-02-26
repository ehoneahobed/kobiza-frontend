'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMe, clearToken, AuthUser } from '@/lib/auth';
import { getMyMemberships, MyMembership } from '@/lib/community';
import { getMyEnrollments, MyEnrollment } from '@/lib/courses';
import { getMyDownloads, MyDownload, formatDownloadPrice } from '@/lib/downloadables';
import { getMyEnrollments as getMyCoachingEnrollments, CoachingEnrollment, formatSessionTime } from '@/lib/coaching';

// ── Nav items ──────────────────────────────────────────────────────────────
const NAV = [
  { label: 'My Learning', href: '/home', icon: '⊞' },
  { label: 'Explore', href: '/explore', icon: '🔍' },
  { label: 'Settings', href: '/home/settings', icon: '⚙' },
];

function Sidebar({ user, onLogout }: { user: AuthUser | null; onLogout: () => void }) {
  return (
    <aside className="w-56 bg-[#1F2937] flex flex-col fixed inset-y-0 left-0 z-20">
      <div className="p-5 border-b border-white/10">
        <Link href="/home" className="text-xl font-bold text-[#0D9488] block">
          Paidli
        </Link>
        <p className="text-xs text-white/40 mt-0.5">Learning Hub</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        {user && (
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#0D9488]/20 flex items-center justify-center text-xs font-bold text-[#0D9488]">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-white/60 truncate">{user.name}</span>
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────
function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.min(Math.round((completed / total) * 100), 100);
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: pct === 100 ? '#0D9488' : 'linear-gradient(90deg, #0D9488, #F59E0B)',
          }}
        />
      </div>
      <span className="text-xs text-[#6B7280] flex-shrink-0 w-20 text-right">
        {completed}/{total} lessons
      </span>
    </div>
  );
}

// ── Empty state with CTA ───────────────────────────────────────────────────
function DiscoverBanner() {
  return (
    <div className="bg-gradient-to-br from-[#1F2937] to-[#0D9488]/80 rounded-2xl p-8 text-white text-center">
      <div className="text-5xl mb-4">🌍</div>
      <h2 className="text-xl font-bold mb-2">Your learning journey starts here</h2>
      <p className="text-white/70 text-sm max-w-md mx-auto mb-6">
        Find creators building courses and communities around what you want to learn.
        Paidli&apos;s accountability track means you get <strong className="text-[#F59E0B]">real coaching</strong>,
        not just videos.
      </p>
      <Link
        href="/explore"
        className="inline-flex items-center gap-2 bg-[#F59E0B] text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-amber-500 transition-colors"
      >
        <span>🔍</span>
        <span>Explore Creators &amp; Communities</span>
      </Link>

      {/* Pill features */}
      <div className="flex flex-wrap gap-2 justify-center mt-6">
        {['⚡ Accountability Coaching', '🎓 Expert-led Courses', '👥 Engaged Communities', '📥 Downloadable Resources'].map((f) => (
          <span key={f} className="text-xs bg-white/10 text-white/70 px-3 py-1.5 rounded-full">
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Community card ─────────────────────────────────────────────────────────
function CommunityCard({ membership }: { membership: MyMembership }) {
  const { community } = membership;
  return (
    <Link
      href={`/${community.slug}/community`}
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden"
    >
      {/* Accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-[#0D9488] to-[#38BDF8]" />
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0D9488] to-teal-700 flex items-center justify-center text-base font-bold text-white flex-shrink-0">
            {community.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#1F2937] text-sm truncate group-hover:text-[#0D9488] transition-colors">
              {community.name}
            </p>
            <p className="text-xs text-[#6B7280]">by {community.creatorName}</p>
          </div>
        </div>
        {community.description && (
          <p className="text-xs text-[#6B7280] line-clamp-2 mb-3">{community.description}</p>
        )}
        <div className="flex gap-3 text-xs text-[#6B7280] pt-2 border-t border-[#F3F4F6]">
          <span>🎓 {community._count.courses} courses</span>
          <span>💬 {community._count.posts} posts</span>
        </div>
      </div>
    </Link>
  );
}

// ── Enrollment card ────────────────────────────────────────────────────────
function EnrollmentCard({ enrollment }: { enrollment: MyEnrollment }) {
  const { course, progress, firstLessonId, track } = enrollment;
  const isComplete = progress.total > 0 && progress.completed >= progress.total;
  const href = progress.completed > 0 || !firstLessonId
    ? `/learn/${course.id}`
    : `/learn/${course.id}/${firstLessonId}`;

  const ctaLabel = isComplete ? 'Review' : progress.completed > 0 ? 'Continue →' : 'Start →';
  const ctaBg = isComplete ? '#6B7280' : '#0D9488';

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Top accent */}
      <div
        className="h-1.5"
        style={{
          background: track === 'ACCOUNTABILITY'
            ? 'linear-gradient(90deg, #F59E0B, #EF4444)'
            : 'linear-gradient(90deg, #0D9488, #38BDF8)',
        }}
      />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center text-xl flex-shrink-0">
            🎓
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#1F2937] text-sm line-clamp-2 leading-snug">{course.title}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">by {course.creatorName}</p>
          </div>
        </div>

        {track === 'ACCOUNTABILITY' && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs bg-[#F59E0B]/10 text-[#F59E0B] px-2 py-0.5 rounded-full font-semibold">
              ⚡ Accountability Track
            </span>
          </div>
        )}

        {isComplete ? (
          <p className="text-xs text-[#0D9488] font-semibold flex items-center gap-1 mt-1">
            ✅ Completed
          </p>
        ) : (
          <ProgressBar completed={progress.completed} total={progress.total} />
        )}

        <Link
          href={href}
          className="mt-4 block text-center text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors hover:opacity-90"
          style={{ background: ctaBg }}
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function MemberHomePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [memberships, setMemberships] = useState<MyMembership[]>([]);
  const [enrollments, setEnrollments] = useState<MyEnrollment[]>([]);
  const [myDownloads, setMyDownloads] = useState<MyDownload[]>([]);
  const [myCoachingEnrollments, setMyCoachingEnrollments] = useState<CoachingEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then((u) => {
        if (u.role === 'CREATOR') { router.replace('/dashboard'); return; }
        setUser(u);
        Promise.all([
          getMyMemberships().catch(() => [] as MyMembership[]),
          getMyEnrollments().catch(() => [] as MyEnrollment[]),
          getMyDownloads().catch(() => [] as MyDownload[]),
          getMyCoachingEnrollments().catch(() => [] as CoachingEnrollment[]),
        ]).then(([m, e, d, b]) => {
          setMemberships(m);
          setEnrollments(e);
          setMyDownloads(d);
          setMyCoachingEnrollments(b);
        });
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => { clearToken(); router.push('/login'); };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasAnything = memberships.length > 0 || enrollments.length > 0 || myDownloads.length > 0 || myCoachingEnrollments.length > 0;

  const inProgress = enrollments.filter(
    (e) => e.progress.completed > 0 && e.progress.total > e.progress.completed,
  );
  const notStarted = enrollments.filter((e) => e.progress.completed === 0);
  const completed = enrollments.filter(
    (e) => e.progress.total > 0 && e.progress.completed >= e.progress.total,
  );

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="flex-1 ml-56">
        {/* Top bar */}
        <div className="bg-white border-b border-[#F3F4F6] px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1F2937]">
              Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''} 👋
            </h1>
            <p className="text-xs text-[#6B7280] mt-0.5">Your learning hub</p>
          </div>
          <Link
            href="/explore"
            className="flex items-center gap-2 bg-[#F59E0B] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-amber-500 transition-colors"
          >
            <span>🔍</span>
            <span className="hidden sm:block">Explore</span>
          </Link>
        </div>

        <div className="px-8 py-8 space-y-10 max-w-4xl">

          {/* ── Empty state: discover banner ── */}
          {!hasAnything && (
            <DiscoverBanner />
          )}

          {/* ── Continue Learning (in-progress) ── */}
          {inProgress.length > 0 && (
            <section>
              <SectionHeader title="Continue Learning" icon="▶️" />
              <div className="grid gap-4 sm:grid-cols-2">
                {inProgress.map((e) => <EnrollmentCard key={e.id} enrollment={e} />)}
              </div>
            </section>
          )}

          {/* ── My Communities ── */}
          <section>
            <SectionHeader
              title="My Communities"
              icon="👥"
              count={memberships.length}
              action={memberships.length > 0 ? { label: 'Explore more', href: '/explore' } : undefined}
            />
            {memberships.length === 0 ? (
              <EmptyCard
                icon="👥"
                title="No communities yet"
                description="Join a creator's community to access their discussions, courses, and accountability coaching."
                cta={{ label: 'Browse Communities →', href: '/explore' }}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {memberships.map((m) => <CommunityCard key={m.id} membership={m} />)}
              </div>
            )}
          </section>

          {/* ── My Courses ── */}
          <section>
            <SectionHeader
              title="My Courses"
              icon="🎓"
              count={enrollments.length}
              action={enrollments.length > 0 ? { label: 'Explore courses', href: '/explore' } : undefined}
            />
            {enrollments.length === 0 ? (
              <EmptyCard
                icon="🎓"
                title="No courses yet"
                description="Enroll in a course — choose Self-paced or Accountability Track for real coaching alongside your learning."
                cta={{ label: 'Find Courses →', href: '/explore' }}
                badge="⚡ Accountability Track available"
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {notStarted.map((e) => <EnrollmentCard key={e.id} enrollment={e} />)}
                {completed.map((e) => <EnrollmentCard key={e.id} enrollment={e} />)}
              </div>
            )}
          </section>

          {/* ── My Downloads ── */}
          {myDownloads.length > 0 && (
            <section>
              <SectionHeader
                title="My Downloads"
                icon="📥"
                count={myDownloads.length}
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myDownloads.map((d) => (
                  <a
                    key={d.id}
                    href={d.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group"
                  >
                    {d.downloadable.coverUrl ? (
                      <img
                        src={d.downloadable.coverUrl}
                        alt={d.downloadable.title}
                        className="w-full h-28 object-cover"
                      />
                    ) : (
                      <div className="w-full h-28 bg-gradient-to-br from-[#0D9488]/10 to-[#38BDF8]/10 flex items-center justify-center text-4xl">
                        📥
                      </div>
                    )}
                    <div className="p-4 flex flex-col flex-1">
                      <p className="font-bold text-[#1F2937] text-sm group-hover:text-[#0D9488] transition-colors line-clamp-2 mb-1">
                        {d.downloadable.title}
                      </p>
                      <p className="text-xs text-[#6B7280] mb-3">
                        by {d.downloadable.creatorName}
                      </p>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-xs text-[#6B7280]">
                          {formatDownloadPrice(d.downloadable.price, d.downloadable.currency)}
                        </span>
                        <span className="text-xs bg-[#0D9488]/10 text-[#0D9488] font-semibold px-2.5 py-1 rounded-full">
                          ⬇ Download
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* ── Coaching & Sessions ── */}
          <section>
            <SectionHeader
              title="Coaching &amp; Sessions"
              icon="📅"
              count={myCoachingEnrollments.length}
              action={myCoachingEnrollments.length > 0 ? { label: 'Explore coaching', href: '/explore' } : undefined}
            />
            {myCoachingEnrollments.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#0D9488]/10 flex items-center justify-center text-2xl flex-shrink-0">
                  📅
                </div>
                <div>
                  <p className="font-semibold text-[#1F2937] text-sm">No coaching programs yet</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Enroll in a coaching program from any creator&apos;s profile.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {myCoachingEnrollments.map((enrollment) => {
                  const program = enrollment.program;
                  const creatorSlug = program?.creatorProfile?.slug;
                  const nextSession = enrollment.sessions?.[0];
                  const canBook = creatorSlug && program?.id && (
                    enrollment.format === 'FIXED_PACKAGE' || enrollment.format === 'SUBSCRIPTION'
                  );
                  return (
                    <Link
                      key={enrollment.id}
                      href={`/learn/coaching/${enrollment.id}`}
                      className="bg-white rounded-2xl shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-all"
                    >
                      <div className="w-11 h-11 rounded-xl bg-[#0D9488]/10 flex items-center justify-center text-xl flex-shrink-0">
                        📅
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#1F2937] text-sm truncate">{program?.title ?? '—'}</p>
                        {program?.creatorProfile?.user.name && (
                          <p className="text-xs text-[#6B7280]">by {program.creatorProfile.user.name}</p>
                        )}
                        {nextSession ? (
                          <p className="text-xs text-[#0D9488] font-semibold mt-1">
                            Next: {formatSessionTime(nextSession.startsAt, nextSession.endsAt)}
                          </p>
                        ) : enrollment.sessionsIncluded != null ? (
                          <p className="text-xs text-[#6B7280] mt-1">
                            {enrollment.sessionsIncluded - enrollment.sessionsUsed} sessions remaining
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {nextSession?.meetingUrl && (
                          <a
                            href={nextSession.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 bg-[#0D9488] text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-teal-700 transition-colors"
                          >
                            Join →
                          </a>
                        )}
                        {canBook && (
                          <Link
                            href={`/${creatorSlug}/coaching/${program!.id}`}
                            className="flex-shrink-0 text-teal-600 text-xs font-medium px-3 py-2 rounded-xl border border-teal-200 hover:bg-teal-50 transition-colors text-center"
                          >
                            Book
                          </Link>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────

function SectionHeader({
  title,
  icon,
  count,
  action,
}: {
  title: string;
  icon: string;
  count?: number;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h2 className="font-bold text-[#1F2937] text-base">{title}</h2>
        {count !== undefined && count > 0 && (
          <span className="text-xs bg-[#0D9488]/10 text-[#0D9488] font-bold px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {action && (
        <Link href={action.href} className="text-sm text-[#0D9488] hover:underline font-medium">
          {action.label} →
        </Link>
      )}
    </div>
  );
}

function EmptyCard({
  icon,
  title,
  description,
  cta,
  badge,
}: {
  icon: string;
  title: string;
  description: string;
  cta: { label: string; href: string };
  badge?: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
      <div className="w-14 h-14 rounded-2xl bg-[#F3F4F6] flex items-center justify-center text-3xl flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[#1F2937] mb-1">{title}</p>
        <p className="text-sm text-[#6B7280] mb-2">{description}</p>
        {badge && (
          <span className="text-xs bg-[#F59E0B]/10 text-[#F59E0B] font-semibold px-2.5 py-1 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <Link
        href={cta.href}
        className="flex-shrink-0 bg-[#0D9488] text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-teal-700 transition-colors"
      >
        {cta.label}
      </Link>
    </div>
  );
}
