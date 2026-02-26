import { apiFetch } from './api';

export interface ConversationUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface ConversationSummary {
  id: string;
  communityId: string;
  otherUser: ConversationUser;
  lastMessage: {
    body: string;
    sentAt: string;
    isOwn: boolean;
  } | null;
  hasUnread: boolean;
  updatedAt: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  sender: ConversationUser;
  body: string;
  fileUrl: string | null;
  isRead: boolean;
  sentAt: string;
  editedAt: string | null;
}

export interface MessagesResponse {
  messages: DirectMessage[];
  total: number;
  page: number;
  hasMore: boolean;
}

export async function getConversations(communityId: string): Promise<ConversationSummary[]> {
  return apiFetch(`/dm/${communityId}/conversations`);
}

export async function createConversation(
  communityId: string,
  otherUserId: string,
): Promise<{ id: string }> {
  return apiFetch(`/dm/${communityId}/conversations`, {
    method: 'POST',
    body: JSON.stringify({ otherUserId }),
  });
}

export async function getMessages(
  conversationId: string,
  page?: number,
  limit?: number,
): Promise<MessagesResponse> {
  const params = new URLSearchParams();
  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiFetch(`/dm/conversations/${conversationId}/messages${qs}`);
}

export async function sendDirectMessage(
  conversationId: string,
  body: string,
  fileUrl?: string,
): Promise<DirectMessage> {
  return apiFetch(`/dm/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body, fileUrl }),
  });
}

export async function markConversationRead(conversationId: string): Promise<void> {
  return apiFetch(`/dm/conversations/${conversationId}/read`, { method: 'PATCH' });
}
