'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getCourse,
  Course,
  Lesson,
  LessonSubmission,
  markLessonComplete,
  unmarkLessonComplete,
} from '@/lib/courses';
import { submitDeliverable } from '@/lib/deliverables';
import { getEmbedUrl } from '@/lib/video';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import PlayerTopBar from '@/components/course-player/PlayerTopBar';
import PlayerSidebar from '@/components/course-player/PlayerSidebar';
import VideoPlayer from '@/components/course-player/VideoPlayer';
import MarkCompleteButton from '@/components/course-player/MarkCompleteButton';
import LessonNavigation from '@/components/course-player/LessonNavigation';
import CourseCompletionModal from '@/components/course-player/CourseCompletionModal';

export default function LessonPlayerPage() {
  const { courseId, lessonId } = useParams();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [submission, setSubmission] = useState<LessonSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Deliverable form state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitForm, setSubmitForm] = useState({ textContent: '', fileUrl: '' });

  useEffect(() => {
    setLoading(true);
    getCourse(courseId as string)
      .then((c) => {
        setCourse(c);
        const lesson =
          c.modules?.flatMap((m) => m.lessons).find((l) => l.id === lessonId) ?? null;
        setCurrentLesson(lesson);

        // Initialize progress from enrollment data
        const ids = new Set(c.enrollment?.progress?.map((p) => p.lessonId) ?? []);
        setCompletedLessonIds(ids);

        if (lesson && c.enrollment?.submissions) {
          const sub =
            c.enrollment.submissions.find((s) => s.lessonId === lesson.id) ?? null;
          setSubmission(sub);
        } else {
          setSubmission(null);
        }
      })
      .catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false));
  }, [courseId, lessonId, router]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable;

      if (isInput) return;

      if (e.key === ']' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (nextLesson) router.push(`/learn/${courseId}/${nextLesson.id}`);
      } else if (e.key === '[' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (prevLesson) router.push(`/learn/${courseId}/${prevLesson.id}`);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        if (currentLesson) handleToggleComplete();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const allLessons = course?.modules?.flatMap((m) => m.lessons) ?? [];
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const handleMarkComplete = useCallback(async () => {
    if (!courseId || !lessonId) return;

    // Optimistic update
    setCompletedLessonIds((prev) => new Set([...prev, lessonId as string]));

    try {
      const result = await markLessonComplete(courseId as string, lessonId as string);
      if (result.courseCompleted) {
        setShowCompletion(true);
      } else if (nextLesson) {
        // Auto-navigate to next incomplete lesson after 500ms
        setTimeout(() => {
          router.push(`/learn/${courseId}/${nextLesson.id}`);
        }, 500);
      }
    } catch {
      // Revert on failure
      setCompletedLessonIds((prev) => {
        const next = new Set(prev);
        next.delete(lessonId as string);
        return next;
      });
    }
  }, [courseId, lessonId, nextLesson, router]);

  const handleUnmark = useCallback(async () => {
    if (!courseId || !lessonId) return;

    // Optimistic update
    setCompletedLessonIds((prev) => {
      const next = new Set(prev);
      next.delete(lessonId as string);
      return next;
    });

    try {
      await unmarkLessonComplete(courseId as string, lessonId as string);
    } catch {
      // Revert on failure
      setCompletedLessonIds((prev) => new Set([...prev, lessonId as string]));
    }
  }, [courseId, lessonId]);

  const handleToggleComplete = useCallback(() => {
    if (!lessonId) return;
    if (completedLessonIds.has(lessonId as string)) {
      handleUnmark();
    } else {
      handleMarkComplete();
    }
  }, [lessonId, completedLessonIds, handleMarkComplete, handleUnmark]);

  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await submitDeliverable(lessonId as string, {
        textContent: submitForm.textContent || undefined,
        fileUrl: submitForm.fileUrl || undefined,
      });
      setSubmission(result as unknown as LessonSubmission);
      // Deliverable submission auto-creates progress on backend
      setCompletedLessonIds((prev) => new Set([...prev, lessonId as string]));
    } catch (err: any) {
      setSubmitError(err.message ?? 'Failed to submit.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !course || !currentLesson) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1F2937]">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const enrollment = course.enrollment;
  const isAccountabilityTrack = enrollment?.track === 'ACCOUNTABILITY';
  const embedUrl = currentLesson.videoUrl ? getEmbedUrl(currentLesson.videoUrl) : null;
  const isLessonCompleted = completedLessonIds.has(currentLesson.id);
  const completedCount = allLessons.filter((l) => completedLessonIds.has(l.id)).length;

  return (
    <div className="min-h-screen bg-[#1F2937]">
      {/* Course completion celebration */}
      {showCompletion && (
        <CourseCompletionModal
          courseTitle={course.title}
          courseId={course.id}
          onClose={() => setShowCompletion(false)}
        />
      )}

      {/* Top bar with progress strip — fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-40">
        <PlayerTopBar
          courseTitle={course.title}
          isAccountabilityTrack={isAccountabilityTrack ?? false}
          completedCount={completedCount}
          totalCount={allLessons.length}
          onBack={() => router.push('/home')}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — always fixed, never scrolls with content */}
      <aside
        className={`fixed top-[53px] bottom-0 left-0 w-72 bg-[#111827] border-r border-white/10 z-30
          transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <PlayerSidebar
          course={course}
          currentLessonId={lessonId as string}
          completedLessonIds={completedLessonIds}
          submissions={enrollment?.submissions}
          isAccountabilityTrack={isAccountabilityTrack ?? false}
        />
      </aside>

      {/* Main lesson content — offset by sidebar width on desktop, by top bar on all */}
      <main className="min-h-screen bg-white lg:ml-72 pt-[53px]">
        {/* Video player */}
        {embedUrl ? (
          <VideoPlayer
            embedUrl={embedUrl}
            lessonTitle={currentLesson.title}
            lessonNumber={`Lesson ${currentIndex + 1}`}
            courseTitle={course.title}
          />
        ) : (
          <div className="h-1.5 bg-gradient-to-r from-[#0D9488] to-[#38BDF8]" />
        )}

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-bold text-[#1F2937] mb-6">{currentLesson.title}</h1>

          {/* Lesson notes/content */}
          {currentLesson.content && (
            <div className="mb-8">
              <MarkdownRenderer content={currentLesson.content} />
            </div>
          )}

          {/* Deliverable section — only for accountability-track students on applicable lessons */}
          {currentLesson.requiresDeliverable && isAccountabilityTrack && (
            <div className="border border-amber-200 bg-amber-50 rounded-xl p-6 mb-8">
              <h2 className="font-semibold text-[#1F2937] mb-1 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" className="text-amber-500">
                  <rect x="2" y="2" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M6 6H12M6 9H12M6 12H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <span>Deliverable Required</span>
              </h2>
              <p className="text-sm text-[#6B7280] mb-5">
                Submit your work for this lesson. Your creator will review it and provide
                personalised feedback.
              </p>

              {submission ? (
                <div className="space-y-3">
                  <div className="bg-white rounded-lg border border-amber-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-[#1F2937]">Your Submission</span>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          submission.status === 'REVIEWED'
                            ? 'bg-teal-100 text-[#0D9488]'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {submission.status === 'REVIEWED' ? 'Reviewed' : 'Awaiting Review'}
                      </span>
                    </div>
                    {submission.textContent && (
                      <p className="text-sm text-[#1F2937] whitespace-pre-wrap">
                        {submission.textContent}
                      </p>
                    )}
                    {submission.fileUrl && (
                      <a
                        href={submission.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-[#0D9488] hover:underline mt-2 block"
                      >
                        View attached file
                      </a>
                    )}
                    <p className="text-xs text-[#6B7280] mt-2">
                      Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {submission.feedback ? (
                    <div className="bg-white rounded-lg border border-[#0D9488] p-4">
                      <p className="text-xs font-semibold text-[#0D9488] uppercase tracking-wide mb-2">
                        Creator Feedback
                      </p>
                      <p className="text-sm text-[#1F2937] whitespace-pre-wrap">
                        {submission.feedback.feedbackContent}
                      </p>
                      <p className="text-xs text-[#6B7280] mt-2">
                        {new Date(submission.feedback.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-[#6B7280] italic">
                      Your creator will review your submission and post feedback soon.
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmitDeliverable} className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[#1F2937]">
                      Your Work / Reflection
                    </label>
                    <textarea
                      value={submitForm.textContent}
                      onChange={(e) =>
                        setSubmitForm((f) => ({ ...f, textContent: e.target.value }))
                      }
                      placeholder="Describe what you've done, share a link, or write your reflection..."
                      rows={5}
                      className="w-full rounded-lg border border-amber-300 px-4 py-3 text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[#1F2937]">
                      File / Link{' '}
                      <span className="text-[#6B7280] font-normal">(optional)</span>
                    </label>
                    <input
                      type="url"
                      value={submitForm.fileUrl}
                      onChange={(e) =>
                        setSubmitForm((f) => ({ ...f, fileUrl: e.target.value }))
                      }
                      placeholder="https://drive.google.com/..."
                      className="w-full rounded-lg border border-amber-300 px-4 py-3 text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                    />
                  </div>
                  {submitError && (
                    <p className="text-sm text-[#EF4444]">{submitError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={
                      submitting || (!submitForm.textContent && !submitForm.fileUrl)
                    }
                    className="bg-[#F59E0B] text-[#1F2937] font-semibold px-6 py-2.5 rounded-lg hover:bg-amber-500 disabled:opacity-50 transition-colors text-sm"
                  >
                    {submitting ? 'Submitting...' : 'Submit Deliverable'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Mark as Complete button */}
          {enrollment && (
            <MarkCompleteButton
              isCompleted={isLessonCompleted}
              isAccountabilityTrack={isAccountabilityTrack ?? false}
              requiresDeliverable={currentLesson.requiresDeliverable}
              hasSubmission={!!submission}
              onMarkComplete={handleMarkComplete}
              onUnmark={handleUnmark}
            />
          )}

          {/* Lesson navigation */}
          <div className="mt-6">
            <LessonNavigation
              courseId={courseId as string}
              prevLesson={prevLesson}
              nextLesson={nextLesson}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
