'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMe, clearToken, AuthUser } from '@/lib/auth';
import { getMyDownloads, MyDownload, formatDownloadPrice } from '@/lib/downloadables';

// ── Nav items (same as home page) ────────────────────────────────────────
const NAV = [
  { label: 'My Learning', href: '/home', icon: '\u229E' },
  { label: 'Downloads', href: '/home/downloads', icon: '\uD83D\uDCE5' },
  { label: 'Messages', href: '/home/messages', icon: '\u2709' },
  { label: 'Explore', href: '/explore', icon: '\uD83D\uDD0D' },
  { label: 'Settings', href: '/home/settings', icon: '\u2699' },
];

function Sidebar({
  user,
  onLogout,
  collapsed,
  onToggle,
}: {
  user: AuthUser | null;
  onLogout: () => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`bg-[#1F2937] flex flex-col fixed inset-y-0 left-0 z-30 transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-56'
        } ${collapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}`}
      >
        <div className={`border-b border-white/10 flex items-center ${collapsed ? 'p-3 justify-center' : 'p-5 justify-between'}`}>
          <Link href="/home" className={collapsed ? 'text-lg font-bold text-[#0D9488]' : 'text-xl font-bold text-[#0D9488] block'}>
            {collapsed ? 'K' : 'Kobiza'}
          </Link>
          <button
            onClick={onToggle}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}>
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {user?.role === 'CREATOR' && (
            <>
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 rounded-lg text-sm font-semibold text-[#0D9488] bg-[#0D9488]/10 hover:bg-[#0D9488]/20 transition-colors ${
                  collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
                }`}
                title={collapsed ? 'Creator Dashboard' : undefined}
              >
                <span className="text-base flex-shrink-0">{'\uD83C\uDFA8'}</span>
                {!collapsed && 'Creator Dashboard'}
              </Link>
              <div className="my-1.5 border-t border-white/10" />
            </>
          )}
          {NAV.map((item) => {
            const isActive = item.href === '/home/downloads';
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white bg-white/10'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                } ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          {user && (
            <div className={`flex items-center gap-2 py-2 mb-1 ${collapsed ? 'justify-center px-0' : 'px-3'}`}>
              <div className="w-7 h-7 rounded-full bg-[#0D9488]/20 flex items-center justify-center text-xs font-bold text-[#0D9488] flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {!collapsed && (
                <span className="text-xs text-white/60 truncate">{user.name}</span>
              )}
            </div>
          )}
          <button
            onClick={onLogout}
            className={`w-full text-left rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors ${
              collapsed ? 'px-2 py-2.5 text-center' : 'px-3 py-2.5'
            }`}
            title={collapsed ? 'Log out' : undefined}
          >
            {collapsed ? '\u21AA' : 'Log out'}
          </button>
        </div>
      </aside>
    </>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function MyDownloadsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [downloads, setDownloads] = useState<MyDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarCollapsed((p) => !p), []);

  useEffect(() => {
    getMe()
      .then((u) => {
        setUser(u);
        return getMyDownloads().catch(() => [] as MyDownload[]);
      })
      .then(setDownloads)
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => { clearToken(); router.push('/login'); };

  const filtered = useMemo(() => {
    if (!search.trim()) return downloads;
    const q = search.toLowerCase();
    return downloads.filter(
      (d) =>
        d.downloadable.title.toLowerCase().includes(q) ||
        d.downloadable.creatorName.toLowerCase().includes(q),
    );
  }, [downloads, search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex">
      <Sidebar user={user} onLogout={handleLogout} collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      <main className={`flex-1 min-w-0 transition-all duration-200 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-56'}`}>
        {/* Top bar */}
        <div className="bg-white border-b border-[#F3F4F6] px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#1F2937]">
                My Downloads
                {downloads.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-[#6B7280]">({downloads.length})</span>
                )}
              </h1>
              <p className="text-xs text-[#6B7280] mt-0.5">All your past downloads in one place</p>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-8 py-8">
          {/* Search */}
          {downloads.length > 0 && (
            <div className="mb-6">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or creator..."
                className="w-full max-w-md border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              />
            </div>
          )}

          {/* Empty state */}
          {downloads.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">{'\uD83D\uDCE5'}</div>
              <h2 className="text-xl font-bold text-[#1F2937] mb-2">No downloads yet</h2>
              <p className="text-[#6B7280] text-sm max-w-sm mx-auto mb-6">
                Once you claim or purchase digital downloads, they&apos;ll appear here for easy re-downloading.
              </p>
              <Link
                href="/explore"
                className="bg-[#0D9488] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors"
              >
                Explore creators
              </Link>
            </div>
          )}

          {/* No search results */}
          {downloads.length > 0 && filtered.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <p className="text-[#6B7280] text-sm">No downloads match &quot;{search}&quot;</p>
            </div>
          )}

          {/* Grid */}
          {filtered.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((d) => (
                <div
                  key={d.id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col"
                >
                  {d.downloadable.coverUrl ? (
                    <img
                      src={d.downloadable.coverUrl}
                      alt={d.downloadable.title}
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-[#0D9488]/10 to-[#38BDF8]/10 flex items-center justify-center text-5xl">
                      {'\uD83D\uDCE5'}
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-[#1F2937] text-sm line-clamp-2 mb-1">
                      {d.downloadable.title}
                    </h3>
                    <p className="text-xs text-[#6B7280] mb-2">
                      by {d.downloadable.creatorName}
                    </p>
                    {d.downloadable.formatInfo && (
                      <span className="inline-block text-xs bg-[#0D9488]/10 text-[#0D9488] font-medium px-2 py-0.5 rounded-full mb-3 self-start">
                        {d.downloadable.formatInfo}
                      </span>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-[#F3F4F6]">
                      <div className="text-xs text-[#6B7280] space-y-0.5">
                        <p>{new Date(d.grantedAt).toLocaleDateString()}</p>
                        <p>{formatDownloadPrice(d.downloadable.price, d.downloadable.currency)}</p>
                      </div>
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#0D9488] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-teal-700 transition-colors"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
