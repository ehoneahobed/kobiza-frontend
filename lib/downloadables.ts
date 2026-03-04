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

// ── Analytics ─────────────────────────────────────────────────────────────

export interface DownloadableAccessUser {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  grantedAt: string;
}

export interface DownloadableAccessesResponse {
  accesses: DownloadableAccessUser[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface DownloadableAnalytics {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  price: number;
  currency: string;
  isPublished: boolean;
  totalAccesses: number;
  last30Days: number;
  daily: { date: string; count: number }[];
}

export async function getDownloadableAnalytics(downloadableId: string): Promise<DownloadableAnalytics> {
  return apiFetch(`/downloadables/${downloadableId}/analytics`);
}

export async function getDownloadableAccesses(
  downloadableId: string,
  page = 1,
  limit = 20,
  search?: string,
): Promise<DownloadableAccessesResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set('search', search);
  return apiFetch(`/downloadables/${downloadableId}/accesses?${params}`);
}

export async function downloadAccessesCsv(downloadableId: string): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('Kobiza_token') : null;
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const res = await fetch(`${API_URL}/api/downloadables/${downloadableId}/accesses/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="(.+)"/);
  const filename = match ? match[1] : 'accesses.csv';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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
