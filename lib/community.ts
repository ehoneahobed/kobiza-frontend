import { apiFetch } from './api';

// ── Types ─────────────────────────────────────────────────────────────────

export interface PostCategory {
  id: string;
  communityId: string;
  name: string;
  emoji: string;
  order: number;
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

export async function getPostsFeed(communityId: string, categoryId?: string): Promise<Post[]> {
  const qs = categoryId ? `?categoryId=${categoryId}` : '';
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
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
  const res = await fetch(`${API_URL}/community/${communityId}/public`);
  if (!res.ok) throw new Error('Failed to fetch community info');
  return res.json();
}
