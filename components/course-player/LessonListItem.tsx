'use client';

import Link from 'next/link';

type LessonStatus = 'completed' | 'current' | 'incomplete' | 'submitted' | 'reviewed';

interface LessonListItemProps {
  lessonId: string;
  courseId: string;
  title: string;
  status: LessonStatus;
}

function StatusIcon({ status }: { status: LessonStatus }) {
  switch (status) {
    case 'completed':
    case 'reviewed':
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" className="flex-shrink-0">
          <circle cx="9" cy="9" r="8" fill="#0D9488" />
          <path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    case 'current':
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" className="flex-shrink-0">
          <circle cx="9" cy="9" r="7.5" fill="none" stroke="#0D9488" strokeWidth="1.5" />
          <circle cx="9" cy="9" r="4" fill="#0D9488" />
        </svg>
      );
    case 'submitted':
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" className="flex-shrink-0">
          <circle cx="9" cy="9" r="8" fill="#F59E0B" />
          <path d="M9 5.5V9.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M9 9.5L11 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'incomplete':
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" className="flex-shrink-0">
          <circle cx="9" cy="9" r="7.5" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        </svg>
      );
  }
}

export default function LessonListItem({ lessonId, courseId, title, status }: LessonListItemProps) {
  const isCurrent = status === 'current';
  return (
    <Link
      href={`/learn/${courseId}/${lessonId}`}
      className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
        isCurrent
          ? 'bg-white/10 border-l-2 border-l-[#0D9488]'
          : 'border-l-2 border-l-transparent hover:bg-white/5'
      }`}
    >
      <StatusIcon status={status} />
      <span
        className={`text-sm leading-snug truncate ${
          isCurrent ? 'text-white font-medium' : 'text-white/60'
        }`}
      >
        {title}
      </span>
    </Link>
  );
}
