'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMe, clearToken, AuthUser } from '@/lib/auth';
import {
  getAllConversations,
  getMessages,
  sendDirectMessage,
  markConversationRead,
  GlobalConversationSummary,
  DirectMessage,
} from '@/lib/dm';

// ── Nav items (same as home/page.tsx) ─────────────────────────────────────
const NAV = [
  { label: 'My Learning', href: '/home', icon: '\u229E' },
  { label: 'Messages', href: '/home/messages', icon: '\u2709' },
  { label: 'Explore', href: '/explore', icon: '\uD83D\uDD0D' },
  { label: 'Settings', href: '/home/settings', icon: '\u2699' },
];

function Sidebar({
  user,
  onLogout,
  collapsed,
  onToggle,
}: {
  user: AuthUser | null;
  onLogout: () => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`bg-[#1F2937] flex flex-col fixed inset-y-0 left-0 z-30 transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-56'
        } ${collapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}`}
      >
        <div className={`border-b border-white/10 flex items-center ${collapsed ? 'p-3 justify-center' : 'p-5 justify-between'}`}>
          <Link href="/home" className={collapsed ? 'text-lg font-bold text-[#0D9488]' : 'text-xl font-bold text-[#0D9488] block'}>
            {collapsed ? 'K' : 'Kobiza'}
          </Link>
          <button
            onClick={onToggle}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}>
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
                item.href === '/home/messages'
                  ? 'text-white bg-white/10'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              } ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!collapsed && item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          {user && (
            <div className={`flex items-center gap-2 py-2 mb-1 ${collapsed ? 'justify-center px-0' : 'px-3'}`}>
              <div className="w-7 h-7 rounded-full bg-[#0D9488]/20 flex items-center justify-center text-xs font-bold text-[#0D9488] flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {!collapsed && (
                <span className="text-xs text-white/60 truncate">{user.name}</span>
              )}
            </div>
          )}
          <button
            onClick={onLogout}
            className={`w-full text-left rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors ${
              collapsed ? 'px-2 py-2.5 text-center' : 'px-3 py-2.5'
            }`}
            title={collapsed ? 'Log out' : undefined}
          >
            {collapsed ? '\u21AA' : 'Log out'}
          </button>
        </div>
      </aside>
    </>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

