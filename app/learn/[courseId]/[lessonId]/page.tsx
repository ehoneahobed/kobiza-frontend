'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCourse, Course, Lesson, LessonSubmission } from '@/lib/courses';
import { submitDeliverable } from '@/lib/deliverables';
import { getEmbedUrl } from '@/lib/video';

export default function LessonPlayerPage() {
  const { courseId, lessonId } = useParams();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [submission, setSubmission] = useState<LessonSubmission | null>(null);
  const [loading, setLoading] = useState(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await submitDeliverable(lessonId as string, {
        textContent: submitForm.textContent || undefined,
        fileUrl: submitForm.fileUrl || undefined,
      });
      setSubmission(result as unknown as LessonSubmission);
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
  const allLessons = course.modules?.flatMap((m) => m.lessons) ?? [];
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-[#1F2937] flex flex-col">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-6 py-3 bg-[#1F2937] border-b border-white/10 flex-shrink-0">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-white/60 hover:text-white text-sm transition-colors"
        >
          ← Dashboard
        </button>
        <span className="text-white/20">|</span>
        <span className="text-white font-semibold text-sm truncate flex-1">{course.title}</span>
        {enrollment && (
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
              isAccountabilityTrack
                ? 'bg-amber-400/20 text-amber-300'
                : 'bg-teal-400/20 text-teal-300'
            }`}
          >
            {isAccountabilityTrack ? 'Accountability Track ★' : 'Self-Paced'}
          </span>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 53px)' }}>
        {/* Sidebar: curriculum */}
        <aside className="w-72 bg-[#111827] border-r border-white/10 overflow-y-auto flex-shrink-0">
          {course.modules?.map((mod) => (
            <div key={mod.id}>
              <div className="px-4 py-3 sticky top-0 bg-[#111827] border-b border-white/5 z-10">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider truncate">
                  {mod.title}
                </p>
              </div>
              {mod.lessons.map((lesson) => {
                const isActive = lesson.id === lessonId;
                const sub = enrollment?.submissions?.find((s) => s.lessonId === lesson.id);
                const icon =
                  sub?.status === 'REVIEWED'
                    ? '✅'
                    : sub?.status === 'SUBMITTED'
                    ? '⏳'
                    : lesson.requiresDeliverable
                    ? '📋'
                    : '▶';
                return (
                  <Link
                    key={lesson.id}
                    href={`/learn/${courseId}/${lesson.id}`}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                      isActive ? 'bg-white/10 border-l-2 border-l-[#0D9488]' : ''
                    }`}
                  >
                    <span className="text-xs mt-0.5 flex-shrink-0">{icon}</span>
                    <span
                      className={`text-sm leading-snug ${
                        isActive ? 'text-white font-medium' : 'text-white/60'
                      }`}
                    >
                      {lesson.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </aside>

        {/* Main lesson content */}
        <main className="flex-1 overflow-y-auto bg-white">
          {/* Video player */}
          {embedUrl ? (
            <div className="aspect-video bg-black w-full">
              <iframe
                src={embedUrl}
                title={currentLesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="h-2 bg-[#0D9488]" />
          )}

          <div className="max-w-3xl mx-auto px-6 py-8">
            <h1 className="text-2xl font-bold text-[#1F2937] mb-6">{currentLesson.title}</h1>

            {/* Lesson notes/content */}
            {currentLesson.content && (
              <div className="prose prose-slate max-w-none mb-8">
                <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-[#1F2937] bg-transparent p-0 border-0">
                  {currentLesson.content}
                </pre>
              </div>
            )}

            {/* Deliverable section — only for accountability-track students on applicable lessons */}
            {currentLesson.requiresDeliverable && isAccountabilityTrack && (
              <div className="border border-amber-200 bg-amber-50 rounded-xl p-6 mb-8">
                <h2 className="font-semibold text-[#1F2937] mb-1 flex items-center gap-2">
                  <span>📋</span>
                  <span>Deliverable Required</span>
                </h2>
                <p className="text-sm text-[#6B7280] mb-5">
                  Submit your work for this lesson. Your creator will review it and provide
                  personalised feedback.
                </p>

                {submission ? (
                  // Already submitted
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
                          {submission.status === 'REVIEWED' ? '✓ Reviewed' : '⏳ Awaiting Review'}
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
                          View attached file →
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
                  // Submission form
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-[#1F2937]">
                        Your Work / Reflection
                      </label>
                      <textarea
                        value={submitForm.textContent}
                        onChange={(e) =>
                          setSubmitForm((f) => ({ ...f, textContent: e.target.value }))
                        }
                        placeholder="Describe what you've done, share a link, or write your reflection…"
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
                        placeholder="https://drive.google.com/…"
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
                      {submitting ? 'Submitting…' : 'Submit Deliverable'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Lesson navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-[#F3F4F6]">
              {prevLesson ? (
                <Link
                  href={`/learn/${courseId}/${prevLesson.id}`}
                  className="text-sm text-[#6B7280] hover:text-[#1F2937] flex items-center gap-1 transition-colors"
                >
                  ← {prevLesson.title}
                </Link>
              ) : (
                <div />
              )}
              {nextLesson && (
                <Link
                  href={`/learn/${courseId}/${nextLesson.id}`}
                  className="text-sm font-semibold text-[#0D9488] hover:text-teal-700 flex items-center gap-1 transition-colors"
                >
                  {nextLesson.title} →
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
