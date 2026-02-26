import { apiFetch, API_URL } from './api';

// ── Types ─────────────────────────────────────────────────────────────────

export interface PostCategory {
  id: string;
  communityId: string;
  name: string;
  emoji: string;
  order: number;
  minTierOrder: number;
}

export interface PostAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: 'CREATOR' | 'MEMBER';
}

export interface CommentAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface CommentReactionCount {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

export interface PostComment {
  id: string;
  content: string;
  createdAt: string;
  author: CommentAuthor;
  parentId: string | null;
  replies: PostComment[];
  reactions: CommentReactionCount[];
}

export interface Post {
  id: string;
  communityId: string;
  content: string;
  imageUrl: string | null;
  isPinned: boolean;
  minTierOrder: number;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  category?: { id: string; name: string; emoji: string } | null;
  comments: PostComment[];
  likes: { userId: string }[];
  likedByMe: boolean;
  _count: { likes: number; comments: number };
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatarUrl: string | null;
  points: number;
  level: number;
}

export type CommunityRole = 'OWNER' | 'MODERATOR' | 'MEMBER';
export type CommunityVisibility = 'PUBLIC' | 'PRIVATE';
export type JoinRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface JoinRequest {
  id: string;
  userId: string;
  user: { id: string; name: string; avatarUrl: string | null };
  status: JoinRequestStatus;
  answers: { question: string; answer: string }[] | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface CommunityMember {
  id: string;
  name: string;
  avatarUrl: string | null;
  communityRole: CommunityRole;
  tierName: string | null;
  joinedAt: string;
}

export interface CommunityClassroomCourse {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  priceSelfPaced: number;
  priceAccountability: number;
  currency: string;
  isPublished: boolean;
  totalLessons: number;
  // Effective prices (member overrides applied if user is a member)
  effectivePriceSelfPaced: number;
  effectivePriceAccountability: number;
  isMemberPricing: boolean;
  classroomEntry: {
    memberPriceSelfPaced: number | null;
    memberPriceAccountability: number | null;
    order: number;
  };
  enrollment: {
    id: string;
    track: 'SELF_PACED' | 'ACCOUNTABILITY';
    status: string;
    enrolledAt: string;
  } | null;
  _count: { enrollments: number };
}

// Alias used in dashboard classroom tab
export type ClassroomCourse = CommunityClassroomCourse;

export interface QuickLink {
  emoji: string;
  title: string;
  url: string;
}

// ── Feed ──────────────────────────────────────────────────────────────────

export type FeedSort = 'DEFAULT' | 'NEW' | 'TOP' | 'UNREAD';

export interface FeedResponse {
  posts: Post[];
  total: number;
  page: number;
  hasMore: boolean;
}

export async function getPostsFeed(
  communityId: string,
  categoryId?: string,
  sort?: FeedSort,
  page?: number,
  limit?: number,
): Promise<FeedResponse> {
  const params = new URLSearchParams();
  if (categoryId) params.set('categoryId', categoryId);
  if (sort && sort !== 'DEFAULT') params.set('sort', sort);
  if (page && page > 1) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiFetch(`/community/${communityId}/posts${qs}`);
}

export async function createPost(
  communityId: string,
  data: { content: string; imageUrl?: string; categoryId?: string; mentionedUserIds?: string[] },
): Promise<Post> {
  return apiFetch(`/community/${communityId}/posts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deletePost(postId: string): Promise<void> {
  return apiFetch(`/community/posts/${postId}`, { method: 'DELETE' });
}

export async function pinPost(postId: string, isPinned: boolean): Promise<Post> {
  return apiFetch(`/community/posts/${postId}/pin`, {
    method: 'PATCH',
    body: JSON.stringify({ isPinned }),
  });
}

// ── Comments ──────────────────────────────────────────────────────────────

export async function addComment(
  postId: string,
  content: string,
  mentionedUserIds?: string[],
  parentId?: string,
): Promise<PostComment> {
  return apiFetch(`/community/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content, mentionedUserIds, parentId }),
  });
}

