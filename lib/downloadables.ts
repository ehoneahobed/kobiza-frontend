import { apiFetch } from './api';

// ── Types ─────────────────────────────────────────────────────────────────

export interface Downloadable {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  price: number; // cents (0 = free)
  currency: string;
  isPublished: boolean;
  createdAt: string;
  _count?: { accesses: number };
}

export interface DownloadablePublic extends Downloadable {
  hasAccess: boolean;
  fileUrl: string | null; // only present when hasAccess === true
  creatorProfile: {
    slug: string;
    user: { name: string; avatarUrl: string | null };
  };
}

export interface MyDownload {
  id: string;
  grantedAt: string;
  fileUrl: string;
  downloadable: {
    id: string;
    title: string;
    description: string | null;
    coverUrl: string | null;
    price: number;
    currency: string;
    creatorName: string;
    creatorSlug: string;
  };
}

// ── Public ─────────────────────────────────────────────────────────────────

export async function listDownloadablesBySlug(slug: string): Promise<Omit<Downloadable, '_count'>[]> {
  return apiFetch(`/downloadables/by-slug/${slug}`);
}

export async function getDownloadablePublic(downloadableId: string): Promise<DownloadablePublic> {
  return apiFetch(`/downloadables/${downloadableId}/public`);
}

// ── Creator ────────────────────────────────────────────────────────────────

export async function listMyDownloadables(): Promise<Downloadable[]> {
  return apiFetch('/downloadables/mine');
}

export async function createDownloadable(data: {
  title: string;
  description?: string;
  fileUrl: string;
  coverUrl?: string;
  price?: number;
  currency?: string;
  isPublished?: boolean;
}): Promise<Downloadable> {
  return apiFetch('/downloadables', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateDownloadable(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    fileUrl: string;
    coverUrl: string;
    price: number;
    currency: string;
    isPublished: boolean;
  }>,
): Promise<Downloadable> {
  return apiFetch(`/downloadables/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteDownloadable(id: string): Promise<void> {
  return apiFetch(`/downloadables/${id}`, { method: 'DELETE' });
}

// ── Member ─────────────────────────────────────────────────────────────────

/** Claim a free download — returns { fileUrl } */
export async function claimFreeDownload(downloadableId: string): Promise<{ fileUrl: string }> {
  return apiFetch(`/downloadables/${downloadableId}/claim`, { method: 'POST' });
}

export async function getMyDownloads(): Promise<MyDownload[]> {
  return apiFetch('/downloadables/my-downloads');
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function formatDownloadPrice(cents: number, currency: string): string {
  if (cents === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}
