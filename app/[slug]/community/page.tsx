'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getStorefront, CreatorProfile } from '@/lib/creator';
import { enrollFree } from '@/lib/payments';
import {
  getPostsFeed,
  createPost,
  getLeaderboard,
  getMembers,
  setMemberRole,
  removeMember,
  getCommunityClassroom,
  getMembershipStatus,
  requestToJoin,
  cancelJoinRequest,
  joinFreeTier,
  getEvents,
  Post,
  LeaderboardEntry,
  CommunityMember,
  CommunityRole,
  CommunityClassroomCourse,
  CommunityEvent,
  PostCategory,
  QuickLink,
  MembershipStatus,
  CommunityVisibility,
  JoinRequestStatus,
  FeedSort,
  switchTier,
} from '@/lib/community';
import { formatPrice } from '@/lib/creator';
import { getToken } from '@/lib/auth'; // used for getUserIdFromToken
import { useCommunitySocket, MentionNotification, PresenceUpdate } from '@/hooks/useCommunitySocket';
import PostCard from '@/components/community/PostCard';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import MentionInput from '@/components/community/MentionInput';
import CommunitySidebar from '@/components/community/CommunitySidebar';
import LeaderboardList from '@/components/community/LeaderboardList';
import WelcomeCard from '@/components/community/WelcomeCard';
import CalendarView from '@/components/community/CalendarView';
import DirectMessages from '@/components/community/DirectMessages';
import CommunitySwitcher from '@/components/community/CommunitySwitcher';
import { getUserActivity, DailyActivity } from '@/lib/activity';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import { ImageUpload } from '@/components/ui/ImageUpload';

type Tab = 'feed' | 'calendar' | 'classroom' | 'members' | 'leaderboard' | 'about';

const ALL_TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'feed', label: 'Community', icon: '💬' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'classroom', label: 'Classroom', icon: '🎓' },
  { id: 'members', label: 'Members', icon: '👥' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
  { id: 'about', label: 'About', icon: 'ℹ' },
];

const LEVEL_COLORS = [
  'bg-gray-100 text-gray-500',
  'bg-blue-100 text-blue-600',
  'bg-teal-100 text-[#0D9488]',
  'bg-amber-100 text-amber-600',
  'bg-orange-100 text-orange-600',
];

function getUserIdFromToken(): string | null {
  try {
    const token = getToken();
    if (!token) return null;
    return JSON.parse(atob(token.split('.')[1])).sub ?? null;
  } catch {
    return null;
  }
}

