"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSignalRChat } from "@/hooks/useSignalRChat";
import { useRouter } from "next/navigation";
import { createChatToken, createOrJoinChatChannel, sendChatMessage, searchUsers, getFollowing, getChatHistory, editChatMessage, deleteChatMessage, getConversationWallpaper, setConversationWallpaper, getWallpaperCatalog, getConversationWallpaperPref, setConversationWallpaperPref, chatAssetUrl, uploadChatMedia, getPinnedMessages, pinChatMessage, unpinChatMessage, uploadCustomWallpaper, getCustomWallpapers, deleteCustomWallpaper, type WallpaperCatalogItemDTO, type UserSearchDTO, type PinnedMessageDTO, type PinScope, type CustomWallpaperUploadDTO } from "../api";
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
  const [showSidebar, setShowSidebar] = useState(false);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchDTO[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const restoredOnceRef = useRef(false);

  // Ensure sidebar is visible on desktop by default
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDesktop = window.innerWidth >= 768; // md breakpoint
      setShowSidebar(isDesktop);
    }
  }, []);

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
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [pinMenuForId, setPinMenuForId] = useState<string | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<{ url: string; mediaType: 'image' | 'video' | 'file'; name?: string } | null>(null);
  const REACTIONS = ["👍","❤️","😂","🎉","👏","😮","😢","🔥","✅","❌","👌","😁","🙏","🤔","😎" ,"💖", "🍑", "🍆", "🍒"];
  const convKeyPair = useCallback((a: string | null | undefined, b: string | null | undefined) => {
    const x = String(a || '').trim();
    const y = String(b || '').trim();
    return [x, y].sort().join(':');
  }, []);

  // Pinned messages state per conversation
  const [pinnedByConversation, setPinnedByConversation] = useState<Record<string, string[]>>({});
  const [serverPinsByConversation, setServerPinsByConversation] = useState<Record<string, PinnedMessageDTO[]>>({});
  const [showPinsPanel, setShowPinsPanel] = useState(false);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const getPinsStorageKey = useCallback((conversationId: string) => `chatPins:${conversationId}`, []);
  const loadPins = useCallback((conversationId: string): string[] => {
    try {
      const raw = localStorage.getItem(getPinsStorageKey(conversationId));
      if (!raw) return [];
      const ids = JSON.parse(raw);
      return Array.isArray(ids) ? ids : [];
    } catch { return []; }
  }, [getPinsStorageKey]);
  const savePins = useCallback((conversationId: string, ids: string[]) => {
    try { localStorage.setItem(getPinsStorageKey(conversationId), JSON.stringify(ids)); } catch {}
  }, [getPinsStorageKey]);
  const isPinned = useCallback((conversationId: string | null, messageId: string) => {
    if (!conversationId) return false;
    const ids = pinnedByConversation[conversationId] || [];
    return ids.includes(messageId);
  }, [pinnedByConversation]);
  const togglePin = useCallback((conversationId: string | null, messageId: string) => {
    if (!conversationId) return;
    setPinnedByConversation(prev => {
      const curr = prev[conversationId] || [];
      const next = curr.includes(messageId) ? curr.filter(id => id !== messageId) : [messageId, ...curr];
      savePins(conversationId, next);
      return { ...prev, [conversationId]: next };
    });
  }, [savePins]);

  const isGloballyPinned = useCallback((conversationId: string | null, messageId: string) => {
    if (!conversationId) return false;
    const arr = serverPinsByConversation[conversationId] || [];
    return arr.some(p => p.messageId === messageId);
  }, [serverPinsByConversation]);

  const handleServerPinToggle = useCallback(async (messageId: string) => {
    try {
      if (!currentConversationId || !currentUserId || !selectedContact?.id) return;
      const globallyPinned = isGloballyPinned(currentConversationId, messageId);
      const supported = typeof window !== 'undefined' ? localStorage.getItem('chat:pins:supported') : null;
      if (supported !== '0') {
        if (globallyPinned) {
          await unpinChatMessage({ me: currentUserId, peer: selectedContact.id, messageId, scope: 'global' });
        } else {
          await pinChatMessage({ me: currentUserId, peer: selectedContact.id, messageId, scope: 'global' });
        }
        const remote = await getPinnedMessages(currentUserId, selectedContact.id);
        setServerPinsByConversation(prev => ({ ...prev, [currentConversationId]: remote }));
      } else {
        // Fallback: update shared-local storage and notify peer via chat message hint
        const key = `chat:pins:global:${convKeyPair(currentUserId, selectedContact.id)}`;
        const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
        const ids: string[] = raw ? JSON.parse(raw) : [];
        const next = globallyPinned ? ids.filter(id => id !== messageId) : [messageId, ...ids.filter(id => id !== messageId)];
        if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(next));
        const convKey = convKeyPair(currentUserId, selectedContact.id);
        setServerPinsByConversation(prev => ({ ...prev, [convKey]: next.map((id, idx) => ({ id: `local-${idx}-${id}`, conversationId: convKey, messageId: id, scope: 'global' as PinScope, pinnedByUserId: currentUserId, createdAt: new Date().toISOString() })) }));
        // Notify peer silently (client-side protocol)
        try {
          // Send a minimal hint; receivers will ignore displaying it and update pins list
          await chat.sendToUser(selectedContact.id, `${globallyPinned ? '[[unpin]]' : '[[pin]]'}:${messageId}`);
        } catch {}
      }
      setShowPinsPanel(true);
    } catch (e) {
      console.warn('Failed to toggle server pin', e);
    } finally {
      setPinMenuForId(null);
    }
  }, [currentConversationId, currentUserId, selectedContact?.id, isGloballyPinned]);

  // Helpers for media rendering
  const getFilenameFromUrl = useCallback((url: string): string => {
    try {
      const u = new URL(url);
      const last = u.pathname.split('/').filter(Boolean).pop() || url;
      return decodeURIComponent(last);
    } catch {
      const parts = url.split('/');
      return decodeURIComponent(parts[parts.length - 1] || url);
    }
  }, []);

  const isCloudinaryUrl = useCallback((url: string): boolean => {
    try {
      const u = new URL(url);
      return /(^|\.)res\.cloudinary\.com$/i.test(u.hostname) || /cloudinary\.com/i.test(u.hostname);
    } catch { return false; }
  }, []);

  const looksLikeImageUrl = useCallback((url: string): boolean => {
    const lower = url.toLowerCase();
    return /(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.avif)(\?|#|$)/.test(lower) || (isCloudinaryUrl(url) && /\/image\//i.test(lower));
  }, [isCloudinaryUrl]);

  const looksLikeVideoUrl = useCallback((url: string): boolean => {
    const lower = url.toLowerCase();
    return /(\.mp4|\.webm|\.ogg)(\?|#|$)/.test(lower) || (isCloudinaryUrl(url) && /\/video\//i.test(lower));
  }, [isCloudinaryUrl]);

  const renderUrlAsMediaOrFilename = useCallback((url: string, compact?: boolean) => {
    const isImg = looksLikeImageUrl(url);
    const isVid = looksLikeVideoUrl(url);
    if (isImg) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-block">
          <img
            src={url}
            alt={getFilenameFromUrl(url) || 'image'}
            className={`${compact ? 'max-h-24' : 'max-w-full'} rounded-xl shadow-md`}
            loading="lazy"
          />
        </a>
      );
    }
    if (isVid) {
      return (
        <video
          src={url}
          controls
          preload="metadata"
          className={`${compact ? 'max-h-28' : 'max-w-full'} rounded-xl shadow-md`}
        />
      );
    }
    const filename = getFilenameFromUrl(url);
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="underline break-all">
        {filename || url}
      </a>
    );
  }, [getFilenameFromUrl, looksLikeImageUrl, looksLikeVideoUrl]);

  // Render message content: support markdown image ![...](url) and @url shorthand
  const renderMessageContent = useCallback((text: string, opts?: { compact?: boolean }) => {
    const mdImg = text.match(/!\[[^\]]*\]\((https?:[^)\s]+)\)/i);
    if (mdImg && mdImg[1]) {
      const url = mdImg[1];
      return renderUrlAsMediaOrFilename(url, opts?.compact);
    }
    // If the whole message is just a single URL, try to embed
    const singleUrl = text.trim().match(/^https?:[^\s]+$/i);
    if (singleUrl) {
      const url = singleUrl[0];
      return renderUrlAsMediaOrFilename(url, opts?.compact);
    }
    const atUrlMatch = text.trim().match(/^@\s*(https?:[^\s]+)$/i);
    if (atUrlMatch && atUrlMatch[1]) {
      const url = atUrlMatch[1];
      return renderUrlAsMediaOrFilename(url, opts?.compact);
    }
    // Linkify plain URLs in text minimally
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    if (urlRegex.test(text)) {
      const parts = text.split(urlRegex);
      return (
        <span>
          {parts.map((part, i) =>
            urlRegex.test(part) ? (
              <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline break-all">{getFilenameFromUrl(part) || part}</a>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </span>
      );
    }
    return <>{text}</>;
  }, [getFilenameFromUrl, renderUrlAsMediaOrFilename]);

  // Chat wallpaper state
  const DEFAULT_WALLPAPERS: string[] = useMemo(() => ([
    // A few tasteful, lightweight Unsplash patterns/textures
    'https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1200&auto=format&fit=crop', // paper
    'https://images.unsplash.com/photo-1520975922284-92da0b5c83e8?q=80&w=1200&auto=format&fit=crop', // gradient fabric
    'https://images.unsplash.com/photo-1504805572947-34fad45aed93?q=80&w=1200&auto=format&fit=crop', // abstract shapes
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1200&auto=format&fit=crop', // subtle waves
    'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?q=80&w=1200&auto=format&fit=crop', // soft triangles
  ]), []);
  const [wallpaper, setWallpaper] = useState<string | null>(null);
  const [wallpaperId, setWallpaperId] = useState<string | null>(null);
  const [opacity, setOpacity] = useState<number>(0.25);
  const [catalog, setCatalog] = useState<WallpaperCatalogItemDTO[] | null>(null);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const [showCustomWallpaperUpload, setShowCustomWallpaperUpload] = useState(false);
  const [customWallpaperFile, setCustomWallpaperFile] = useState<File | null>(null);
  const [customWallpaperName, setCustomWallpaperName] = useState('');
  const [customWallpaperDescription, setCustomWallpaperDescription] = useState('');
  const [customWallpaperCategory, setCustomWallpaperCategory] = useState('custom');
  const [customWallpaperSupportsDark, setCustomWallpaperSupportsDark] = useState(true);
  const [customWallpaperSupportsLight, setCustomWallpaperSupportsLight] = useState(true);
  const [uploadingWallpaper, setUploadingWallpaper] = useState(false);

  const getWallpaperKey = useCallback((me: string | null | undefined, peer: string | null | undefined) => {
    const a = (me || "").trim();
    const b = (peer || "").trim();
    return a && b ? `chatWallpaper:${a}:${b}` : null;
  }, []);

  const loadWallpaperForContact = useCallback((me: string | null | undefined, peer: string | null | undefined) => {
    try {
      const key = getWallpaperKey(me, peer);
      if (!key) return null;
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }, [getWallpaperKey]);

  const saveWallpaperForContact = useCallback((me: string | null | undefined, peer: string | null | undefined, url: string | null) => {
    try {
      const key = getWallpaperKey(me, peer);
      if (!key) return;
      if (url) localStorage.setItem(key, url);
      else localStorage.removeItem(key);
    } catch {}
  }, [getWallpaperKey]);

  const handleApplyWallpaper = async (id: string | null, url: string | null, nextOpacity?: number) => {
    if (nextOpacity !== undefined) setOpacity(nextOpacity);
    setWallpaperId(id);
    setWallpaper(url);
    saveWallpaperForContact(currentUserId, selectedContact?.id, url);
    try {
      if (currentUserId && selectedContact?.id) {
        await setConversationWallpaperPref({ me: currentUserId, peer: selectedContact.id, wallpaperId: id, opacity: nextOpacity ?? opacity });
      }
    } catch {}
  };

  const handleCustomWallpaperUpload = async () => {
    if (!customWallpaperFile || !currentUserId) return;
    
    setUploadingWallpaper(true);
    try {
      const result = await uploadCustomWallpaper(
        customWallpaperFile,
        currentUserId,
        customWallpaperName || undefined,
        customWallpaperDescription || undefined,
        customWallpaperCategory || undefined,
        customWallpaperSupportsDark,
        customWallpaperSupportsLight
      );
      
      // Refresh catalog to include the new wallpaper
      const updatedCatalog = await getWallpaperCatalog(currentUserId);
      setCatalog(updatedCatalog);
      
      // Reset form
      setCustomWallpaperFile(null);
      setCustomWallpaperName('');
      setCustomWallpaperDescription('');
      setCustomWallpaperCategory('custom');
      setCustomWallpaperSupportsDark(true);
      setCustomWallpaperSupportsLight(true);
      setShowCustomWallpaperUpload(false);
      
      // Auto-apply the new wallpaper
      await handleApplyWallpaper(result.wallpaperId, result.url);
    } catch (error) {
      console.error('Failed to upload custom wallpaper:', error);
    } finally {
      setUploadingWallpaper(false);
    }
  };

  const handleDeleteCustomWallpaper = async (wallpaperId: string) => {
    if (!currentUserId) return;
    
    try {
      await deleteCustomWallpaper(wallpaperId, currentUserId);
      // Refresh catalog
      const updatedCatalog = await getWallpaperCatalog(currentUserId);
      setCatalog(updatedCatalog);
    } catch (error) {
      console.error('Failed to delete custom wallpaper:', error);
    }
  };

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
      const nowIso = new Date().toISOString();
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
      
      // Handle out-of-band pin/unpin hints for fallback syncing and do NOT render these as messages
      if (typeof text === 'string' && (text.startsWith('[[pin]]:') || text.startsWith('[[unpin]]:'))) {
        const msgId = text.split(':')[1];
        // Derive conversation key from current user and sender to ensure both sides update
        const key = currentUserId && sender ? convKeyPair(currentUserId, sender) : (currentConversationId || (selectedContact?.id ? convKeyPair(currentUserId, selectedContact.id) : null));
        if (msgId && key) {
          setServerPinsByConversation(prev => {
            const arr = prev[key] || [];
            const isUnpin = text.startsWith('[[unpin]]:');
            const nextArr = isUnpin ? arr.filter(p => p.messageId !== msgId) : [{ id: `hint-${msgId}`, conversationId: key, messageId: msgId, scope: 'global' as any, pinnedByUserId: sender, createdAt: nowIso }, ...arr.filter(p => p.messageId !== msgId)];
            try {
              const idsToSave = nextArr.map(p => p.messageId);
              localStorage.setItem(`chat:pins:global:${key}`, JSON.stringify(idsToSave));
            } catch {}
            return { ...prev, [key]: nextArr } as any;
          });
        }
        return; // do not add this hint as a chat message
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
      if (!input.trim() && !pendingAttachment) return;
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
      // If there is a pending attachment, send it first
      if (pendingAttachment) {
        await sendText(pendingAttachment.url);
        setPendingAttachment(null);
      }
      // Then send any typed text
      if (input.trim()) {
        await sendText(input.trim());
        setInput("");
      }
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

  async function sendText(text: string) {
    if (!text.trim()) return;
    if (!currentUserId) return;
    if (!chat.connected) {
      setError('Connection lost. Please wait for reconnection...');
      return;
    }
    const id = crypto.randomUUID();
    const newMessage: ChatMessage = {
      id,
      text: text.trim(),
      userId: currentUserId,
      createdAt: new Date().toISOString(),
      username: "You",
      replyToMessageId: replyTo?.id ?? null
    };
    if (currentConversationId) {
      addMessageToConversation(currentConversationId, newMessage);
    }
    if (selectedContact) {
      const targetId = selectedContact.id;
      if (targetId && typeof targetId === 'string') {
        await chat.sendToUserWithMeta(targetId, newMessage.text, replyTo?.id ?? undefined, id);
      } else {
        throw new Error('Invalid target user id');
      }
    }
    setReplyTo(null);
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
    // Load wallpaper for this contact (per-conversation)
    // Load wallpaper locally first, then from server
    const localWp = loadWallpaperForContact(currentUserId, contact.id);
    setWallpaper(localWp || null);
    setWallpaperId(null);
    setOpacity(0.25);
    // Load catalog once (including custom wallpapers)
    (async () => {
      try {
        if (!catalog && currentUserId) {
          const items = await getWallpaperCatalog(currentUserId);
          setCatalog(items);
        }
      } catch {}
    })();
    (async () => {
      try {
        if (currentUserId && contact.id) {
          // Prefer new pref API (id + opacity); fallback to legacy url API
          try {
            const pref = await getConversationWallpaperPref(currentUserId, contact.id);
            setWallpaperId(pref.wallpaperId);
            setOpacity(typeof pref.opacity === 'number' ? pref.opacity : 0.25);
            if (pref.wallpaperId) {
              const all = catalog || [];
              const found = all.find(c => c.id === pref.wallpaperId);
              if (found) setWallpaper(chatAssetUrl(found.previewUrl));
            }
          } catch {
            const res = await getConversationWallpaper(currentUserId, contact.id);
            const serverWp = (res && typeof res.url === 'string') ? res.url : null;
            if (serverWp) {
              setWallpaper(serverWp);
              saveWallpaperForContact(currentUserId, contact.id, serverWp);
            }
          }
        }
      } catch {}
    })();
    
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
    // Load wallpaper when selecting from search results
    const localWp = loadWallpaperForContact(currentUserId, user.id);
    setWallpaper(localWp || null);
    (async () => {
      try {
        if (currentUserId && user.id) {
          const res = await getConversationWallpaper(currentUserId, user.id);
          const serverWp = (res && typeof res.url === 'string') ? res.url : null;
          if (serverWp) {
            setWallpaper(serverWp);
            saveWallpaperForContact(currentUserId, user.id, serverWp);
          }
        }
      } catch {}
    })();
  };

  // Load pins when switching conversations
  useEffect(() => {
    if (!selectedContact?.id || !currentUserId) return;
    const key = currentConversationId || convKeyPair(currentUserId, selectedContact.id);
    setPinnedByConversation(prev => ({ ...prev, [key]: loadPins(key) }));
    (async () => {
      try {
        const remote = await getPinnedMessages(currentUserId, selectedContact.id);
        setServerPinsByConversation(prev => ({ ...prev, [key]: remote }));
      } catch {}
    })();
  }, [selectedContact?.id, currentUserId, currentConversationId, loadPins, convKeyPair]);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 flex overflow-hidden">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-80 block' : 'w-0 hidden'} md:w-80 md:block transition-all duration-300 ease-in-out bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col shadow-xl relative z-10 h-full overflow-hidden`}>
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
      <div className="flex-1 min-h-0 flex flex-col bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 relative z-0">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 p-4 shadow-lg relative z-20">
              <div className="flex items-center justify-between px-4">
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
                    className="mr-3 p-2 rounded-2xl hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-all duration-200 shadow-lg"
                  >
                    <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <div className="relative">
                    <img
                      src={selectedContact.avatar}
                      alt={selectedContact.name}
                      className="w-12 h-12 rounded-2xl border-2 border-white dark:border-gray-600 shadow-xl"
                    />
                    {selectedContact.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-800 shadow-lg">
                        <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedContact.name}</h2>
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
                <div className="flex items-center space-x-2">
              <div className="relative">
                    <button
                      onClick={() => setShowWallpaperPicker(v => !v)}
                      className="p-2 rounded-2xl hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 shadow-lg"
                      title="Change wallpaper"
                    >
                      🎨
                    </button>
                    {showWallpaperPicker && (
                      <div className="absolute right-0 mt-2 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-2xl p-3 z-50 pointer-events-auto">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Chat Wallpaper</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setShowCustomWallpaperUpload(!showCustomWallpaperUpload)}
                              className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded-lg transition-colors"
                            >
                              Upload
                            </button>
                            <button
                              className="text-xs text-red-500 hover:text-red-600"
                              onClick={() => handleApplyWallpaper(null, null, 0.25)}
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                        
                        {/* Custom Wallpaper Upload Form */}
                        {showCustomWallpaperUpload && (
                          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="space-y-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setCustomWallpaperFile(e.target.files?.[0] || null)}
                                className="text-xs w-full"
                              />
                              <input
                                type="text"
                                placeholder="Wallpaper name"
                                value={customWallpaperName}
                                onChange={(e) => setCustomWallpaperName(e.target.value)}
                                className="text-xs w-full px-2 py-1 rounded border"
                              />
                              <input
                                type="text"
                                placeholder="Description"
                                value={customWallpaperDescription}
                                onChange={(e) => setCustomWallpaperDescription(e.target.value)}
                                className="text-xs w-full px-2 py-1 rounded border"
                              />
                              <div className="flex items-center space-x-2 text-xs">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={customWallpaperSupportsDark}
                                    onChange={(e) => setCustomWallpaperSupportsDark(e.target.checked)}
                                    className="mr-1"
                                  />
                                  Dark mode
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={customWallpaperSupportsLight}
                                    onChange={(e) => setCustomWallpaperSupportsLight(e.target.checked)}
                                    className="mr-1"
                                  />
                                  Light mode
                                </label>
                              </div>
                              <button
                                onClick={handleCustomWallpaperUpload}
                                disabled={!customWallpaperFile || uploadingWallpaper}
                                className="w-full text-xs bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-2 py-1 rounded transition-colors"
                              >
                                {uploadingWallpaper ? 'Uploading...' : 'Upload Wallpaper'}
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                          {(catalog || []).map(item => (
                            <div key={item.id} className="relative group">
                              <button
                                onClick={() => handleApplyWallpaper(item.id, item.previewUrl.startsWith('http') ? item.previewUrl : chatAssetUrl(item.previewUrl))}
                                className={`relative rounded-xl overflow-hidden aspect-[4/3] border w-full ${wallpaperId === item.id ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-gray-200/50 dark:border-gray-700/50'}`}
                                title={`${item.name} — ${item.description}`}
                              >
                                <img 
                                  src={item.previewUrl.startsWith('http') ? item.previewUrl : chatAssetUrl(item.previewUrl)} 
                                  alt={item.name} 
                                  className="w-full h-full object-cover" 
                                  loading="lazy" 
                                />
                                <span className="absolute bottom-0 left-0 right-0 text-[10px] sm:text-xs text-gray-800 bg-white/70 dark:bg-gray-900/60 dark:text-gray-200 px-1 py-0.5 truncate">{item.name}</span>
                                {wallpaperId === item.id && (
                                  <div className="absolute inset-0 bg-indigo-500/10"></div>
                                )}
                              </button>
                              {/* Delete button for custom wallpapers */}
                              {item.category === 'custom' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCustomWallpaper(item.id);
                                  }}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Delete wallpaper"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-3">
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Opacity</label>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={Math.round(opacity * 100)}
                            onChange={async (e) => {
                              const v = Math.max(0, Math.min(100, Number(e.target.value)));
                              const next = v / 100;
                              setOpacity(next);
                              if (currentUserId && selectedContact?.id) {
                                try { await setConversationWallpaperPref({ me: currentUserId, peer: selectedContact.id, wallpaperId, opacity: next }); } catch {}
                              }
                            }}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                {/* Pins toggle */}
                <button
                  onClick={() => setShowPinsPanel(v => !v)}
                  className="p-2 rounded-2xl hover:bg-gray-100/80 dark:hover:bg-gray-700/80 text-gray-600 dark:text-gray-400 transition-all duration-200 shadow-lg"
                  title="Pinned messages"
                >
                  📌
                </button>
                  <button className="p-2 rounded-2xl hover:bg-gradient-to-r hover:from-green-500 hover:to-emerald-600 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 shadow-lg">
                    <PhoneIcon className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-2xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-600 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 shadow-lg">
                    <VideoCameraIcon className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-2xl hover:bg-gray-100/80 dark:hover:bg-gray-700/80 text-gray-600 dark:text-gray-400 transition-all duration-200 shadow-lg">
                    <EllipsisHorizontalIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="relative flex-1 min-h-0 z-0">
              {/* Background layer */}
              <div
                className="absolute inset-0 -z-10 bg-no-repeat pointer-events-none"
                style={wallpaper ? { backgroundImage: `url(${wallpaper})`, backgroundPosition: 'center center', backgroundSize: 'cover' } : {}}
              />
              {/* Overlay with adjustable opacity for readability */}
              <div
                className="absolute inset-0 -z-10 pointer-events-none"
                style={{
                  background: `linear-gradient(to bottom, rgba(255,255,255,${opacity}), rgba(255,255,255,${Math.min(1, opacity + 0.2)}))`,
                  // Dark mode will naturally be darker; if needed, detect prefers-color-scheme
                }}
              />

              <div 
                ref={listRef}
                className="h-full overflow-y-auto p-4 md:p-5 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
              >
              <div className="max-w-3xl mx-auto space-y-4 md:space-y-5">
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
                    ref={el => { messageRefs.current[message.id] = el; }}
                    className={`flex ${message.userId === currentUserId ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div className={`max-w-[80%] md:max-w-[65%] lg:max-w-[60%] ${message.userId === currentUserId ? 'order-2' : 'order-1'}`}>
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
                            className="w-5 h-5 rounded-full mr-2 shadow-lg"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {message.userId === 'system' ? 'System' : selectedContact.name}
                          </span>
                        </div>
                      )}
                      <div
                        className={`px-4 py-3 rounded-3xl text-sm shadow-lg backdrop-blur-sm ${
                          message.userId === currentUserId
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-lg'
                            : 'bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white border border-gray-200/50 dark:border-gray-700/50 rounded-bl-lg'
                        }`}
                      >
                        <div className="leading-relaxed break-words">{renderMessageContent(message.text)}</div>
                        {message.reactions && Object.keys(message.reactions).length > 0 && (
                          <div className="mt-2 flex gap-1.5 text-[11px]">
                            {Object.entries(message.reactions).map(([emoji, users]) => (
                              users.length > 0 ? (
                                <span key={emoji} className={`px-2.5 py-0.5 rounded-full border shadow-sm ${message.userId === currentUserId ? 'border-indigo-300/50 text-indigo-100 bg-white/20' : 'border-gray-300/50 text-gray-600 dark:text-gray-300 bg-gray-100/50 dark:bg-gray-700/50'}`}>
                                  {emoji} {users.length}
                                </span>
                              ) : null
                            ))}
                          </div>
                        )}
                        <p className={`text-[10px] mt-2 ${
                          message.userId === currentUserId 
                            ? 'text-indigo-100' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formatTime(message.createdAt)}
                        </p>
                        <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 relative">
                          {/* Reactions dropdown */}
                          <button onClick={() => setEmojiMenuForId(emojiMenuForId === message.id ? null : message.id)} className="text-[11px] cursor-pointer px-2.5 py-1 rounded-full border border-gray-300/50 dark:border-gray-600/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200">
                            😊 React
                          </button>
                          {/* Unified pin menu */}
                          <div className="relative">
                            <button onClick={() => setPinMenuForId(pinMenuForId === message.id ? null : message.id)} className="text-[11px] cursor-pointer px-2.5 py-1 rounded-full border border-gray-300/50 dark:border-gray-600/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200">
                              📌 Pin
                            </button>
                            {pinMenuForId === message.id && (
                              <div className={`absolute z-20 bottom-full mb-2 ${message.userId === currentUserId ? 'right-0' : 'left-0'} bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-2xl p-2 w-44`}
                                onMouseLeave={() => setPinMenuForId(null)}
                              >
                                <button className="w-full text-left text-[12px] px-3 py-2 rounded-xl hover:bg-gray-100/70 dark:hover:bg-gray-700/70" onClick={() => { togglePin(currentConversationId, message.id); setPinMenuForId(null); }}>
                                  {isPinned(currentConversationId, message.id) ? 'Unpin for me' : 'Pin for me'}
                                </button>
                                <button className="w-full text-left text-[12px] px-3 py-2 rounded-xl hover:bg-gray-100/70 dark:hover:bg-gray-700/70" onClick={() => handleServerPinToggle(message.id)}>
                                  {isGloballyPinned(currentConversationId, message.id) ? 'Unpin for everyone' : 'Pin for everyone'}
                                </button>
                              </div>
                            )}
                          </div>
                          {emojiMenuForId === message.id && (
                            <div className={`absolute z-20 bottom-full mb-2 ${message.userId === currentUserId ? 'right-0' : 'left-0'} bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-2xl p-3 grid grid-cols-5 gap-2`}
                              onMouseLeave={() => setEmojiMenuForId(null)}
                            >
                              {REACTIONS.map(em => (
                                <button
                                  key={em}
                                  onClick={async () => { try { await chat.reactToMessage(message.id, em); } finally { setEmojiMenuForId(null); } }}
                                  className="px-2.5 py-2 text-base hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 hover:scale-110"
                                  title={em}
                                >
                                  {em}
                                </button>
                              ))}
                            </div>
                          )}
                          <span className="mx-1 text-gray-400">|</span>
                          <button onClick={() => setReplyTo(message)} className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">Reply</button>
                          {message.userId === currentUserId && (
                            <>
                              <button onClick={() => { setEditingId(message.id); setInput(message.text); inputRef.current?.focus(); }} className="text-[11px] text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Edit</button>
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
                              }} className="text-[11px] text-red-600 hover:text-red-700 transition-colors">Delete</button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              </div>
              </div>
            </div>

            {/* Pinned messages side panel */}
            {showPinsPanel && currentConversationId && (
              <div className="absolute right-3 top-20 bottom-28 w-72 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-2xl p-3 z-30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pinned</span>
                  <button className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" onClick={() => setShowPinsPanel(false)}>Close</button>
                </div>
                <div className="space-y-2 overflow-y-auto max-h-full pr-1">
                  {((pinnedByConversation[currentConversationId] || []).length === 0 && (serverPinsByConversation[currentConversationId] || []).length === 0) && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No pinned messages</p>
                  )}
                  {/* Global pins (all) */}
                  {(serverPinsByConversation[currentConversationId] || []).map(pin => {
                    const msg = (conversations[currentConversationId] || []).find(m => m.id === pin.messageId);
                    if (!msg) return null;
                    return (
                      <div key={`global-${pin.id}`} className="group">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => { const el = messageRefs.current[pin.messageId]; if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const el = messageRefs.current[pin.messageId]; if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }}
                          className="w-full text-left px-3 py-2 rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-gray-50/80 dark:bg-gray-700/50 hover:bg-gray-100/80 dark:hover:bg-gray-700 transition-colors text-sm"
                          title={new Date(msg.createdAt).toLocaleString()}
                        >
                          <div className="truncate">
                            {renderMessageContent(msg.text, { compact: true })}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">{formatTime(msg.createdAt)} • all</span>
                            <button className="text-[10px] text-red-600 hover:text-red-700" onClick={async (e) => { e.stopPropagation(); if (!currentUserId || !selectedContact?.id) return; try { await unpinChatMessage({ me: currentUserId, peer: selectedContact.id, messageId: pin.messageId, scope: 'global' }); const remote = await getPinnedMessages(currentUserId, selectedContact.id); if (currentConversationId) setServerPinsByConversation(prev => ({ ...prev, [currentConversationId]: remote })); } catch {} }}>Remove</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* Personal pins (me) */}
                  {(pinnedByConversation[currentConversationId] || []).map(id => {
                    const msg = (conversations[currentConversationId] || []).find(m => m.id === id);
                    if (!msg) return null;
                    return (
                      <div key={`me-${id}`} className="group">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => { const el = messageRefs.current[id]; if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const el = messageRefs.current[id]; if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }}
                          className="w-full text-left px-3 py-2 rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-gray-50/80 dark:bg-gray-700/50 hover:bg-gray-100/80 dark:hover:bg-gray-700 transition-colors text-sm"
                          title={new Date(msg.createdAt).toLocaleString()}
                        >
                          <div className="truncate">{renderMessageContent(msg.text, { compact: true })}</div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">{formatTime(msg.createdAt)} • me</span>
                            <button className="text-[10px] text-red-600 hover:text-red-700" onClick={(e) => { e.stopPropagation(); togglePin(currentConversationId, id); }}>Remove</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 p-4 shadow-xl">
              <div className="max-w-3xl mx-auto flex items-center space-x-3 px-2">
                <div className="relative">
                  <button
                    className="p-2 rounded-2xl hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 shadow-lg"
                    onClick={() => setShowAttachMenu(v => !v)}
                    title="Attach"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                  {showAttachMenu && (
                    <div className="absolute bottom-full mb-3 left-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-2xl p-3 z-50 w-56">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-1">Attach</div>
                      <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200">
                        <span className="text-lg">📷</span>
                        <span className="text-sm">Photo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f || !selectedContact) return;
                          try {
                            const { url } = await uploadChatMedia(f);
                            setPendingAttachment({ url, mediaType: 'image', name: f.name });
                          } catch {}
                          setShowAttachMenu(false);
                        }} />
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200">
                        <span className="text-lg">🎬</span>
                        <span className="text-sm">Video</span>
                        <input type="file" accept="video/*" className="hidden" onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f || !selectedContact) return;
                          try {
                            const { url } = await uploadChatMedia(f);
                            setPendingAttachment({ url, mediaType: 'video', name: f.name });
                          } catch {}
                          setShowAttachMenu(false);
                        }} />
                      </label>
                    </div>
                  )}
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={onInputChange}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                  className="flex-1 px-5 py-3 rounded-3xl border-0 bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all duration-200 shadow-lg"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() && !pendingAttachment}
                  className="p-3 rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-xl"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
              {isTyping && (
                <div className="max-w-3xl mx-auto px-6 pt-3 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <div className="flex space-x-1 mr-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  {selectedContact?.name} is typing...
                </div>
              )}
              {/* Pending attachment preview */}
              {pendingAttachment && (
                <div className="max-w-3xl mx-auto px-6 pt-3">
                  <div className="flex items-center gap-3 bg-gray-100/80 dark:bg-gray-700/80 px-3 py-2 rounded-2xl shadow-md border border-gray-200/50 dark:border-gray-700/50">
                    <div className="shrink-0">
                      {pendingAttachment.mediaType === 'image' ? (
                        <img src={pendingAttachment.url} alt={pendingAttachment.name || 'image'} className="h-16 w-auto rounded-lg" loading="lazy" />
                      ) : pendingAttachment.mediaType === 'video' ? (
                        <video src={pendingAttachment.url} className="h-16 w-28 rounded-lg" muted playsInline />
                      ) : (
                        <span>📄</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-600 dark:text-gray-300 truncate">{pendingAttachment.name || pendingAttachment.url}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">Attachment ready to send</div>
                    </div>
                    <button
                      className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                      onClick={() => setPendingAttachment(null)}
                    >
                      Remove
                    </button>
                  </div>
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


