'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  Notification,
} from '@/lib/notifications';

const TYPE_ICONS: Record<string, string> = {
  MENTION: '@',
  REPLY: '💬',
  ROLE_CHANGE: '🛡',
  EVENT_REMINDER: '📅',
  LIKE: '❤',
  NEW_POST: '📝',
  DM: '✉',
  COACHING_MESSAGE: '🎯',
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async (p: number, append = false) => {
    if (!append) setLoading(true);
    try {
      const result = await getNotifications({ page: p, limit: 20 });
      if (append) {
        setNotifications((prev) => [...prev, ...result.notifications]);
      } else {
        setNotifications(result.notifications);
      }
      setHasMore(result.hasMore);
      setPage(result.page);
      setUnreadCount(result.unreadCount);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load(1);
  }, [load]);

  const handleClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await markNotificationRead(notif.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (notif.linkUrl) router.push(notif.linkUrl);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id).catch(() => {});
    const wasUnread = notifications.find((n) => n.id === id && !n.isRead);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-[#6B7280] mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm font-medium text-[#0D9488] hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-4xl mb-3">🔔</div>
          <p className="font-semibold text-[#1F2937]">No notifications</p>
          <p className="text-sm text-[#6B7280] mt-1">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-[#F3F4F6]">
          {notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`w-full text-left px-5 py-4 hover:bg-[#F3F4F6] transition-colors flex gap-4 items-start group ${
                !notif.isRead ? 'bg-teal-50/30' : ''
              }`}
            >
              <span className="text-base flex-shrink-0 w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                {TYPE_ICONS[notif.type] ?? '🔔'}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${!notif.isRead ? 'font-semibold text-[#1F2937]' : 'text-[#1F2937]'}`}>
                  {notif.title}
                </p>
                {notif.body && (
                  <p className="text-sm text-[#6B7280] mt-0.5">{notif.body}</p>
                )}
                <p className="text-xs text-[#6B7280] mt-1">{formatDate(notif.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!notif.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488]" />
                )}
                <button
                  onClick={(e) => handleDelete(e, notif.id)}
                  className="text-[#6B7280] hover:text-[#EF4444] opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                  title="Delete"
                >
                  ×
                </button>
              </div>
            </button>
          ))}
        </div>
      )}

      {hasMore && (
        <button
          onClick={() => load(page + 1, true)}
          className="w-full mt-4 py-3 rounded-xl bg-white shadow-sm text-sm font-medium text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F3F4F6] transition-colors"
        >
          Load more
        </button>
      )}
    </div>
  );
}
