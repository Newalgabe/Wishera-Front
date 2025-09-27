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
  // Conversation management state
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({});
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
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

  // Get current conversation messages
  const currentMessages = currentConversationId ? conversations[currentConversationId] || [] : [];

  // Helper functions for conversation management
  const getConversationId = (contactId: string) => {
    return `conv_${currentUserId}_${contactId}`;
  };

  const saveConversationToCache = (conversationId: string, messages: ChatMessage[]) => {
    try {
      localStorage.setItem(`chatHistory:${conversationId}`, JSON.stringify(messages));
    } catch (error) {
      console.warn('Failed to save conversation to cache:', error);
    }
  };

  const loadConversationFromCache = (conversationId: string): ChatMessage[] => {
    try {
      const cached = localStorage.getItem(`chatHistory:${conversationId}`);
      if (cached) {
        const parsed = JSON.parse(cached) as ChatMessage[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) {
      console.warn('Failed to load conversation from cache:', error);
    }
    return [];
  };

  const updateConversationMessages = (conversationId: string, messages: ChatMessage[]) => {
    setConversations(prev => ({
      ...prev,
      [conversationId]: messages
    }));
    saveConversationToCache(conversationId, messages);
  };

  const addMessageToConversation = (conversationId: string, message: ChatMessage) => {
    setConversations(prev => {
      const currentMessages = prev[conversationId] || [];
      const newMessages = [...currentMessages, message];
      saveConversationToCache(conversationId, newMessages);
      return {
        ...prev,
        [conversationId]: newMessages
      };
    });
  };

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
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [emojiMenuForId, setEmojiMenuForId] = useState<string | null>(null);
  const REACTIONS = ["👍","❤️","😂","🎉","👏","😮","😢","🔥","✅","❌","👌","😁","🙏","🤔","😎" ,"💖", "🍑", "🍆", "🍒"];

  // Connection status indicator
  const getConnectionStatusColor = (state: string) => {
    switch (state) {
      case 'Connected': return 'bg-green-500';
      case 'Reconnecting': return 'bg-yellow-500';
      case 'Disconnected': return 'bg-gray-500';
      case 'Failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConnectionStatusText = (state: string) => {
    switch (state) {
      case 'Connected': return 'Connected';
      case 'Reconnecting': return 'Reconnecting...';
      case 'Disconnected': return 'Disconnected';
      case 'Failed': return 'Connection Failed';
      default: return 'Unknown';
    }
  };

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
            if (Array.isArray(parsed)) {
              const conversationId = getConversationId(savedId);
              updateConversationMessages(conversationId, parsed);
            }
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
  }, [currentMessages.length]);

  // Subscribe to server pushes
  useEffect(() => {
    const offMsg = chat.onReceiveMessage((payload: any, username?: string) => {
      // Server sends either: (userId, messageText) or ({ senderId, text }, username)
      const text = typeof payload === 'string' ? payload : (payload?.text ?? payload?.message ?? '');
      const sender = typeof payload === 'string' ? (username || 'other') : (payload?.senderId || username || 'other');
      const id = typeof payload === 'object' && payload?.id ? String(payload.id) : crypto.randomUUID();
      const replyToMessageId = typeof payload === 'object' && payload?.replyToMessageId ? String(payload.replyToMessageId) : null;
      
      // Use server timestamp if available, otherwise use current time
      const serverTimestamp = typeof payload === 'object' && payload?.sentAt 
        ? payload.sentAt 
        : typeof payload === 'object' && payload?.createdAt 
        ? payload.createdAt 
        : new Date().toISOString();
      
      // Debug: Log the timestamp data we're receiving
      if (typeof payload === 'object') {
        console.log('Message payload timestamp data:', {
          sentAt: payload.sentAt,
          createdAt: payload.createdAt,
          timestamp: payload.timestamp,
          date: payload.date,
          serverTimestamp
        });
      }
      
      const newMessage: ChatMessage = {
        id,
        text,
        userId: sender,
        createdAt: serverTimestamp,
        replyToMessageId
      };
      
      // Determine which conversation this message belongs to
      // If it's from the current selected contact, add to current conversation
      if (selectedContact && sender === selectedContact.id) {
        if (currentConversationId) {
          addMessageToConversation(currentConversationId, newMessage);
        }
      } else if (sender !== currentUserId) {
        // If it's from another contact, add to their conversation
        const senderConversationId = getConversationId(sender);
        addMessageToConversation(senderConversationId, newMessage);
        
        // Update the contact's last message in the sidebar
        setContacts(prev => prev.map(contact => 
          contact.id === sender 
            ? { ...contact, lastMessage: text, lastMessageTime: nowIso }
            : contact
        ));
      }
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
      // Update reactions in all conversations that contain this message
      setConversations(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(conversationId => {
          updated[conversationId] = updated[conversationId].map(m => {
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
          });
        });
        return updated;
      });
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

      // This is for channel setup, not individual conversations
      // We'll handle this differently if needed
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } }; message?: string };
      setError(error?.response?.data?.message || error?.message || 'Failed to setup channel');
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    try {
      if (!input.trim()) return;
      if (!currentUserId) return;
      
      // Check connection status before sending
      if (!chat.connected) {
        setError('Connection lost. Please wait for reconnection...');
        return;
      }
      
      if (editingId) {
        const newText = input.trim();
        setInput("");
        setEditingId(null);
        // Optimistic update
        if (currentConversationId) {
          setConversations(prev => ({
            ...prev,
            [currentConversationId]: prev[currentConversationId]?.map(m => 
              m.id === editingId ? { ...m, text: newText } : m
            ) || []
          }));
        }
        try {
          await editChatMessage(editingId, newText);
        } catch (error) {
          console.error('Failed to edit message:', error);
          setError('Failed to edit message. Please try again.');
        }
        return;
      }
      const id = crypto.randomUUID();
      const text = input.trim();
      setInput("");
      
      const newMessage: ChatMessage = {
        id, 
        text, 
        userId: currentUserId, 
        createdAt: new Date().toISOString(), // Client timestamp for immediate display
        username: "You",
        replyToMessageId: replyTo?.id ?? null
      };
      
      // Add message to current conversation
      if (currentConversationId) {
        addMessageToConversation(currentConversationId, newMessage);
      }
      if (selectedContact) {
        const targetId = selectedContact.id;
        if (targetId && typeof targetId === 'string') {
          // Prefer meta so replyTo is included server-side
          await chat.sendToUserWithMeta(targetId, text, replyTo?.id ?? undefined, id);
          
          // Update the message with server timestamp when we get confirmation
          // This will be handled by the message received callback
        } else {
          throw new Error('Invalid target user id');
        }
      }
      setReplyTo(null);
    } catch (e: unknown) {
      console.error('Send message error:', e);
      const error = e as { message?: string; response?: { data?: { message?: string } } };
      if (error?.message?.includes('Connection')) {
        setError('Connection lost. Message will be sent when connection is restored.');
      } else {
        setError(error?.response?.data?.message || error?.message || 'Failed to send message');
      }
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
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid time';
    }
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    // Show relative time for recent messages
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) { // Less than 24 hours
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      // For older messages, show actual time
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
  };

  const handleContactSelect = (contact: ChatContact) => {
    setSelectedContact(contact);
    setShowSearchResults(false);
    setSearchQuery("");
    
    const conversationId = getConversationId(contact.id);
    setCurrentConversationId(conversationId);
    
    try { 
      localStorage.setItem('chatSelectedContactId', contact.id); 
    } catch {}
    
    // Load conversation messages (from cache first, then server)
    const loadConversation = async () => {
      try {
        // First, try to load from cache for immediate display
        const cachedMessages = loadConversationFromCache(conversationId);
        if (cachedMessages.length > 0) {
          updateConversationMessages(conversationId, cachedMessages);
        }
        
        // Then load from server to get latest messages
        const cid = await chat.getConnectionId();
        const uid = currentUserId;
        if (cid && uid) await chat.addUser(uid, cid);
        
        if (currentUserId && contact?.id) {
          const history = await getChatHistory(currentUserId, contact.id, 0, 50);
          const fromServer = history.map(m => ({
            id: m.id,
            text: m.text,
            userId: m.senderUserId,
            createdAt: m.sentAt, // Use server timestamp
            replyToMessageId: (m as any).replyToMessageId ?? null,
            reactions: (m as any).reactions || {}
          }));
          
          // Update conversation with server messages
          updateConversationMessages(conversationId, fromServer);
        } else {
          updateConversationMessages(conversationId, []);
        }
      } catch (e: unknown) {
        console.warn('Failed to load chat history:', e);
        // If server load fails, keep cached messages
        if (conversations[conversationId]?.length === 0) {
          updateConversationMessages(conversationId, []);
        }
      }
    };
    
    loadConversation();
  };

  function quotePreview() {
    if (!replyTo) return null;
    return (
      <div className="mt-4 mx-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200/50 dark:border-indigo-700/50 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mr-3"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Replying to:</span>
          </div>
          <button 
            onClick={() => setReplyTo(null)} 
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 truncate">{replyTo.text}</p>
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
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 flex overflow-hidden">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-80' : 'w-0'} transition-all duration-300 ease-in-out bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col shadow-xl relative z-10 h-full overflow-hidden`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-indigo-500 to-purple-600">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Messages</h1>
              <p className="text-indigo-100 text-sm mt-1">Connect with your friends</p>
            </div>
            <button className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-200 hover:scale-105 shadow-lg">
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-0 bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-white/50 focus:outline-none transition-all duration-200 shadow-lg"
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800/50 dark:to-slate-800/50">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                Search Results
              </h3>
            </div>
            {searchResults.map((user) => (
              <div
                key={user.id}
                onClick={() => handleSearchResultSelect(user)}
                className="flex items-center p-4 hover:bg-white/60 dark:hover:bg-gray-700/60 cursor-pointer transition-all duration-200 hover:shadow-md border-b border-gray-100/50 dark:border-gray-600/50 group"
              >
                <div className="relative">
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username)}`}
                    alt={user.username}
                    className="w-12 h-12 rounded-2xl border-2 border-white dark:border-gray-600 shadow-lg group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{user.username}</h3>
                    {!user.isFollowing && (
                      <button className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg">
                        <UserPlusIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {user.isFollowing ? 'Following' : 'Not following'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {contacts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <UserPlusIcon className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No contacts yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Search for users to start conversations</p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-slate-800/50 border-b border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                  <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mr-2"></div>
                  Your Contacts
                </h3>
              </div>
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => handleContactSelect(contact)}
                  className={`flex items-center p-4 hover:bg-white/60 dark:hover:bg-gray-700/60 cursor-pointer transition-all duration-200 hover:shadow-md border-b border-gray-100/50 dark:border-gray-700/50 group ${
                    selectedContact?.id === contact.id 
                      ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-l-4 border-indigo-500' 
                      : ''
                  }`}
                >
                  <div className="relative">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-14 h-14 rounded-2xl border-2 border-white dark:border-gray-600 shadow-lg group-hover:scale-105 transition-transform duration-200"
                    />
                    {contact.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-800 shadow-lg">
                        <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{contact.name}</h3>
                      {contact.lastMessageTime && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{contact.lastMessageTime}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{contact.lastMessage}</p>
                  </div>
                  {(contact.unreadCount ?? 0) > 0 && (
                    <div className="ml-3 w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      {contact.unreadCount}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 relative z-0">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    onClick={() => {
                      setShowSidebar(true);
                      setSelectedContact(null);
                      setCurrentConversationId(null);
                      setInput("");
                      setReplyTo(null);
                      setEditingId(null);
                    }}
                    className="mr-4 p-3 rounded-2xl hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <div className="relative">
                    <img
                      src={selectedContact.avatar}
                      alt={selectedContact.name}
                      className="w-14 h-14 rounded-2xl border-2 border-white dark:border-gray-600 shadow-xl"
                    />
                    {selectedContact.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-800 shadow-lg">
                        <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedContact.name}</h2>
                    <div className="flex items-center mt-1 space-x-4">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${selectedContact.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          {selectedContact.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${getConnectionStatusColor(chat.connectionState)} ${chat.connectionState === 'Reconnecting' ? 'animate-pulse' : ''}`}></div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {getConnectionStatusText(chat.connectionState)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="p-3 rounded-2xl hover:bg-gradient-to-r hover:from-green-500 hover:to-emerald-600 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105 shadow-lg">
                    <PhoneIcon className="w-5 h-5" />
                  </button>
                  <button className="p-3 rounded-2xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-600 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105 shadow-lg">
                    <VideoCameraIcon className="w-5 h-5" />
                  </button>
                  <button className="p-3 rounded-2xl hover:bg-gray-100/80 dark:hover:bg-gray-700/80 text-gray-600 dark:text-gray-400 transition-all duration-200 hover:scale-105 shadow-lg">
                    <EllipsisHorizontalIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={listRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-transparent to-gray-50/30 dark:to-gray-900/30 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
            >
              {currentMessages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-12">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <PaperAirplaneIcon className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No messages yet</h3>
                  <p className="text-sm">Start a conversation with {selectedContact.name}!</p>
                </div>
              ) : (
                currentMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.userId === currentUserId ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div className={`max-w-[75%] ${message.userId === currentUserId ? 'order-2' : 'order-1'}`}>
                      {message.replyToMessageId && (
                        <div className="mb-2 text-xs text-gray-500 dark:text-gray-400 italic bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg">
                          Replying to...
                        </div>
                      )}
                      {message.userId !== currentUserId && (
                        <div className="flex items-center mb-2">
                          <img
                            src={selectedContact.avatar}
                            alt={selectedContact.name}
                            className="w-6 h-6 rounded-full mr-2 shadow-lg"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {message.userId === 'system' ? 'System' : selectedContact.name}
                          </span>
                        </div>
                      )}
                      <div
                        className={`px-6 py-4 rounded-3xl text-sm shadow-lg backdrop-blur-sm ${
                          message.userId === currentUserId
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-lg'
                            : 'bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white border border-gray-200/50 dark:border-gray-700/50 rounded-bl-lg'
                        }`}
                      >
                        <p className="leading-relaxed">{message.text}</p>
                        {message.reactions && Object.keys(message.reactions).length > 0 && (
                          <div className="mt-3 flex gap-2 text-xs">
                            {Object.entries(message.reactions).map(([emoji, users]) => (
                              users.length > 0 ? (
                                <span key={emoji} className={`px-3 py-1 rounded-full border shadow-sm ${message.userId === currentUserId ? 'border-indigo-300/50 text-indigo-100 bg-white/20' : 'border-gray-300/50 text-gray-600 dark:text-gray-300 bg-gray-100/50 dark:bg-gray-700/50'}`}>
                                  {emoji} {users.length}
                                </span>
                              ) : null
                            ))}
                          </div>
                        )}
                        <p className={`text-xs mt-3 ${
                          message.userId === currentUserId 
                            ? 'text-indigo-100' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formatTime(message.createdAt)}
                        </p>
                        <div className="mt-3 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-200 relative">
                          {/* Reactions dropdown */}
                          <button onClick={() => setEmojiMenuForId(emojiMenuForId === message.id ? null : message.id)} className="text-xs cursor-pointer px-3 py-1.5 rounded-full border border-gray-300/50 dark:border-gray-600/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200">
                            😊 React
                          </button>
                          {emojiMenuForId === message.id && (
                            <div className={`absolute z-20 bottom-full mb-2 ${message.userId === currentUserId ? 'right-0' : 'left-0'} bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-2xl p-3 grid grid-cols-5 gap-2`}
                              onMouseLeave={() => setEmojiMenuForId(null)}
                            >
                              {REACTIONS.map(em => (
                                <button
                                  key={em}
                                  onClick={async () => { try { await chat.reactToMessage(message.id, em); } finally { setEmojiMenuForId(null); } }}
                                  className="px-3 py-2 text-base hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 hover:scale-110"
                                  title={em}
                                >
                                  {em}
                                </button>
                              ))}
                            </div>
                          )}
                          <span className="mx-1 text-gray-400">|</span>
                          <button onClick={() => setReplyTo(message)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">Reply</button>
                          {message.userId === currentUserId && (
                            <>
                              <button onClick={() => { setEditingId(message.id); setInput(message.text); inputRef.current?.focus(); }} className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Edit</button>
                              <button onClick={async () => {
                                try {
                                  await deleteChatMessage(message.id);
                                  if (currentConversationId) {
                                    setConversations(prev => {
                                      const updatedMessages = prev[currentConversationId]?.filter(m => m.id !== message.id) || [];
                                      saveConversationToCache(currentConversationId, updatedMessages);
                                      return {
                                        ...prev,
                                        [currentConversationId]: updatedMessages
                                      };
                                    });
                                  }
                                } catch {}
                              }} className="text-xs text-red-600 hover:text-red-700 transition-colors">Delete</button>
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
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 p-6 shadow-xl">
              <div className="flex items-center space-x-4">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={onInputChange}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                  className="flex-1 px-6 py-4 rounded-3xl border-0 bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all duration-200 shadow-lg"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="p-4 rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-xl disabled:hover:scale-100"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
              {isTyping && (
                <div className="px-6 pt-3 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <div className="flex space-x-1 mr-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  {selectedContact?.name} is typing...
                </div>
              )}
              {quotePreview()}
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
            <div className="text-center max-w-md mx-auto px-6">
              <div className="w-32 h-32 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <PaperAirplaneIcon className="w-16 h-16 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Welcome to Chat</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg leading-relaxed">Search for users or select a contact to start messaging and connect with your friends</p>
              <button
                onClick={() => setShowSidebar(true)}
                className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-xl font-semibold"
              >
                Open Conversations
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Connection Status Notification */}
      {chat.connectionState === 'Reconnecting' && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-yellow-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-2xl shadow-lg flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Reconnecting...</span>
          </div>
        </div>
      )}

      {chat.connectionState === 'Failed' && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-2xl shadow-lg flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span className="text-sm font-medium">Connection Failed</span>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Oops! Something went wrong</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">{error}</p>
              <button
                onClick={() => setError(null)}
                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg font-semibold"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


