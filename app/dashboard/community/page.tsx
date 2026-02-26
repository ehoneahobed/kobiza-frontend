'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getMyCommunities,
  updateCommunity,
  createCommunity,
  deleteCommunity,
  setFeaturedCommunity,
  createTier,
  deleteTier,
  Community,
  MembershipTier,
  CommunityQuickLink,
} from '@/lib/creator';
import { getPostsFeed, createPost, Post, getCategories, createCategory, deleteCategory, PostCategory, getCommunityClassroom, ClassroomCourse, getJoinRequests, reviewJoinRequest, JoinRequest, JoinRequestStatus, CommunityVisibility, getMembers, CommunityMember, CommunityRole, setMemberRole, removeMember } from '@/lib/community';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import PostCard from '@/components/community/PostCard';
import MentionInput from '@/components/community/MentionInput';
import { getToken } from '@/lib/auth';
import { API_URL } from '@/lib/api';
import { useCommunitySocket } from '@/hooks/useCommunitySocket';
import { formatPrice, updateClassroomEntry, removeFromClassroom } from '@/lib/courses';
import { createBillingCheckout, getMyPlan } from '@/lib/billing';
import { streamCommunityAsk } from '@/lib/ai';
import { getMyProfile } from '@/lib/creator';

function getUserIdFromToken(): string | null {
  try {
    const token = getToken();
    if (!token) return null;
    return JSON.parse(atob(token.split('.')[1])).sub ?? null;
  } catch {
    return null;
  }
}

type Tab = 'feed' | 'classroom' | 'members' | 'settings' | 'requests' | 'ai';

