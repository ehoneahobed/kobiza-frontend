import { apiFetch } from './api';

export interface LessonSubmission {
  id: string;
  lessonId: string;
  textContent: string | null;
  fileUrl: string | null;
  status: 'SUBMITTED' | 'REVIEWED';
  submittedAt: string;
  feedback?: { id: string; feedbackContent: string; createdAt: string } | null;
}

export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  track: 'SELF_PACED' | 'ACCOUNTABILITY';
  enrolledAt: string;
  submissions?: LessonSubmission[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  order: number;
  requiresDeliverable: boolean;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface CourseClassroom {
  id: string;
  courseId: string;
  communityId: string;
  memberPriceSelfPaced: number | null;
  memberPriceAccountability: number | null;
  showInClassroom: boolean;
  order: number;
  addedAt: string;
  community?: { id: string; name: string; description?: string | null };
}

export interface Course {
  id: string;
  creatorProfileId: string;
  communityId: string | null;  // Optional after Phase 13
  title: string;
  description: string | null;
  coverUrl: string | null;
  priceSelfPaced: number;
  priceAccountability: number;
  currency: string;
  isPublished: boolean;
  createdAt: string;
  modules?: CourseModule[];
  enrollment?: CourseEnrollment;
  classrooms?: CourseClassroom[];
  _count?: { modules: number; enrollments: number };
}

export interface PublicLesson {
  id: string;
  title: string;
  requiresDeliverable: boolean;
}

export interface PublicModule {
  id: string;
  title: string;
  order: number;
  lessons: PublicLesson[];
}

export interface PublicCourse extends Omit<Course, 'modules'> {
  modules: PublicModule[];
  creatorProfile: {
    slug: string;
    bio: string | null;
    logoUrl: string | null;
    brandColor: string | null;
    user: { name: string; avatarUrl: string | null };
  };
}

// ── Courses ───────────────────────────────────────────────────────────────
export async function listMyCourses(): Promise<Course[]> {
  return apiFetch('/courses');
}

export async function getCourse(courseId: string): Promise<Course> {
  return apiFetch(`/courses/${courseId}`);
}

export async function getPublicCourse(courseId: string): Promise<PublicCourse> {
  return apiFetch(`/courses/${courseId}/public`);
}

export async function createCourse(data: {
  title: string;
  description?: string;
  coverUrl?: string;
  priceSelfPaced: number;
  priceAccountability: number;
  currency?: string;
}): Promise<Course> {
  return apiFetch('/courses', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateCourse(courseId: string, data: Partial<Course>): Promise<Course> {
  return apiFetch(`/courses/${courseId}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteCourse(courseId: string) {
  return apiFetch(`/courses/${courseId}`, { method: 'DELETE' });
}

// ── Classrooms ────────────────────────────────────────────────────────────
export async function getClassrooms(courseId: string): Promise<CourseClassroom[]> {
  return apiFetch(`/courses/${courseId}/classrooms`);
}

export async function addToClassroom(
  courseId: string,
  data: {
    communityId: string;
    memberPriceSelfPaced?: number | null;
    memberPriceAccountability?: number | null;
    showInClassroom?: boolean;
    order?: number;
  },
): Promise<CourseClassroom> {
  return apiFetch(`/courses/${courseId}/classrooms`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateClassroomEntry(
  courseId: string,
  communityId: string,
  data: {
    memberPriceSelfPaced?: number | null;
    memberPriceAccountability?: number | null;
    showInClassroom?: boolean;
    order?: number;
  },
): Promise<CourseClassroom> {
  return apiFetch(`/courses/${courseId}/classrooms/${communityId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function removeFromClassroom(courseId: string, communityId: string) {
  return apiFetch(`/courses/${courseId}/classrooms/${communityId}`, { method: 'DELETE' });
}

// ── Modules ───────────────────────────────────────────────────────────────
export async function createModule(courseId: string, data: { title: string; order?: number }): Promise<CourseModule> {
  return apiFetch(`/courses/${courseId}/modules`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateModule(courseId: string, moduleId: string, data: { title?: string; order?: number }): Promise<CourseModule> {
  return apiFetch(`/courses/${courseId}/modules/${moduleId}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteModule(courseId: string, moduleId: string) {
  return apiFetch(`/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE' });
}

// ── Lessons ───────────────────────────────────────────────────────────────
export async function createLesson(
  courseId: string,
  moduleId: string,
  data: { title: string; content?: string; videoUrl?: string; order?: number; requiresDeliverable?: boolean },
): Promise<Lesson> {
  return apiFetch(`/courses/${courseId}/modules/${moduleId}/lessons`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateLesson(
  courseId: string,
  moduleId: string,
  lessonId: string,
  data: Partial<Lesson>,
): Promise<Lesson> {
  return apiFetch(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteLesson(courseId: string, moduleId: string, lessonId: string) {
  return apiFetch(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, { method: 'DELETE' });
}

// ── Member: My Enrollments ────────────────────────────────────────────────

export interface MyEnrollment {
  id: string;
  track: 'SELF_PACED' | 'ACCOUNTABILITY';
  enrolledAt: string;
  progress: { completed: number; total: number };
  firstLessonId: string | null;
  course: {
    id: string;
    title: string;
    description: string | null;
    slug: string;
    creatorName: string;
    creatorAvatarUrl: string | null;
  };
}

export async function getMyEnrollments(): Promise<MyEnrollment[]> {
  return apiFetch('/courses/my-enrollments');
}

// ── Formatting ─────────────────────────────────────────────────────────────
export function formatPrice(cents: number, currency: string): string {
  if (cents === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}
