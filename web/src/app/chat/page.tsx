"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSignalRChat } from "@/hooks/useSignalRChat";
import { useRouter } from "next/navigation";
import { createChatToken, createOrJoinChatChannel, sendChatMessage, searchUsers, getFollowing, getChatHistory, editChatMessage, deleteChatMessage, type UserSearchDTO } from "../api";
import { 
  PaperAirplaneIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
  PhoneIcon,
  VideoCameraIcon,
  ArrowLeftIcon,
  UserPlusIcon
} from "@heroicons/react/24/outline";

type ChatMessage = { 
  id: string; 
  text: string; 
  userId: string; 
  createdAt: string;
  username?: string;
  replyToMessageId?: string | null;
  reactions?: Record<string, string[]>;
};

type ChatContact = {
  id: string;
  name: string;
  avatar: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
  isFollowing?: boolean;
};

export default function ChatPage() {
  const router = useRouter();
  const [channelType, setChannelType] = useState("messaging");
  const [channelId, setChannelId] = useState("");
  const [memberIds, setMemberIds] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchDTO[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const restoredOnceRef = useRef(false);

  function toNumericId(id: string | null | undefined): number | null {
    if (!id) return null;
    const n = Number(id);
    if (!Number.isNaN(n) && Number.isFinite(n)) return Math.trunc(n);
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) || 1;
  }

  const currentUserId = useMemo(() => {
    if (typeof window === 'undefined') return "";
    return localStorage.getItem('userId') || "";
  }, []);

  const chat = useSignalRChat(currentUserId);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const [emojiMenuForId, setEmojiMenuForId] = useState<string | null>(null);
  const REACTIONS = ["👍","❤️","😂","🎉","👏","😮","😢","🔥","✅","❌","👌","😁","🙏","🤔","😎" ,"💖", "🍑", "🍆", "🍒"];

  // Load friends/following users
  useEffect(() => {
    async function loadContacts() {
      if (!currentUserId) return;
      try {
        const following = await getFollowing(currentUserId, 1, 50);
        const contactsData: ChatContact[] = following.map(user => ({
          id: user.id,
          name: user.username,
          avatar: user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username)}`,
          lastMessage: "Start a conversation!",
          lastMessageTime: "",
          unreadCount: 0,
          isOnline: false,
          isFollowing: true
        }));
        setContacts(contactsData);
      } catch (error) {
        console.error('Failed to load contacts:', error);
      }
    }
    loadContacts();
  }, [currentUserId]);

  // Restore last selected conversation and cached messages after contacts load
  useEffect(() => {
    if (restoredOnceRef.current) return;
    if (!currentUserId) return;
    if (!contacts || contacts.length === 0) return;
    const savedId = typeof window !== 'undefined' ? localStorage.getItem('chatSelectedContactId') : null;
    if (savedId) {
      const found = contacts.find(c => c.id === savedId);
      if (found) {
        restoredOnceRef.current = true;
        // Load cached messages immediately for better UX
        try {
          const cacheKey = `chatHistory:${currentUserId}:${savedId}`;
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached) as ChatMessage[];
            if (Array.isArray(parsed)) setMessages(parsed);
          }
        } catch {}
        handleContactSelect(found);
      }
    }
  }, [contacts, currentUserId]);

  // Search users
  useEffect(() => {
    async function searchUsersByName() {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchUsers(searchQuery, 1, 10);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Failed to search users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }

    const timeoutId = setTimeout(searchUsersByName, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) router.push('/login');
  }, [router]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  // Subscribe to server pushes
  useEffect(() => {
    const offMsg = chat.onReceiveMessage((payload: any, username?: string) => {
      // Server sends either: (userId, messageText) or ({ senderId, text }, username)
      const nowIso = new Date().toISOString();
      const text = typeof payload === 'string' ? payload : (payload?.text ?? payload?.message ?? '');
      const sender = typeof payload === 'string' ? (username || 'other') : (payload?.senderId || username || 'other');
      const id = typeof payload === 'object' && payload?.id ? String(payload.id) : crypto.randomUUID();
      const replyToMessageId = typeof payload === 'object' && payload?.replyToMessageId ? String(payload.replyToMessageId) : null;
      setMessages(prev => {
        const next = [...prev, {
          id,
        text,
        userId: sender,
          createdAt: nowIso,
          replyToMessageId
        }];
        // Persist to localStorage per-conversation
        try {
          const peerId = selectedContact?.id;
          if (currentUserId && peerId) {
            const cacheKey = `chatHistory:${currentUserId}:${peerId}`;
            localStorage.setItem(cacheKey, JSON.stringify(next));
          }
        } catch {}
        return next;
      });
    });
    const offUsers = chat.onReceiveActiveUsers((ids) => {
      setContacts(prev => prev.map(c => ({ ...c, isOnline: ids.includes(c.id) })));
    });
    const offTyping = chat.onTyping(({ userId, isTyping }) => {
      if (userId === selectedContact?.id) {
        setIsTyping(isTyping);
      }
    });
    const offRead = chat.onMessagesRead(({ byUserId, messageIds }) => {
      // Could update UI to show read ticks per message id (omitted for brevity)
    });
    const offReact = chat.onMessageReactionUpdated(({ id, userId, emoji, removed }) => {
      setMessages(prev => prev.map(m => {
        if (m.id !== id) return m;
        const reactions = { ...(m.reactions || {}) };
        const current = new Set(reactions[emoji] || []);
        if (removed) {
          current.delete(userId);
        } else {
          current.add(userId);
        }
        reactions[emoji] = Array.from(current);
        return { ...m, reactions };
      }));
    });
    return () => {
      offMsg?.();
      offUsers?.();
      offTyping?.();
      offRead?.();
      offReact?.();
    };
  }, [chat]);

  useEffect(() => {
    if (selectedContact) {
      setShowSidebar(false);
    }
  }, [selectedContact]);

  async function handleSetupChannel() {
    try {
      setLoading(true);
      setError(null);
      if (!currentUserId) throw new Error('Missing current user');

      await createChatToken(currentUserId, 60);

      const parsedMembers = memberIds
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      await createOrJoinChatChannel({
        channelType: channelType || 'messaging',
        channelId: channelId || `${[currentUserId, ...parsedMembers].sort().join('_')}`,
        createdByUserId: currentUserId,
        memberIds: parsedMembers,
        customData: { title: 'Wishlist Chat' }
      });

      setMessages(prev => prev.length ? prev : [{
        id: 'welcome',
        text: 'Channel is ready. Start chatting!',
        userId: 'system',
        createdAt: new Date().toISOString()
      }]);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to setup channel');
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    try {
      if (!input.trim()) return;
      if (!currentUserId) return;
      if (editingId) {
        const newText = input.trim();
        setInput("");
        setEditingId(null);
        // Optimistic update
        setMessages(prev => prev.map(m => m.id === editingId ? { ...m, text: newText } : m));
        try {
          await editChatMessage(editingId, newText);
        } catch {}
        return;
      }
      const id = crypto.randomUUID();
      const text = input.trim();
      setInput("");
      setMessages(prev => {
        const next = [...prev, { 
          id, 
          text, 
          userId: currentUserId, 
          createdAt: new Date().toISOString(),
          username: "You",
          replyToMessageId: replyTo?.id ?? null
        }];
        try {
          const peerId = selectedContact?.id;
          if (currentUserId && peerId) {
            const cacheKey = `chatHistory:${currentUserId}:${peerId}`;
            localStorage.setItem(cacheKey, JSON.stringify(next));
          }
        } catch {}
        return next;
      });
      if (selectedContact) {
        const targetId = selectedContact.id;
        if (targetId && typeof targetId === 'string') {
          // Prefer meta so replyTo is included server-side
          await chat.sendToUserWithMeta(targetId, text, replyTo?.id ?? undefined, id);
        } else {
          throw new Error('Invalid target user id');
        }
      }
      setReplyTo(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to send message');
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
    if (selectedContact?.id) {
      chat.startTyping(selectedContact.id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (selectedContact?.id) chat.stopTyping(selectedContact.id);
      }, 1200);
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleContactSelect = (contact: ChatContact) => {
    setSelectedContact(contact);
    setShowSearchResults(false);
    setSearchQuery("");
    try { localStorage.setItem('chatSelectedContactId', contact.id); } catch {}
    // add to active users list and load persisted history
    (async () => {
      try {
        const cid = await chat.getConnectionId();
        const uid = currentUserId;
        if (cid && uid) await chat.addUser(uid, cid);
      } catch {}
      try {
        if (currentUserId && contact?.id) {
          const history = await getChatHistory(currentUserId, contact.id, 0, 50);
          const fromServer = history.map(m => ({
            id: m.id,
            text: m.text,
            userId: m.senderUserId,
            createdAt: m.sentAt,
            replyToMessageId: (m as any).replyToMessageId ?? null,
            reactions: (m as any).reactions || {}
          }));
          setMessages(fromServer);
          try {
            const cacheKey = `chatHistory:${currentUserId}:${contact.id}`;
            localStorage.setItem(cacheKey, JSON.stringify(fromServer));
          } catch {}
        } else {
          setMessages([]);
        }
      } catch (e) {
        // If history fails, keep current messages array unchanged
      }
    })();
  };

  function quotePreview() {
    if (!replyTo) return null;
    return (
      <div className="mb-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-xs flex items-center justify-between">
        <span className="truncate max-w-[80%]">Replying to: {replyTo.text}</span>
        <button onClick={() => setReplyTo(null)} className="ml-2 text-indigo-600 dark:text-indigo-300">Cancel</button>
      </div>
    );
  }

  const handleSearchResultSelect = (user: UserSearchDTO) => {
    const contact: ChatContact = {
      id: user.id,
      name: user.username,
      avatar: user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username)}`,
      lastMessage: "Start a conversation!",
      lastMessageTime: "",
      unreadCount: 0,
      isOnline: false,
      isFollowing: user.isFollowing
    };
    setSelectedContact(contact);
    setShowSearchResults(false);
    setSearchQuery("");
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-80' : 'w-0'} transition-all duration-300 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h1>
            <button className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/40 transition-colors">
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="p-3 bg-gray-50 dark:bg-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Results</h3>
            </div>
            {searchResults.map((user) => (
              <div
                key={user.id}
                onClick={() => handleSearchResultSelect(user)}
                className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-600"
              >
                <img
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username)}`}
                  alt={user.username}
                  className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-600"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white">{user.username}</h3>
                    {!user.isFollowing && (
                      <button className="p-1 rounded-full bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/40 transition-colors">
                        <UserPlusIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user.isFollowing ? 'Following' : 'Not following'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlusIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">No contacts yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Search for users to start conversations</p>
            </div>
          ) : (
            <>
              <div className="p-3 bg-gray-50 dark:bg-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Contacts</h3>
              </div>
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => handleContactSelect(contact)}
                  className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700"
                >
                  <div className="relative">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-600"
                    />
                    {contact.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                    )}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{contact.name}</h3>
                      {contact.lastMessageTime && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">{contact.lastMessageTime}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{contact.lastMessage}</p>
                  </div>
                  {(contact.unreadCount ?? 0) > 0 && (
                    <div className="ml-2 w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">
                      {contact.unreadCount}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="mr-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <div className="relative">
                    <img
                      src={selectedContact.avatar}
                      alt={selectedContact.name}
                      className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-600"
                    />
                    {selectedContact.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                    )}
                  </div>
                  <div className="ml-3">
                    <h2 className="font-semibold text-gray-900 dark:text-white">{selectedContact.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedContact.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <PhoneIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <VideoCameraIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <EllipsisHorizontalIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={listRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900"
            >
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PaperAirplaneIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p>No messages yet</p>
                  <p className="text-sm">Start a conversation with {selectedContact.name}!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.userId === currentUserId ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${message.userId === currentUserId ? 'order-2' : 'order-1'}`}>
                      {message.replyToMessageId && (
                        <div className="mb-1 text-xs text-gray-500 dark:text-gray-400 italic">
                          Replying to...
                        </div>
                      )}
                      {message.userId !== currentUserId && (
                        <div className="flex items-center mb-1">
                          <img
                            src={selectedContact.avatar}
                            alt={selectedContact.name}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {message.userId === 'system' ? 'System' : selectedContact.name}
                          </span>
                        </div>
                      )}
                      <div
                        className={`px-4 py-3 rounded-2xl text-sm ${
                          message.userId === currentUserId
                            ? 'bg-indigo-600 text-white rounded-br-md'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-md'
                        }`}
                      >
                        <p>{message.text}</p>
                        {message.reactions && Object.keys(message.reactions).length > 0 && (
                          <div className="mt-1 flex gap-2 text-xs">
                            {Object.entries(message.reactions).map(([emoji, users]) => (
                              users.length > 0 ? (
                                <span key={emoji} className={`px-2 py-0.5 rounded-full border ${message.userId === currentUserId ? 'border-indigo-300 text-indigo-100' : 'border-gray-300 text-gray-600 dark:text-gray-300'}`}>
                                  {emoji} {users.length}
                                </span>
                              ) : null
                            ))}
                          </div>
                        )}
                        <p className={`text-xs mt-1 ${
                          message.userId === currentUserId 
                            ? 'text-indigo-200' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formatTime(message.createdAt)}
                        </p>
                        <div className="mt-2 flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity relative">
                          {/* Reactions dropdown */}
                          <button onClick={() => setEmojiMenuForId(emojiMenuForId === message.id ? null : message.id)} className="text-xs cursor-pointer px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600">
                            😊 React
                          </button>
                          {emojiMenuForId === message.id && (
                            <div className={`absolute z-10 bottom-full mb-2 ${message.userId === currentUserId ? 'right-0' : 'left-0'} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-2 grid grid-cols-5 gap-1`}
                              onMouseLeave={() => setEmojiMenuForId(null)}
                            >
                              {REACTIONS.map(em => (
                                <button
                                  key={em}
                                  onClick={async () => { try { await chat.reactToMessage(message.id, em); } finally { setEmojiMenuForId(null); } }}
                                  className="px-2 py-1 text-base hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                  title={em}
                                >
                                  {em}
                                </button>
                              ))}
                            </div>
                          )}
                          <span className="mx-1 text-gray-400">|</span>
                          <button onClick={() => setReplyTo(message)} className="text-xs text-indigo-600 dark:text-indigo-300">Reply</button>
                          {message.userId === currentUserId && (
                            <>
                              <button onClick={() => { setEditingId(message.id); setInput(message.text); inputRef.current?.focus(); }} className="text-xs text-gray-600 dark:text-gray-300">Edit</button>
                              <button onClick={async () => {
                                try {
                                  await deleteChatMessage(message.id);
                                  setMessages(prev => prev.filter(m => m.id !== message.id));
                                  const peerId = selectedContact?.id;
                                  if (currentUserId && peerId) {
                                    const cacheKey = `chatHistory:${currentUserId}:${peerId}`;
                                    localStorage.setItem(cacheKey, JSON.stringify(prev.filter(m => m.id !== message.id)));
                                  }
                                } catch {}
                              }} className="text-xs text-red-600">Delete</button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center space-x-3">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onChange={onInputChange}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                  className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
              {isTyping && (
                <div className="px-4 pt-2 text-xs text-gray-500 dark:text-gray-400">{selectedContact?.name} is typing...</div>
              )}
              {quotePreview()}
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <PaperAirplaneIcon className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Chat</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Search for users or select a contact to start messaging</p>
              <button
                onClick={() => setShowSidebar(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Open Conversations
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => setError(null)}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


