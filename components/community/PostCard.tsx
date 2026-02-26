'use client';

import { useState, useEffect } from 'react';
import { Post, PostComment, CommentReactionCount, CommunityRole, addComment, deleteComment, toggleLike, deletePost, pinPost, toggleCommentReaction } from '@/lib/community';
import { renderWithMentions } from '@/lib/renderWithMentions';
import MentionInput from './MentionInput';

function Avatar({ name, avatarUrl, size = 'sm' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' }) {
  const px = size === 'md' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={`${px} rounded-full object-cover`} />;
  }
  return (
    <div className={`${px} rounded-full bg-[#0D9488]/10 flex items-center justify-center font-semibold text-[#0D9488] flex-shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '👏', '😮'];

function ReactionBar({
  reactions,
  currentUserId,
  onToggle,
}: {
  reactions: CommentReactionCount[];
  currentUserId: string;
  onToggle: (emoji: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
      {REACTION_EMOJIS.map((emoji) => {
        const r = reactions.find((rc) => rc.emoji === emoji);
        const count = r?.count ?? 0;
        const active = r?.reactedByMe ?? false;
        return (
          <button
            key={emoji}
            onClick={() => onToggle(emoji)}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors border ${
              active
                ? 'bg-[#0D9488]/10 border-[#0D9488]/30 text-[#0D9488]'
                : 'bg-transparent border-transparent text-[#6B7280] hover:bg-[#F3F4F6]'
            }`}
            title={emoji}
          >
            <span className="text-sm">{emoji}</span>
            {count > 0 && <span className="font-medium">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

interface PostCardProps {
  post: Post;
  communityId: string;
  currentUserId: string;
  currentUserRole?: CommunityRole | null;
  onUpdate: (post: Post) => void;
  onDelete: (postId: string) => void;
}

export default function PostCard({ post, communityId, currentUserId, currentUserRole, onUpdate, onDelete }: PostCardProps) {
  const canModerate = currentUserRole === 'OWNER' || currentUserRole === 'MODERATOR';
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentMentionMap, setCommentMentionMap] = useState<Map<string, string>>(new Map());
  const [addingComment, setAddingComment] = useState(false);
  const [liking, setLiking] = useState(false);
  const [localPost, setLocalPost] = useState<Post>(post);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyMentionMap, setReplyMentionMap] = useState<Map<string, string>>(new Map());
  const [addingReply, setAddingReply] = useState(false);

  // Stable string derived from parent's comment IDs (including replies)
  const allCommentIds = post.comments.flatMap((c) => [c.id, ...(c.replies ?? []).map((r) => r.id)]).join(',');

  useEffect(() => {
    setLocalPost((prev) => {
      const parentCommentSet = new Set(post.comments.flatMap((c) => [c.id, ...(c.replies ?? []).map((r) => r.id)]));
      const prevAllIds = prev.comments.flatMap((c) => [c.id, ...(c.replies ?? []).map((r) => r.id)]);
      const localOnly = prevAllIds.filter((id) => !parentCommentSet.has(id));

      if (
        prev.isPinned === post.isPinned &&
        localOnly.length === 0 &&
        prevAllIds.length === parentCommentSet.size
      ) {
        return prev;
      }

      return {
        ...prev,
        isPinned: post.isPinned,
        comments: post.comments,
        _count: { ...prev._count, comments: post._count.comments },
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.isPinned, allCommentIds]);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    const wasLiked = localPost.likedByMe;
    setLocalPost((p) => ({
      ...p,
      likedByMe: !wasLiked,
      _count: { ...p._count, likes: wasLiked ? p._count.likes - 1 : p._count.likes + 1 },
    }));
    try {
      await toggleLike(localPost.id);
    } catch {
      setLocalPost((p) => ({
        ...p,
        likedByMe: wasLiked,
        _count: { ...p._count, likes: wasLiked ? p._count.likes : p._count.likes - 1 },
      }));
    } finally {
      setLiking(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setAddingComment(true);
    try {
      const mentionedUserIds = Array.from(commentMentionMap.values());
      const comment = await addComment(localPost.id, commentText.trim(), mentionedUserIds.length ? mentionedUserIds : undefined);
      setLocalPost((p) => {
        if (p.comments.some((c) => c.id === comment.id)) return p;
        return {
          ...p,
          comments: [...p.comments, comment],
          _count: { ...p._count, comments: p._count.comments + 1 },
        };
      });
      setCommentText('');
      setCommentMentionMap(new Map());
    } finally {
      setAddingComment(false);
    }
  };

  const handleAddReply = async (parentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setAddingReply(true);
    try {
      const mentionedUserIds = Array.from(replyMentionMap.values());
      const reply = await addComment(localPost.id, replyText.trim(), mentionedUserIds.length ? mentionedUserIds : undefined, parentId);
      setLocalPost((p) => ({
        ...p,
        comments: p.comments.map((c) =>
          c.id === parentId
            ? { ...c, replies: [...(c.replies ?? []), reply] }
            : c,
        ),
        _count: { ...p._count, comments: p._count.comments + 1 },
      }));
      setReplyText('');
      setReplyMentionMap(new Map());
      setReplyingTo(null);
    } finally {
      setAddingReply(false);
    }
  };

  const handleDeleteComment = async (commentId: string, parentId?: string | null) => {
    await deleteComment(commentId);
    if (parentId) {
      // Deleting a reply
      setLocalPost((p) => ({
        ...p,
        comments: p.comments.map((c) =>
          c.id === parentId
            ? { ...c, replies: (c.replies ?? []).filter((r) => r.id !== commentId) }
            : c,
        ),
        _count: { ...p._count, comments: p._count.comments - 1 },
      }));
    } else {
      // Deleting a top-level comment (cascade removes replies too)
      const comment = localPost.comments.find((c) => c.id === commentId);
      const replyCount = comment?.replies?.length ?? 0;
      setLocalPost((p) => ({
        ...p,
        comments: p.comments.filter((c) => c.id !== commentId),
        _count: { ...p._count, comments: p._count.comments - 1 - replyCount },
      }));
    }
  };

  const handleToggleReaction = async (commentId: string, emoji: string, parentId?: string | null) => {
    // Optimistic update
    const updateReactions = (reactions: CommentReactionCount[]): CommentReactionCount[] => {
      const existing = reactions.find((r) => r.emoji === emoji);
      if (existing?.reactedByMe) {
        return existing.count <= 1
          ? reactions.filter((r) => r.emoji !== emoji)
          : reactions.map((r) => r.emoji === emoji ? { ...r, count: r.count - 1, reactedByMe: false } : r);
      }
      if (existing) {
        return reactions.map((r) => r.emoji === emoji ? { ...r, count: r.count + 1, reactedByMe: true } : r);
      }
      return [...reactions, { emoji, count: 1, reactedByMe: true }];
    };

    setLocalPost((p) => ({
      ...p,
      comments: p.comments.map((c) => {
        if (c.id === commentId) return { ...c, reactions: updateReactions(c.reactions ?? []) };
        return {
          ...c,
          replies: (c.replies ?? []).map((r) =>
            r.id === commentId ? { ...r, reactions: updateReactions(r.reactions ?? []) } : r,
          ),
        };
      }),
    }));

    try {
      await toggleCommentReaction(commentId, emoji);
    } catch {
      // Revert would be complex — just let the next feed load correct it
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Delete this post?')) return;
    await deletePost(localPost.id);
    onDelete(localPost.id);
  };

  const handlePin = async () => {
    const updated = await pinPost(localPost.id, !localPost.isPinned);
    setLocalPost(updated as Post);
    onUpdate(updated as Post);
  };

  const canDelete = localPost.author.id === currentUserId || canModerate;
  const canPin = canModerate;

  const renderComment = (comment: PostComment, isReply = false) => (
    <div key={comment.id} className={`flex gap-2.5 group ${isReply ? 'ml-10' : ''}`}>
      <Avatar name={comment.author.name} avatarUrl={comment.author.avatarUrl} />
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-lg px-3 py-2 text-sm">
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-[#1F2937] text-xs">{comment.author.name}</span>
            <span className="text-[#6B7280] text-xs">{timeAgo(comment.createdAt)}</span>
            {(comment.author.id === currentUserId || canModerate) && (
              <button
                onClick={() => handleDeleteComment(comment.id, comment.parentId)}
                className="text-[#6B7280] text-xs hover:text-[#EF4444] ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            )}
          </div>
          <p className="text-[#1F2937] mt-0.5 whitespace-pre-wrap">
            {renderWithMentions(comment.content)}
          </p>
        </div>
        <ReactionBar
          reactions={comment.reactions ?? []}
          currentUserId={currentUserId}
          onToggle={(emoji) => handleToggleReaction(comment.id, emoji, comment.parentId)}
        />
        {/* Reply button — only for top-level comments */}
        {!isReply && (
          <button
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            className="text-xs text-[#6B7280] hover:text-[#0D9488] mt-1 ml-1 transition-colors"
          >
            Reply
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${localPost.isPinned ? 'ring-2 ring-[#0D9488]/30' : ''}`}>
      {localPost.isPinned && (
        <div className="bg-teal-50 px-5 py-1.5 border-b border-teal-100 flex items-center gap-1.5">
          <span className="text-xs text-[#0D9488] font-medium">📌 Pinned post</span>
        </div>
      )}

      <div className="p-5">
        {/* Author row */}
        <div className="flex items-start gap-3 mb-4">
          <Avatar name={localPost.author.name} avatarUrl={localPost.author.avatarUrl} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-[#1F2937] text-sm">{localPost.author.name}</span>
              {localPost.author.role === 'CREATOR' && (
                <span className="text-xs bg-[#0D9488] text-white px-2 py-0.5 rounded-full font-medium">👑 Creator</span>
              )}
              {localPost.category && (
                <span className="text-xs bg-[#F3F4F6] text-[#6B7280] px-2 py-0.5 rounded-full">
                  {localPost.category.emoji} {localPost.category.name}
                </span>
              )}
              <span className="text-xs text-[#6B7280]">{timeAgo(localPost.createdAt)}</span>
            </div>
          </div>
          {/* Action menu */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {canPin && (
              <button
                onClick={handlePin}
                className="text-xs text-[#6B7280] hover:text-[#0D9488] transition-colors"
                title={localPost.isPinned ? 'Unpin' : 'Pin to top'}
              >
                {localPost.isPinned ? '📌 Unpin' : '📌 Pin'}
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDeletePost}
                className="text-xs text-[#6B7280] hover:text-[#EF4444] transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Post content */}
        <p className="text-[#1F2937] leading-relaxed whitespace-pre-wrap text-sm mb-4">
          {renderWithMentions(localPost.content)}
        </p>

        {localPost.imageUrl && (
          <img
            src={localPost.imageUrl}
            alt="Post image"
            className="w-full rounded-lg object-cover max-h-80 mb-4"
          />
        )}

        {/* Action bar */}
        <div className="flex items-center gap-5 pt-3 border-t border-[#F3F4F6]">
          <button
            onClick={handleLike}
            disabled={liking}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              localPost.likedByMe ? 'text-[#0D9488] font-medium' : 'text-[#6B7280] hover:text-[#0D9488]'
            }`}
          >
            <span>{localPost.likedByMe ? '❤️' : '🤍'}</span>
            <span>{localPost._count.likes}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D9488] transition-colors"
          >
            <span>💬</span>
            <span>{localPost._count.comments} {localPost._count.comments === 1 ? 'comment' : 'comments'}</span>
          </button>
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-[#F3F4F6] bg-[#F3F4F6]/40">
          {/* Existing comments */}
          {localPost.comments.length > 0 && (
            <div className="px-5 pt-4 space-y-3">
              {localPost.comments.map((comment) => (
                <div key={comment.id}>
                  {renderComment(comment, false)}
                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {comment.replies.map((reply) => renderComment(reply, true))}
                    </div>
                  )}
                  {/* Inline reply form */}
                  {replyingTo === comment.id && (
                    <form onSubmit={(e) => handleAddReply(comment.id, e)} className="mt-2 ml-10 flex gap-2 items-end">
                      <div className="flex-1">
                        <MentionInput
                          communityId={communityId}
                          value={replyText}
                          onChange={(val, map) => {
                            setReplyText(val);
                            setReplyMentionMap(map);
                          }}
                          placeholder={`Reply to ${comment.author.name}…`}
                          rows={1}
                          className="w-full rounded-2xl border border-[#6B7280]/30 px-4 py-2 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488] bg-white resize-none"
                          disabled={addingReply}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!replyText.trim() || addingReply}
                        className="bg-[#0D9488] text-white rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-teal-700 transition-colors flex-shrink-0"
                      >
                        Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => { setReplyingTo(null); setReplyText(''); setReplyMentionMap(new Map()); }}
                        className="text-xs text-[#6B7280] hover:text-[#1F2937] flex-shrink-0"
                      >
                        Cancel
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Comment form */}
          <form onSubmit={handleAddComment} className="flex gap-2.5 px-5 py-4">
            <div className="w-8 h-8 rounded-full bg-[#0D9488]/10 flex items-center justify-center font-semibold text-[#0D9488] text-xs flex-shrink-0">
              Me
            </div>
            <div className="flex-1 flex gap-2 items-end">
              <div className="flex-1">
                <MentionInput
                  communityId={communityId}
                  value={commentText}
                  onChange={(val, map) => {
                    setCommentText(val);
                    setCommentMentionMap(map);
                  }}
                  placeholder="Write a comment… use @ to mention"
                  rows={1}
                  className="w-full rounded-2xl border border-[#6B7280]/30 px-4 py-2 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488] bg-white resize-none"
                  disabled={addingComment}
                />
              </div>
              <button
                type="submit"
                disabled={!commentText.trim() || addingComment}
                className="bg-[#0D9488] text-white rounded-full px-4 py-2 text-xs font-medium disabled:opacity-40 hover:bg-teal-700 transition-colors flex-shrink-0"
              >
                Post
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
