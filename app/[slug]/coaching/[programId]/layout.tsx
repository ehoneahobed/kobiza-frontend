import { Metadata } from 'next';
import { API_URL } from '@/lib/api';

interface Props {
  params: Promise<{ slug: string; programId: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, programId } = await params;
  try {
    const res = await fetch(`${API_URL}/api/coaching/programs/${programId}/public`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return { title: 'Coaching — Kobiza' };
    const program = await res.json();
    const title = `${program.title} — Kobiza`;
    const description = program.description?.slice(0, 160) || `${program.title} coaching on Kobiza.`;
    return {
      title,
      description,
      openGraph: { title, description },
    };
  } catch {
    return { title: 'Coaching — Kobiza' };
  }
}

export default function CoachingProgramLayout({ children }: Props) {
  return <>{children}</>;
}