function Avatar({
  name,
  avatarUrl,
  size = 'sm',
}: {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const cls =
    size === 'lg'
      ? 'w-12 h-12 text-base'
      : size === 'md'
      ? 'w-10 h-10 text-sm'
      : 'w-8 h-8 text-xs';
  if (avatarUrl)
    return <img src={avatarUrl} alt={name} className={`${cls} rounded-full object-cover`} />;
  return (
    <div
      className={`${cls} rounded-full bg-[#0D9488]/10 flex items-center justify-center font-semibold text-[#0D9488] flex-shrink-0`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Feed Tab ───────────────────────────────────────────────────────────────
function FeedTab({
  communityId,
  categories,
  welcomeMessage,
  currentUserId,
  currentUserRole,
  brand,
  onMentionReceived,
}: {
  communityId: string;
  categories: PostCategory[];
  welcomeMessage?: string | null;
  currentUserId: string | null;
  currentUserRole: CommunityRole | null;
  brand: string;
  onMentionReceived?: (notif: MentionNotification) => void;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(undefined);
  const [feedSort, setFeedSort] = useState<FeedSort>('DEFAULT');
  const [feedPage, setFeedPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postMentionMap, setPostMentionMap] = useState<Map<string, string>>(new Map());
  const [postCategory, setPostCategory] = useState<string>('');
  const [posting, setPosting] = useState(false);
  const [postImageUrl, setPostImageUrl] = useState('');
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref so the WebSocket handler reads the latest active category filter
  // without reconnecting every time the user switches category pills
  const activeCatRef = useRef<string | undefined>(undefined);
  activeCatRef.current = activeCategoryId;

  const loadFeed = useCallback(
    async (catId?: string, sort: FeedSort = 'DEFAULT', page = 1, append = false, q?: string) => {
      if (!append) setLoading(true);
      else setLoadingMore(true);
      try {
        const result = await getPostsFeed(communityId, catId, sort, page, undefined, q || undefined);
        if (append) {
          setPosts((prev) => [...prev, ...result.posts]);
        } else {
          setPosts(result.posts);
        }
        setHasMore(result.hasMore);
        setFeedPage(result.page);
      } catch {
        // ignore
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [communityId],
  );

  useEffect(() => {
    loadFeed(activeCategoryId, feedSort, 1, false, searchQuery);
  }, [loadFeed, activeCategoryId, feedSort, searchQuery]);

  const handleSortChange = (sort: FeedSort) => {
    setFeedSort(sort);
    setFeedPage(1);
  };

  const handleLoadMore = () => {
    loadFeed(activeCategoryId, feedSort, feedPage + 1, true, searchQuery);
  };

  const handleSearchInput = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
      setFeedPage(1);
    }, 350);
  };

  // WebSocket: one persistent connection; server pushes all events instantly
  useCommunitySocket(communityId, {
    onNewPost: (post) => {
      if (post.author.id === currentUserId) return; // own post already shown from handlePost
      if (activeCatRef.current && post.category?.id !== activeCatRef.current) return;
      // Auto-insert at top; dedup guard prevents showing twice if somehow received again
      setPosts((prev) => (prev.some((p) => p.id === post.id) ? prev : [post, ...prev]));
    },
    onPostUpdated: (updatedPost) => {
      setPosts((ps) => ps.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p)));
    },
    onCommentUpdated: (postId, updatedComment) => {
      setPosts((ps) =>
        ps.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            comments: p.comments.map((c) => {
              if (c.id === updatedComment.id) return { ...c, ...updatedComment, replies: c.replies };
              return {
                ...c,
                replies: (c.replies ?? []).map((r) =>
                  r.id === updatedComment.id ? { ...r, ...updatedComment } : r,
                ),
              };
            }),
          };
        }),
      );
    },
    onPostDeleted: (postId) => {
      setPosts((ps) => ps.filter((p) => p.id !== postId));
    },
    onPostPinned: (postId, isPinned) => {
      setPosts((ps) => ps.map((p) => (p.id === postId ? { ...p, isPinned } : p)));
    },
    onNewComment: (postId, comment) => {
      if (comment.author.id === currentUserId) return; // handled optimistically by PostCard
      setPosts((ps) =>
        ps.map((p) => {
          if (p.id !== postId) return p;
          if (comment.parentId) {
            // It's a reply — add to parent comment's replies
            const alreadyExists = p.comments.some((c) => (c.replies ?? []).some((r) => r.id === comment.id));
            if (alreadyExists) return p;
            return {
              ...p,
              comments: p.comments.map((c) =>
                c.id === comment.parentId
                  ? { ...c, replies: [...(c.replies ?? []), comment] }
                  : c,
              ),
              _count: { ...p._count, comments: p._count.comments + 1 },
            };
          }
          // Top-level comment
          if (p.comments.some((c) => c.id === comment.id)) return p;
          return {
            ...p,
            comments: [...p.comments, comment],
            _count: { ...p._count, comments: p._count.comments + 1 },
          };
        }),
      );
    },
    onCommentDeleted: (postId, commentId, deletedCount, parentId) => {
      setPosts((ps) =>
        ps.map((p) => {
          if (p.id !== postId) return p;
          if (parentId) {
            // Deleting a reply
            return {
              ...p,
              comments: p.comments.map((c) =>
                c.id === parentId
                  ? { ...c, replies: (c.replies ?? []).filter((r) => r.id !== commentId) }
                  : c,
              ),
              _count: { ...p._count, comments: Math.max(0, p._count.comments - (deletedCount ?? 1)) },
            };
          }
          // Deleting a top-level comment (and its replies via cascade)
          return {
            ...p,
            comments: p.comments.filter((c) => c.id !== commentId),
            _count: { ...p._count, comments: Math.max(0, p._count.comments - (deletedCount ?? 1)) },
          };
        }),
      );
    },
    onReactionToggled: (commentId, _emoji, reactionCounts, userId, _reacted) => {
      if (userId === currentUserId) return; // handled optimistically by PostCard
      setPosts((ps) =>
        ps.map((p) => ({
          ...p,
          comments: p.comments.map((c) => {
            if (c.id === commentId) {
              return { ...c, reactions: reactionCounts.map((rc) => ({ ...rc, reactedByMe: c.reactions?.find((r) => r.emoji === rc.emoji)?.reactedByMe ?? false })) };
            }
            return {
              ...c,
              replies: (c.replies ?? []).map((r) =>
                r.id === commentId
                  ? { ...r, reactions: reactionCounts.map((rc) => ({ ...rc, reactedByMe: r.reactions?.find((rr) => rr.emoji === rc.emoji)?.reactedByMe ?? false })) }
                  : r,
              ),
            };
          }),
        })),
      );
    },
    onLikeToggled: (postId, likeCount, userId, liked) => {
      setPosts((ps) =>
        ps.map((p) =>
          p.id === postId
            ? {
                ...p,
                // Update likedByMe only for events triggered by this user (server echo)
                likedByMe: userId === currentUserId ? liked : p.likedByMe,
                _count: { ...p._count, likes: likeCount },
              }
            : p,
        ),
      );
    },
    onMentionReceived,
  });

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || !currentUserId) return;
    setPosting(true);
    try {
      const mentionedUserIds = Array.from(postMentionMap.values());
      const post = await createPost(communityId, {
        content: postContent.trim(),
        imageUrl: postImageUrl || undefined,
        categoryId: postCategory || undefined,
        mentionedUserIds: mentionedUserIds.length ? mentionedUserIds : undefined,
      });
      setPosts((ps) => [post, ...ps]);
      setPostContent('');
      setPostMentionMap(new Map());
      setPostCategory('');
      setPostImageUrl('');
      setShowImageUpload(false);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Welcome card */}
      {welcomeMessage && (
        <WelcomeCard message={welcomeMessage} storageKey={`welcome-${communityId}`} />
      )}

      {/* Post composer */}
      {currentUserId ? (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <form onSubmit={handlePost}>
            <MentionInput
              communityId={communityId}
              value={postContent}
              onChange={(val, map) => {
                setPostContent(val);
                setPostMentionMap(map);
              }}
              placeholder="Write something… use @ to mention"
              rows={3}
              className="w-full rounded-lg border border-[#F3F4F6] bg-[#F3F4F6] px-4 py-3 text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488] resize-none text-sm"
              disabled={posting}
            />
            {/* Image preview */}
            {postImageUrl && (
              <div className="mt-2 relative inline-block">
                <img
                  src={postImageUrl}
                  alt="Attached"
                  className="h-20 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => { setPostImageUrl(''); setShowImageUpload(false); }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-[#EF4444] text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                >
                  x
                </button>
              </div>
            )}

            {/* Image upload inline */}
            {showImageUpload && !postImageUrl && (
              <div className="mt-2">
                <ImageUpload
                  value=""
                  onChange={(url) => setPostImageUrl(url)}
                  purpose="post-image"
                  maxSizeMB={5}
                />
              </div>
            )}

            <div className="flex items-center gap-3 mt-3">
              {categories.length > 0 && (
                <select
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value)}
                  className="text-sm border border-[#6B7280]/20 rounded-lg px-3 py-2 text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488] bg-white"
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => setShowImageUpload((s) => !s)}
                className={`p-2 rounded-lg transition-colors ${
                  showImageUpload || postImageUrl
                    ? 'text-[#0D9488] bg-teal-50'
                    : 'text-[#6B7280] hover:text-[#0D9488] hover:bg-[#F3F4F6]'
                }`}
                title="Attach image"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              </button>
              <button
                type="submit"
                disabled={!postContent.trim() || posting}
                className="ml-auto text-white font-semibold px-5 py-2 rounded-lg text-sm disabled:opacity-40 transition-colors hover:opacity-90"
                style={{ background: brand }}
              >
                {posting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-5 text-center">
          <p className="text-[#6B7280] text-sm mb-3">Sign in to join the conversation</p>
          <Link
            href="/login"
            className="inline-block text-white font-semibold px-6 py-2 rounded-lg text-sm"
            style={{ background: brand }}
          >
            Log in
          </Link>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search posts..."
          onChange={(e) => handleSearchInput(e.target.value)}
          className="w-full bg-white border border-[#6B7280]/20 rounded-xl px-4 py-2.5 pl-10 text-sm text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Category filter pills + Sort */}
      <div className="flex items-center gap-2 flex-wrap">
        {categories.length > 0 && (
          <>
            <button
              onClick={() => setActiveCategoryId(undefined)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !activeCategoryId
                  ? 'text-white'
                  : 'bg-white text-[#6B7280] hover:bg-[#F3F4F6]'
              }`}
              style={!activeCategoryId ? { background: brand } : {}}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setActiveCategoryId(activeCategoryId === cat.id ? undefined : cat.id)
                }
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategoryId === cat.id
                    ? 'text-white'
                    : 'bg-white text-[#6B7280] hover:bg-[#F3F4F6]'
                }`}
                style={activeCategoryId === cat.id ? { background: brand } : {}}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </>
        )}
        <select
          value={feedSort}
          onChange={(e) => handleSortChange(e.target.value as FeedSort)}
          className="ml-auto text-sm border border-[#6B7280]/20 rounded-lg px-3 py-1.5 text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488] bg-white"
        >
          <option value="DEFAULT">Default</option>
          <option value="NEW">New</option>
          <option value="TOP">Top</option>
          <option value="UNREAD">Unread</option>
        </select>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center">
          <div className="text-4xl mb-3">{searchQuery ? '🔍' : '💬'}</div>
          <p className="font-semibold text-[#1F2937]">
            {searchQuery ? 'No posts found' : 'No posts yet'}
          </p>
          <p className="text-sm text-[#6B7280] mt-1">
            {searchQuery
              ? `No posts matching "${searchQuery}". Try a different search.`
              : 'Be the first to start a conversation!'}
          </p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              communityId={communityId}
              currentUserId={currentUserId ?? ''}
              currentUserRole={currentUserRole}
              onUpdate={(updated) =>
                setPosts((ps) => ps.map((p) => (p.id === updated.id ? updated : p)))
              }
              onDelete={(postId) => setPosts((ps) => ps.filter((p) => p.id !== postId))}
            />
          ))}
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full py-3 rounded-xl bg-white shadow-sm text-sm font-medium text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F3F4F6] transition-colors disabled:opacity-50"
            >
              {loadingMore ? 'Loading...' : 'Load more posts'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Classroom Tab ──────────────────────────────────────────────────────────
function CalendarTab({ communityId, slug }: { communityId: string; slug: string }) {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(
    (month?: number, year?: number) => {
      setLoading(true);
      getEvents(communityId, { month, year, withLockStatus: true })
        .then(setEvents)
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    [communityId],
  );

  useEffect(() => {
    const now = new Date();
    loadEvents(now.getMonth() + 1, now.getFullYear());
  }, [loadEvents]);

  if (loading && events.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <CalendarView
        events={events}
        onMonthChange={(month, year) => loadEvents(month, year)}
        slug={slug}
      />
    </div>
  );
}

function ClassroomTab({
  communityId,
  slug,
  brand,
}: {
  communityId: string;
  slug: string;
  brand: string;
}) {
  const router = useRouter();
  const [courses, setCourses] = useState<CommunityClassroomCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  useEffect(() => {
    getCommunityClassroom(communityId)
      .then(setCourses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [communityId]);

  const handleEnrollFree = async (courseId: string) => {
    setEnrollingId(courseId);
    try {
      await enrollFree(courseId, 'self_paced', communityId);
      router.push(`/learn/${courseId}`);
    } catch {
      // Fall back to course page if enrollment fails
      router.push(`/${slug}/courses/${courseId}`);
    } finally {
      setEnrollingId(null);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (courses.length === 0)
    return (
      <div className="bg-white rounded-xl shadow-sm p-10 text-center">
        <div className="text-4xl mb-3">🎓</div>
        <p className="font-semibold text-[#1F2937]">No courses yet</p>
        <p className="text-sm text-[#6B7280] mt-1">Check back soon!</p>
      </div>
    );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {courses.map((course) => {
        const isEnrolled = !!course.enrollment;
        const spPrice = course.effectivePriceSelfPaced;
        const accPrice = course.effectivePriceAccountability;
        const isFreeForMember = course.isMemberPricing && spPrice === 0 && accPrice === 0;
        return (
          <div key={course.id} className="bg-white rounded-xl shadow-sm p-5 flex flex-col">
            {course.coverUrl && (
              <img src={course.coverUrl} alt={course.title} className="w-full h-32 object-cover rounded-lg mb-3" />
            )}
            <h3 className="font-semibold text-[#1F2937] mb-1 line-clamp-2">{course.title}</h3>
            {course.description && (
              <p className="text-sm text-[#6B7280] mb-2 line-clamp-2">{course.description}</p>
            )}
            <p className="text-xs text-[#6B7280] mb-2">
              {course.totalLessons} lessons · {course._count.enrollments} students
            </p>
            {/* Pricing */}
            <div className="flex gap-3 mb-3 text-xs">
              {isFreeForMember ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[#92400e] font-medium">Free for members</span>
              ) : (
                <>
                  <span className="text-[#6B7280]">
                    SP: {spPrice === 0 ? 'Free' : new Intl.NumberFormat('en-US', { style: 'currency', currency: course.currency, minimumFractionDigits: 0 }).format(spPrice / 100)}
                    {course.isMemberPricing && spPrice !== course.priceSelfPaced && (
                      <span className="line-through ml-1 opacity-50">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: course.currency, minimumFractionDigits: 0 }).format(course.priceSelfPaced / 100)}
                      </span>
                    )}
                  </span>
                  <span className="text-[#0D9488]">
                    A: {accPrice === 0 ? 'Free' : new Intl.NumberFormat('en-US', { style: 'currency', currency: course.currency, minimumFractionDigits: 0 }).format(accPrice / 100)}
                  </span>
                </>
              )}
            </div>
            <div className="mt-auto">
              {isEnrolled ? (
                <Link
                  href={`/learn/${course.id}`}
                  className="block w-full text-center text-white font-semibold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity"
                  style={{ background: brand }}
                >
                  Continue Learning →
                </Link>
              ) : isFreeForMember ? (
                <button
                  onClick={() => handleEnrollFree(course.id)}
                  disabled={enrollingId === course.id}
                  className="w-full text-center text-white font-semibold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ background: brand }}
                >
                  {enrollingId === course.id ? 'Enrolling...' : 'Enroll Free →'}
                </button>
              ) : (
                <Link
                  href={`/${slug}/courses/${course.id}`}
                  className="block w-full text-center font-semibold px-4 py-2 rounded-lg text-sm border-2 transition-colors hover:text-white"
                  style={{ borderColor: brand, color: brand }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = brand;
                    (e.currentTarget as HTMLElement).style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = '';
                    (e.currentTarget as HTMLElement).style.color = brand;
                  }}
                >
                  View Course
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Members Tab ────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: CommunityRole }) {
  if (role === 'OWNER') return <span className="text-xs font-medium text-[#0D9488]">👑 Owner</span>;
  if (role === 'MODERATOR') return <span className="text-xs font-medium text-amber-600">⚡ Mod</span>;
  return null;
}

function MemberActivitySection({ memberId }: { memberId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [activityData, setActivityData] = useState<DailyActivity[] | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);

  const handleToggle = () => {
    if (!expanded && activityData === null) {
      setActivityLoading(true);
      getUserActivity(memberId)
        .then(setActivityData)
        .catch(() => setActivityData([]))
        .finally(() => setActivityLoading(false));
    }
    setExpanded((v) => !v);
  };

  return (
    <div className="mt-3 pt-3 border-t border-[#F3F4F6]">
      <button
        onClick={handleToggle}
        className="text-xs font-medium text-[#0D9488] hover:underline"
      >
        {expanded ? 'Hide Activity' : 'View Activity'}
      </button>
      {expanded && (
        <div className="mt-3">
          {activityLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activityData && activityData.length > 0 ? (
            <ActivityHeatmap data={activityData} />
          ) : (
            <p className="text-xs text-[#6B7280] py-2">No activity data available.</p>
          )}
        </div>
      )}
    </div>
  );
}

function MembersTab({
  communityId,
  currentUserId,
  currentUserRole,
  onlineUserIds,
  onOpenDm,
}: {
  communityId: string;
  currentUserId: string | null;
  currentUserRole: CommunityRole | null;
  onlineUserIds: string[];
  onOpenDm?: (targetUserId: string) => void;
}) {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    getMembers(communityId)
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [communityId]);

  const handleSetRole = async (memberId: string, role: 'MODERATOR' | 'MEMBER') => {
    setActionLoading(memberId);
    try {
      await setMemberRole(communityId, memberId, role);
      setMembers((ms) =>
        ms.map((m) => (m.id === memberId ? { ...m, communityRole: role } : m)),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this community?`)) return;
    setActionLoading(memberId);
    try {
      await removeMember(communityId, memberId);
      setMembers((ms) => ms.filter((m) => m.id !== memberId));
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const owners = filtered.filter((m) => m.communityRole === 'OWNER');
  const moderators = filtered.filter((m) => m.communityRole === 'MODERATOR');
  const regularMembers = filtered.filter((m) => m.communityRole === 'MEMBER');
  const sortedFiltered = [...owners, ...moderators, ...regularMembers];

  return (
    <div>
      {/* Header with counts */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#0D9488] text-white">
          Members {members.length}
        </span>
        {members.filter((m) => m.communityRole === 'OWNER' || m.communityRole === 'MODERATOR').length > 0 && (
          <span className="text-xs font-medium px-3 py-1.5 rounded-full border border-[#E5E7EB] text-[#6B7280]">
            Admins {members.filter((m) => m.communityRole === 'OWNER' || m.communityRole === 'MODERATOR').length}
          </span>
        )}
        {onlineUserIds.length > 0 && (
          <span className="text-xs font-medium px-3 py-1.5 rounded-full border border-[#E5E7EB] text-[#6B7280]">
            Online {onlineUserIds.length}
          </span>
        )}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search members…"
        className="w-full rounded-xl border border-[#F3F4F6] bg-white px-4 py-3 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488] mb-4 shadow-sm"
      />

      {/* Member list — single column, full-width cards */}
      <div className="space-y-3">
        {sortedFiltered.map((member) => {
          const isMe = member.id === currentUserId;
          const isOwnerEntry = member.communityRole === 'OWNER';
          const isModerating = actionLoading === member.id;
          const isOnline = onlineUserIds.includes(member.id);
          const joinedDate = member.joinedAt
            ? new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : null;
          const canManage = currentUserRole === 'OWNER' && !isMe && !isOwnerEntry;
          const canModRemove = currentUserRole === 'MODERATOR' && !isMe && member.communityRole === 'MEMBER';

          return (
            <div
              key={member.id}
              className="bg-white rounded-xl shadow-sm p-5 transition-shadow hover:shadow-md"
            >
              {/* Top row: avatar + info + chat button */}
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <Avatar name={member.name} avatarUrl={member.avatarUrl} size="lg" />
                  {isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[#1F2937] text-base">{member.name}</p>
                    {member.tierName && member.communityRole === 'MEMBER' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0D9488]/10 text-[#0D9488] font-semibold">
                        {member.tierName}
                      </span>
                    )}
                  </div>
                  <RoleBadge role={member.communityRole} />

                  {/* Metadata row */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-[#6B7280]">
                    {isOnline && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Online
                      </span>
                    )}
                    {joinedDate && (
                      <span className="flex items-center gap-1.5">
                        <span>📅</span>
                        Joined {joinedDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Chat button — not for self */}
                {!isMe && onOpenDm && (
                  <button
                    onClick={() => onOpenDm(member.id)}
                    className="text-xs font-medium px-3 py-2 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:border-[#0D9488] hover:text-[#0D9488] transition-colors flex-shrink-0 flex items-center gap-1.5"
                    title={`Chat with ${member.name}`}
                  >
                    Chat <span>💬</span>
                  </button>
                )}
              </div>

              {/* Admin action buttons — separate row so they don't crowd the name */}
              {(canManage || canModRemove) && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F3F4F6]">
                  {canManage && (
                    <>
                      {member.communityRole === 'MEMBER' ? (
                        <button
                          onClick={() => handleSetRole(member.id, 'MODERATOR')}
                          disabled={isModerating}
                          className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                        >
                          ⚡ Promote
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSetRole(member.id, 'MEMBER')}
                          disabled={isModerating}
                          className="text-xs px-3 py-1.5 rounded-lg bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB] transition-colors disabled:opacity-50"
                        >
                          Demote
                        </button>
                      )}
                    </>
                  )}
                  {(canManage || canModRemove) && (
                    <button
                      onClick={() => handleRemove(member.id, member.name)}
                      disabled={isModerating}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}

              {/* Activity heatmap expand */}
              <MemberActivitySection memberId={member.id} />
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-[#6B7280] text-center py-8">No members found.</p>
        )}
      </div>
    </div>
  );
}

// ── Leaderboard Tab ────────────────────────────────────────────────────────
function LeaderboardTab({ communityId }: { communityId: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard(communityId)
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [communityId]);

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold text-[#1F2937]">Leaderboard</h2>
          <p className="text-xs text-[#6B7280]">
            Points earned in the last 30 days · Post (+5) · Like received (+2) · Comment (+1)
          </p>
        </div>
      </div>
      <LeaderboardList entries={entries} />
    </div>
  );
}

// ── About Tab ──────────────────────────────────────────────────────────────
function AboutTab({
  profile,
  community,
  communityId,
  quickLinks,
  memberCount,
  membershipStatus,
  slug,
}: {
  profile: CreatorProfile;
  community: { name: string; description: string | null };
  communityId: string;
  quickLinks: QuickLink[];
  memberCount: number;
  membershipStatus: MembershipStatus | null;
  slug: string;
}) {
  const brand = profile.brandColor ?? '#0D9488';
  const allTiers = membershipStatus?.allTiers ?? [];
  const currentTierId = membershipStatus?.membership?.tier?.id ?? null;
  const [switching, setSwitching] = useState<string | null>(null);
  const [switchMsg, setSwitchMsg] = useState<string | null>(null);

  const handleSwitchTier = async (targetTierId: string) => {
    setSwitching(targetTierId);
    setSwitchMsg(null);
    try {
      const result = await switchTier(communityId, targetTierId);
      if (result.action === 'checkout') {
        // Redirect to storefront checkout
        window.location.href = `/${slug}#membership`;
      } else {
        setSwitchMsg(result.message);
        // Refresh page after a short delay to reflect the change
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err: any) {
      setSwitchMsg(err.message || 'Failed to switch tier.');
    } finally {
      setSwitching(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-bold text-[#1F2937] text-lg mb-2">{community.name}</h2>
        {community.description && (
          <div className="text-[#6B7280] mb-4"><MarkdownRenderer content={community.description} size="sm" /></div>
        )}
        <div className="flex gap-6 text-sm text-[#6B7280]">
          <span>👥 {memberCount} members</span>
        </div>
      </div>

      {/* Membership Tiers */}
      {allTiers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-[#1F2937] mb-4">Membership Tiers</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {allTiers.map((tier) => {
              const isCurrent = tier.id === currentTierId;
              const isFree = tier.priceMonthly === 0;
              const fmt = (cents: number) =>
                cents === 0
                  ? 'Free'
                  : new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: tier.currency,
                      minimumFractionDigits: 0,
                    }).format(cents / 100);

              return (
                <div
                  key={tier.id}
                  className={`rounded-xl border-2 p-5 transition-colors ${
                    isCurrent ? 'border-[#0D9488] bg-teal-50/30' : 'border-[#F3F4F6]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-[#1F2937]">{tier.name}</h4>
                    {isCurrent && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#0D9488] text-white font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  {tier.description && (
                    <div className="text-sm text-[#6B7280] mb-3"><MarkdownRenderer content={tier.description} size="sm" compact /></div>
                  )}
                  <div className="text-sm space-y-1 mb-4">
                    <p className="font-semibold text-[#1F2937]">{fmt(tier.priceMonthly)}{!isFree && '/mo'}</p>
                    {tier.priceAnnual > 0 && (
                      <p className="text-[#6B7280]">{fmt(tier.priceAnnual)}/yr</p>
                    )}
                  </div>
                  {!isCurrent && membershipStatus?.hasMembership && (
                    <button
                      onClick={() => handleSwitchTier(tier.id)}
                      disabled={switching === tier.id}
                      className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ background: brand }}
                    >
                      {switching === tier.id
                        ? 'Switching…'
                        : tier.priceMonthly > (membershipStatus?.membership?.tier?.priceMonthly ?? 0)
                          ? 'Upgrade'
                          : 'Switch'}
                    </button>
                  )}
                  {!isCurrent && !membershipStatus?.hasMembership && !isFree && (
                    <Link
                      href={`/${slug}#membership`}
                      className="inline-block text-sm font-semibold px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
                      style={{ background: brand }}
                    >
                      Join
                    </Link>
                  )}
                  {!isCurrent && !membershipStatus?.hasMembership && isFree && (
                    <Link
                      href={`/${slug}#membership`}
                      className="inline-block text-sm font-semibold px-4 py-2 rounded-lg border-2 transition-colors hover:text-white"
                      style={{ borderColor: brand, color: brand }}
                    >
                      Join Free
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
          {switchMsg && (
            <p className="mt-3 text-sm text-[#0D9488] font-medium">{switchMsg}</p>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-[#1F2937] mb-4">About the Creator</h3>
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
            style={{ background: profile.logoUrl ? `url(${profile.logoUrl}) center/cover` : brand }}
          >
            {!profile.logoUrl && profile.user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-[#1F2937]">{profile.user.name}</p>
            {profile.bio && <p className="text-sm text-[#6B7280] mt-0.5">{profile.bio}</p>}
          </div>
        </div>
      </div>

      {quickLinks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-[#1F2937] mb-3">Links</h3>
          <div className="space-y-2">
            {quickLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-sm font-medium hover:underline transition-colors"
                style={{ color: brand }}
              >
                <span>{link.emoji}</span>
                <span>{link.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Membership Banner ──────────────────────────────────────────────────────
function MembershipBanner({
  status,
  slug,
  brand,
}: {
  status: MembershipStatus | null;
  slug: string;
  brand: string;
}) {
  if (!status) return null;

  const { hasMembership, membership, allTiers } = status;

  if (!hasMembership) {
    if (allTiers.length === 0) return null;
    return (
      <div className="border-b border-[#F3F4F6] bg-white">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          <p className="text-sm text-[#6B7280]">
            Join this community to unlock all courses and features.
          </p>
          <Link
            href={`/${slug}#membership`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white whitespace-nowrap"
            style={{ background: brand }}
          >
            Join Now
          </Link>
        </div>
      </div>
    );
  }

  if (!membership) return null;

  const isActive = membership.status === 'ACTIVE';
  const isCancelled = membership.status === 'CANCELLED';

  if (isActive && !isCancelled) return null; // Active paid members get no banner (clean UX)

  if (isCancelled) {
    const endDate = membership.currentPeriodEnd
      ? new Date(membership.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : null;
    return (
      <div className="border-b border-amber-200 bg-amber-50">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800">
            Your <span className="font-medium">{membership.tier.name}</span> membership ends
            {endDate ? ` on ${endDate}` : ' soon'}.
          </p>
          <Link
            href={`/${slug}#membership`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 text-white whitespace-nowrap hover:bg-amber-700 transition-colors"
          >
            Renew
          </Link>
        </div>
      </div>
    );
  }

  if (membership.status === 'EXPIRED') {
    return (
      <div className="border-b border-red-200 bg-red-50">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          <p className="text-sm text-red-800">
            Your <span className="font-medium">{membership.tier.name}</span> membership has expired.
          </p>
          <Link
            href={`/${slug}#membership`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white whitespace-nowrap hover:bg-red-700 transition-colors"
          >
            Renew Now
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

// ── Request To Join Modal ──────────────────────────────────────────────────
function RequestToJoinModal({
  communityId,
  joinQuestions,
  onClose,
  onSubmitted,
}: {
  communityId: string;
  joinQuestions: string[];
  onClose: () => void;
  onSubmitted: (request: { id: string; status: JoinRequestStatus; createdAt: string }) => void;
}) {
  const [answers, setAnswers] = useState<string[]>(joinQuestions.map(() => ''));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinQuestions.length > 0 && answers.some((a) => !a.trim())) {
      setError('Please answer all questions.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await requestToJoin(
        communityId,
        joinQuestions.length > 0
          ? joinQuestions.map((q, i) => ({ question: q, answer: answers[i].trim() }))
          : undefined,
      );
      onSubmitted(result);
    } catch (err: any) {
      setError(err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-[#1F2937] text-lg mb-1">Request to Join</h3>
        <p className="text-sm text-[#6B7280] mb-4">
          This is a private community. Answer the questions below to request access.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {joinQuestions.map((q, i) => (
            <div key={i}>
              <label className="block text-sm font-medium text-[#1F2937] mb-1">{q}</label>
              <textarea
                value={answers[i]}
                onChange={(e) => {
                  const next = [...answers];
                  next[i] = e.target.value;
                  setAnswers(next);
                }}
                rows={2}
                className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488] resize-none"
                placeholder="Your answer…"
              />
            </div>
          ))}
          {error && <p className="text-sm text-[#EF4444]">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#6B7280] hover:text-[#1F2937] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#0D9488] rounded-lg hover:bg-[#0D9488]/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Locked Content Banner ─────────────────────────────────────────────────
function LockedContentBanner({
  communityId,
  visibility,
  joinQuestions,
  joinRequest,
  freeTierId,
  slug,
  brand,
  onStatusChange,
}: {
  communityId: string;
  visibility: CommunityVisibility;
  joinQuestions: string[] | null;
  joinRequest: { id: string; status: JoinRequestStatus; createdAt: string } | null;
  freeTierId: string | null;
  slug: string;
  brand: string;
  onStatusChange: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [localRequest, setLocalRequest] = useState(joinRequest);
  const [joining, setJoining] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleJoinPublic = async () => {
    if (!freeTierId) return;
    setJoining(true);
    try {
      await joinFreeTier(freeTierId);
      onStatusChange();
    } catch {
      // ignore
    } finally {
      setJoining(false);
    }
  };

  const handleRequestSubmitted = (request: { id: string; status: JoinRequestStatus; createdAt: string }) => {
    setLocalRequest(request);
    setShowModal(false);
  };

  const handleRequestToJoin = () => {
    const questions = joinQuestions ?? [];
    if (questions.length > 0) {
      setShowModal(true);
    } else {
      requestToJoin(communityId)
        .then(handleRequestSubmitted)
        .catch(() => {});
    }
  };

  const handleCancelRequest = async () => {
    setCancelling(true);
    try {
      await cancelJoinRequest(communityId);
      setLocalRequest(null);
    } catch {
      // ignore
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 text-center mb-4">
      {visibility === 'PUBLIC' ? (
        <>
          <div className="text-3xl mb-3">🔒</div>
          <h3 className="font-semibold text-[#1F2937] mb-1">Join to access this community</h3>
          <p className="text-sm text-[#6B7280] mb-4">
            Become a member to unlock the feed, classroom, leaderboard, and more.
          </p>
          {freeTierId ? (
            <button
              onClick={handleJoinPublic}
              disabled={joining}
              className="text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: brand }}
            >
              {joining ? 'Joining…' : 'Join Community'}
            </button>
          ) : (
            <Link
              href={`/${slug}#membership`}
              className="inline-block text-white font-semibold px-6 py-2.5 rounded-lg text-sm"
              style={{ background: brand }}
            >
              View Membership Options
            </Link>
          )}
        </>
      ) : localRequest?.status === 'PENDING' ? (
        <>
          <div className="text-3xl mb-3">⏳</div>
          <h3 className="font-semibold text-[#1F2937] mb-1">Your request is pending</h3>
          <p className="text-sm text-[#6B7280] mb-4">
            The community owner will review your request soon. You&apos;ll be notified when it&apos;s approved.
          </p>
          <button
            onClick={handleCancelRequest}
            disabled={cancelling}
            className="text-sm text-[#6B7280] hover:text-[#EF4444] transition-colors disabled:opacity-50"
          >
            {cancelling ? 'Cancelling…' : 'Cancel Request'}
          </button>
        </>
      ) : localRequest?.status === 'REJECTED' ? (
        <>
          <div className="text-3xl mb-3">❌</div>
          <h3 className="font-semibold text-[#1F2937] mb-1">Your request was not approved</h3>
          <p className="text-sm text-[#6B7280] mb-4">
            You can submit a new request if you&apos;d like to try again.
          </p>
          <button
            onClick={handleRequestToJoin}
            className="text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-opacity hover:opacity-90"
            style={{ background: brand }}
          >
            Request Again
          </button>
        </>
      ) : (
        <>
          <div className="text-3xl mb-3">🔐</div>
          <h3 className="font-semibold text-[#1F2937] mb-1">This is a private community</h3>
          <p className="text-sm text-[#6B7280] mb-4">
            Membership is by request only. Submit a request and the owner will review it.
          </p>
          <button
            onClick={handleRequestToJoin}
            className="text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-opacity hover:opacity-90"
            style={{ background: brand }}
          >
            Request to Join
          </button>
        </>
      )}

      {showModal && (
        <RequestToJoinModal
          communityId={communityId}
          joinQuestions={joinQuestions ?? []}
          onClose={() => setShowModal(false)}
          onSubmitted={handleRequestSubmitted}
        />
      )}
    </div>
  );
}

// ── Main Hub Page ──────────────────────────────────────────────────────────
export default function CommunityHubPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CommunityHubContent />
    </Suspense>
  );
}

function CommunityHubContent() {
  const { slug } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as Tab) ?? 'feed';

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUserId] = useState<string | null>(getUserIdFromToken);
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [mentionNotifs, setMentionNotifs] = useState<MentionNotification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [dmOpen, setDmOpen] = useState(false);
  const [dmTargetUserId, setDmTargetUserId] = useState<string | undefined>();
  const [incomingDm, setIncomingDm] = useState<{ conversationId: string; message: any } | null>(null);

  const communityId = searchParams.get('id');

  useEffect(() => {
    getStorefront(slug as string)
      .then((p) => {
        setProfile(p);
        // Pick the community: by ?id= param, then featured, then first
        const communities = p.communities ?? [];
        const target = communityId
          ? communities.find((c) => c.id === communityId)
          : communities.find((c) => c.isFeatured) ?? communities[0];
        if (target?.id) {
          getLeaderboard(target.id).then(setLeaderboard).catch(() => {});
          getMembers(target.id).then((m) => setMemberCount(m.length)).catch(() => {});
          // Load membership status for logged-in users
          if (getUserIdFromToken()) {
            getMembershipStatus(target.id).then(setMembershipStatus).catch(() => {});
          }
        }
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [slug, router, communityId]);

  const setTab = (tab: string) => {
    router.push(`/${slug}/community?tab=${tab}`, { scroll: false });
  };

  // Resolve the community ID early so the hook can be called unconditionally
  const resolvedCommunityId = (() => {
    if (!profile) return undefined;
    const comms = profile.communities ?? [];
    const c = communityId
      ? comms.find((x) => x.id === communityId)
      : comms.find((x) => x.isFeatured) ?? comms[0];
    return c?.id;
  })();

  // Hub-level socket for presence + DM events (must be before early returns)
  useCommunitySocket(resolvedCommunityId, {
    onPresenceUpdate: (data: PresenceUpdate) => {
      setOnlineUserIds(data.onlineUserIds);
    },
    onDmReceived: (data) => {
      setIncomingDm(data);
    },
    onMentionReceived: (notif) =>
      setMentionNotifs((prev) => [notif, ...prev].slice(0, 10)),
  });

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F3F4F6]">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const communities = profile.communities ?? [];
  const community = communityId
    ? communities.find((c) => c.id === communityId)
    : communities.find((c) => c.isFeatured) ?? communities[0];
  const brand = profile.brandColor ?? '#0D9488';
  const categories = (community as any)?.categories ?? [];
  const quickLinks: QuickLink[] = Array.isArray((community as any)?.quickLinks)
    ? (community as any).quickLinks
    : [];
  const welcomeMessage = (community as any)?.welcomeMessage ?? null;

  if (!community) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#6B7280]">This creator hasn&apos;t set up a community yet.</p>
          <Link href={`/${slug}`} className="text-[#0D9488] text-sm hover:underline mt-2 block">
            ← Back to storefront
          </Link>
        </div>
      </div>
    );
  }

  const isCreator = currentUserId != null && currentUserId === profile.userId;
  // Determine current user's community role
  const currentUserRole: CommunityRole | null = isCreator ? 'OWNER' : null;
  const isMember = isCreator || (membershipStatus?.hasMembership ?? false);
  const visibleTabs = isMember
    ? ALL_TABS
    : ALL_TABS.filter((t) => t.id === 'about');

  const reloadMembershipStatus = () => {
    if (currentUserId && community) {
      getMembershipStatus(community.id)
        .then(setMembershipStatus)
        .catch(() => {});
    }
    // Also reload the page to refresh all data
    window.location.reload();
  };

  const openDm = (targetUserId?: string) => {
    setDmTargetUserId(targetUserId);
    setDmOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Top header */}
      <header className="bg-white border-b border-[#F3F4F6] sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-4 py-3 border-b border-[#F3F4F6]">
            <CommunitySwitcher
              currentCommunityId={community.id}
              currentCommunityName={community.name}
              brandColor={brand}
              isCreator={isCreator}
            />
            {currentUserId && isMember && (
              <div className="ml-auto flex items-center gap-3">
                {/* DM chat icon */}
                <button
                  onClick={() => openDm()}
                  className="p-1.5 text-[#6B7280] hover:text-[#1F2937] transition-colors"
                  title="Messages"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
                {/* Notification bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifDropdown((v) => !v);
                      // Clear badge count when opening
                    }}
                    className="relative p-1.5 text-[#6B7280] hover:text-[#1F2937] transition-colors"
                    title="Mentions"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    {mentionNotifs.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center leading-none">
                        {mentionNotifs.length > 9 ? '9+' : mentionNotifs.length}
                      </span>
                    )}
                  </button>
                  {showNotifDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-[#F3F4F6] z-50 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6]">
                        <span className="text-sm font-semibold text-[#1F2937]">Mentions</span>
                        {mentionNotifs.length > 0 && (
                          <button
                            onClick={() => {
                              setMentionNotifs([]);
                              setShowNotifDropdown(false);
                            }}
                            className="text-xs text-[#6B7280] hover:text-[#1F2937]"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                      {mentionNotifs.length === 0 ? (
                        <p className="text-xs text-[#6B7280] text-center py-6">No new mentions</p>
                      ) : (
                        <div className="divide-y divide-[#F3F4F6] max-h-64 overflow-y-auto">
                          {mentionNotifs.map((n, i) => (
                            <a
                              key={i}
                              href={n.postUrl}
                              onClick={() => setShowNotifDropdown(false)}
                              className="flex flex-col gap-0.5 px-4 py-3 hover:bg-[#F3F4F6] transition-colors"
                            >
                              <span className="text-xs font-medium text-[#1F2937]">
                                <span className="text-[#0D9488]">{n.mentionerName}</span> mentioned you
                              </span>
                              <span className="text-xs text-[#6B7280]">in {n.communityName}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Link
                  href="/dashboard"
                  className="text-xs text-[#6B7280] hover:text-[#1F2937] transition-colors"
                >
                  Dashboard →
                </Link>
              </div>
            )}
          </div>

          {/* Tab navigation */}
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#0D9488] text-[#0D9488]'
                    : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
                }`}
                style={activeTab === tab.id ? { borderColor: brand, color: brand } : {}}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Membership status banner */}
      <MembershipBanner status={membershipStatus} slug={slug as string} brand={brand} />

      {/* Main layout */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Content area */}
          <div className="flex-1 min-w-0">
            {/* Locked content banner for non-members */}
            {!isMember && currentUserId && membershipStatus && (
              <LockedContentBanner
                communityId={community.id}
                visibility={membershipStatus.visibility}
                joinQuestions={membershipStatus.joinQuestions}
                joinRequest={membershipStatus.joinRequest}
                freeTierId={membershipStatus.freeTier?.id ?? null}
                slug={slug as string}
                brand={brand}
                onStatusChange={reloadMembershipStatus}
              />
            )}
            {!isMember && !currentUserId && (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center mb-4">
                <div className="text-3xl mb-3">🔒</div>
                <h3 className="font-semibold text-[#1F2937] mb-1">Sign in to join this community</h3>
                <p className="text-sm text-[#6B7280] mb-4">
                  Log in or create an account to access the feed, classroom, and more.
                </p>
                <Link
                  href="/login"
                  className="inline-block text-white font-semibold px-6 py-2.5 rounded-lg text-sm"
                  style={{ background: brand }}
                >
                  Log in
                </Link>
              </div>
            )}
            {isMember && activeTab === 'feed' && (
              <FeedTab
                communityId={community.id}
                categories={categories}
                welcomeMessage={welcomeMessage}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                brand={brand}
                onMentionReceived={(notif) =>
                  setMentionNotifs((prev) => [notif, ...prev].slice(0, 10))
                }
              />
            )}
            {isMember && activeTab === 'calendar' && (
              <CalendarTab communityId={community.id} slug={slug as string} />
            )}
            {isMember && activeTab === 'classroom' && (
              <ClassroomTab communityId={community.id} slug={slug as string} brand={brand} />
            )}
            {isMember && activeTab === 'members' && (
              <MembersTab
                communityId={community.id}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                onlineUserIds={onlineUserIds}
                onOpenDm={currentUserId ? openDm : undefined}
              />
            )}
            {isMember && activeTab === 'leaderboard' && <LeaderboardTab communityId={community.id} />}
            {(activeTab === 'about' || !isMember) && (
              <AboutTab
                profile={profile}
                community={community}
                communityId={community.id}
                quickLinks={quickLinks}
                memberCount={memberCount}
                membershipStatus={membershipStatus}
                slug={slug as string}
              />
            )}
          </div>

          {/* Sidebar — hidden on small screens */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <CommunitySidebar
              slug={slug as string}
              communityName={community.name}
              description={community.description}
              memberCount={memberCount}
              onlineCount={onlineUserIds.length}
              courseCount={community._count?.courses ?? 0}
              quickLinks={quickLinks}
              leaderboard={leaderboard}
              onTabChange={setTab}
            />
          </div>
        </div>
      </div>

      {/* Direct Messages slide-in panel */}
      {dmOpen && currentUserId && (
        <DirectMessages
          communityId={community.id}
          currentUserId={currentUserId}
          targetUserId={dmTargetUserId}
          incomingDm={incomingDm}
          onIncomingDmProcessed={() => setIncomingDm(null)}
          onClose={() => {
            setDmOpen(false);
            setDmTargetUserId(undefined);
            setIncomingDm(null);
          }}
        />
      )}
    </div>
  );
}
