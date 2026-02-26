'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  Notification,
} from '@/lib/notifications';
import { getToken } from '@/lib/auth';

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

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const result = await getNotifications({ limit: 10 });
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch {
      // not logged in or error
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Listen for real-time notifications via WebSocket
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // We listen through the community socket namespace which the user is already connected to
    // The notification:new event is pushed to the user:{userId} room
    const handleNewNotification = () => {
      fetchNotifications();
    };

    // Listen for custom event on window (dispatched from useCommunitySocket)
    window.addEventListener('notification:new', handleNewNotification);
    return () => window.removeEventListener('notification:new', handleNewNotification);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await markNotificationRead(notif.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (notif.linkUrl) router.push(notif.linkUrl);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-[#F3F4F6] transition-colors"
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#F3F4F6] z-50 max-h-[400px] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6]">
            <h3 className="font-semibold text-sm text-[#1F2937]">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-[#0D9488] hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => { setOpen(false); router.push('/notifications'); }}
                className="text-xs text-[#6B7280] hover:text-[#1F2937]"
              >
                View all
              </button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#6B7280]">
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left px-4 py-3 hover:bg-[#F3F4F6] transition-colors flex gap-3 items-start ${
                    !notif.isRead ? 'bg-teal-50/30' : ''
                  }`}
                >
                  <span className="text-sm flex-shrink-0 w-6 text-center">
                    {TYPE_ICONS[notif.type] ?? '🔔'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight ${!notif.isRead ? 'font-semibold text-[#1F2937]' : 'text-[#6B7280]'}`}>
                      {notif.title}
                    </p>
                    {notif.body && (
                      <p className="text-xs text-[#6B7280] mt-0.5 truncate">{notif.body}</p>
                    )}
                  </div>
                  <span className="text-xs text-[#6B7280] flex-shrink-0">
                    {formatTime(notif.createdAt)}
                  </span>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#0D9488] flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
