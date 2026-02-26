'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getCourse,
  updateCourse,
  createModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
  Course,
  CourseModule,
  Lesson,
  formatPrice,
} from '@/lib/courses';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// ── Lesson Editor (inline) ─────────────────────────────────────────────────
function LessonEditor({
  lesson,
  courseId,
  moduleId,
  onUpdate,
  onDelete,
}: {
  lesson: Lesson;
  courseId: string;
  moduleId: string;
  onUpdate: (l: Lesson) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: lesson.title,
    videoUrl: lesson.videoUrl ?? '',
    content: lesson.content ?? '',
    requiresDeliverable: lesson.requiresDeliverable,
  });

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateLesson(courseId, moduleId, lesson.id, {
        title: form.title,
        videoUrl: form.videoUrl || undefined,
        content: form.content || undefined,
        requiresDeliverable: form.requiresDeliverable,
      });
      onUpdate(updated);
      setExpanded(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-[#F3F4F6] rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 bg-white cursor-pointer hover:bg-[#F3F4F6]/50"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-[#6B7280] text-sm">☰</span>
        <span className="flex-1 font-medium text-[#1F2937] text-sm">{lesson.title}</span>
        {lesson.videoUrl && <span className="text-xs text-[#38BDF8]">▶ Video</span>}
        {lesson.requiresDeliverable && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Deliverable</span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); if (confirm('Delete this lesson?')) onDelete(); }}
          className="text-[#EF4444] text-xs hover:underline ml-2"
        >
          Delete
        </button>
        <span className="text-[#6B7280] text-xs">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 bg-[#F3F4F6]/30 border-t border-[#F3F4F6] space-y-3">
          <Input
            label="Lesson Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Input
            label="Video URL (YouTube, Vimeo, or Loom)"
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            value={form.videoUrl}
            onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#1F2937]">Lesson Notes (Markdown)</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Add written content, resources, or instructions…"
              rows={4}
              className="w-full rounded-lg border border-[#6B7280] px-4 py-3 text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488] resize-none text-sm font-mono"
            />
          </div>
          {/* Accountability toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm((f) => ({ ...f, requiresDeliverable: !f.requiresDeliverable }))}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                form.requiresDeliverable ? 'bg-[#F59E0B]' : 'bg-[#6B7280]'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.requiresDeliverable ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1F2937]">Requires Deliverable</p>
              <p className="text-xs text-[#6B7280]">
                Accountability-track students must submit work before progressing.
              </p>
            </div>
          </label>
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" onClick={() => setExpanded(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Save Lesson</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Module Section ────────────────────────────────────────────────────────
function ModuleSection({
  mod,
  courseId,
  onModuleDelete,
  onModuleUpdate,
}: {
  mod: CourseModule;
  courseId: string;
  onModuleDelete: () => void;
  onModuleUpdate: (m: CourseModule) => void;
}) {
  const [lessons, setLessons] = useState<Lesson[]>(mod.lessons);
  const [addingLesson, setAddingLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [lessonLoading, setLessonLoading] = useState(false);

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setLessonLoading(true);
    try {
      const lesson = await createLesson(courseId, mod.id, { title: newLessonTitle });
      setLessons((ls) => [...ls, lesson]);
      setNewLessonTitle('');
      setAddingLesson(false);
    } finally {
      setLessonLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F3F4F6]">
        <h3 className="font-semibold text-[#1F2937] flex-1">{mod.title}</h3>
        <button
          onClick={() => { if (confirm(`Delete module "${mod.title}" and all its lessons?`)) onModuleDelete(); }}
          className="text-xs text-[#EF4444] hover:underline"
        >
          Delete Module
        </button>
      </div>

      <div className="p-4 space-y-2">
        {lessons.length === 0 && (
          <p className="text-sm text-[#6B7280] text-center py-3">No lessons yet. Add one below.</p>
        )}
        {lessons.map((lesson) => (
          <LessonEditor
            key={lesson.id}
            lesson={lesson}
            courseId={courseId}
            moduleId={mod.id}
            onUpdate={(updated) => setLessons((ls) => ls.map((l) => l.id === updated.id ? updated : l))}
            onDelete={async () => {
              await deleteLesson(courseId, mod.id, lesson.id);
              setLessons((ls) => ls.filter((l) => l.id !== lesson.id));
            }}
          />
        ))}

        {addingLesson ? (
          <form onSubmit={handleAddLesson} className="flex gap-2 pt-1">
            <input
              autoFocus
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              placeholder="Lesson title…"
              required
              className="flex-1 rounded-lg border border-[#0D9488] px-3 py-2 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
            <Button type="submit" loading={lessonLoading} className="py-2 px-4 text-sm">Add</Button>
            <Button type="button" variant="secondary" onClick={() => setAddingLesson(false)} className="py-2 px-4 text-sm">Cancel</Button>
          </form>
        ) : (
          <button
            onClick={() => setAddingLesson(true)}
            className="w-full text-left text-sm text-[#0D9488] hover:underline pt-1 px-1"
          >
            + Add Lesson
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function CourseEditorPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [settingsForm, setSettingsForm] = useState({
    title: '',
    description: '',
    priceSelfPaced: '',
    priceAccountability: '',
    currency: 'USD',
  });

  const [addingModule, setAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [moduleLoading, setModuleLoading] = useState(false);

  useEffect(() => {
    getCourse(courseId)
      .then((c) => {
        setCourse(c);
        setModules(c.modules ?? []);
        setSettingsForm({
          title: c.title,
          description: c.description ?? '',
          priceSelfPaced: (c.priceSelfPaced / 100).toFixed(2),
          priceAccountability: (c.priceAccountability / 100).toFixed(2),
          currency: c.currency,
        });
      })
      .catch(() => router.push('/dashboard/courses'))
      .finally(() => setLoading(false));
  }, [courseId, router]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await updateCourse(courseId, {
        title: settingsForm.title,
        description: settingsForm.description || undefined,
        priceSelfPaced: Math.round(parseFloat(settingsForm.priceSelfPaced) * 100),
        priceAccountability: Math.round(parseFloat(settingsForm.priceAccountability) * 100),
        currency: settingsForm.currency,
      });
      setCourse(updated);
      setSuccess('Changes saved.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!course) return;
    setPublishing(true);
    try {
      const updated = await updateCourse(courseId, { isPublished: !course.isPublished });
      setCourse(updated);
    } finally {
      setPublishing(false);
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setModuleLoading(true);
    try {
      const mod = await createModule(courseId, { title: newModuleTitle, order: modules.length });
      setModules((ms) => [...ms, { ...mod, lessons: [] }]);
      setNewModuleTitle('');
      setAddingModule(false);
    } finally {
      setModuleLoading(false);
    }
  };

  if (loading || !course) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.push('/dashboard/courses')} className="text-[#6B7280] hover:text-[#1F2937]">
          ← Back
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#1F2937]">{course.title}</h1>
          <p className="text-sm text-[#6B7280]">
            {modules.length} modules · {modules.reduce((n, m) => n + m.lessons.length, 0)} lessons
          </p>
        </div>
        <Button
          variant={course.isPublished ? 'secondary' : 'primary'}
          loading={publishing}
          onClick={handleTogglePublish}
        >
          {course.isPublished ? 'Unpublish' : 'Publish Course'}
        </Button>
      </div>

      {/* Dual-track pricing summary */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-white rounded-xl border border-[#F3F4F6] p-4 text-center shadow-sm">
          <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">Self-Paced</p>
          <p className="text-2xl font-bold text-[#1F2937]">
            {formatPrice(course.priceSelfPaced, course.currency)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#0D9488] p-4 text-center shadow-sm">
          <p className="text-xs text-[#0D9488] uppercase tracking-wide mb-1">Accountability ★</p>
          <p className="text-2xl font-bold text-[#1F2937]">
            {formatPrice(course.priceAccountability, course.currency)}
          </p>
        </div>
      </div>

      {/* Course settings */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="font-semibold text-[#1F2937] mb-4">Course Details & Pricing</h2>
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <Input
            label="Title"
            value={settingsForm.title}
            onChange={(e) => setSettingsForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#1F2937]">Description</label>
            <textarea
              value={settingsForm.description}
              onChange={(e) => setSettingsForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-[#6B7280] px-4 py-3 text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#F3F4F6] p-4">
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Self-Paced Price</p>
              <Input
                label=""
                type="number" min="0" step="0.01" placeholder="49.00"
                value={settingsForm.priceSelfPaced}
                onChange={(e) => setSettingsForm((f) => ({ ...f, priceSelfPaced: e.target.value }))}
                required
              />
            </div>
            <div className="rounded-xl border border-[#0D9488] bg-teal-50/40 p-4">
              <p className="text-xs font-semibold text-[#0D9488] uppercase tracking-wide mb-2">Accountability Price</p>
              <Input
                label=""
                type="number" min="0" step="0.01" placeholder="149.00"
                value={settingsForm.priceAccountability}
                onChange={(e) => setSettingsForm((f) => ({ ...f, priceAccountability: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#1F2937]">Currency</label>
            <select
              value={settingsForm.currency}
              onChange={(e) => setSettingsForm((f) => ({ ...f, currency: e.target.value }))}
              className="rounded-lg border border-[#6B7280] px-4 py-3 text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            >
              {['USD', 'NGN', 'GHS', 'KES', 'ZAR'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {error && <p className="text-sm text-[#EF4444]">{error}</p>}
          {success && <p className="text-sm text-[#0D9488]">✓ {success}</p>}
          <Button type="submit" loading={saving}>Save Settings</Button>
        </form>
      </div>

      {/* Curriculum builder */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#1F2937]">Curriculum</h2>
          <button
            onClick={() => setAddingModule(true)}
            className="text-sm text-[#0D9488] font-medium hover:underline"
          >
            + Add Module
          </button>
        </div>

        {modules.length === 0 && !addingModule && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-[#6B7280]">
            <p className="mb-3">No modules yet.</p>
            <button onClick={() => setAddingModule(true)} className="text-[#0D9488] font-medium hover:underline">
              Add your first module
            </button>
          </div>
        )}

        <div className="space-y-4">
          {modules.map((mod) => (
            <ModuleSection
              key={mod.id}
              mod={mod}
              courseId={courseId}
              onModuleDelete={async () => {
                await deleteModule(courseId, mod.id);
                setModules((ms) => ms.filter((m) => m.id !== mod.id));
              }}
              onModuleUpdate={(updated) =>
                setModules((ms) => ms.map((m) => m.id === updated.id ? updated : m))
              }
            />
          ))}
        </div>

        {addingModule && (
          <form onSubmit={handleAddModule} className="flex gap-2 mt-4">
            <input
              autoFocus
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              placeholder="Module title…"
              required
              className="flex-1 rounded-lg border border-[#0D9488] px-4 py-3 text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
            <Button type="submit" loading={moduleLoading}>Add</Button>
            <Button type="button" variant="secondary" onClick={() => setAddingModule(false)}>Cancel</Button>
          </form>
        )}
      </div>
    </div>
  );
}
