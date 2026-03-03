'use client';

import Link from 'next/link';
import { Lesson } from '@/lib/courses';

interface LessonNavigationProps {
  courseId: string;
  prevLesson: Lesson | null;
  nextLesson: Lesson | null;
}

export default function LessonNavigation({ courseId, prevLesson, nextLesson }: LessonNavigationProps) {
  return (
    <div className="flex items-center justify-between pt-6 border-t border-[#F3F4F6]">
      {prevLesson ? (
        <Link
          href={`/learn/${courseId}/${prevLesson.id}`}
          className="text-sm text-[#6B7280] hover:text-[#1F2937] flex items-center gap-2 transition-colors group max-w-[45%]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
            <path d="M13 8H3M3 8L7 4M3 8L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="truncate">{prevLesson.title}</span>
        </Link>
      ) : (
        <div />
      )}
      {nextLesson && (
        <Link
          href={`/learn/${courseId}/${nextLesson.id}`}
          className="text-sm font-semibold text-[#0D9488] hover:text-teal-700 flex items-center gap-2 transition-colors group max-w-[45%]"
        >
          <span className="truncate">{nextLesson.title}</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
            <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </div>
  );
}
