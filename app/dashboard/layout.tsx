'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken } from '@/lib/auth';
import { getMyProfile, CreatorProfile } from '@/lib/creator';
import { getMyPlan, PlanTier } from '@/lib/billing';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: '⊞' },
  { label: 'Community', href: '/dashboard/community', icon: '👥' },
  { label: 'Courses', href: '/dashboard/courses', icon: '🎓' },
  { label: 'Downloads', href: '/dashboard/downloads', icon: '📥' },
  { label: 'Coaching', href: '/dashboard/coaching', icon: '📅' },
  { label: 'Submissions', href: '/dashboard/submissions', icon: '📋' },
  { label: 'AI Architect', href: '/dashboard/courses/ai-architect', icon: '✨', pro: true },
  { label: 'Content Engine', href: '/dashboard/content-engine', icon: '🔄', pro: true },
  { label: 'Billing', href: '/dashboard/billing', icon: '💳' },
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙' },
];

const PLAN_BADGE: Record<PlanTier, { label: string; cls: string }> = {
  FREE: { label: 'Free', cls: 'text-white/40 bg-white/10' },
  STARTER: { label: 'Starter', cls: 'text-amber-300 bg-amber-400/10' },
  PRO: { label: 'Pro ★', cls: 'text-[#0D9488] bg-[#0D9488]/15' },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [planTier, setPlanTier] = useState<PlanTier>('FREE');

  useEffect(() => {
    getMyProfile().then(setProfile).catch(() => {});
    getMyPlan().then((p) => setPlanTier(p.plan)).catch(() => {});
  }, []);

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  const storefront = profile?.slug ? `/${profile.slug}` : null;

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex">
      {/* Sidebar */}
      <aside className="w-60 bg-[#1F2937] flex flex-col fixed inset-y-0 left-0 z-20">
        {/* Logo */}
        <div className="px-6 pt-5 pb-4 border-b border-white/10">
          <Link href="/dashboard" className="text-2xl font-bold text-[#0D9488]">
            Paidli
          </Link>
        </div>

        {/* Creator identity */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#0D9488]/20 flex items-center justify-center text-sm font-bold text-[#0D9488] flex-shrink-0 overflow-hidden">
              {profile?.user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.user.avatarUrl} alt={profile.user.name} className="w-full h-full object-cover" />
              ) : (
                (profile?.user.name ?? '?').charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {profile?.user.name ?? '…'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-white/40 text-xs">Creator</p>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${PLAN_BADGE[planTier].cls}`}>
                  {PLAN_BADGE[planTier].label}
                </span>
              </div>
            </div>
          </div>
          {storefront && (
            <Link
              href={storefront}
              target="_blank"
              className="flex items-center justify-between w-full text-xs text-[#0D9488] bg-[#0D9488]/10 hover:bg-[#0D9488]/20 rounded-lg px-3 py-2 transition-colors"
            >
              <span>View storefront</span>
              <span>↗</span>
            </Link>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            const isProItem = (item as any).pro === true;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#0D9488] text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {isProItem && planTier !== 'PRO' && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-amber-300 bg-amber-400/10">
                    Pro
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-60 p-8">{children}</main>
    </div>
  );
}