function Avatar({ name, avatarUrl, size = 'md' }: { name: string; avatarUrl: string | null; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt={name} className={`${dim} rounded-full object-cover flex-shrink-0`} />
    );
  }
  return (
    <div className={`${dim} rounded-full bg-[#0D9488]/20 flex items-center justify-center font-bold text-[#0D9488] flex-shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarCollapsed((p) => !p), []);

  // Conversations
  const [conversations, setConversations] = useState<GlobalConversationSummary[]>([]);
  const [convoLoading, setConvoLoading] = useState(true);

  // Selected conversation + messages
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgBody, setMsgBody] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mobile: show thread view
  const [mobileShowThread, setMobileShowThread] = useState(false);

  // Auth check
  useEffect(() => {
    getMe()
      .then((u) => {
        if (u.role === 'CREATOR') { router.replace('/dashboard'); return; }
        setUser(u);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    setConvoLoading(true);
    getAllConversations()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setConvoLoading(false));
  }, [user]);

  // Load messages when conversation selected
  useEffect(() => {
    if (!selectedId) return;
    setMsgLoading(true);
    Promise.all([
      getMessages(selectedId),
      markConversationRead(selectedId),
    ])
      .then(([res]) => {
        setMessages(res.messages);
        // Clear unread badge locally
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedId ? { ...c, hasUnread: false } : c)),
        );
      })
      .catch(() => {})
      .finally(() => setMsgLoading(false));
  }, [selectedId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    setMobileShowThread(true);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !msgBody.trim() || sending) return;
    setSending(true);
    try {
      const msg = await sendDirectMessage(selectedId, msgBody.trim());
      setMessages((prev) => [...prev, msg]);
      setMsgBody('');
      // Update last message in list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? {
                ...c,
                lastMessage: { body: msg.body, sentAt: msg.sentAt, isOwn: true },
                updatedAt: msg.sentAt,
              }
            : c,
        ),
      );
    } catch {}
    setSending(false);
  };

  const handleLogout = () => { clearToken(); router.push('/login'); };

  const selectedConvo = conversations.find((c) => c.id === selectedId);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex">
      <Sidebar user={user} onLogout={handleLogout} collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      <main className={`flex-1 min-w-0 transition-all duration-200 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-56'} flex flex-col h-screen`}>
        {/* Top bar */}
        <div className="bg-white border-b border-[#F3F4F6] px-4 sm:px-6 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-[#1F2937]">Messages</h1>
        </div>

        {/* Two-panel inbox */}
        <div className="flex-1 flex min-h-0">
          {/* ── Conversation list ── */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-[#E5E7EB] bg-white flex flex-col ${
              mobileShowThread ? 'hidden md:flex' : 'flex'
            }`}
          >
            {convoLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div>
                  <div className="text-4xl mb-3">{'\u2709'}</div>
                  <p className="font-semibold text-[#1F2937] mb-1">No messages yet</p>
                  <p className="text-sm text-[#6B7280]">
                    Start a conversation from a community&apos;s Members tab.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectConversation(c.id)}
                    className={`w-full text-left px-4 py-3 border-b border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors flex items-start gap-3 ${
                      selectedId === c.id ? 'bg-[#0D9488]/5' : ''
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar name={c.otherUser.name} avatarUrl={c.otherUser.avatarUrl} />
                      {c.hasUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#0D9488] rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm truncate ${c.hasUnread ? 'font-bold text-[#1F2937]' : 'font-medium text-[#1F2937]'}`}>
                          {c.otherUser.name}
                        </span>
                        {c.lastMessage && (
                          <span className="text-xs text-[#9CA3AF] flex-shrink-0">
                            {timeAgo(c.lastMessage.sentAt)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#0D9488] bg-[#0D9488]/10 px-1.5 py-0.5 rounded-full">
                        {c.communityName}
                      </span>
                      {c.lastMessage && (
                        <p className={`text-xs mt-1 truncate ${c.hasUnread ? 'text-[#1F2937] font-medium' : 'text-[#6B7280]'}`}>
                          {c.lastMessage.isOwn ? 'You: ' : ''}{c.lastMessage.body}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Message thread ── */}
          <div
            className={`flex-1 flex flex-col bg-[#F9FAFB] ${
              !mobileShowThread ? 'hidden md:flex' : 'flex'
            }`}
          >
            {!selectedId ? (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <div className="text-5xl mb-3">{'\uD83D\uDCAC'}</div>
                  <p className="text-[#6B7280] text-sm">Select a conversation to read messages</p>
                </div>
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div className="bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => setMobileShowThread(false)}
                    className="md:hidden p-1 rounded text-[#6B7280] hover:text-[#1F2937] transition-colors"
                    aria-label="Back to conversations"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {selectedConvo && (
                    <>
                      <Avatar name={selectedConvo.otherUser.name} avatarUrl={selectedConvo.otherUser.avatarUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="font-semibold text-[#1F2937] text-sm truncate">{selectedConvo.otherUser.name}</p>
                        <span className="text-xs text-[#0D9488]">{selectedConvo.communityName}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {msgLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-6 h-6 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-[#6B7280]">No messages yet. Say hello!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] ${isOwn ? 'order-1' : ''}`}>
                            <div
                              className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                isOwn
                                  ? 'bg-[#0D9488] text-white rounded-br-md'
                                  : 'bg-white text-[#1F2937] shadow-sm rounded-bl-md'
                              }`}
                            >
                              {msg.body}
                            </div>
                            <p className={`text-[10px] mt-1 ${isOwn ? 'text-right' : 'text-left'} text-[#9CA3AF]`}>
                              {timeAgo(msg.sentAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Send form */}
                <form onSubmit={handleSend} className="bg-white border-t border-[#E5E7EB] px-4 py-3 flex items-center gap-2 flex-shrink-0">
                  <input
                    type="text"
                    value={msgBody}
                    onChange={(e) => setMsgBody(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 text-sm bg-[#F3F4F6] border-0 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 placeholder:text-[#9CA3AF]"
                  />
                  <button
                    type="submit"
                    disabled={!msgBody.trim() || sending}
                    className="bg-[#0D9488] text-white p-2.5 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M3.105 2.29a.75.75 0 0 0-.826.95l1.414 4.925A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086L2.28 16.76a.75.75 0 0 0 .826.95l15.19-4.868a.75.75 0 0 0 0-1.424L3.105 2.289Z" />
                    </svg>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
