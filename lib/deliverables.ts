import { apiFetch } from './api';

export interface Submission {
  id: string;
  enrollmentId: string;
  lessonId: string;
  textContent: string | null;
  fileUrl: string | null;
  status: 'SUBMITTED' | 'REVIEWED';
  submittedAt: string;
  lesson?: { title: string; content: string | null };
  enrollment?: {
    user: { id: string; name: string; email: string };
    course: { id: string; title: string };
    track: 'SELF_PACED' | 'ACCOUNTABILITY';
  };
  feedback?: { id: string; feedbackContent: string; createdAt: string } | null;
}

export async function submitDeliverable(
  lessonId: string,
  data: { textContent?: string; fileUrl?: string },
): Promise<Submission> {
  return apiFetch(`/lessons/${lessonId}/submissions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function listSubmissions(): Promise<Submission[]> {
  return apiFetch('/creator/submissions');
}

export async function getSubmission(submissionId: string): Promise<Submission> {
  return apiFetch(`/submissions/${submissionId}`);
}

export async function postFeedback(
  submissionId: string,
  feedbackContent: string,
): Promise<{ id: string; feedbackContent: string; createdAt: string }> {
  return apiFetch(`/submissions/${submissionId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ feedbackContent }),
  });
}