export default function CommunityPage() {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [currentUserId] = useState<string | null>(getUserIdFromToken);

  // Create community form
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [createLoading, setCreateLoading] = useState(false);

  // Add tier form
  const [showTierForm, setShowTierForm] = useState(false);
  const [tierForm, setTierForm] = useState({ name: '', description: '', priceMonthly: '', priceAnnual: '', currency: 'USD' });
  const [tierLoading, setTierLoading] = useState(false);

  // Feed state
  const [posts, setPosts] = useState<Post[]>([]);
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postMentionMap, setPostMentionMap] = useState<Map<string, string>>(new Map());
  const [posting, setPosting] = useState(false);

  // Settings: welcome message
  const [welcomeMsg, setWelcomeMsg] = useState('');
  const [savingWelcome, setSavingWelcome] = useState(false);

  // Settings: quick links
  const [quickLinks, setQuickLinks] = useState<CommunityQuickLink[]>([]);
  const [newLink, setNewLink] = useState({ emoji: '🔗', title: '', url: '' });
  const [savingLinks, setSavingLinks] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);

  // Settings: categories
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [newCategory, setNewCategory] = useState({ emoji: '💬', name: '' });
  const [savingCategory, setSavingCategory] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // Classroom state
  const [classroomCourses, setClassroomCourses] = useState<ClassroomCourse[]>([]);
  const [classroomLoading, setClassroomLoading] = useState(false);

  // Members state
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberActionLoading, setMemberActionLoading] = useState<string | null>(null);
  const [creatorSlug, setCreatorSlug] = useState<string | null>(null);

  // Visibility & Join Requests state
  const [visibility, setVisibility] = useState<CommunityVisibility>('PUBLIC');
  const [joinQuestions, setJoinQuestions] = useState<string[]>([]);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [joinRequestsList, setJoinRequestsList] = useState<JoinRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsFilter, setRequestsFilter] = useState<JoinRequestStatus | 'ALL'>('PENDING');
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // AI Copilot state
  const [isPro, setIsPro] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiSystemPrompt, setAiSystemPrompt] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiStreaming, setAiStreaming] = useState(false);
  const [aiError, setAiError] = useState('');
  const aiAbortRef = useRef<AbortController | null>(null);

  const community = communities.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    getMyPlan().then((p) => setIsPro(p.plan === 'PRO')).catch(() => {});
    getMyProfile().then((p) => setCreatorSlug(p.slug)).catch(() => {});
    getMyCommunities()
      .then((cs) => {
        setCommunities(cs);
        if (cs.length > 0) {
          const featured = cs.find((c) => c.isFeatured) ?? cs[0];
          setSelectedId(featured.id);
          setWelcomeMsg(featured.welcomeMessage ?? '');
          setQuickLinks(featured.quickLinks ?? []);
          setVisibility((featured as any).visibility ?? 'PUBLIC');
          setJoinQuestions(Array.isArray((featured as any).joinQuestions) ? (featured as any).joinQuestions : []);
          getCategories(featured.id).then(setCategories).catch(() => {});
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  // Sync welcome/quicklinks when switching communities
  useEffect(() => {
    if (!community) return;
    setWelcomeMsg(community.welcomeMessage ?? '');
    setQuickLinks(community.quickLinks ?? []);
    setVisibility((community as any).visibility ?? 'PUBLIC');
    setJoinQuestions(Array.isArray((community as any).joinQuestions) ? (community as any).joinQuestions : []);
    setCategories([]);
    getCategories(community.id).then(setCategories).catch(() => {});
    setPosts([]);
    if (activeTab === 'feed') {
      setFeedLoading(true);
      getPostsFeed(community.id)
        .then(setPosts)
        .catch(() => {})
        .finally(() => setFeedLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Load feed when switching to feed tab
  useEffect(() => {
    if (activeTab === 'feed' && community?.id) {
      setFeedLoading(true);
      getPostsFeed(community.id)
        .then(setPosts)
        .catch(() => {})
        .finally(() => setFeedLoading(false));
    }
    if (activeTab === 'classroom' && community?.id) {
      setClassroomLoading(true);
      getCommunityClassroom(community.id)
        .then(setClassroomCourses)
        .catch(() => {})
        .finally(() => setClassroomLoading(false));
    }
    if (activeTab === 'members' && community?.id) {
      setMembersLoading(true);
      getMembers(community.id)
        .then(setMembers)
        .catch(() => {})
        .finally(() => setMembersLoading(false));
    }
    if (activeTab === 'requests' && community?.id) {
      loadJoinRequests();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, requestsFilter]);

  // SSE: server pushes new posts from members in real time
  useEffect(() => {
    if (activeTab !== 'feed' || !community?.id) return;
    const token = getToken();
    if (!token) return;
    const url = `${API_URL}/api/community/${community.id}/feed/stream?token=${encodeURIComponent(token)}`;
    const source = new EventSource(url);
    let everConnected = false;

    source.onmessage = (event) => {
      everConnected = true;
      try {
        const post = JSON.parse(event.data) as Post;
        if (post.author.id === currentUserId) return;
        setPendingPosts((prev) => {
          if (prev.some((p) => p.id === post.id)) return prev;
          return [post, ...prev];
        });
      } catch {}
    };

    source.onerror = () => {
      if (!everConnected) source.close();
    };

    return () => source.close();
  }, [activeTab, community?.id, currentUserId]);

  const revealPending = () => {
    setPosts((ps) => {
      const existingIds = new Set(ps.map((p) => p.id));
      const toAdd = pendingPosts.filter((p) => !existingIds.has(p.id));
      return [...toAdd, ...ps];
    });
    setPendingPosts([]);
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');
    try {
      const c = await createCommunity(createForm);
      setCommunities((cs) => [...cs, c]);
      setSelectedId(c.id);
      setShowCreate(false);
    } catch (err: any) {
      // Plan limit hit — show upgrade modal instead of inline error
      if (err.message?.toLowerCase().includes('plan') || err.message?.toLowerCase().includes('upgrade')) {
        setShowCreate(false);
        setShowUpgradeModal(true);
      } else {
        setError(err.message);
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpgradeToPlan = async (plan: 'STARTER' | 'PRO') => {
    setUpgradeLoading(true);
    try {
      const { url } = await createBillingCheckout(plan);
      if (url) window.location.href = url;
    } catch {
      // ignore
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!community) return;
    if (!confirm(`Delete "${community.name}"? This is permanent and cannot be undone.`)) return;
    try {
      await deleteCommunity(community.id);
      const remaining = communities.filter((c) => c.id !== community.id);
      setCommunities(remaining);
      setSelectedId(remaining[0]?.id ?? null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSetFeatured = async () => {
    if (!community) return;
    try {
      const updated = await setFeaturedCommunity(community.id);
      setCommunities((cs) =>
        cs.map((c) => ({ ...c, isFeatured: c.id === updated.id })),
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!community) return;
    setTierLoading(true);
    setError('');
    try {
      const tier = await createTier(community.id, {
        name: tierForm.name,
        description: tierForm.description || undefined,
        priceMonthly: Math.round(parseFloat(tierForm.priceMonthly || '0') * 100),
        priceAnnual: tierForm.priceAnnual ? Math.round(parseFloat(tierForm.priceAnnual) * 100) : 0,
        currency: tierForm.currency,
      });
      setCommunities((cs) =>
        cs.map((c) =>
          c.id === community.id
            ? { ...c, membershipTiers: [...c.membershipTiers, tier] }
            : c,
        ),
      );
      setTierForm({ name: '', description: '', priceMonthly: '', priceAnnual: '', currency: 'USD' });
      setShowTierForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTierLoading(false);
    }
  };

  const handleDeleteTier = async (tierId: string) => {
    if (!community) return;
    if (!confirm('Delete this membership tier?')) return;
    try {
      await deleteTier(community.id, tierId);
      setCommunities((cs) =>
        cs.map((c) =>
          c.id === community.id
            ? { ...c, membershipTiers: c.membershipTiers.filter((t) => t.id !== tierId) }
            : c,
        ),
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!community || !postContent.trim()) return;
    setPosting(true);
    try {
      const mentionedUserIds = Array.from(postMentionMap.values());
      const post = await createPost(community.id, {
        content: postContent.trim(),
        mentionedUserIds: mentionedUserIds.length ? mentionedUserIds : undefined,
      });
      setPosts((ps) => [post, ...ps]);
      setPostContent('');
      setPostMentionMap(new Map());
    } catch {
      // fail silently
    } finally {
      setPosting(false);
    }
  };

  const handleSaveWelcome = async () => {
    if (!community) return;
    setSavingWelcome(true);
    try {
      const updated = await updateCommunity(community.id, { welcomeMessage: welcomeMsg });
      setCommunities((cs) =>
        cs.map((c) => (c.id === community.id ? { ...c, welcomeMessage: updated.welcomeMessage } : c)),
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingWelcome(false);
    }
  };

  const handleSaveVisibility = async () => {
    if (!community) return;
    setSavingVisibility(true);
    try {
      const updated = await updateCommunity(community.id, {
        visibility,
        joinQuestions: visibility === 'PRIVATE' ? joinQuestions : [],
      } as any);
      setCommunities((cs) =>
        cs.map((c) =>
          c.id === community.id
            ? { ...c, visibility: (updated as any).visibility, joinQuestions: (updated as any).joinQuestions }
            : c,
        ),
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingVisibility(false);
    }
  };

  const loadJoinRequests = async () => {
    if (!community) return;
    setRequestsLoading(true);
    try {
      const filterStatus = requestsFilter === 'ALL' ? undefined : requestsFilter;
      const requests = await getJoinRequests(community.id, filterStatus);
      setJoinRequestsList(requests);
    } catch {
      // ignore
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleReviewRequest = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    setReviewingId(requestId);
    try {
      await reviewJoinRequest(requestId, status);
      setJoinRequestsList((rs) =>
        rs.map((r) => (r.id === requestId ? { ...r, status, reviewedAt: new Date().toISOString() } : r)),
      );
    } catch {
      // ignore
    } finally {
      setReviewingId(null);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!community || !newLink.title.trim() || !newLink.url.trim()) return;
    setSavingLinks(true);
    const updated = [...quickLinks, { ...newLink }];
    try {
      await updateCommunity(community.id, { quickLinks: updated });
      setQuickLinks(updated);
      setCommunities((cs) =>
        cs.map((c) => (c.id === community.id ? { ...c, quickLinks: updated } : c)),
      );
      setNewLink({ emoji: '🔗', title: '', url: '' });
      setShowLinkForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingLinks(false);
    }
  };

  const handleDeleteLink = async (index: number) => {
    if (!community) return;
    const updated = quickLinks.filter((_, i) => i !== index);
    setSavingLinks(true);
    try {
      await updateCommunity(community.id, { quickLinks: updated });
      setQuickLinks(updated);
      setCommunities((cs) =>
        cs.map((c) => (c.id === community.id ? { ...c, quickLinks: updated } : c)),
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingLinks(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!community || !newCategory.name.trim()) return;
    setSavingCategory(true);
    try {
      const cat = await createCategory(community.id, { name: newCategory.name.trim(), emoji: newCategory.emoji });
      setCategories((cs) => [...cs, cat]);
      setNewCategory({ emoji: '💬', name: '' });
      setShowCategoryForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Delete this category? Posts in it will become uncategorized.')) return;
    try {
      await deleteCategory(categoryId);
      setCategories((cs) => cs.filter((c) => c.id !== categoryId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAskAI = () => {
    if (!community || !aiQuestion.trim() || aiStreaming) return;
    setAiStreaming(true);
    setAiAnswer('');
    setAiError('');
    aiAbortRef.current = streamCommunityAsk(
      community.id,
      aiQuestion.trim(),
      aiSystemPrompt.trim() || undefined,
      (chunk) => setAiAnswer((prev) => prev + chunk),
      () => setAiStreaming(false),
      (msg) => {
        setAiError(msg);
        setAiStreaming(false);
      },
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No communities at all — show create form
  if (communities.length === 0 && !showCreate) {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-[#1F2937] mb-2">Create Your Community</h1>
        <p className="text-[#6B7280] mb-8">Your community is the home for your members.</p>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <form onSubmit={handleCreateCommunity} className="space-y-4">
            <Input
              label="Community Name"
              placeholder="e.g. Bola Business School"
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#1F2937]">Description</label>
              <textarea
                placeholder="What will members get from your community?"
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-[#6B7280] px-4 py-3 text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488] resize-none"
              />
            </div>
            {error && <p className="text-sm text-[#EF4444]">{error}</p>}
            <Button type="submit" loading={createLoading} className="w-full">
              Create Community
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Header with community switcher */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {communities.length > 1 ? (
            <select
              value={selectedId ?? ''}
              onChange={(e) => setSelectedId(e.target.value)}
              className="font-bold text-lg text-[#1F2937] bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-[#0D9488] rounded-lg px-2 py-1 cursor-pointer max-w-xs truncate"
            >
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.isFeatured ? ' ★' : ''}
                </option>
              ))}
            </select>
          ) : (
            <h1 className="text-2xl font-bold text-[#1F2937] truncate">
              {community?.name}
              {community?.isFeatured && (
                <span className="ml-2 text-sm font-normal text-[#F59E0B]">★ Featured</span>
              )}
            </h1>
          )}
        </div>
        <Button onClick={() => setShowCreate(true)} variant="secondary">
          + New Community
        </Button>
      </div>

      {/* Upgrade plan modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
            <div className="text-4xl mb-4 text-center">🚀</div>
            <h2 className="text-xl font-bold text-[#1F2937] mb-2 text-center">Upgrade Your Plan</h2>
            <p className="text-sm text-[#6B7280] text-center mb-6">
              Your current plan only allows 1 community. Upgrade to create more and reduce platform fees.
            </p>
            <div className="space-y-3 mb-6">
              <div className="border border-amber-300 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#1F2937]">Starter — $5/month</p>
                  <p className="text-xs text-[#6B7280]">Up to 3 communities · 4% fee</p>
                </div>
                <button
                  onClick={() => handleUpgradeToPlan('STARTER')}
                  disabled={upgradeLoading}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50"
                >
                  {upgradeLoading ? '…' : 'Upgrade'}
                </button>
              </div>
              <div className="border border-[#0D9488] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#1F2937]">Pro — $50/month</p>
                  <p className="text-xs text-[#6B7280]">Unlimited communities · 1% fee · AI features</p>
                </div>
                <button
                  onClick={() => handleUpgradeToPlan('PRO')}
                  disabled={upgradeLoading}
                  className="px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50"
                >
                  {upgradeLoading ? '…' : 'Upgrade'}
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full text-center text-sm text-[#6B7280] hover:text-[#1F2937]"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Create community modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
            <h2 className="text-xl font-bold text-[#1F2937] mb-6">Create a New Community</h2>
            <form onSubmit={handleCreateCommunity} className="space-y-4">
              <Input
                label="Community Name"
                placeholder="e.g. Advanced Mastermind"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#1F2937]">Description</label>
                <textarea
                  placeholder="What will members get from this community?"
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-[#6B7280] px-4 py-3 text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488] resize-none"
                />
              </div>
              {error && <p className="text-sm text-[#EF4444]">{error}</p>}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => { setShowCreate(false); setError(''); }}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={createLoading} className="flex-1">
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab switcher + View as Member */}
      {community && (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm w-fit flex-wrap">
            {([
              'feed',
              'classroom',
              'members',
              ...((community as any)?.visibility === 'PRIVATE' ? ['requests' as Tab] : []),
              'ai',
              'settings',
            ] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors flex items-center gap-1.5 ${
                  activeTab === tab
                    ? 'bg-[#0D9488] text-white'
                    : 'text-[#6B7280] hover:text-[#1F2937]'
                }`}
              >
                {tab === 'feed' && '💬 Feed'}
                {tab === 'classroom' && '🎓 Classroom'}
                {tab === 'members' && '👥 Members'}
                {tab === 'ai' && (
                  <>
                    ✨ AI Copilot
                    {!isPro && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-amber-600 bg-amber-100">
                        Pro
                      </span>
                    )}
                  </>
                )}
                {tab === 'requests' && '📋 Requests'}
                {tab === 'settings' && '⚙ Settings'}
              </button>
            ))}
          </div>
          {creatorSlug && (
            <a
              href={`/${creatorSlug}/community?id=${community.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[#6B7280] hover:text-[#0D9488] transition-colors flex items-center gap-1"
            >
              👁 View as Member
            </a>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-[#EF4444] bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
          {error}
        </p>
      )}

      {!community && (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center">
          <div className="text-4xl mb-3">🏘️</div>
          <p className="font-semibold text-[#1F2937]">No community selected</p>
          <p className="text-sm text-[#6B7280] mt-1">Create one to get started.</p>
        </div>
      )}

      {/* ── Feed Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'feed' && community && (
        <div className="space-y-4">
          {pendingPosts.length > 0 && (
            <button
              onClick={revealPending}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors bg-[#0D9488] hover:bg-teal-700"
            >
              ↑ {pendingPosts.length} new {pendingPosts.length === 1 ? 'post' : 'posts'} — tap to show
            </button>
          )}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <form onSubmit={handleCreatePost}>
              <MentionInput
                communityId={community.id}
                value={postContent}
                onChange={(val, map) => {
                  setPostContent(val);
                  setPostMentionMap(map);
                }}
                placeholder={`Share something with ${community.name}… use @ to mention`}
                rows={3}
                className="w-full rounded-lg border border-[#F3F4F6] bg-[#F3F4F6] px-4 py-3 text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488] resize-none text-sm"
                disabled={posting}
              />
              <div className="flex justify-end mt-3">
                <Button type="submit" loading={posting} disabled={!postContent.trim()}>
                  Post
                </Button>
              </div>
            </form>
          </div>

          {feedLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center">
              <div className="text-4xl mb-3">💬</div>
              <h2 className="font-semibold text-[#1F2937] mb-1">No posts yet</h2>
              <p className="text-sm text-[#6B7280]">
                Be the first to post! Share an update, resource, or question.
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                communityId={community.id}
                currentUserId={currentUserId ?? ''}
                currentUserRole="OWNER"
                onUpdate={(updated) => setPosts((ps) => ps.map((p) => p.id === updated.id ? updated : p))}
                onDelete={(postId) => setPosts((ps) => ps.filter((p) => p.id !== postId))}
              />
            ))
          )}
        </div>
      )}

      {/* ── Classroom Tab ────────────────────────────────────────────────── */}
      {activeTab === 'classroom' && community && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-[#1F2937]">Community Classroom</h2>
              <p className="text-sm text-[#6B7280] mt-0.5">
                Courses added to this classroom are visible to all community members.
                Member pricing overrides let you offer discounts or free access.
              </p>
            </div>
          </div>

          {classroomLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : classroomCourses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center">
              <div className="text-4xl mb-3">🎓</div>
              <h2 className="font-semibold text-[#1F2937] mb-1">No courses in classroom</h2>
              <p className="text-sm text-[#6B7280] max-w-sm mx-auto">
                Go to the{' '}
                <a href="/dashboard/courses" className="text-[#0D9488] hover:underline">
                  Courses page
                </a>{' '}
                and click &quot;Classrooms&quot; on a course to add it here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {classroomCourses.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#1F2937]">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-[#6B7280] mt-0.5 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-[#6B7280]">
                        <span>Standard: {formatPrice(item.priceSelfPaced, item.currency)} (SP) / {formatPrice(item.priceAccountability, item.currency)} (A)</span>
                        {item.effectivePriceSelfPaced !== item.priceSelfPaced && (
                          <span className="text-[#0D9488] font-medium">
                            Member: {item.effectivePriceSelfPaced === 0 ? 'Free' : formatPrice(item.effectivePriceSelfPaced, item.currency)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${item.isPublished ? 'bg-teal-100 text-[#0D9488]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                          {item.isPublished ? 'Published' : 'Draft'}
                        </span>
                        {item.classroomEntry.memberPriceSelfPaced === 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-[#92400e]">
                            Free for members
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Remove "${item.title}" from this community's classroom?`)) {
                          removeFromClassroom(item.id, community.id)
                            .then(() => setClassroomCourses((cs) => cs.filter((c) => c.id !== item.id)))
                            .catch(() => alert('Failed to remove course.'));
                        }
                      }}
                      className="text-xs text-[#EF4444] hover:underline flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── AI Copilot Tab ───────────────────────────────────────────────── */}
      {activeTab === 'ai' && community && (
        <div className="space-y-5">
          {!isPro ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center">
              <div className="text-4xl mb-3">✨</div>
              <h2 className="font-semibold text-[#1F2937] mb-2">AI Community Copilot</h2>
              <p className="text-sm text-[#6B7280] max-w-sm mx-auto mb-5">
                Let AI answer questions from your community members using context from recent posts.
                Available on the Pro plan.
              </p>
              <button
                onClick={() => handleUpgradeToPlan('PRO')}
                disabled={upgradeLoading}
                className="px-6 py-2.5 rounded-xl bg-[#0D9488] text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {upgradeLoading ? '…' : 'Upgrade to Pro — $50/month'}
              </button>
            </div>
          ) : (
            <>
              {/* System prompt */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-semibold text-[#1F2937] mb-1">AI System Prompt</h2>
                <p className="text-xs text-[#6B7280] mb-3">
                  Customise how the AI responds. If left blank, it uses a friendly default.
                </p>
                <textarea
                  value={aiSystemPrompt}
                  onChange={(e) => setAiSystemPrompt(e.target.value)}
                  rows={4}
                  placeholder="e.g. You are a helpful assistant for the Bola Business School community. Focus on entrepreneurship and growth topics. Always be encouraging and practical."
                  className="w-full rounded-lg border border-[#6B7280]/30 px-4 py-3 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488] resize-none"
                />
              </div>

              {/* Test the copilot */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-semibold text-[#1F2937] mb-1">Test the Copilot</h2>
                <p className="text-xs text-[#6B7280] mb-4">
                  Ask a question to see how the AI responds using your community&apos;s recent posts as context.
                </p>

                <div className="flex gap-3 mb-4">
                  <input
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !aiStreaming && aiQuestion.trim()) {
                        e.preventDefault();
                        handleAskAI();
                      }
                    }}
                    placeholder="e.g. What are the most common questions members are asking?"
                    disabled={aiStreaming}
                    className="flex-1 rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488] disabled:opacity-60"
                  />
                  {aiStreaming ? (
                    <button
                      onClick={() => {
                        aiAbortRef.current?.abort();
                        setAiStreaming(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#F3F4F6] text-[#6B7280] text-sm font-medium hover:bg-[#E5E7EB] transition-colors flex-shrink-0"
                    >
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={handleAskAI}
                      disabled={!aiQuestion.trim()}
                      className="px-5 py-2 rounded-xl bg-[#0D9488] text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-40 transition-colors flex-shrink-0"
                    >
                      Ask
                    </button>
                  )}
                </div>

                {aiError && (
                  <p className="text-sm text-[#EF4444] bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                    {aiError}
                  </p>
                )}

                {(aiAnswer || aiStreaming) && (
                  <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#F3F4F6]">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-5 h-5 rounded-full bg-[#0D9488]/10 text-[#0D9488] text-xs font-bold flex items-center justify-center flex-shrink-0">
                        AI
                      </span>
                      <span className="text-xs font-medium text-[#6B7280]">Community Copilot</span>
                      {aiStreaming && (
                        <div className="w-3 h-3 rounded-full border-2 border-[#0D9488] border-t-transparent animate-spin ml-auto flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-[#1F2937] leading-relaxed whitespace-pre-wrap">
                      {aiAnswer}
                      {aiStreaming && !aiAnswer && (
                        <span className="inline-block w-2 h-4 bg-[#0D9488] animate-pulse rounded-sm" />
                      )}
                    </p>
                  </div>
                )}

                {!aiAnswer && !aiStreaming && (
                  <p className="text-xs text-[#9CA3AF] text-center py-2">
                    The AI uses the last 20 posts from this community as context.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Members Tab ────────────────────────────────────────────────── */}
      {activeTab === 'members' && community && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#1F2937]">Members ({members.length})</h2>
            </div>
            <input
              type="text"
              placeholder="Search members…"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full rounded-lg border border-[#6B7280]/30 px-4 py-2.5 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488] mb-4"
            />
            {membersLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {members
                  .filter((m) => m.name.toLowerCase().includes(memberSearch.toLowerCase()))
                  .map((member) => {
                    const isOwner = member.communityRole === 'OWNER';
                    const isMod = member.communityRole === 'MODERATOR';
                    return (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F3F4F6] transition-colors">
                        <div className="w-10 h-10 rounded-full bg-[#0D9488]/10 flex items-center justify-center font-semibold text-[#0D9488] text-sm flex-shrink-0 overflow-hidden">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            member.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[#1F2937] text-sm truncate">{member.name}</span>
                            {isOwner && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0D9488]/10 text-[#0D9488]">Owner</span>
                            )}
                            {isMod && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Moderator</span>
                            )}
                          </div>
                          <p className="text-xs text-[#6B7280]">
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {!isOwner && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={async () => {
                                setMemberActionLoading(member.id);
                                try {
                                  const newRole: 'MODERATOR' | 'MEMBER' = isMod ? 'MEMBER' : 'MODERATOR';
                                  await setMemberRole(community.id, member.id, newRole);
                                  setMembers((ms) => ms.map((m) =>
                                    m.id === member.id ? { ...m, communityRole: newRole as CommunityRole } : m,
                                  ));
                                } catch {} finally {
                                  setMemberActionLoading(null);
                                }
                              }}
                              disabled={memberActionLoading === member.id}
                              className="text-xs text-[#0D9488] hover:underline disabled:opacity-50"
                            >
                              {isMod ? 'Demote' : 'Promote'}
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm(`Remove ${member.name} from the community?`)) return;
                                setMemberActionLoading(member.id);
                                try {
                                  await removeMember(community.id, member.id);
                                  setMembers((ms) => ms.filter((m) => m.id !== member.id));
                                } catch {} finally {
                                  setMemberActionLoading(null);
                                }
                              }}
                              disabled={memberActionLoading === member.id}
                              className="text-xs text-[#EF4444] hover:underline disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                {members.filter((m) => m.name.toLowerCase().includes(memberSearch.toLowerCase())).length === 0 && (
                  <p className="text-sm text-[#6B7280] text-center py-6">No members found.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Join Requests Tab ──────────────────────────────────────────── */}
      {activeTab === 'requests' && community && (
        <div className="space-y-4">
          {/* Filter tabs */}
          <div className="flex gap-2">
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setRequestsFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  requestsFilter === f
                    ? 'bg-[#0D9488] text-white'
                    : 'bg-white text-[#6B7280] hover:text-[#1F2937] shadow-sm'
                }`}
              >
                {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {requestsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : joinRequestsList.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center">
              <div className="text-3xl mb-3">📋</div>
              <p className="font-semibold text-[#1F2937]">No {requestsFilter === 'ALL' ? '' : requestsFilter.toLowerCase()} requests</p>
              <p className="text-sm text-[#6B7280] mt-1">
                {requestsFilter === 'PENDING' ? 'New requests will appear here.' : 'No requests match this filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {joinRequestsList.map((req) => (
                <div key={req.id} className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-[#0D9488]/10 flex items-center justify-center text-sm font-semibold text-[#0D9488] flex-shrink-0">
                      {req.user.avatarUrl ? (
                        <img src={req.user.avatarUrl} alt={req.user.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        req.user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-[#1F2937] text-sm">{req.user.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280]">
                        Requested {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>

                      {/* Show answers if any */}
                      {req.answers && Array.isArray(req.answers) && req.answers.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {(req.answers as { question: string; answer: string }[]).map((a, i) => (
                            <div key={i} className="bg-[#F3F4F6] rounded-lg px-3 py-2">
                              <p className="text-xs font-medium text-[#6B7280]">{a.question}</p>
                              <p className="text-sm text-[#1F2937] mt-0.5">{a.answer}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {req.status === 'PENDING' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleReviewRequest(req.id, 'APPROVED')}
                          disabled={reviewingId === req.id}
                          className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors font-medium disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReviewRequest(req.id, 'REJECTED')}
                          disabled={reviewingId === req.id}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Settings Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'settings' && community && (
        <div className="space-y-6">

          {/* Community Identity */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#1F2937]">Community</h2>
              <div className="flex gap-2">
                {!community.isFeatured && communities.length > 1 && (
                  <button
                    onClick={handleSetFeatured}
                    className="text-xs text-[#F59E0B] font-medium border border-[#F59E0B]/40 rounded-lg px-3 py-1.5 hover:bg-amber-50 transition-colors"
                  >
                    Set as Featured
                  </button>
                )}
                {communities.length > 1 && (
                  <button
                    onClick={handleDeleteCommunity}
                    className="text-xs text-[#EF4444] font-medium border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            <div className="text-sm text-[#6B7280] space-y-1">
              <p><span className="font-medium text-[#1F2937]">Name:</span> {community.name}</p>
              {community.description && (
                <p><span className="font-medium text-[#1F2937]">Description:</span> {community.description}</p>
              )}
              <p>
                <span className="font-medium text-[#1F2937]">Status:</span>{' '}
                {community.isFeatured ? (
                  <span className="text-[#F59E0B]">★ Featured on storefront</span>
                ) : (
                  'Not featured'
                )}
              </p>
            </div>
          </div>

          {/* Visibility & Access Control */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-[#1F2937] mb-1">Visibility & Access</h2>
            <p className="text-xs text-[#6B7280] mb-4">
              Control who can join your community.
            </p>

            <div className="flex gap-3 mb-4">
              {(['PUBLIC', 'PRIVATE'] as CommunityVisibility[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVisibility(v)}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    visibility === v
                      ? 'border-[#0D9488] bg-[#0D9488]/5 text-[#0D9488]'
                      : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]'
                  }`}
                >
                  {v === 'PUBLIC' ? '🌍 Public' : '🔐 Private'}
                  <p className="text-xs font-normal mt-0.5 opacity-75">
                    {v === 'PUBLIC' ? 'Anyone can join directly' : 'Join requires approval'}
                  </p>
                </button>
              ))}
            </div>

            {visibility === 'PRIVATE' && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[#1F2937]">
                    Join Questions <span className="text-xs text-[#6B7280] font-normal">(optional, max 5)</span>
                  </label>
                  {joinQuestions.length < 5 && (
                    <button
                      onClick={() => setJoinQuestions([...joinQuestions, ''])}
                      className="text-xs text-[#0D9488] font-medium hover:underline"
                    >
                      + Add Question
                    </button>
                  )}
                </div>
                {joinQuestions.length === 0 && (
                  <p className="text-xs text-[#6B7280] py-2">
                    No questions — requesters will only need to click &quot;Request to Join&quot;.
                  </p>
                )}
                <div className="space-y-2">
                  {joinQuestions.map((q, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        value={q}
                        onChange={(e) => {
                          const next = [...joinQuestions];
                          next[i] = e.target.value;
                          setJoinQuestions(next);
                        }}
                        placeholder={`Question ${i + 1}`}
                        className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                      />
                      <button
                        onClick={() => setJoinQuestions(joinQuestions.filter((_, idx) => idx !== i))}
                        className="text-xs text-[#6B7280] hover:text-[#EF4444] transition-colors flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleSaveVisibility}
              loading={savingVisibility}
              disabled={
                visibility === ((community as any)?.visibility ?? 'PUBLIC') &&
                JSON.stringify(joinQuestions) === JSON.stringify(
                  Array.isArray((community as any)?.joinQuestions) ? (community as any).joinQuestions : []
                )
              }
            >
              Save Visibility Settings
            </Button>
          </div>

          {/* Welcome Message */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-[#1F2937] mb-1">Welcome Message</h2>
            <p className="text-xs text-[#6B7280] mb-4">
              Shown to members when they first visit your community.
            </p>
            <textarea
              value={welcomeMsg}
              onChange={(e) => setWelcomeMsg(e.target.value)}
              rows={4}
              placeholder="Welcome to the community! Here's what you need to know to get started…"
              className="w-full rounded-lg border border-[#6B7280]/30 px-4 py-3 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488] resize-none mb-3"
            />
            <Button
              onClick={handleSaveWelcome}
              loading={savingWelcome}
              disabled={welcomeMsg === (community.welcomeMessage ?? '')}
            >
              Save Welcome Message
            </Button>
          </div>

          {/* Post Categories */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-[#1F2937]">Post Categories</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Members can tag posts with a category.
                </p>
              </div>
              <button
                onClick={() => setShowCategoryForm(!showCategoryForm)}
                className="text-sm text-[#0D9488] font-medium hover:underline"
              >
                {showCategoryForm ? 'Cancel' : '+ Add'}
              </button>
            </div>

            {categories.length === 0 && !showCategoryForm && (
              <p className="text-[#6B7280] text-sm text-center py-4">No categories yet.</p>
            )}

            <div className="space-y-2 mb-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between border border-[#F3F4F6] rounded-lg px-4 py-3"
                >
                  <span className="text-sm font-medium text-[#1F2937]">
                    {cat.emoji} {cat.name}
                  </span>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-xs text-[#6B7280] hover:text-[#EF4444] transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>

            {showCategoryForm && (
              <form onSubmit={handleAddCategory} className="pt-3 border-t border-[#F3F4F6]">
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-3">New Category</p>
                <div className="flex gap-3 items-end">
                  <div className="flex flex-col gap-1 w-24">
                    <label className="text-xs font-medium text-[#1F2937]">Emoji</label>
                    <input
                      value={newCategory.emoji}
                      onChange={(e) => setNewCategory((f) => ({ ...f, emoji: e.target.value }))}
                      maxLength={4}
                      placeholder="💬"
                      className="rounded-lg border border-[#6B7280]/30 px-3 py-2.5 text-sm text-center text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-xs font-medium text-[#1F2937]">Name</label>
                    <input
                      value={newCategory.name}
                      onChange={(e) => setNewCategory((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Wins, Questions, Announcements"
                      maxLength={40}
                      required
                      className="rounded-lg border border-[#6B7280]/30 px-3 py-2.5 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                    />
                  </div>
                  <Button type="submit" loading={savingCategory} disabled={!newCategory.name.trim()}>
                    Add
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-[#1F2937]">Quick Links</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Displayed in the sidebar of your community page.
                </p>
              </div>
              <button
                onClick={() => setShowLinkForm(!showLinkForm)}
                className="text-sm text-[#0D9488] font-medium hover:underline"
              >
                {showLinkForm ? 'Cancel' : '+ Add'}
              </button>
            </div>

            {quickLinks.length === 0 && !showLinkForm && (
              <p className="text-[#6B7280] text-sm text-center py-4">No links yet.</p>
            )}

            <div className="space-y-2 mb-3">
              {quickLinks.map((link, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border border-[#F3F4F6] rounded-lg px-4 py-3"
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-[#0D9488] hover:underline"
                  >
                    <span>{link.emoji}</span>
                    <span>{link.title}</span>
                  </a>
                  <button
                    onClick={() => handleDeleteLink(i)}
                    className="text-xs text-[#6B7280] hover:text-[#EF4444] transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>

            {showLinkForm && (
              <form onSubmit={handleAddLink} className="pt-3 border-t border-[#F3F4F6]">
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-3">New Link</p>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex flex-col gap-1 w-24">
                      <label className="text-xs font-medium text-[#1F2937]">Emoji</label>
                      <input
                        value={newLink.emoji}
                        onChange={(e) => setNewLink((f) => ({ ...f, emoji: e.target.value }))}
                        maxLength={4}
                        placeholder="🔗"
                        className="rounded-lg border border-[#6B7280]/30 px-3 py-2.5 text-sm text-center text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-xs font-medium text-[#1F2937]">Title</label>
                      <input
                        value={newLink.title}
                        onChange={(e) => setNewLink((f) => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. Join our Discord"
                        required
                        className="rounded-lg border border-[#6B7280]/30 px-3 py-2.5 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-xs font-medium text-[#1F2937]">URL</label>
                      <input
                        value={newLink.url}
                        onChange={(e) => setNewLink((f) => ({ ...f, url: e.target.value }))}
                        placeholder="https://…"
                        type="url"
                        required
                        className="rounded-lg border border-[#6B7280]/30 px-3 py-2.5 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                      />
                    </div>
                    <Button
                      type="submit"
                      loading={savingLinks}
                      disabled={!newLink.title.trim() || !newLink.url.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Membership Tiers */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#1F2937]">Membership Tiers</h2>
              <button
                onClick={() => setShowTierForm(!showTierForm)}
                className="text-sm text-[#0D9488] font-medium hover:underline"
              >
                {showTierForm ? 'Cancel' : '+ Add Tier'}
              </button>
            </div>

            {community.membershipTiers.length === 0 && !showTierForm && (
              <p className="text-[#6B7280] text-sm text-center py-4">
                No tiers yet. Add one to start accepting members.
              </p>
            )}

            <div className="space-y-3">
              {community.membershipTiers.map((tier: MembershipTier) => (
                <div
                  key={tier.id}
                  className="flex items-center justify-between border border-[#F3F4F6] rounded-lg p-4"
                >
                  <div>
                    <p className="font-medium text-[#1F2937]">{tier.name}</p>
                    {tier.description && (
                      <p className="text-sm text-[#6B7280]">{tier.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-bold text-[#0D9488]">
                        {formatPrice(tier.priceMonthly, tier.currency)}
                        {tier.priceMonthly > 0 && <span className="font-normal text-[#6B7280] text-xs">/mo</span>}
                      </span>
                      {tier.priceAnnual > 0 && (
                        <p className="text-xs text-[#6B7280]">
                          {formatPrice(tier.priceAnnual, tier.currency)}/yr
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteTier(tier.id)}
                      className="text-[#EF4444] text-sm hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {showTierForm && (
              <form onSubmit={handleAddTier} className="mt-4 pt-4 border-t border-[#F3F4F6] space-y-3">
                <h3 className="font-medium text-[#1F2937] text-sm">New Tier</h3>
                <Input
                  label="Tier Name"
                  placeholder="e.g. Pro Member"
                  value={tierForm.name}
                  onChange={(e) => setTierForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
                <Input
                  label="Description"
                  placeholder="What's included?"
                  value={tierForm.description}
                  onChange={(e) => setTierForm((f) => ({ ...f, description: e.target.value }))}
                />
                <div className="flex gap-3">
                  <Input
                    label="Monthly Price (0 = Free)"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="19.99"
                    value={tierForm.priceMonthly}
                    onChange={(e) => setTierForm((f) => ({ ...f, priceMonthly: e.target.value }))}
                    className="flex-1"
                  />
                  <div className="flex flex-col gap-1 w-28">
                    <label className="text-sm font-medium text-[#1F2937]">Currency</label>
                    <select
                      value={tierForm.currency}
                      onChange={(e) => setTierForm((f) => ({ ...f, currency: e.target.value }))}
                      className="rounded-lg border border-[#6B7280] px-3 py-3 text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                    >
                      {['USD', 'NGN', 'GHS', 'KES', 'ZAR'].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Input
                  label="Annual Price (optional — leave blank for monthly-only)"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="190.00 (≈ 2 months free)"
                  value={tierForm.priceAnnual}
                  onChange={(e) => setTierForm((f) => ({ ...f, priceAnnual: e.target.value }))}
                />
                <Button type="submit" loading={tierLoading} className="w-full">
                  Add Tier
                </Button>
              </form>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