export async function toggleCommentReaction(
  commentId: string,
  emoji: string,
): Promise<{ reacted: boolean; reactionCounts: { emoji: string; count: number }[] }> {
  return apiFetch(`/community/comments/${commentId}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ emoji }),
  });
}

// ── Member Search ──────────────────────────────────────────────────────────

export interface MentionSuggestion {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export async function searchMembers(communityId: string, q: string): Promise<MentionSuggestion[]> {
  return apiFetch(`/community/${communityId}/members/search?q=${encodeURIComponent(q)}`);
}

export async function deleteComment(commentId: string): Promise<void> {
  return apiFetch(`/community/comments/${commentId}`, { method: 'DELETE' });
}

// ── Likes ─────────────────────────────────────────────────────────────────

export async function toggleLike(postId: string): Promise<{ liked: boolean }> {
  return apiFetch(`/community/posts/${postId}/like`, { method: 'POST' });
}

// ── Categories ────────────────────────────────────────────────────────────

export async function getCategories(communityId: string): Promise<PostCategory[]> {
  return apiFetch(`/community/${communityId}/categories`);
}

export async function createCategory(
  communityId: string,
  data: { name: string; emoji?: string },
): Promise<PostCategory> {
  return apiFetch(`/community/${communityId}/categories`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(categoryId: string): Promise<void> {
  return apiFetch(`/community/categories/${categoryId}`, { method: 'DELETE' });
}

// ── Leaderboard & Members ─────────────────────────────────────────────────

export async function getLeaderboard(communityId: string): Promise<LeaderboardEntry[]> {
  return apiFetch(`/community/${communityId}/leaderboard`);
}

export async function getMembers(communityId: string): Promise<CommunityMember[]> {
  return apiFetch(`/community/${communityId}/members`);
}

export async function setMemberRole(
  communityId: string,
  targetUserId: string,
  role: 'MODERATOR' | 'MEMBER',
): Promise<{ message: string }> {
  return apiFetch(`/community/${communityId}/members/${targetUserId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function removeMember(
  communityId: string,
  targetUserId: string,
): Promise<{ message: string }> {
  return apiFetch(`/community/${communityId}/members/${targetUserId}`, { method: 'DELETE' });
}

export async function getCommunityClassroom(
  communityId: string,
): Promise<CommunityClassroomCourse[]> {
  return apiFetch(`/community/${communityId}/classroom`);
}

// ── Member Home ────────────────────────────────────────────────────────────

export interface MyMembership {
  id: string;
  joinedAt: string;
  community: {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    creatorName: string;
    creatorAvatarUrl: string | null;
    _count: { courses: number; posts: number };
  };
}

export async function getMyMemberships(): Promise<MyMembership[]> {
  return apiFetch('/community/my-memberships');
}

export async function joinFreeTier(tierId: string): Promise<{ id: string; slug: string }> {
  return apiFetch(`/community/tiers/${tierId}/join-free`, { method: 'POST' });
}

// ── Membership Status ──────────────────────────────────────────────────────

export interface MembershipStatus {
  hasMembership: boolean;
  membership: {
    id: string;
    tier: {
      id: string;
      name: string;
      priceMonthly: number;
      priceAnnual: number;
      currency: string;
    };
    billingInterval: 'FREE' | 'MONTHLY' | 'ANNUAL';
    currentPeriodEnd: string | null;
    daysUntilRenewal: number | null;
    cancelAtPeriodEnd: boolean;
    status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  } | null;
  freeTier: { id: string; name: string } | null;
  allTiers: {
    id: string;
    name: string;
    description: string | null;
    priceMonthly: number;
    priceAnnual: number;
    currency: string;
  }[];
  visibility: CommunityVisibility;
  joinQuestions: string[] | null;
  joinRequest: { id: string; status: JoinRequestStatus; createdAt: string } | null;
}

export async function getMembershipStatus(communityId: string): Promise<MembershipStatus> {
  return apiFetch(`/community/${communityId}/membership-status`);
}

// ── Join Requests ────────────────────────────────────────────────────────

export async function requestToJoin(
  communityId: string,
  answers?: { question: string; answer: string }[],
): Promise<{ id: string; status: JoinRequestStatus; createdAt: string }> {
  return apiFetch(`/community/${communityId}/join-request`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

export async function cancelJoinRequest(communityId: string): Promise<{ message: string }> {
  return apiFetch(`/community/${communityId}/join-request`, { method: 'DELETE' });
}

export async function getJoinRequests(
  communityId: string,
  status?: JoinRequestStatus,
): Promise<JoinRequest[]> {
  const qs = status ? `?status=${status}` : '';
  return apiFetch(`/community/${communityId}/join-requests${qs}`);
}

export async function reviewJoinRequest(
  requestId: string,
  status: 'APPROVED' | 'REJECTED',
): Promise<{ message: string }> {
  return apiFetch(`/community/join-requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function getCommunityPublic(communityId: string): Promise<{
  id: string;
  name: string;
  description: string | null;
  welcomeMessage: string | null;
  visibility: CommunityVisibility;
  memberCount: number;
  membershipTiers: { id: string; name: string; description: string | null; priceMonthly: number; priceAnnual: number; currency: string }[];
  creatorName: string;
  creatorAvatarUrl: string | null;
}> {
  const res = await fetch(`${API_URL}/api/community/${communityId}/public`);
  if (!res.ok) throw new Error('Failed to fetch community info');
  return res.json();
}

// ── Events ────────────────────────────────────────────────────────────────

export type EventType = 'ONLINE' | 'IN_PERSON' | 'HYBRID';
export type RsvpStatus = 'GOING' | 'MAYBE' | 'NOT_GOING';
export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export interface CommunityEvent {
  id: string;
  communityId: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  location: string | null;
  locationUrl: string | null;
  eventType: EventType;
  startsAt: string;
  endsAt: string;
  timezone: string;
  minTierOrder: number;
  maxAttendees: number | null;
  recurrenceType: RecurrenceType;
  recurrenceEndDate: string | null;
  parentEventId: string | null;
  isPublished: boolean;
  createdAt: string;
  createdBy: { id: string; name: string; avatarUrl: string | null };
  myRsvp: RsvpStatus | null;
  rsvpCount: { going: number; maybe: number };
  isLocked?: boolean;
  _count: { rsvps: number };
}

export interface CreateEventData {
  title: string;
  description?: string;
  coverUrl?: string;
  location?: string;
  locationUrl?: string;
  eventType?: EventType;
  startsAt: string;
  endsAt: string;
  timezone?: string;
  minTierOrder?: number;
  maxAttendees?: number;
  recurrenceType?: RecurrenceType;
  recurrenceEndDate?: string;
}

export async function getEvents(
  communityId: string,
  opts?: { month?: number; year?: number; withLockStatus?: boolean },
): Promise<CommunityEvent[]> {
  const params = new URLSearchParams();
  if (opts?.month !== undefined) params.set('month', String(opts.month));
  if (opts?.year !== undefined) params.set('year', String(opts.year));
  if (opts?.withLockStatus) params.set('withLockStatus', 'true');
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiFetch(`/community/${communityId}/events${qs}`);
}

export async function createEvent(communityId: string, data: CreateEventData): Promise<CommunityEvent> {
  return apiFetch(`/community/${communityId}/events`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEvent(eventId: string, data: Partial<CreateEventData> & { isPublished?: boolean }): Promise<CommunityEvent> {
  return apiFetch(`/community/events/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteEvent(eventId: string, deleteSeries?: boolean): Promise<void> {
  const qs = deleteSeries ? '?deleteSeries=true' : '';
  return apiFetch(`/community/events/${eventId}${qs}`, { method: 'DELETE' });
}

export async function rsvpEvent(eventId: string, status: RsvpStatus, note?: string): Promise<{ id: string; status: RsvpStatus }> {
  return apiFetch(`/community/events/${eventId}/rsvp`, {
    method: 'POST',
    body: JSON.stringify({ status, note }),
  });
}

export async function cancelRsvp(eventId: string): Promise<{ message: string }> {
  return apiFetch(`/community/events/${eventId}/rsvp`, { method: 'DELETE' });
}

// ── Tier Config ──────────────────────────────────────────────────────────

export interface TierConfigTier {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
  isActive: boolean;
  order: number;
  _count: { memberships: number };
}

export interface TierConfig {
  tiers: TierConfigTier[];
  categories: PostCategory[];
}

export async function getTierConfig(communityId: string): Promise<TierConfig> {
  return apiFetch(`/community/${communityId}/tier-config`);
}

export async function updateCategory(
  categoryId: string,
  data: { minTierOrder?: number; name?: string; emoji?: string },
): Promise<PostCategory> {
  return apiFetch(`/community/categories/${categoryId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export interface SwitchTierResult {
  action: 'checkout' | 'downgraded' | 'enrolled';
  tierId: string;
  message: string;
}

export async function switchTier(
  communityId: string,
  targetTierId: string,
): Promise<SwitchTierResult> {
  return apiFetch(`/community/${communityId}/switch-tier`, {
    method: 'POST',
    body: JSON.stringify({ targetTierId }),
  });
}
