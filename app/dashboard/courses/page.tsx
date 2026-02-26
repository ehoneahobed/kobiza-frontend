'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  listMyCourses,
  createCourse,
  Course,
  CourseClassroom,
  formatPrice,
  addToClassroom,
  removeFromClassroom,
  updateClassroomEntry,
} from '@/lib/courses';
import { getMyProfile, getMyCommunities } from '@/lib/creator';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CopyLinkButton } from '@/components/ui/CopyLinkButton';

const CURRENCIES = ['USD', 'NGN', 'GHS', 'KES', 'ZAR'];

interface Community { id: string; name: string }

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    coverUrl: '',
    priceSelfPaced: '',
    priceAccountability: '',
    currency: 'USD',
  });

  // Classroom modal state
  const [classroomModal, setClassroomModal] = useState<{ courseId: string; courseName: string; current: CourseClassroom[] } | null>(null);
  const [classroomForm, setClassroomForm] = useState({ communityId: '', memberPriceSelfPaced: '', memberPriceAccountability: '' });
  const [classroomSaving, setClassroomSaving] = useState(false);

  useEffect(() => {
    Promise.all([listMyCourses(), getMyProfile(), getMyCommunities()])
      .then(([c, p, comms]) => {
        setCourses(c);
        setSlug(p.slug);
        setCommunities(comms);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const course = await createCourse({
        title: form.title,
        description: form.description || undefined,
        coverUrl: form.coverUrl || undefined,
        priceSelfPaced: Math.round(parseFloat(form.priceSelfPaced || '0') * 100),
        priceAccountability: Math.round(parseFloat(form.priceAccountability || '0') * 100),
        currency: form.currency,
      });
      router.push(`/dashboard/courses/${course.id}`);
    } catch (err: any) {
      setError(err.message ?? 'Failed to create course.');
      setCreating(false);
    }
  };

  const openClassroomModal = (course: Course) => {
    setClassroomModal({ courseId: course.id, courseName: course.title, current: course.classrooms ?? [] });
    setClassroomForm({ communityId: '', memberPriceSelfPaced: '', memberPriceAccountability: '' });
  };

  const handleAddToClassroom = async () => {
    if (!classroomModal || !classroomForm.communityId) return;
    setClassroomSaving(true);
    try {
      const entry = await addToClassroom(classroomModal.courseId, {
        communityId: classroomForm.communityId,
        memberPriceSelfPaced: classroomForm.memberPriceSelfPaced
          ? Math.round(parseFloat(classroomForm.memberPriceSelfPaced) * 100)
          : null,
        memberPriceAccountability: classroomForm.memberPriceAccountability
          ? Math.round(parseFloat(classroomForm.memberPriceAccountability) * 100)
          : null,
      });
      setClassroomModal((m) => m ? { ...m, current: [...m.current, entry] } : null);
      setCourses((cs) =>
        cs.map((c) =>
          c.id === classroomModal.courseId
            ? { ...c, classrooms: [...(c.classrooms ?? []), entry] }
            : c,
        ),
      );
      setClassroomForm({ communityId: '', memberPriceSelfPaced: '', memberPriceAccountability: '' });
    } catch (err: any) {
      alert(err.message ?? 'Failed to add to classroom.');
    } finally {
      setClassroomSaving(false);
    }
  };

  const handleRemoveFromClassroom = async (courseId: string, communityId: string) => {
    try {
      await removeFromClassroom(courseId, communityId);
      setClassroomModal((m) =>
        m ? { ...m, current: m.current.filter((e) => e.communityId !== communityId) } : null,
      );
      setCourses((cs) =>
        cs.map((c) =>
          c.id === courseId
            ? { ...c, classrooms: (c.classrooms ?? []).filter((e) => e.communityId !== communityId) }
            : c,
        ),
      );
    } catch (err: any) {
      alert(err.message ?? 'Failed to remove from classroom.');
    }
  };

  const availableCommunitiesForModal = communities.filter(
    (comm) => !classroomModal?.current.some((e) => e.communityId === comm.id),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Courses</h1>
          <p className="text-[#6B7280] mt-1">
            {courses.length} course{courses.length !== 1 ? 's' : ''} · Dual-track pricing enabled
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ New Course</Button>
      </div>

      {/* Create Course Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[#1F2937] mb-1">Create a New Course</h2>
            <p className="text-sm text-[#6B7280] mb-6">Set up your course details and dual-track pricing.</p>

            <form onSubmit={handleCreate} className="space-y-6">
              {/* Section: Course Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#1F2937] uppercase tracking-wide border-b border-[#F3F4F6] pb-2">Course Details</h3>
                <Input
                  label="Course Title"
                  placeholder="e.g. Build a SaaS in 30 Days"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-[#1F2937]">Description (optional)</label>
                  <textarea
                    placeholder="What will students learn?"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-[#6B7280] px-4 py-3 text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488] resize-none"
                  />
                </div>
                <Input
                  label="Cover Image URL (optional)"
                  placeholder="https://..."
                  value={form.coverUrl}
                  onChange={(e) => setForm((f) => ({ ...f, coverUrl: e.target.value }))}
                />
              </div>

              {/* Section: Pricing */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#1F2937] uppercase tracking-wide border-b border-[#F3F4F6] pb-2">Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[#F3F4F6] p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">📖</span>
                      <p className="text-sm font-semibold text-[#1F2937]">Self-Paced</p>
                    </div>
                    <p className="text-xs text-[#6B7280] mb-3">Students learn at their own speed with lifetime access.</p>
                    <Input
                      label="Price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="49.00"
                      value={form.priceSelfPaced}
                      onChange={(e) => setForm((f) => ({ ...f, priceSelfPaced: e.target.value }))}
                      required
                    />
                    <p className="text-xs text-[#6B7280] mt-1">Set to 0 for free access</p>
                  </div>
                  <div className="rounded-xl border-2 border-[#0D9488] bg-teal-50/30 p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🎯</span>
                      <p className="text-sm font-semibold text-[#0D9488]">Accountability</p>
                    </div>
                    <p className="text-xs text-[#6B7280] mb-3">Includes deadlines, submissions, and direct feedback.</p>
                    <Input
                      label="Price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="149.00"
                      value={form.priceAccountability}
                      onChange={(e) => setForm((f) => ({ ...f, priceAccountability: e.target.value }))}
                      required
                    />
                    <p className="text-xs text-[#6B7280] mt-1">Typically 2-3x self-paced</p>
                  </div>
                </div>
              </div>

              {/* Section: Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#1F2937] uppercase tracking-wide border-b border-[#F3F4F6] pb-2">Settings</h3>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-[#1F2937]">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className="rounded-lg border border-[#6B7280] px-4 py-3 text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  >
                    {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-sm text-[#EF4444] bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={creating} className="flex-1">
                  Create Course
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Classroom management modal */}
      {classroomModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">Manage Classrooms</h2>
                <p className="text-sm text-[#6B7280] mt-1">{classroomModal.courseName}</p>
              </div>
              <button
                onClick={() => setClassroomModal(null)}
                className="text-[#6B7280] hover:text-[#1F2937] text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Current classrooms */}
            {classroomModal.current.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[#1F2937] mb-3">In these classrooms:</h3>
                <div className="space-y-2">
                  {classroomModal.current.map((entry) => (
                    <div key={entry.communityId} className="flex items-center justify-between bg-teal-50 rounded-lg px-4 py-3">
                      <div>
                        <p className="font-medium text-[#1F2937] text-sm">
                          {entry.community?.name ?? communities.find(c => c.id === entry.communityId)?.name ?? entry.communityId}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          {entry.memberPriceSelfPaced !== null
                            ? `Member: ${entry.memberPriceSelfPaced === 0 ? 'Free' : `$${entry.memberPriceSelfPaced / 100}`} self-paced`
                            : 'Standard pricing for members'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveFromClassroom(classroomModal.courseId, entry.communityId)}
                        className="text-xs text-[#EF4444] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add to classroom */}
            {availableCommunitiesForModal.length > 0 ? (
              <div className="border-t border-[#F3F4F6] pt-5">
                <h3 className="text-sm font-semibold text-[#1F2937] mb-3">Add to a classroom:</h3>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[#1F2937]">Community</label>
                    <select
                      value={classroomForm.communityId}
                      onChange={(e) => setClassroomForm((f) => ({ ...f, communityId: e.target.value }))}
                      className="rounded-lg border border-[#6B7280] px-4 py-2.5 text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                    >
                      <option value="">Select a community…</option>
                      {availableCommunitiesForModal.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-[#6B7280]">Member Price — Self-Paced</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Leave blank = standard price; 0 = free"
                        value={classroomForm.memberPriceSelfPaced}
                        onChange={(e) => setClassroomForm((f) => ({ ...f, memberPriceSelfPaced: e.target.value }))}
                        className="rounded-lg border border-[#6B7280] px-3 py-2 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-[#6B7280]">Member Price — Accountability</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Leave blank = standard price; 0 = free"
                        value={classroomForm.memberPriceAccountability}
                        onChange={(e) => setClassroomForm((f) => ({ ...f, memberPriceAccountability: e.target.value }))}
                        className="rounded-lg border border-[#6B7280] px-3 py-2 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddToClassroom}
                    loading={classroomSaving}
                    disabled={!classroomForm.communityId}
                    className="w-full"
                  >
                    Add to Classroom
                  </Button>
                </div>
              </div>
            ) : classroomModal.current.length === 0 ? (
              <p className="text-sm text-[#6B7280]">
                You have no communities to add this course to yet.{' '}
                <Link href="/dashboard/community" className="text-[#0D9488] hover:underline">
                  Create one first.
                </Link>
              </p>
            ) : (
              <p className="text-sm text-[#6B7280] border-t border-[#F3F4F6] pt-4">
                This course is already in all your communities.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Course list */}
      {courses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">🎓</div>
          <h2 className="text-lg font-semibold text-[#1F2937] mb-2">No courses yet</h2>
          <p className="text-[#6B7280] max-w-sm mx-auto mb-6">
            Create your first course with self-paced and accountability pricing.
          </p>
          <Button onClick={() => setShowCreate(true)}>+ Create Your First Course</Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Link
                      href={`/dashboard/courses/${course.id}`}
                      className="font-semibold text-[#1F2937] hover:text-[#0D9488] truncate"
                    >
                      {course.title}
                    </Link>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        course.isPublished
                          ? 'bg-teal-100 text-[#0D9488]'
                          : 'bg-[#F3F4F6] text-[#6B7280]'
                      }`}
                    >
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                    {/* Classroom badges */}
                    {(course.classrooms ?? []).length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {course.classrooms!.map((entry) => (
                          <span
                            key={entry.communityId}
                            className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-[#0369a1]"
                          >
                            In: {entry.community?.name ?? 'Community'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {course.description && (
                    <p className="text-sm text-[#6B7280] truncate">{course.description}</p>
                  )}
                  <p className="text-xs text-[#6B7280] mt-1">
                    {course._count?.modules ?? 0} modules · {course._count?.enrollments ?? 0} students
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="hidden sm:flex gap-4 mr-2">
                    <div className="text-right">
                      <p className="text-xs text-[#6B7280]">Self-Paced</p>
                      <p className="font-semibold text-[#1F2937]">
                        {formatPrice(course.priceSelfPaced, course.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#0D9488]">Accountability</p>
                      <p className="font-semibold text-[#1F2937]">
                        {formatPrice(course.priceAccountability, course.currency)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => openClassroomModal(course)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[#0D9488] text-[#0D9488] hover:bg-teal-50 transition-colors font-medium"
                    title="Manage classrooms"
                  >
                    Classrooms
                  </button>

                  {slug && course.isPublished && (
                    <CopyLinkButton
                      url={`${typeof window !== 'undefined' ? window.location.origin : ''}/${slug}/courses/${course.id}`}
                    />
                  )}

                  <Link
                    href={`/dashboard/courses/${course.id}`}
                    className="text-[#6B7280] hover:text-[#0D9488]"
                  >
                    →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
