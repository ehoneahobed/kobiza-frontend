'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSubmission, postFeedback, Submission } from '@/lib/deliverables';
import { Button } from '@/components/ui/Button';

export default function SubmissionDetailPage() {
  const { submissionId } = useParams();
  const router = useRouter();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackText, setFeedbackText] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getSubmission(submissionId as string)
      .then(setSubmission)
      .catch(() => router.push('/dashboard/submissions'))
      .finally(() => setLoading(false));
  }, [submissionId, router]);

  const handlePostFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    setError('');
    try {
      const fb = await postFeedback(submissionId as string, feedbackText);
      // Update local state to show the new feedback
      setSubmission((s) =>
        s
          ? {
              ...s,
              status: 'REVIEWED',
              feedback: fb,
            }
          : s,
      );
      setFeedbackText('');
      setSuccess('Feedback posted! The student has been notified by email.');
    } catch (err: any) {
      setError(err.message ?? 'Failed to post feedback.');
    } finally {
      setPosting(false);
    }
  };

  if (loading || !submission) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const student = submission.enrollment?.user;
  const course = submission.enrollment?.course;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/dashboard/submissions')}
          className="text-[#6B7280] hover:text-[#1F2937] transition-colors"
        >
          ← Submissions
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#1F2937]">
            Submission: {submission.lesson?.title ?? 'Lesson'}
          </h1>
          <p className="text-sm text-[#6B7280]">
            {course?.title} · {new Date(submission.submittedAt).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`text-xs px-3 py-1.5 rounded-full font-medium ${
            submission.status === 'REVIEWED'
              ? 'bg-teal-100 text-[#0D9488]'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {submission.status === 'REVIEWED' ? '✓ Reviewed' : '⏳ Awaiting Review'}
        </span>
      </div>

      {/* Student info */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#0D9488]/10 flex items-center justify-center flex-shrink-0">
          <span className="text-[#0D9488] font-semibold text-sm">
            {student?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </span>
        </div>
        <div>
          <p className="font-semibold text-[#1F2937]">{student?.name}</p>
          <p className="text-sm text-[#6B7280]">{student?.email}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-[#6B7280]">Track</p>
          <p className="text-sm font-medium text-[#1F2937]">
            {submission.enrollment?.track === 'ACCOUNTABILITY'
              ? 'Accountability ★'
              : 'Self-Paced'}
          </p>
        </div>
      </div>

      {/* Submission content */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-5">
        <h2 className="font-semibold text-[#1F2937] mb-4">Student's Submission</h2>

        {submission.textContent ? (
          <div className="bg-[#F3F4F6] rounded-lg p-4 mb-4">
            <p className="text-sm text-[#1F2937] whitespace-pre-wrap leading-relaxed">
              {submission.textContent}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[#6B7280] italic mb-4">No text provided.</p>
        )}

        {submission.fileUrl && (
          <a
            href={submission.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[#0D9488] hover:text-teal-700 font-medium border border-[#0D9488]/30 rounded-lg px-4 py-2 hover:bg-teal-50 transition-colors"
          >
            <span>📎</span> View Attached File
          </a>
        )}
      </div>

      {/* Feedback section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-[#1F2937] mb-4">Your Feedback</h2>

        {submission.feedback ? (
          // Already posted feedback
          <div>
            <div className="bg-teal-50 border border-[#0D9488]/30 rounded-lg p-4">
              <p className="text-sm text-[#1F2937] whitespace-pre-wrap leading-relaxed">
                {submission.feedback.feedbackContent}
              </p>
            </div>
            <p className="text-xs text-[#6B7280] mt-2">
              Posted on {new Date(submission.feedback.createdAt).toLocaleDateString()} · Student
              notified by email
            </p>
          </div>
        ) : (
          // Feedback form
          <form onSubmit={handlePostFeedback} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#1F2937]">
                Write your feedback for {student?.name?.split(' ')[0] ?? 'the student'}
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Be specific and encouraging. What did they do well? What can they improve? What should they do next?"
                rows={6}
                required
                className="w-full rounded-lg border border-[#6B7280] px-4 py-3 text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488] resize-none text-sm"
              />
            </div>

            {error && (
              <p className="text-sm text-[#EF4444] bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-[#0D9488] bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
                ✓ {success}
              </p>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" loading={posting} disabled={!feedbackText.trim()}>
                Post Feedback & Notify Student
              </Button>
              <p className="text-xs text-[#6B7280]">
                The student will receive an email notification.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
