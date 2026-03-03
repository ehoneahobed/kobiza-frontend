'use client';

interface PlayerTopBarProps {
  courseTitle: string;
  isAccountabilityTrack: boolean;
  completedCount: number;
  totalCount: number;
  onBack: () => void;
  onMenuToggle: () => void;
}

export default function PlayerTopBar({
  courseTitle,
  isAccountabilityTrack,
  completedCount,
  totalCount,
  onBack,
  onMenuToggle,
}: PlayerTopBarProps) {
  const pct = totalCount === 0 ? 0 : Math.min(Math.round((completedCount / totalCount) * 100), 100);

  return (
    <header className="flex-shrink-0 relative">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 bg-[#1F2937] border-b border-white/10">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          onClick={onBack}
          className="text-white/60 hover:text-white text-sm transition-colors hidden sm:block"
        >
          &larr; Dashboard
        </button>
        <span className="text-white/20 hidden sm:block">|</span>
        <span className="text-white font-semibold text-sm truncate flex-1">{courseTitle}</span>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
            isAccountabilityTrack
              ? 'bg-amber-400/20 text-amber-300'
              : 'bg-teal-400/20 text-teal-300'
          }`}
        >
          {isAccountabilityTrack ? 'Accountability' : 'Self-Paced'}
        </span>
      </div>
      {/* Thin progress strip */}
      <div className="h-0.5 bg-white/5">
        <div
          className="h-full bg-[#0D9488] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </header>
  );
}
