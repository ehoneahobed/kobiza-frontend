'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCourse } from '@/lib/courses';

export default function CourseIndexPage() {
  const { courseId } = useParams();
  const router = useRouter();

  useEffect(() => {
    getCourse(courseId as string)
      .then((course) => {
        const firstLesson = course.modules?.[0]?.lessons?.[0];
        if (firstLesson) {
          router.replace(`/learn/${courseId}/${firstLesson.id}`);
        } else {
          router.replace('/home');
        }
      })
      .catch(() => router.push('/home'));
  }, [courseId, router]);

  return (
    <div className="flex items-center justify-center h-screen bg-[#1F2937]">
      <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
