import { Metadata } from 'next';
import { API_URL } from '@/lib/api';

interface Props {
  params: Promise<{ slug: string; courseId: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, courseId } = await params;
  try {
    const res = await fetch(`${API_URL}/api/courses/${courseId}/public`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return { title: 'Course — Kobiza' };
    const course = await res.json();
    const title = `${course.title} — Kobiza`;
    const description = course.description?.slice(0, 160) || `Learn ${course.title} on Kobiza.`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        ...(course.coverUrl ? { images: [course.coverUrl] } : {}),
      },
    };
  } catch {
    return { title: 'Course — Kobiza' };
  }
}

export default function CourseLayout({ children }: Props) {
  return <>{children}</>;
}
