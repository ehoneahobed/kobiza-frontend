'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMe, AuthUser } from '@/lib/auth';
import {
  getMyProfile,
  getDashboardStats,
  getRecentActivity,
  CreatorProfile,
  DashboardStats,
  ActivityItem,
} from '@/lib/creator';
import { formatPrice } from '@/lib/creator';
import { CopyLinkButton } from '@/components/ui/CopyLinkButton';

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const ACTIVITY_ICONS: Record<ActivityItem['type'], string> = {
  enrollment: '🎓',
  download: '📥',
  coaching: '📅',
  membership: '👥',
};

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  sub,
}: {
  label: string;
  value: string | number;
  icon: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 flex items-center justify-center text-xl">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-[#1F2937] mb-0.5">{value}</p>
      <p className="text-sm text-[#6B7280]">{label}</p>
      {sub && <p className="text-xs text-[#0D9488] mt-1">{sub}</p>}
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#F3F4F6] last:border-0">
      <div className="w-8 h-8 rounded-full bg-[#0D9488]/10 flex items-center justify-center text-sm font-bold text-[#0D9488] flex-shrink-0 overflow-hidden">
        {item.user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.user.avatarUrl} alt={item.user.name} className="w-full h-full object-cover" />
        ) : (
          item.user.name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#1F2937]">
          <span className="font-medium">{item.user.name}</span>
          {' '}{item.label}{' '}
          <span className="font-medium truncate">{item.title}</span>
        </p>
        <p className="text-xs text-[#6B7280] mt-0.5">{timeAgo(item.at)}</p>
      </div>
      <span className="text-base flex-shrink-0">{ACTIVITY_ICONS[item.type]}</span>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMe(), getMyProfile(), getDashboardStats(), getRecentActivity()])
      .then(([u, p, s, a]) => {
        setUser(u);
        setProfile(p);
        setStats(s);
        setActivity(a);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasCommunity = (profile?.communities?.length ?? 0) > 0;
  const slug = profile?.slug ?? '';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://paidli.com';
  const storefrontUrl = `${origin}/${slug}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-[#6B7280] mt-1 text-sm">Here&apos;s your creator overview.</p>
        </div>
        {slug && (
          <div className="flex items-center gap-2">
            <CopyLinkButton url={storefrontUrl} size="md" />
            <Link
              href={`/${slug}`}
              target="_blank"
              className="text-sm text-[#0D9488] border border-[#0D9488] rounded-xl px-4 py-2 hover:bg-teal-50 transition-colors"
            >
              View storefront ↗
            </Link>
          </div>
        )}
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Active Members" value={stats.totalMembers} icon="👥" />
          <StatCard label="Course Enrollments" value={stats.totalEnrollments} icon="🎓" />
          <StatCard label="Downloads" value={stats.totalDownloads} icon="📥" />
          <StatCard label="Coaching Bookings" value={stats.totalBookings} icon="📅" />
          <StatCard
            label="Total Revenue"
            value={formatPrice(stats.totalRevenue, 'USD')}
            icon="💰"
            sub={
              stats.revenueThisMonth > 0
                ? `${formatPrice(stats.revenueThisMonth, 'USD')} this month`
                : undefined
            }
          />
          <StatCard
            label="This Month"
            value={formatPrice(stats.revenueThisMonth, 'USD')}
            icon="📈"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick actions */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="font-bold text-[#1F2937] text-sm uppercase tracking-wide">Quick Actions</h2>

          {[
            { label: 'Create a Course', sub: 'Dual-track pricing', href: '/dashboard/courses', icon: '🎓' },
            { label: 'Add a Download', sub: 'PDFs, templates, tools', href: '/dashboard/downloads', icon: '📥' },
            { label: 'New Coaching Program', sub: '1-on-1 or group sessions', href: '/dashboard/coaching', icon: '📅' },
            { label: 'Manage Community', sub: 'Feed, tiers & settings', href: '/dashboard/community', icon: '👥' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-[#0D9488]/10 transition-colors">
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#1F2937] group-hover:text-[#0D9488] transition-colors">
                  {action.label}
                </p>
                <p className="text-xs text-[#6B7280]">{action.sub}</p>
              </div>
              <span className="text-[#6B7280] group-hover:text-[#0D9488] transition-colors text-sm">→</span>
            </Link>
          ))}

          {/* Shareable links */}
          {slug && (
            <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
              <h3 className="font-bold text-[#1F2937] text-sm mb-3">Your Links</h3>
              {[
                { label: 'Storefront', path: `/${slug}` },
                { label: 'Community', path: `/${slug}/community` },
                { label: 'Explore', path: '/explore' },
              ].map(({ label, path }) => (
                <div key={path} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-[#6B7280] truncate">{label}</span>
                  <CopyLinkButton url={`${origin}${path}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
              <span>Recent Activity</span>
              {activity.length > 0 && (
                <span className="text-xs bg-[#0D9488]/10 text-[#0D9488] px-2 py-0.5 rounded-full font-normal">
                  {activity.length}
                </span>
              )}
            </h2>

            {activity.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">📭</div>
                <p className="font-medium text-[#1F2937] text-sm mb-1">No activity yet</p>
                <p className="text-xs text-[#6B7280]">
                  When members enroll, download, or book sessions, they&apos;ll appear here.
                </p>
              </div>
            ) : (
              <div>
                {activity.map((item, i) => (
                  <ActivityRow key={i} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Setup checklist */}
      {!hasCommunity && (
        <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-[#F59E0B]">
          <h2 className="font-bold text-[#1F2937] mb-4">🚀 Complete your setup</h2>
          <div className="space-y-3">
            {[
              { label: 'Set up your public profile', href: '/dashboard/settings', done: !!profile?.bio },
              { label: 'Create your community', href: '/dashboard/community', done: hasCommunity },
              { label: 'Create your first course', href: '/dashboard/courses', done: (stats?.totalEnrollments ?? 0) > 0 },
            ].map((step) => (
              <Link
                key={step.label}
                href={step.href}
                className={`flex items-center gap-3 p-3 rounded-lg hover:bg-[#F3F4F6] transition-colors ${
                  step.done ? 'opacity-50' : ''
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs ${
                    step.done ? 'bg-[#0D9488] border-[#0D9488] text-white' : 'border-[#6B7280]'
                  }`}
                >
                  {step.done ? '✓' : ''}
                </span>
                <span className={`text-[#1F2937] text-sm ${step.done ? 'line-through' : ''}`}>
                  {step.label}
                </span>
                <span className="ml-auto text-[#6B7280]">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
