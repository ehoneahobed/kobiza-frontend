import { notFound } from 'next/navigation';
import { getStorefront } from '@/lib/creator';
import { listDownloadablesBySlug } from '@/lib/downloadables';
import { listProgramsBySlug } from '@/lib/coaching';
import StorefrontContent from './StorefrontContent';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function StorefrontPage({ params }: Props) {
  const { slug } = await params;
  let profile;
  try {
    profile = await getStorefront(slug);
  } catch {
    notFound();
  }

  const brand = profile.brandColor ?? '#0D9488';
  const communities = profile.communities ?? [];
  const standaloneCourses = profile.courses ?? [];
  const downloads = await listDownloadablesBySlug(slug).catch(() => []);
  const coachingPrograms = await listProgramsBySlug(slug).catch(() => []);

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Cover */}
      <div
        className="h-48 md:h-64 w-full"
        style={{
          background: profile.coverUrl
            ? `url(${profile.coverUrl}) center/cover no-repeat`
            : `linear-gradient(135deg, ${brand} 0%, #0f766e 100%)`,
        }}
      />

      <div className="max-w-3xl mx-auto px-4 -mt-16 pb-16">
        {/* Avatar + header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-end gap-5 mb-4">
            <div
              className="w-24 h-24 rounded-2xl border-4 border-white shadow flex items-center justify-center text-3xl font-bold text-white flex-shrink-0"
              style={{
                background: profile.logoUrl ? `url(${profile.logoUrl}) center/cover` : brand,
              }}
            >
              {!profile.logoUrl && profile.user.name.charAt(0).toUpperCase()}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-bold text-[#1F2937]">{profile.user.name}</h1>
              <p className="text-[#6B7280] text-sm">Kobiza.com/{slug}</p>
            </div>
          </div>

          {profile.bio && (
            <p className="text-[#1F2937] leading-relaxed">{profile.bio}</p>
          )}
        </div>

        <StorefrontContent
          communities={communities}
          standaloneCourses={standaloneCourses}
          downloads={downloads}
          coachingPrograms={coachingPrograms}
          brand={brand}
          slug={slug}
        />
      </div>
    </div>
  );
}
