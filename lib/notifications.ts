import { apiFetch, API_URL } from './api';

export type NotificationType =
  | 'MENTION'
  | 'REPLY'
  | 'ROLE_CHANGE'
  | 'EVENT_REMINDER'
  | 'LIKE'
  | 'NEW_POST'
  | 'DM'
  | 'COACHING_MESSAGE';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl: string | null;
  isRead: boolean;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  hasMore: boolean;
  unreadCount: number;
}

export async function getNotifications(
  opts?: { page?: number; limit?: number; unreadOnly?: boolean },
): Promise<NotificationsResponse> {
  const params = new URLSearchParams();
  if (opts?.page) params.set('page', String(opts.page));
  if (opts?.limit) params.set('limit', String(opts.limit));
  if (opts?.unreadOnly) params.set('unreadOnly', 'true');
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiFetch(`/notifications${qs}`);
}

export async function markNotificationRead(id: string): Promise<void> {
  return apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead(): Promise<void> {
  return apiFetch('/notifications/read-all', { method: 'PATCH' });
}

export async function deleteNotification(id: string): Promise<void> {
  return apiFetch(`/notifications/${id}`, { method: 'DELETE' });
}

export async function subscribeToPush(subscription: PushSubscription): Promise<void> {
  const json = subscription.toJSON();
  return apiFetch('/notifications/push-subscribe', {
    method: 'POST',
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
    }),
  });
}

export async function unsubscribeFromPush(endpoint: string): Promise<void> {
  return apiFetch('/notifications/push-subscribe', {
    method: 'DELETE',
    body: JSON.stringify({ endpoint }),
  });
}

export async function getVapidPublicKey(): Promise<string> {
  const res = await fetch(`${API_URL}/api/notifications/vapid-public-key`);
  const data = await res.json();
  return data.key;
}
