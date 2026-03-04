import { Metadata } from 'next';
import { API_URL } from '@/lib/api';

interface Props {
  params: Promise<{ slug: string; downloadId: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, downloadId } = await params;
  try {
    const res = await fetch(`${API_URL}/api/downloadables/${downloadId}/public`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return { title: 'Download — Kobiza' };
    const download = await res.json();
    const title = `${download.title} — Kobiza`;
    const description = download.description?.slice(0, 160) || `Get ${download.title} on Kobiza.`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        ...(download.coverUrl ? { images: [download.coverUrl] } : {}),
      },
    };
  } catch {
    return { title: 'Download — Kobiza' };
  }
}

export default function DownloadLayout({ children }: Props) {
  return <>{children}</>;
}
