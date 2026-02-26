import { apiFetch } from './api';
import { getToken } from './auth';

// ── Course Outline ─────────────────────────────────────────────────────────

export interface LessonOutline {
  title: string;
  scriptOutline: string;
  deliverableIdea: string;
}

export interface ModuleOutline {
  title: string;
  lessons: LessonOutline[];
}

export interface CourseOutline {
  title: string;
  description: string;
  modules: ModuleOutline[];
}

export async function generateCourseOutline(
  topic: string,
  targetAudience: string,
): Promise<CourseOutline> {
  return apiFetch('/ai/course-outline', {
    method: 'POST',
    body: JSON.stringify({ topic, targetAudience }),
  });
}

// ── SSE Stream helpers ─────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

/**
 * Opens an SSE stream to an AI endpoint. Calls `onChunk` for each streamed
 * text delta and `onDone` when the stream ends.
 *
 * Returns an AbortController so the caller can cancel mid-stream.
 */
export function streamAI(
  endpoint: string,
  body: object,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError?: (msg: string) => void,
): AbortController {
  const controller = new AbortController();
  const token = getToken();

  fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'AI request failed.' }));
        onError?.(err.message ?? 'AI request failed.');
        onDone();
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) onChunk(parsed.text);
            if (parsed.error) onError?.(parsed.error);
          } catch {
            // ignore parse errors on partial lines
          }
        }
      }
      onDone();
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError?.('Connection error. Please try again.');
      }
      onDone();
    });

  return controller;
}

export function streamCommunityAsk(
  communityId: string,
  question: string,
  systemPrompt: string | undefined,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError?: (msg: string) => void,
) {
  return streamAI('/ai/ask', { communityId, question, systemPrompt }, onChunk, onDone, onError);
}

export function streamRepurposeContent(
  content: string,
  contentType: 'lesson' | 'transcript' | 'post',
  onChunk: (text: string) => void,
  onDone: () => void,
  onError?: (msg: string) => void,
) {
  return streamAI('/ai/repurpose', { content, contentType }, onChunk, onDone, onError);
}
