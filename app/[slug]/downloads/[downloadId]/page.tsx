'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getDownloadablePublic,
  claimFreeDownload,
  DownloadablePublic,
  formatDownloadPrice,
} from '@/lib/downloadables';
import { getToken } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/payments';

// ── Helpers ─────────────────────────────────────────────────────────────────

function getGateway(): 'stripe' | 'paystack' {
  // Simple heuristic: use Paystack for African currencies
  return 'stripe';
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function DownloadLandingPage() {
  const { slug, downloadId } = useParams<{ slug: string; downloadId: string }>();
  const router = useRouter();

  const [dl, setDl] = useState<DownloadablePublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [claimed, setClaimed] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    getDownloadablePublic(downloadId)
      .then((data) => {
        setDl(data);
        if (data.hasAccess && data.fileUrl) {
          setFileUrl(data.fileUrl);
          setClaimed(true);
        }
      })
      .catch(() => setError('Download not found.'))
      .finally(() => setLoading(false));
  }, [downloadId]);

  const handleClaim = async () => {
    if (!getToken()) {
      router.push(`/login?next=/${slug}/downloads/${downloadId}`);
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      const { fileUrl: url } = await claimFreeDownload(downloadId);
      setFileUrl(url);
      setClaimed(true);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to claim download.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!getToken()) {
      router.push(`/login?next=/${slug}/downloads/${downloadId}`);
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      const result = await createCheckoutSession({
        productId: downloadId,
        productType: 'download',
        gateway: getGateway(),
      });
      if ('url' in result && result.url) window.location.href = result.url;
      else if ('authorization_url' in result) window.location.href = result.authorization_url;
    } catch (err: any) {
      setError(err?.message ?? 'Failed to start checkout.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !dl) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center max-w-sm w-full">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-[#1F2937] font-semibold mb-2">Not found</p>
          <p className="text-[#6B7280] text-sm mb-6">{error}</p>
          <Link
            href={`/${slug}`}
            className="bg-[#0D9488] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors"
          >
            Back to profile
          </Link>
        </div>
      </div>
    );
  }

  if (!dl) return null;

  const isFree = dl.price === 0;
  const { creatorProfile } = dl;

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Header nav */}
      <div className="bg-white border-b border-[#F3F4F6] px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href={`/${slug}`} className="text-sm text-[#6B7280] hover:text-[#0D9488] transition-colors">
            ← {creatorProfile.user.name}
          </Link>
          <span className="text-[#D1D5DB]">/</span>
          <span className="text-sm text-[#1F2937] font-medium truncate">{dl.title}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Product card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          {/* Cover */}
          {dl.coverUrl ? (
            <img src={dl.coverUrl} alt={dl.title} className="w-full h-56 object-cover" />
          ) : (
            <div className="w-full h-56 bg-gradient-to-br from-[#0D9488]/20 to-[#38BDF8]/20 flex items-center justify-center text-8xl">
              📥
            </div>
          )}

          <div className="p-8">
            {/* Creator */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-[#0D9488]/20 flex items-center justify-center text-xs font-bold text-[#0D9488]">
                {creatorProfile.user.name.charAt(0).toUpperCase()}
              </div>
              <Link
                href={`/${slug}`}
                className="text-sm text-[#6B7280] hover:text-[#0D9488] transition-colors"
              >
                {creatorProfile.user.name}
              </Link>
            </div>

            <h1 className="text-2xl font-bold text-[#1F2937] mb-3">{dl.title}</h1>

            {dl.description && (
              <p className="text-[#6B7280] leading-relaxed mb-6">{dl.description}</p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-3xl font-bold text-[#1F2937]">
                {formatDownloadPrice(dl.price, dl.currency)}
              </span>
              {isFree && (
                <span className="text-sm text-[#0D9488] font-semibold">No credit card needed</span>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            {/* CTA */}
            {claimed && fileUrl ? (
              <div className="space-y-3">
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-semibold text-[#0D9488] text-sm">You have access!</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">Your download link is ready below.</p>
                  </div>
                </div>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-4 rounded-xl bg-[#0D9488] text-white font-bold text-base hover:bg-teal-700 transition-colors"
                >
                  ⬇ Download Now
                </a>
              </div>
            ) : isFree ? (
              <button
                onClick={handleClaim}
                disabled={actionLoading}
                className="w-full py-4 rounded-xl bg-[#0D9488] text-white font-bold text-base hover:bg-teal-700 transition-colors disabled:opacity-60"
              >
                {actionLoading ? 'Getting your link…' : 'Get Free Download'}
              </button>
            ) : (
              <button
                onClick={handleBuy}
                disabled={actionLoading}
                className="w-full py-4 rounded-xl bg-[#F59E0B] text-white font-bold text-base hover:bg-amber-500 transition-colors disabled:opacity-60"
              >
                {actionLoading ? 'Redirecting…' : `Buy — ${formatDownloadPrice(dl.price, dl.currency)}`}
              </button>
            )}

            {!getToken() && (
              <p className="text-center text-xs text-[#6B7280] mt-3">
                Already purchased?{' '}
                <Link
                  href={`/login?next=/${slug}/downloads/${downloadId}`}
                  className="text-[#0D9488] hover:underline font-medium"
                >
                  Sign in
                </Link>{' '}
                to access your download.
              </p>
            )}
          </div>
        </div>

        {/* What you'll get */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-[#1F2937] mb-4">What you get</h2>
          <ul className="space-y-3">
            {[
              'Instant digital delivery',
              'Download anytime from your account',
              isFree ? 'Completely free — no credit card' : `One-time payment of ${formatDownloadPrice(dl.price, dl.currency)}`,
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-[#1F2937]">
                <span className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center text-[#0D9488] text-xs flex-shrink-0">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
