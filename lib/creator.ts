import { apiFetch } from './api';

export interface MembershipTier {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
  isActive: boolean;
}

export interface CommunityCategory {
  id: string;
  name: string;
  emoji: string;
  order: number;
}

export interface CommunityQuickLink {
  emoji: string;
  title: string;
  url: string;
}

export interface Community {
  id: string;
  name: string;
  description: string | null;
  welcomeMessage: string | null;
  quickLinks: CommunityQuickLink[] | null;
  categories: CommunityCategory[];
  membershipTiers: MembershipTier[];
  isFeatured: boolean;
  _count?: { courses: number; posts: number };
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  coverUrl?: string | null;
  priceSelfPaced: number;
  priceAccountability: number;
  currency: string;
}

export interface StorefrontClassroomEntry {
  course: Course;
  memberPriceSelfPaced: number | null;
  memberPriceAccountability: number | null;
  order: number;
}

// Storefront community — classrooms replace direct courses relation
export type StorefrontCommunity = Community & {
  classrooms?: StorefrontClassroomEntry[];
  _count?: { classrooms: number };
};

export interface CreatorProfile {
  id: string;
  userId: string;
  slug: string;
  bio: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  brandColor: string | null;
  user: { name: string; email?: string; avatarUrl: string | null };
  communities: StorefrontCommunity[];
  courses?: Course[];  // Standalone courses (not in any classroom)
}

// ── Public ────────────────────────────────────────────────────────────────
export async function getStorefront(slug: string): Promise<CreatorProfile> {
  return apiFetch(`/creators/${slug}`);
}

// ── Creator (protected) ───────────────────────────────────────────────────
export async function getMyProfile(): Promise<CreatorProfile> {
  return apiFetch('/creators/me/profile');
}

export async function updateMyProfile(data: Partial<{
  name: string;
  bio: string;
  slug: string;
  logoUrl: string;
  coverUrl: string;
  brandColor: string;
}>): Promise<CreatorProfile> {
  return apiFetch('/creators/me/profile', { method: 'PATCH', body: JSON.stringify(data) });
}

export interface DashboardStats {
  totalMembers: number;
  totalEnrollments: number;
  totalDownloads: number;
  totalBookings: number;
  totalRevenue: number;
  revenueThisMonth: number;
}

export interface ActivityItem {
  type: 'enrollment' | 'download' | 'coaching' | 'membership';
  user: { name: string; avatarUrl: string | null };
  title: string;
  label: string;
  at: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch('/creators/me/dashboard-stats');
}

export async function getRecentActivity(): Promise<ActivityItem[]> {
  return apiFetch('/creators/me/recent-activity');
}

// ── Community ─────────────────────────────────────────────────────────────
export async function createCommunity(data: { name: string; description?: string }): Promise<Community> {
  return apiFetch('/community', { method: 'POST', body: JSON.stringify(data) });
}

export async function getMyCommunities(): Promise<Community[]> {
  return apiFetch('/community/mine');
}

export async function updateCommunity(
  communityId: string,
  data: {
    name?: string;
    description?: string;
    welcomeMessage?: string;
    quickLinks?: CommunityQuickLink[];
  },
): Promise<Community> {
  return apiFetch(`/community/${communityId}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteCommunity(communityId: string): Promise<void> {
  return apiFetch(`/community/${communityId}`, { method: 'DELETE' });
}

export async function setFeaturedCommunity(communityId: string): Promise<Community> {
  return apiFetch(`/community/${communityId}/featured`, { method: 'PATCH' });
}

// ── Tiers ─────────────────────────────────────────────────────────────────
export async function createTier(
  communityId: string,
  data: { name: string; description?: string; priceMonthly: number; priceAnnual?: number; currency?: string },
): Promise<MembershipTier> {
  return apiFetch(`/community/${communityId}/tiers`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateTier(
  communityId: string,
  tierId: string,
  data: { name?: string; description?: string; priceMonthly?: number; priceAnnual?: number; isActive?: boolean },
): Promise<MembershipTier> {
  return apiFetch(`/community/${communityId}/tiers/${tierId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTier(communityId: string, tierId: string) {
  return apiFetch(`/community/${communityId}/tiers/${tierId}`, { method: 'DELETE' });
}

// ── Public Directory ───────────────────────────────────────────────────────

export interface ExploreCommunity {
  id: string;
  name: string;
  description: string | null;
  isFeatured: boolean;
  creatorProfile: {
    slug: string;
    bio: string | null;
    logoUrl: string | null;
    brandColor: string | null;
    user: { name: string; avatarUrl: string | null };
  };
  _count: { courses: number; membershipTiers: number };
}

export interface ExploreCourse {
  id: string;
  title: string;
  description: string | null;
  priceSelfPaced: number;
  priceAccountability: number;
  currency: string;
  community: {
    name: string;
    creatorProfile: {
      slug: string;
      brandColor: string | null;
      logoUrl: string | null;
      user: { name: string };
    };
  };
  _count: { enrollments: number; modules: number };
}

export interface ExploreDownload {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  coverUrl: string | null;
  creatorProfile: {
    slug: string;
    brandColor: string | null;
    logoUrl: string | null;
    user: { name: string; avatarUrl: string | null };
  };
  _count: { accesses: number };
}

export interface ExploreCoaching {
  id: string;
  title: string;
  description: string | null;
  type: 'ONE_ON_ONE' | 'GROUP';
  durationMinutes: number;
  price: number;
  currency: string;
  creatorProfile: {
    slug: string;
    brandColor: string | null;
    logoUrl: string | null;
    user: { name: string; avatarUrl: string | null };
  };
  _count: { sessions: number };
}

export interface ExploreResults {
  communities: ExploreCommunity[];
  courses: ExploreCourse[];
  downloads: ExploreDownload[];
  coaching: ExploreCoaching[];
}

export async function getExploreResults(q?: string): Promise<ExploreResults> {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  return apiFetch(`/creators/explore${qs}`);
}

export interface DirectoryCreator {
  id: string;
  slug: string;
  bio: string | null;
  logoUrl: string | null;
  brandColor: string | null;
  user: { name: string; avatarUrl: string | null };
  community: {
    id: string;
    name: string;
    description: string | null;
    _count: { courses: number; posts: number; membershipTiers: number };
  } | null;
}

export async function getCreatorDirectory(q?: string): Promise<DirectoryCreator[]> {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  return apiFetch(`/creators${qs}`);
}

// ── Formatting ─────────────────────────────────────────────────────────────
export function formatPrice(cents: number, currency: string): string {
  if (cents === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}
