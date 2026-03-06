import { MetadataRoute } from 'next';
import { API_URL } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kobiza.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/explore`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${siteUrl}/signup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  // Dynamic pages — fetch creator profiles
  try {
    const res = await fetch(`${API_URL}/api/creators/explore`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const creators = await res.json();
      const creatorPages: MetadataRoute.Sitemap = (Array.isArray(creators) ? creators : []).map(
        (creator: { slug: string }) => ({
          url: `${siteUrl}/${creator.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }),
      );
      return [...staticPages, ...creatorPages];
    }
  } catch {
    // Fall back to static pages only
  }

  return staticPages;
}
