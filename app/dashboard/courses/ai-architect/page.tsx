'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { generateCourseOutline, CourseOutline } from '@/lib/ai';
import { createCourse } from '@/lib/courses';
import { createBillingCheckout, getMyPlan } from '@/lib/billing';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function AiArchitectPage() {
  const router = useRouter();
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [loading, setLoading] = useState(false);
  const [outline, setOutline] = useState<CourseOutline | null>(null);
  const [error, setError] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]));
  const [saving, setSaving] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  useEffect(() => {
    getMyPlan()
      .then((p) => setIsPro(p.plan === 'PRO'))
      .catch(() => setIsPro(false));
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !audience.trim()) return;
    setLoading(true);
    setError('');
    setOutline(null);
    try {
      const result = await generateCourseOutline(topic.trim(), audience.trim());
      setOutline(result as CourseOutline);
      setExpandedModules(new Set([0]));
    } catch (err: any) {
      setError(err.message ?? 'Failed to generate outline. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!outline) return;
    setSaving(true);
    try {
      const course = await createCourse({
        title: outline.title,
        description: outline.description,
        priceSelfPaced: 0,
        priceAccountability: 0,
        currency: 'USD',
      });
      router.push(`/dashboard/courses/${course.id}`);
    } catch (err: any) {
      setError(err.message ?? 'Failed to save course.');
      setSaving(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgradeLoading(true);
    try {
      const { url } = await createBillingCheckout('PRO');
      window.location.href = url;
    } catch {
      setUpgradeLoading(false);
    }
  };

  const toggleModule = (mi: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(mi)) next.delete(mi);
      else next.add(mi);
      return next;
    });
  };

  if (isPro === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-2">
          <Link href="/dashboard/courses" className="hover:text-[#0D9488] transition-colors">
            Courses
          </Link>
          <span>/</span>
          <span>AI Architect</span>
        </div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-[#1F2937]">AI Course Architect</h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-[#0D9488] bg-[#0D9488]/10 border border-[#0D9488]/20">
            Pro
          </span>
        </div>
        <p className="text-[#6B7280]">
          Describe your course topic and target audience — AI generates a complete structured outline in seconds.
        </p>
      </div>

      {/* Pro gate */}
      {!isPro ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-xl font-bold text-[#1F2937] mb-2">Pro Feature</h2>
          <p className="text-[#6B7280] max-w-sm mx-auto mb-6">
            AI Course Architect is available on the Pro plan. Get unlimited communities, 1% platform fee, and all AI tools.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Button onClick={handleUpgrade} loading={upgradeLoading}>
              Upgrade to Pro — $50/month
            </Button>
            <Link href="/dashboard/billing" className="text-sm text-[#6B7280] hover:text-[#0D9488]">
              Compare plans →
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Input form */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <form onSubmit={handleGenerate} className="space-y-4">
              <Input
                label="Course Topic"
                placeholder="e.g. Building a SaaS with Next.js and Stripe"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#1F2937]">Target Audience</label>
                <textarea
                  placeholder="e.g. Beginner developers who know HTML/CSS but have never shipped a product"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  rows={2}
                  required
                  className="w-full rounded-lg border border-[#6B7280]/30 px-4 py-3 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488] resize-none"
                />
              </div>
              {error && (
                <p className="text-sm text-[#EF4444] bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {error}
                </p>
              )}
              <Button type="submit" loading={loading} className="w-full">
                {loading ? 'Generating outline…' : '✨ Generate Course Outline'}
              </Button>
            </form>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse space-y-4">
              <div className="h-6 bg-[#F3F4F6] rounded w-2/3" />
              <div className="h-4 bg-[#F3F4F6] rounded w-full" />
              <div className="h-4 bg-[#F3F4F6] rounded w-5/6" />
              <div className="space-y-3 pt-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-[#F3F4F6] rounded-xl" />
                ))}
              </div>
            </div>
          )}

          {/* Outline results */}
          {outline && !loading && (
            <div className="space-y-4">
              {/* Course header card */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#1F2937] mb-1">{outline.title}</h2>
                    <p className="text-[#6B7280] text-sm leading-relaxed">{outline.description}</p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-[#6B7280]">
                      <span className="bg-teal-50 text-[#0D9488] font-medium px-2 py-0.5 rounded-full">
                        {outline.modules.length} modules
                      </span>
                      <span className="bg-[#F3F4F6] px-2 py-0.5 rounded-full">
                        {outline.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Module accordion */}
              {outline.modules.map((mod, mi) => (
                <div key={mi} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleModule(mi)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#F3F4F6]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-[#0D9488]/10 text-[#0D9488] text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {mi + 1}
                      </span>
                      <span className="font-semibold text-[#1F2937]">{mod.title}</span>
                      <span className="text-xs text-[#6B7280] hidden sm:inline">
                        {mod.lessons.length} {mod.lessons.length === 1 ? 'lesson' : 'lessons'}
                      </span>
                    </div>
                    <span className="text-[#6B7280] text-xs flex-shrink-0">
                      {expandedModules.has(mi) ? '▲ Collapse' : '▼ Expand'}
                    </span>
                  </button>

                  {expandedModules.has(mi) && (
                    <div className="border-t border-[#F3F4F6] divide-y divide-[#F3F4F6]">
                      {mod.lessons.map((lesson, li) => (
                        <div key={li} className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <span className="w-5 h-5 rounded-full bg-[#F3F4F6] text-[#6B7280] text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                              {li + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#1F2937] mb-2">{lesson.title}</p>
                              <div className="text-xs text-[#6B7280] bg-[#F3F4F6] rounded-lg px-3 py-2.5 mb-2 leading-relaxed whitespace-pre-wrap">
                                {lesson.scriptOutline}
                              </div>
                              {lesson.deliverableIdea && (
                                <div className="flex items-start gap-1.5">
                                  <span className="text-amber-500 text-xs mt-0.5 flex-shrink-0">★</span>
                                  <p className="text-xs text-amber-700 leading-relaxed">
                                    <span className="font-medium">Deliverable:</span> {lesson.deliverableIdea}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => {
                    setOutline(null);
                    setTopic('');
                    setAudience('');
                    setError('');
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  Start Over
                </Button>
                <Button onClick={handleSaveCourse} loading={saving} className="flex-1">
                  Save as Draft Course →
                </Button>
              </div>

              <p className="text-xs text-[#6B7280] text-center">
                Saving creates a draft course with this title and description. You can add modules and lessons in the course editor.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
