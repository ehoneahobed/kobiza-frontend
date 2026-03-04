import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kobiza.com';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/home/', '/dashboard/', '/learn/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
