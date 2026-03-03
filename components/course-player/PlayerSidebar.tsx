'use client';

import ProgressRing from './ProgressRing';
import ModuleAccordion from './ModuleAccordion';
import { Course, LessonSubmission } from '@/lib/courses';

interface PlayerSidebarProps {
  course: Course;
  currentLessonId: string;
  completedLessonIds: Set<string>;
  submissions?: LessonSubmission[];
  isAccountabilityTrack: boolean;
}

export default function PlayerSidebar({
  course,
  currentLessonId,
  completedLessonIds,
  submissions,
  isAccountabilityTrack,
}: PlayerSidebarProps) {
  const allLessons = course.modules?.flatMap((m) => m.lessons) ?? [];
  const totalCount = allLessons.length;
  const completedCount = allLessons.filter((l) => completedLessonIds.has(l.id)).length;

  return (
    <div className="h-full flex flex-col">
      {/* Progress header */}
      <div className="px-4 py-5 flex flex-col items-center border-b border-white/10">
        <ProgressRing completed={completedCount} total={totalCount} />
        <p className="text-white font-semibold text-sm mt-3 text-center line-clamp-2">{course.title}</p>
        <p className="text-white/40 text-xs mt-1">
          {completedCount}/{totalCount} lessons done
        </p>
      </div>

      {/* Module list */}
      <div className="flex-1 overflow-y-auto">
        {course.modules?.map((mod) => (
          <ModuleAccordion
            key={mod.id}
            moduleId={mod.id}
            title={mod.title}
            lessons={mod.lessons}
            courseId={course.id}
            currentLessonId={currentLessonId}
            completedLessonIds={completedLessonIds}
            submissions={submissions}
            isAccountabilityTrack={isAccountabilityTrack}
          />
        ))}
      </div>
    </div>
  );
}
