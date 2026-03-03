'use client';

import { useState, useEffect } from 'react';
import LessonListItem from './LessonListItem';
import { Lesson, LessonSubmission } from '@/lib/courses';

interface ModuleAccordionProps {
  moduleId: string;
  title: string;
  lessons: Lesson[];
  courseId: string;
  currentLessonId: string;
  completedLessonIds: Set<string>;
  submissions?: LessonSubmission[];
  isAccountabilityTrack: boolean;
}

function getLessonStatus(
  lesson: Lesson,
  currentLessonId: string,
  completedLessonIds: Set<string>,
  submissions: LessonSubmission[] | undefined,
  isAccountabilityTrack: boolean,
): 'completed' | 'current' | 'incomplete' | 'submitted' | 'reviewed' {
  if (lesson.id === currentLessonId) return 'current';
  if (completedLessonIds.has(lesson.id)) return 'completed';

  if (isAccountabilityTrack && lesson.requiresDeliverable) {
    const sub = submissions?.find((s) => s.lessonId === lesson.id);
    if (sub?.status === 'REVIEWED') return 'reviewed';
    if (sub?.status === 'SUBMITTED') return 'submitted';
  }

  return 'incomplete';
}

export default function ModuleAccordion({
  moduleId,
  title,
  lessons,
  courseId,
  currentLessonId,
  completedLessonIds,
  submissions,
  isAccountabilityTrack,
}: ModuleAccordionProps) {
  const hasCurrentLesson = lessons.some((l) => l.id === currentLessonId);
  const [open, setOpen] = useState(hasCurrentLesson);

  useEffect(() => {
    if (hasCurrentLesson) setOpen(true);
  }, [hasCurrentLesson]);

  const completedCount = lessons.filter((l) => completedLessonIds.has(l.id)).length;
  const totalCount = lessons.length;
  const allDone = completedCount === totalCount && totalCount > 0;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="currentColor"
            className={`text-white/40 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
          >
            <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wider truncate">
            {title}
          </span>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
            allDone
              ? 'bg-[#0D9488]/20 text-[#0D9488]'
              : 'bg-white/10 text-white/40'
          }`}
        >
          {completedCount}/{totalCount}
        </span>
      </button>

      {open && (
        <div>
          {lessons.map((lesson) => (
            <LessonListItem
              key={lesson.id}
              lessonId={lesson.id}
              courseId={courseId}
              title={lesson.title}
              status={getLessonStatus(lesson, currentLessonId, completedLessonIds, submissions, isAccountabilityTrack)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
