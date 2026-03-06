'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMyMemberships, MyMembership } from '@/lib/community';

interface CommunitySwitcherProps {
  currentCommunityId: string;
  currentCommunityName: string;
  brandColor: string;
  isCreator: boolean;
}

export default function CommunitySwitcher({
  currentCommunityId,
  currentCommunityName,
  brandColor,
  isCreator,
}: CommunitySwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [memberships, setMemberships] = useState<MyMembership[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch memberships when dropdown opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getMyMemberships()
      .then(setMemberships)
      .catch(() => setMemberships([]))
      .finally(() => setLoading(false));
  }, [open]);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [open]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const filtered = memberships.filter((m) =>
    m.community.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[#1F2937] font-bold text-base hover:opacity-80 transition-opacity"
      >
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: brandColor }}
        >
          {currentCommunityName.charAt(0).toUpperCase()}
        </span>
        {currentCommunityName}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-4 h-4 text-[#6B7280] transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-[#E5E7EB] z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-[#F3F4F6]">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search communities..."
              className="w-full px-3 py-2 text-sm rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] placeholder-[#9CA3AF]"
            />
          </div>

          {/* Community list */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-[#9CA3AF]">
                {search ? 'No communities found' : 'No communities joined yet'}
              </div>
            ) : (
              filtered.map((m) => {
                const isActive = m.community.id === currentCommunityId;
                return (
                  <button
                    key={m.community.id}
                    onClick={() => {
                      setOpen(false);
                      if (!isActive) {
                        router.push(`/${m.community.slug}/community`);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#F9FAFB] transition-colors ${
                      isActive ? 'bg-[#FFFBEB]' : ''
                    }`}
                  >
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: isActive ? '#F59E0B' : '#0D9488' }}
                    >
                      {m.community.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-semibold truncate ${isActive ? 'text-[#B45309]' : 'text-[#1F2937]'}`}>
                        {m.community.name}
                      </div>
                      <div className="text-xs text-[#9CA3AF] truncate">
                        by {m.community.creatorName}
                      </div>
                    </div>
                    {isActive && (
                      <span className="text-xs text-[#F59E0B] font-medium flex-shrink-0">Current</span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Action links */}
          <div className="border-t border-[#F3F4F6] p-2 flex flex-col gap-1">
            {isCreator && (
              <Link
                href="/dashboard/community"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#0D9488] hover:bg-[#F0FDFA] rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                Create a community
              </Link>
            )}
            <Link
              href="/explore"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[#6B7280] hover:bg-[#F9FAFB] rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Discover communities
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
