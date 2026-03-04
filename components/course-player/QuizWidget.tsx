'use client';

import { useState, useEffect, useCallback } from 'react';
import { getQuiz, submitQuiz, Quiz, QuizResult } from '@/lib/courses';

interface QuizWidgetProps {
  courseId: string;
  lessonId: string;
}

export default function QuizWidget({ courseId, lessonId }: QuizWidgetProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    setResult(null);
    setAnswers({});
    setStarted(false);
    getQuiz(courseId, lessonId)
      .then((q) => {
        setQuiz(q);
        if (q.previousAttempt) {
          setResult({
            score: q.previousAttempt.score,
            passed: q.previousAttempt.passed,
            correctCount: 0,
            totalQuestions: q.questions.length,
            passingScore: q.passingScore,
            attemptId: '',
          });
        }
      })
      .catch(() => setQuiz(null))
      .finally(() => setLoading(false));
  }, [courseId, lessonId]);

  // Timer countdown
  useEffect(() => {
    if (!started || timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, timeLeft]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && started && !result) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const handleSubmit = useCallback(async () => {
    if (!quiz) return;
    setSubmitting(true);
    try {
      const answerArray = quiz.questions.map((q) => ({
        questionId: q.id,
        selectedIndex: answers[q.id] ?? -1,
      }));
      const res = await submitQuiz(courseId, lessonId, answerArray);
      setResult(res);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }, [quiz, answers, courseId, lessonId]);

  if (loading) return null;
  if (!quiz) return null;

  // Show previous result
  if (result && !started) {
    return (
      <div className="border border-[#0D9488]/30 bg-[#0D9488]/5 rounded-xl p-6 mb-8">
        <h2 className="font-semibold text-[#1F2937] mb-3 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#0D9488]">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {quiz.title}
        </h2>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          result.passed ? 'bg-teal-100 text-[#0D9488]' : 'bg-red-100 text-red-700'
        }`}>
          {result.passed ? 'Passed' : 'Not passed'} &mdash; {result.score}%
        </div>
        <p className="text-sm text-[#6B7280] mt-2">
          Passing score: {quiz.passingScore}%
        </p>
        <button
          onClick={() => {
            setResult(null);
            setAnswers({});
            setStarted(true);
            if (quiz.timeLimitSec) setTimeLeft(quiz.timeLimitSec);
          }}
          className="mt-3 text-sm font-medium text-[#0D9488] hover:underline"
        >
          Retake Quiz
        </button>
      </div>
    );
  }

  // Show start screen
  if (!started) {
    return (
      <div className="border border-[#0D9488]/30 bg-[#0D9488]/5 rounded-xl p-6 mb-8">
        <h2 className="font-semibold text-[#1F2937] mb-2 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#0D9488]">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {quiz.title}
        </h2>
        <p className="text-sm text-[#6B7280] mb-4">
          {quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}
          {quiz.timeLimitSec ? ` \u00b7 ${Math.ceil(quiz.timeLimitSec / 60)} min time limit` : ''}
          {` \u00b7 ${quiz.passingScore}% to pass`}
        </p>
        <button
          onClick={() => {
            setStarted(true);
            if (quiz.timeLimitSec) setTimeLeft(quiz.timeLimitSec);
          }}
          className="bg-[#0D9488] text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-teal-700 transition-colors"
        >
          Start Quiz
        </button>
      </div>
    );
  }

  // Show result after submission
  if (result) {
    return (
      <div className="border border-[#0D9488]/30 bg-[#0D9488]/5 rounded-xl p-6 mb-8">
        <h2 className="font-semibold text-[#1F2937] mb-3">{quiz.title} &mdash; Results</h2>
        <div className={`text-3xl font-bold mb-2 ${result.passed ? 'text-[#0D9488]' : 'text-red-600'}`}>
          {result.score}%
        </div>
        <p className="text-sm text-[#6B7280]">
          {result.correctCount} of {result.totalQuestions} correct &mdash;{' '}
          {result.passed ? 'You passed!' : `Need ${result.passingScore}% to pass.`}
        </p>
        <button
          onClick={() => {
            setResult(null);
            setAnswers({});
            if (quiz.timeLimitSec) setTimeLeft(quiz.timeLimitSec);
          }}
          className="mt-3 text-sm font-medium text-[#0D9488] hover:underline"
        >
          Retake Quiz
        </button>
      </div>
    );
  }

  // Quiz questions
  const allAnswered = quiz.questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="border border-[#0D9488]/30 bg-[#0D9488]/5 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-[#1F2937]">{quiz.title}</h2>
        {timeLeft !== null && (
          <span className={`text-sm font-mono font-medium px-2.5 py-1 rounded-lg ${
            timeLeft < 60 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-[#6B7280]'
          }`}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
        )}
      </div>

      <div className="space-y-6">
        {quiz.questions.map((q, qi) => (
          <div key={q.id}>
            <p className="text-sm font-medium text-[#1F2937] mb-2">
              {qi + 1}. {q.text}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <label
                  key={oi}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-sm ${
                    answers[q.id] === oi
                      ? 'border-[#0D9488] bg-[#0D9488]/10 text-[#1F2937]'
                      : 'border-gray-200 bg-white text-[#6B7280] hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`quiz-${q.id}`}
                    checked={answers[q.id] === oi}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                    className="accent-[#0D9488]"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
        className="mt-6 bg-[#0D9488] text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-teal-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Grading...' : 'Submit Answers'}
      </button>
    </div>
  );
}
