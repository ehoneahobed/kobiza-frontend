'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { listSubmissions, Submission } from '@/lib/deliverables';

function StatusBadge({ status }: { status: 'SUBMITTED' | 'REVIEWED' }) {
  return (
    <span
      className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${
        status === 'REVIEWED'
          ? 'bg-teal-100 text-[#0D9488]'
          : 'bg-amber-100 text-amber-700'
      }`}
    >
      {status === 'REVIEWED' ? '✓ Reviewed' : '⏳ Pending'}
    </span>
  );
}

export default function SubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('all');

  useEffect(() => {
    listSubmissions()
      .then(setSubmissions)
      .catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = submissions.filter((s) => {
    if (filter === 'pending') return s.status === 'SUBMITTED';
    if (filter === 'reviewed') return s.status === 'REVIEWED';
    return true;
  });

  const pendingCount = submissions.filter((s) => s.status === 'SUBMITTED').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Student Submissions</h1>
          <p className="text-[#6B7280] mt-1">
            {submissions.length} total · {pendingCount} awaiting review
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="bg-amber-100 text-amber-700 text-sm font-semibold px-4 py-2 rounded-full">
            {pendingCount} to review
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm w-fit">
        {(['all', 'pending', 'reviewed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === tab
                ? 'bg-[#0D9488] text-white'
                : 'text-[#6B7280] hover:text-[#1F2937]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Submissions list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-lg font-semibold text-[#1F2937] mb-2">
            {filter === 'pending' ? 'No pending submissions' : 'No submissions yet'}
          </h2>
          <p className="text-[#6B7280]">
            {filter === 'pending'
              ? 'All caught up! Check back when students submit new work.'
              : 'Submissions from your accountability-track students will appear here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F3F4F6]">
                <th className="text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide px-6 py-4">
                  Student
                </th>
                <th className="text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide px-6 py-4">
                  Lesson
                </th>
                <th className="text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide px-6 py-4 hidden md:table-cell">
                  Course
                </th>
                <th className="text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide px-6 py-4 hidden sm:table-cell">
                  Submitted
                </th>
                <th className="text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide px-6 py-4">
                  Status
                </th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-[#F3F4F6]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-[#1F2937] text-sm">
                        {sub.enrollment?.user.name ?? '—'}
                      </p>
                      <p className="text-xs text-[#6B7280]">{sub.enrollment?.user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#1F2937]">{sub.lesson?.title ?? '—'}</p>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <p className="text-sm text-[#6B7280]">{sub.enrollment?.course.title ?? '—'}</p>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <p className="text-sm text-[#6B7280]">
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/submissions/${sub.id}`}
                      className={`text-sm font-medium ${
                        sub.status === 'SUBMITTED'
                          ? 'text-[#0D9488] hover:text-teal-700'
                          : 'text-[#6B7280] hover:text-[#1F2937]'
                      } transition-colors`}
                    >
                      {sub.status === 'SUBMITTED' ? 'Review →' : 'View →'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
