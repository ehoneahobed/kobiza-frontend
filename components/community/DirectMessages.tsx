'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  getConversations,
  createConversation,
  getMessages,
  sendDirectMessage,
  markConversationRead,
  ConversationSummary,
  DirectMessage,
} from '@/lib/dm';
import { searchMembers, MentionSuggestion } from '@/lib/community';

export default function DirectMessages({
  communityId,
  currentUserId,
  targetUserId,
  incomingDm,
  onIncomingDmProcessed,
  onClose,
}: {
  communityId: string;
  currentUserId: string;
  targetUserId?: string;
  incomingDm?: { conversationId: string; message: any } | null;
  onIncomingDmProcessed?: () => void;
  onClose: () => void;
}) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Compose / search state
  const [showCompose, setShowCompose] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MentionSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const convos = await getConversations(communityId);
      setConversations(convos);
      return convos;
    } catch {
      return [];
    }
  }, [communityId]);

  useEffect(() => {
    setLoading(true);
    loadConversations().then(async (convos) => {
      // If targetUserId is set, open or create conversation with them
      if (targetUserId) {
        const existing = convos.find((c) => c.otherUser.id === targetUserId);
        if (existing) {
          setActiveConversationId(existing.id);
        } else {
          try {
            const newConvo = await createConversation(communityId, targetUserId);
            setActiveConversationId(newConvo.id);
            await loadConversations();
          } catch {
            // user may have DMs disabled
          }
        }
      }
      setLoading(false);
    });
  }, [communityId, targetUserId, loadConversations]);

  useEffect(() => {
    if (!activeConversationId) return;
    getMessages(activeConversationId).then((result) => {
      setMessages(result.messages);
      markConversationRead(activeConversationId).catch(() => {});
    });
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Process incoming DM from WebSocket
  useEffect(() => {
    if (!incomingDm) return;

    if (incomingDm.conversationId === activeConversationId) {
      // Active conversation — append message with dedup
      setMessages((prev) => {
        if (prev.some((m) => m.id === incomingDm.message.id)) return prev;
        return [...prev, incomingDm.message];
      });
      markConversationRead(incomingDm.conversationId).catch(() => {});
    } else {
      // Different conversation — reload list to show unread indicator
      loadConversations();
    }

    onIncomingDmProcessed?.();
  }, [incomingDm, activeConversationId, loadConversations, onIncomingDmProcessed]);

  // Reset compose state when opening a conversation
  useEffect(() => {
    if (activeConversationId) {
      setShowCompose(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [activeConversationId]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchMembers(communityId, query.trim());
        setSearchResults(results.filter((m) => m.id !== currentUserId));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelectUser = async (userId: string) => {
    setShowCompose(false);
    setSearchQuery('');
    setSearchResults([]);

    // Check if we already have a conversation with this user
    const existing = conversations.find((c) => c.otherUser.id === userId);
    if (existing) {
      setActiveConversationId(existing.id);
      return;
    }

    try {
      const newConvo = await createConversation(communityId, userId);
      setActiveConversationId(newConvo.id);
      await loadConversations();
    } catch {
      // user may have DMs disabled
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversationId) return;
    setSending(true);
    try {
      const msg = await sendDirectMessage(activeConversationId, messageText.trim());
      setMessages((prev) => [...prev, msg]);
      setMessageText('');
    } finally {
      setSending(false);
    }
  };

  const activeConvo = conversations.find((c) => c.id === activeConversationId);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-[#F3F4F6]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6]">
          {activeConversationId && activeConvo ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveConversationId(null)}
                className="text-[#6B7280] hover:text-[#1F2937]"
              >
                ←
              </button>
              <div className="w-8 h-8 rounded-full bg-[#0D9488]/10 flex items-center justify-center text-xs font-semibold text-[#0D9488]">
                {activeConvo.otherUser.avatarUrl ? (
                  <img src={activeConvo.otherUser.avatarUrl} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  activeConvo.otherUser.name.charAt(0).toUpperCase()
                )}
              </div>
              <p className="font-semibold text-sm text-[#1F2937]">{activeConvo.otherUser.name}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-[#1F2937]">Messages</p>
              <button
                onClick={() => setShowCompose((v) => !v)}
                className="w-6 h-6 rounded-full bg-[#0D9488] text-white text-sm font-bold flex items-center justify-center hover:bg-[#0D9488]/80 transition-colors"
                title="New message"
              >
                +
              </button>
            </div>
          )}
          <button onClick={onClose} className="text-[#6B7280] hover:text-[#1F2937] text-xl leading-none">
            ×
          </button>
        </div>

        {/* Compose search panel */}
        {showCompose && !activeConversationId && (
          <div className="border-b border-[#F3F4F6] px-4 py-3">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search members..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E7EB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
            {searching && (
              <div className="flex justify-center py-3">
                <div className="w-5 h-5 border-3 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!searching && searchQuery.trim() && searchResults.length === 0 && (
              <p className="text-xs text-[#6B7280] text-center py-3">No members found</p>
            )}
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto">
                {searchResults.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleSelectUser(member.id)}
                    className="w-full text-left px-2 py-2 hover:bg-[#F3F4F6] rounded-lg transition-colors flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#0D9488]/10 flex items-center justify-center text-xs font-semibold text-[#0D9488] flex-shrink-0">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        member.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <p className="text-sm text-[#1F2937]">{member.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !activeConversationId ? (
          // Conversation list
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#6B7280]">
                No conversations yet. Click &quot;Chat&quot; on a member or use the <strong>+</strong> button to start.
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-[#F3F4F6] transition-colors flex items-center gap-3 ${
                    conv.hasUnread ? 'bg-teal-50/30' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#0D9488]/10 flex items-center justify-center text-sm font-semibold text-[#0D9488] flex-shrink-0">
                    {conv.otherUser.avatarUrl ? (
                      <img src={conv.otherUser.avatarUrl} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      conv.otherUser.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm ${conv.hasUnread ? 'font-semibold text-[#1F2937]' : 'text-[#1F2937]'}`}>
                        {conv.otherUser.name}
                      </p>
                      {conv.hasUnread && <span className="w-2 h-2 rounded-full bg-[#0D9488]" />}
                    </div>
                    {conv.lastMessage && (
                      <p className="text-xs text-[#6B7280] truncate mt-0.5">
                        {conv.lastMessage.isOwn ? 'You: ' : ''}{conv.lastMessage.body}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          // Message thread
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg) => {
                const isOwn = msg.senderId === currentUserId;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                        isOwn
                          ? 'bg-[#0D9488] text-white'
                          : 'bg-[#F3F4F6] text-[#1F2937]'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                      <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/60' : 'text-[#6B7280]'}`}>
                        {formatTime(msg.sentAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="border-t border-[#F3F4F6] px-4 py-3 flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#F3F4F6] bg-[#F3F4F6] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!messageText.trim() || sending}
                className="px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-semibold disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
