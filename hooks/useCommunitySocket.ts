'use client';

import { useEffect, useRef } from 'react';
import type { Post, PostComment } from '@/lib/community';
import { getToken } from '@/lib/auth';
import { API_URL } from '@/lib/api';

export interface MentionNotification {
  postId: string;
  communityId: string;
  communityName: string;
  mentionerName: string;
  postUrl: string;
}

export interface PresenceUpdate {
  communityId: string;
  onlineUserIds: string[];
}

export interface CommunitySocketHandlers {
  /** A new post was published by someone else */
  onNewPost?: (post: Post) => void;
  /** A post was deleted */
  onPostDeleted?: (postId: string) => void;
  /** A post's pin state changed */
  onPostPinned?: (postId: string, isPinned: boolean) => void;
  /** A comment was added to a post */
  onNewComment?: (postId: string, comment: PostComment) => void;
  /** A comment was deleted */
  onCommentDeleted?: (postId: string, commentId: string, deletedCount?: number, parentId?: string | null) => void;
  /** Someone liked or unliked a post — provides the new total count */
  onLikeToggled?: (postId: string, likeCount: number, userId: string, liked: boolean) => void;
  /** Someone toggled a reaction on a comment */
  onReactionToggled?: (commentId: string, emoji: string, reactionCounts: { emoji: string; count: number }[], userId: string, reacted: boolean) => void;
  /** The current user was mentioned in a post or comment */
  onMentionReceived?: (notif: MentionNotification) => void;
  /** Online presence updated */
  onPresenceUpdate?: (data: PresenceUpdate) => void;
  /** New DM received */
  onDmReceived?: (data: { conversationId: string; message: any }) => void;
}

/**
 * Opens a Socket.IO connection to the /community namespace and joins the room
 * for the given communityId. Calls handler functions when real-time events
 * arrive. Disconnects cleanly on unmount or when communityId changes.
 *
 * Handlers are stored in a ref so they can be updated each render without
 * causing the socket to reconnect.
 *
 * The `cancelled` flag + `disconnect` closure pattern is required because the
 * socket is created inside an async dynamic import. React StrictMode runs the
 * effect cleanup before the import resolves, so without this guard a second
 * socket would be created after the first is "cleaned up" — resulting in two
 * active connections that fire every event twice.
 */
export function useCommunitySocket(
  communityId: string | undefined,
  handlers: CommunitySocketHandlers,
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const token = getToken();
    if (!token || !communityId) return;

    let cancelled = false;
    let disconnect: (() => void) | undefined;

    import('socket.io-client').then(({ io }) => {
      // Bail out if React already ran the cleanup (StrictMode double-invoke,
      // communityId change, or unmount) before this import resolved.
      if (cancelled) return;

      const socket = io(`${API_URL}/community`, {
        auth: { token },
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        socket.emit('join-community', communityId);
      });

      socket.on('post:new', (post: Post) => {
        handlersRef.current.onNewPost?.(post);
      });

      socket.on('post:deleted', ({ postId }: { postId: string }) => {
        handlersRef.current.onPostDeleted?.(postId);
      });

      socket.on('post:pinned', ({ postId, isPinned }: { postId: string; isPinned: boolean }) => {
        handlersRef.current.onPostPinned?.(postId, isPinned);
      });

      socket.on('comment:new', ({ postId, comment }: { postId: string; comment: PostComment }) => {
        handlersRef.current.onNewComment?.(postId, comment);
      });

      socket.on(
        'comment:deleted',
        ({ postId, commentId, deletedCount, parentId }: { postId: string; commentId: string; deletedCount?: number; parentId?: string | null }) => {
          handlersRef.current.onCommentDeleted?.(postId, commentId, deletedCount, parentId);
        },
      );

      socket.on(
        'like:toggled',
        ({
          postId,
          likeCount,
          userId,
          liked,
        }: {
          postId: string;
          likeCount: number;
          userId: string;
          liked: boolean;
        }) => {
          handlersRef.current.onLikeToggled?.(postId, likeCount, userId, liked);
        },
      );

      socket.on(
        'reaction:toggled',
        ({
          commentId,
          emoji,
          reactionCounts,
          userId,
          reacted,
        }: {
          commentId: string;
          emoji: string;
          reactionCounts: { emoji: string; count: number }[];
          userId: string;
          reacted: boolean;
        }) => {
          handlersRef.current.onReactionToggled?.(commentId, emoji, reactionCounts, userId, reacted);
        },
      );

      socket.on('mention:received', (notif: MentionNotification) => {
        handlersRef.current.onMentionReceived?.(notif);
      });

      socket.on('presence:update', (data: PresenceUpdate) => {
        handlersRef.current.onPresenceUpdate?.(data);
      });

      socket.on('dm:new', (data: { conversationId: string; message: any }) => {
        handlersRef.current.onDmReceived?.(data);
      });

      socket.on('notification:new', () => {
        // Dispatch a custom window event so NotificationBell can refresh
        window.dispatchEvent(new Event('notification:new'));
      });

      disconnect = () => {
        socket.emit('leave-community', communityId);
        socket.disconnect();
      };
    });

    return () => {
      cancelled = true;
      disconnect?.();
    };
  }, [communityId]); // Only reconnect if the community changes
}
