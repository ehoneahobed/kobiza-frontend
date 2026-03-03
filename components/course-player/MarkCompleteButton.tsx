'use client';

import { useState } from 'react';

interface MarkCompleteButtonProps {
  isCompleted: boolean;
  isAccountabilityTrack: boolean;
  requiresDeliverable: boolean;
  hasSubmission: boolean;
  onMarkComplete: () => Promise<void>;
  onUnmark: () => Promise<void>;
}

export default function MarkCompleteButton({
  isCompleted,
  isAccountabilityTrack,
  requiresDeliverable,
  hasSubmission,
  onMarkComplete,
  onUnmark,
}: MarkCompleteButtonProps) {
  const [loading, setLoading] = useState(false);

  // Accountability track + deliverable required + not submitted yet → hide button (form is CTA)
  if (isAccountabilityTrack && requiresDeliverable && !hasSubmission) {
    return null;
  }

  const handleClick = async () => {
    setLoading(true);
    try {
      if (isCompleted) {
        await onUnmark();
      } else {
        await onMarkComplete();
      }
    } finally {
      setLoading(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          disabled
          className="flex-1 py-3 rounded-xl border-2 border-[#0D9488]/30 text-[#0D9488] font-semibold text-sm cursor-default flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <circle cx="9" cy="9" r="8" fill="#0D9488" />
            <path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          Completed
        </button>
        <button
          onClick={handleClick}
          disabled={loading}
          className="text-xs text-[#6B7280] hover:text-[#EF4444] transition-colors px-3 py-2 disabled:opacity-50"
        >
          Undo
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="mt-8 w-full bg-[#0D9488] text-white font-semibold py-3.5 rounded-xl hover:bg-teal-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          Mark as Complete & Continue
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </>
      )}
    </button>
  );
}
