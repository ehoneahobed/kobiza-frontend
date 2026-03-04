'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  getDownloadableAnalytics,
  getDownloadableAccesses,
  downloadAccessesCsv,
  formatDownloadPrice,
  DownloadableAnalytics,
  DownloadableAccessUser,
} from '@/lib/downloadables';

export default function DownloadableDetailPage() {
  const { downloadableId } = useParams<{ downloadableId: string }>();

  const [analytics, setAnalytics] = useState<DownloadableAnalytics | null>(null);
  const [accesses, setAccesses] = useState<DownloadableAccessUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const limit = 20;

  useEffect(() => {
    getDownloadableAnalytics(downloadableId)
      .then(setAnalytics)
      .finally(() => setLoading(false));
  }, [downloadableId]);

  const fetchAccesses = useCallback(() => {
    getDownloadableAccesses(downloadableId, page, limit, search || undefined).then(
      (res) => {
        setAccesses(res.accesses);
        setTotal(res.total);
        setHasMore(res.hasMore);
      },
    );
  }, [downloadableId, page, search]);

  useEffect(() => {
    fetchAccesses();
  }, [fetchAccesses]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadAccessesCsv(downloadableId);
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-20">
        <p className="text-[#6B7280]">Downloadable not found.</p>
        <Link href="/dashboard/downloads" className="text-[#0D9488] text-sm mt-2 inline-block">
          Back to Downloads
        </Link>
      </div>
    );
  }

  const maxDaily = Math.max(...analytics.daily.map((d) => d.count), 1);

  return (
    <div>
      {/* Back link */}
      <Link
        href="/dashboard/downloads"
        className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#0D9488] transition-colors mb-6"
      >
        &larr; Back to Downloads
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-[#1F2937]">{analytics.title}</h1>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                analytics.isPublished
                  ? 'bg-teal-50 text-[#0D9488]'
                  : 'bg-[#F3F4F6] text-[#6B7280]'
              }`}
            >
              {analytics.isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
          <p className="text-sm text-[#6B7280]">
            {formatDownloadPrice(analytics.price, analytics.currency)}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 bg-[#0D9488] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors disabled:opacity-60"
        >
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Downloads" value={analytics.totalAccesses} icon="📥" />
        <StatCard label="Last 30 Days" value={analytics.last30Days} icon="📈" />
        <StatCard
          label="Price"
          value={formatDownloadPrice(analytics.price, analytics.currency)}
          icon="💰"
        />
      </div>

      {/* 30-day trend */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <h2 className="text-sm font-semibold text-[#1F2937] mb-4">Downloads — Last 30 Days</h2>
        <div className="flex items-end gap-[3px] h-32">
          {analytics.daily.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center group relative">
              <div
                className="w-full bg-[#0D9488] rounded-t-sm min-h-[2px] transition-all"
                style={{ height: `${(d.count / maxDaily) * 100}%` }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-[#1F2937] text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap z-10">
                {d.date}: {d.count}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-[#9CA3AF]">
          <span>{analytics.daily[0]?.date}</span>
          <span>{analytics.daily[analytics.daily.length - 1]?.date}</span>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#F3F4F6] flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-sm font-semibold text-[#1F2937]">
            Users ({total})
          </h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name or email..."
              className="border border-[#E5E7EB] rounded-xl px-4 py-2 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] w-64"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {accesses.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#6B7280]">
            {search ? 'No users match your search.' : 'No downloads yet.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[#6B7280] border-b border-[#F3F4F6]">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Opt-In</th>
                <th className="px-5 py-3 font-medium">Download Date</th>
              </tr>
            </thead>
            <tbody>
              {accesses.map((a) => (
                <tr key={a.id} className="border-b border-[#F3F4F6] last:border-0 hover:bg-[#F9FAFB]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {a.avatarUrl ? (
                        <img
                          src={a.avatarUrl}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#0D9488]/10 flex items-center justify-center text-xs font-bold text-[#0D9488]">
                          {(a.name ?? a.email)[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-[#1F2937] font-medium">{a.name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[#6B7280]">{a.email}</td>
                  <td className="px-5 py-3 text-[#6B7280]">{a.phone ?? '—'}</td>
                  <td className="px-5 py-3">
                    {a.marketingOptIn === true ? (
                      <span className="text-xs bg-teal-50 text-[#0D9488] font-semibold px-2 py-0.5 rounded-full">Yes</span>
                    ) : a.marketingOptIn === false ? (
                      <span className="text-xs bg-[#F3F4F6] text-[#6B7280] font-medium px-2 py-0.5 rounded-full">No</span>
                    ) : (
                      <span className="text-[#6B7280]">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-[#6B7280]">
                    {new Date(a.grantedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#F3F4F6]">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-sm text-[#0D9488] font-medium disabled:text-[#D1D5DB]"
            >
              &larr; Prev
            </button>
            <span className="text-xs text-[#6B7280]">
              Page {page} of {Math.ceil(total / limit)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
              className="text-sm text-[#0D9488] font-medium disabled:text-[#D1D5DB]"
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 flex items-center justify-center text-xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#1F2937]">{value}</p>
        <p className="text-xs text-[#6B7280]">{label}</p>
      </div>
    </div>
  );
}
