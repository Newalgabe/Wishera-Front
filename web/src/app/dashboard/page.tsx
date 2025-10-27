"use client";
import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { 
  HomeIcon, 
  UserIcon, 
  HeartIcon, 
  GiftIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  BookmarkIcon,
  EllipsisHorizontalIcon,
  ShareIcon,
  EyeIcon,
  ArrowRightOnRectangleIcon,
  CalendarIcon,
  Cog6ToothIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useLanguage } from "../../contexts/LanguageContext";
import WisheraLogo from "../../components/WisheraLogo";
import BirthdayCalendar from "../../components/BirthdayCalendar";
import {
  getFeed,
  likeWishlist,
  unlikeWishlist,
  type WishlistFeedDTO,
  searchUsers,
  followUser,
  unfollowUser,
  type UserSearchDTO,
  getUserProfile,
  updateUserProfile,
  updateUserAvatar,
  type UserProfileDTO,
  getFollowers,
  getFollowing,
  getUserWishlists,
  getWishlistDetails,
  createWishlist,
  updateWishlist,
  deleteWishlist,
  type CreateWishlistDTO,
  WISHLIST_CATEGORIES,
  getLikedWishlists,
    // Gifts
    createGift,
    getMyGifts,
    deleteGift,
    reserveGift,
    cancelGiftReservation,
    type GiftDTO,
    getSuggestedUsers,
} from "../api";
import { useRouter, useSearchParams } from "next/navigation";
import ThemeToggle from "../../components/ThemeToggle";
import LanguageSelector from "../../components/LanguageSelector";
import UserSearchAutocomplete from "../../components/UserSearchAutocomplete";
import NotificationBadge from "../../components/NotificationBadge";
import NotificationDropdown from "../../components/NotificationDropdown";
import BirthdayCountdownBanner from "../../components/BirthdayCountdownBanner";
import { useAuth } from "../../hooks/useAuth";
import { getBirthdayCountdownMessage } from "../../utils/birthdayUtils";

type UIWishlist = {
  id: string;
  user: { id: string; name: string; avatar: string; username: string };
  title: string;
  description?: string | null;
  category?: string | null;
  isPublic?: boolean;
  gifts: { id: string; name: string; price?: number | null; image?: string | null }[];
  likes: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
};


function Dashboard() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout } = useAuth();
  const [wishlists, setWishlists] = useState<UIWishlist[]>([]);
  const [likedWishlists, setLikedWishlists] = useState<WishlistFeedDTO[]>([]);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<UserSearchDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [profile, setProfile] = useState<null | {
    id: string;
    username: string;
    avatarUrl?: string | null;
    bio?: string | null;
    interests?: string[] | null;
    isPrivate?: boolean;
    birthday?: string | null;
    followers: UserSearchDTO[];
    following: UserSearchDTO[];
    myWishlists: UIWishlist[];
  }>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ 
    title: "", 
    description: "", 
    category: "", 
    isPublic: true, 
    allowedViewerIds: [] as string[],
    gifts: [] as Array<{ name: string; price: string; category: string; imageFile?: File }>
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [availableGifts, setAvailableGifts] = useState<GiftDTO[]>([]);
  const [availableGiftsLoading, setAvailableGiftsLoading] = useState(false);
  const [selectedExistingGifts, setSelectedExistingGifts] = useState<string[]>([]);

  // Load available gifts when create modal opens
  const loadAvailableGifts = async () => {
    try {
      setAvailableGiftsLoading(true);
      const gifts = await getMyGifts();
      setAvailableGifts(gifts);
    } catch (error) {
      console.error('Failed to load available gifts:', error);
      setAvailableGifts([]);
    } finally {
      setAvailableGiftsLoading(false);
    }
  };

  // Wishlist management state
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editingWishlist, setEditingWishlist] = useState<UIWishlist | null>(null);
  const [deletingWishlist, setDeletingWishlist] = useState<UIWishlist | null>(null);
  const [isEditWishlistOpen, setIsEditWishlistOpen] = useState(false);
  const [isDeleteWishlistOpen, setIsDeleteWishlistOpen] = useState(false);
  const [editWishlistForm, setEditWishlistForm] = useState({
    title: '',
    description: '',
    category: '',
    isPublic: true,
    allowedViewerIds: [] as string[]
  });
  const [editWishlistError, setEditWishlistError] = useState<string | null>(null);
  const [editWishlistLoading, setEditWishlistLoading] = useState(false);
  const [deleteWishlistLoading, setDeleteWishlistLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Notification state
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showBirthdayNotification, setShowBirthdayNotification] = useState(true);

  // Debug birthday notification state
  useEffect(() => {
    console.log('Dashboard: showBirthdayNotification state:', showBirthdayNotification);
  }, [showBirthdayNotification]);

  // Check for create query parameter and open modal
  useEffect(() => {
    const createParam = searchParams?.get('create');
    if (createParam === 'true') {
      setIsCreateOpen(true);
      loadAvailableGifts();
      // Clean up URL
      router.replace('/dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);


  // Get current user ID (kept in state so it updates if we derive it from JWT)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Derive userId/username from JWT if missing in localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedUserId = localStorage.getItem('userId');
      const storedUsername = localStorage.getItem('username');
      const token = localStorage.getItem('token');
      if (storedUserId) {
        setCurrentUserId(storedUserId);
        return;
      }
      if (token && !storedUserId) {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payloadJson = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          const nameId = payloadJson['nameid'] || payloadJson['sub'] || payloadJson['NameIdentifier'];
          const uname = payloadJson['unique_name'] || payloadJson['name'] || payloadJson['Username'];
          if (nameId && typeof nameId === 'string') {
            localStorage.setItem('userId', nameId);
            setCurrentUserId(nameId);
          }
          if (!storedUsername && uname && typeof uname === 'string') {
            localStorage.setItem('username', uname);
          }
        }
      }
    } catch {}
  }, []);

  // Debug logging for user ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Current user ID from localStorage:', currentUserId);
      console.log('All localStorage keys:', Object.keys(localStorage));
      console.log('Token exists:', !!localStorage.getItem('token'));
    }
  }, [currentUserId]);

  // Helper function to check if user owns a wishlist
  const isWishlistOwner = (wishlist: UIWishlist) => {
    const isOwner = currentUserId && wishlist.user.id === currentUserId;
    console.log('Ownership check:', {
      currentUserId,
      wishlistUserId: wishlist.user.id,
      wishlistTitle: wishlist.title,
      isOwner
    });
    return isOwner;
  };

  // Logout function is now handled by useAuth hook

  // Profile editing state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    username: "",
    bio: "",
    interests: [] as string[],
    isPrivate: false,
    birthday: ""
  });
  const [editProfileError, setEditProfileError] = useState<string | null>(null);
  const [editProfileLoading, setEditProfileLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [interestInput, setInterestInput] = useState("");

  // Gifts tab state
  const [gifts, setGifts] = useState<GiftDTO[]>([]);
  const [giftsLoading, setGiftsLoading] = useState(false);
  const [giftsError, setGiftsError] = useState<string | null>(null);
  const [giftCategoryFilter, setGiftCategoryFilter] = useState("");
  const [giftSortBy, setGiftSortBy] = useState<"price-asc" | "price-desc" | "name-asc" | "name-desc" | "">("");
  const [giftForm, setGiftForm] = useState<{ name: string; price: string; category: string; imageFile: File | null }>({ name: "", price: "", category: "", imageFile: null });

  // Ensure unique wishlists for rendering (avoid duplicate keys)
  const dedupeById = (items: UIWishlist[]) => {
    const seen = new Set<string>();
    const result: UIWishlist[] = [];
    for (const w of items) {
      if (!seen.has(w.id)) {
        seen.add(w.id);
        result.push(w);
      }
    }
    return result;
  };
  const uniqWishlists = dedupeById(wishlists);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          router.push('/login');
          return;
        }
        let data: WishlistFeedDTO[] = [];
        // Show global feed (all users' wishlists) on home page
        data = await getFeed(1, 20);
        if (!isMounted) return;
        const mapped: UIWishlist[] = data.map((w: WishlistFeedDTO) => ({
          id: w.id,
          user: {
            id: w.userId,
            name: w.username,
            avatar: w.avatarUrl || "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(w.username),
            username: formatUsername(w.username)
          },
          title: w.title,
          description: w.description,
          category: w.category,
          isPublic: w.isPublic,
          gifts: [],
          likes: w.likeCount,
          isLiked: w.isLiked,
          isBookmarked: false,
          createdAt: new Date(w.createdAt).toLocaleString()
        }));
        setWishlists(mapped);
        // Load suggested users
        if (currentUserId) {
          try {
            const users = await getSuggestedUsers(currentUserId, 1, 5);
            setSuggestedUsers(users);
          } catch (error) {
            console.error('Failed to load suggested users:', error);
          }
        }
        setError(null);
      } catch (e: any) {
        if (e?.response?.status === 401) {
          router.push('/login');
          return;
        }
        setError(e?.response?.data?.message || 'Failed to load feed');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [currentUserId]);

  // After feed loads, fetch wishlist item details lazily for each card
  useEffect(() => {
    let isCancelled = false;
    async function hydrateItems() {
      const targets = wishlists.filter(w => w.gifts.length === 0).slice(0, 6);
      for (const w of targets) {
        try {
          const details = await getWishlistDetails(w.id);
          if (isCancelled) return;
          const items = (details.items || []).slice(0, 6).map((it, idx) => ({
            id: `${w.id}-${idx}`,
            name: it.title,
            price: it.price ?? null,
            image: it.imageUrl ?? null,
          }));
          setWishlists(prev => prev.map(x => x.id === w.id ? { ...x, gifts: items } : x));
        } catch {
          // ignore individual failures
        }
      }
    }
    if (wishlists.length > 0) {
      hydrateItems();
    }
    return () => { isCancelled = true; };
  }, [wishlists.length]);

  // After liked wishlists load, fetch wishlist item details lazily for each card
  useEffect(() => {
    let isCancelled = false;
    async function hydrateLikedItems() {
      const targets = likedWishlists.filter(w => !(w as any).gifts || (w as any).gifts.length === 0).slice(0, 6);
      for (const w of targets) {
        try {
          const details = await getWishlistDetails(w.id);
          if (isCancelled) return;
          const items = (details.items || []).slice(0, 6).map((it, idx) => ({
            id: `${w.id}-${idx}`,
            name: it.title,
            price: it.price ?? null,
            image: it.imageUrl ?? null,
          }));
          setLikedWishlists(prev => prev.map(x => x.id === w.id ? { ...x, gifts: items } as any : x));
        } catch {
          // ignore individual failures
        }
      }
    }
    if (likedWishlists.length > 0) {
      hydrateLikedItems();
    }
    return () => { isCancelled = true; };
  }, [likedWishlists.length]);

  // Load My Gifts when tab is active
  useEffect(() => {
    async function loadGifts() {
      if (activeTab !== 'my-wishlists' && activeTab !== 'my-gifts') return;
      try {
        setGiftsLoading(true);
        setGiftsError(null);
        const data = await getMyGifts({
          category: giftCategoryFilter || undefined,
          sortBy: giftSortBy || undefined,
        });
        setGifts(data);
      } catch (e: any) {
        if (e?.response?.status === 401) {
          router.push('/login');
          return;
        }
        setGiftsError(e?.response?.data?.message || 'Failed to load gifts');
      } finally {
        setGiftsLoading(false);
      }
    }
    loadGifts();
  }, [activeTab]);

  // Load Liked Wishlists when tab is active
  useEffect(() => {
    async function loadLikedWishlists() {
      if (activeTab !== 'liked') return;
      try {
        setLoading(true);
        setError(null);
        const data = await getLikedWishlists();
        setLikedWishlists(data);
      } catch (e: any) {
        if (e?.response?.status === 401) {
          router.push('/login');
          return;
        }
        setError(e?.response?.data?.message || 'Failed to load liked wishlists');
      } finally {
        setLoading(false);
      }
    }
    loadLikedWishlists();
  }, [activeTab]);

  // Load profile tab information when selected
  useEffect(() => {
    async function loadProfile() {
      if (activeTab !== 'profile') return;
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;
        // Decode user info minimally from previous auth response stored if present
        const storedUserId = localStorage.getItem('userId');
        const storedUsername = localStorage.getItem('username');
        let userId = storedUserId || "";
        if (!userId) {
          // Fallback: call profile "me" is not available; we need user id from login/register response
          return;
        }
        const [userProfile, followers, following, myWishlists] = await Promise.all([
          getUserProfile(userId),
          getFollowers(userId, 1, 10),
          getFollowing(userId, 1, 10),
          getUserWishlists(userId, 1, 20)
        ]);
        const mappedMy: UIWishlist[] = myWishlists.map(w => ({
          id: w.id,
          user: { id: w.userId, name: userProfile.username, avatar: w.avatarUrl || "", username: formatUsername(userProfile.username) },
          title: w.title,
          description: w.description,
          category: w.category,
          isPublic: w.isPublic,
          gifts: [],
          likes: w.likeCount,
          isLiked: w.isLiked,
          isBookmarked: false,
          createdAt: new Date(w.createdAt).toLocaleString()
        }));
        setProfile({
          id: userProfile.id,
          username: userProfile.username,
          avatarUrl: userProfile.avatarUrl,
          bio: userProfile.bio,
          interests: userProfile.interests,
          isPrivate: userProfile.isPrivate,
          birthday: userProfile.birthday,
          followers,
          following,
          myWishlists: mappedMy
        });
      } catch (e) {
        // ignore profile errors for now
      }
    }
    loadProfile();
  }, [activeTab]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (activeDropdown && !target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
      if (showSearchDropdown && !target.closest('.search-container')) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown, showSearchDropdown]);

  const handleLike = async (wishlistId: string) => {
    setWishlists(prev => prev.map(w => w.id === wishlistId ? { ...w, isLiked: !w.isLiked, likes: w.isLiked ? w.likes - 1 : w.likes + 1 } : w));
    try {
      const target = wishlists.find(w => w.id === wishlistId);
      if (!target) return;
      if (target.isLiked) {
        await unlikeWishlist(wishlistId);
      } else {
        await likeWishlist(wishlistId);
      }
    } catch {
      // revert on error
      setWishlists(prev => prev.map(w => w.id === wishlistId ? { ...w, isLiked: !w.isLiked, likes: w.isLiked ? w.likes - 1 : w.likes + 1 } : w));
    }
  };

  const handleBookmark = (wishlistId: string) => {
    setWishlists(prev => prev.map(wishlist => 
      wishlist.id === wishlistId 
        ? { ...wishlist, isBookmarked: !wishlist.isBookmarked }
        : wishlist
    ));
  };

  const handleEditWishlist = async () => {
    if (!editingWishlist) return;
    
    // Check authentication
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setEditWishlistError('You must be logged in to edit wishlists');
      return;
    }
    
    // Double-check ownership
    if (!isWishlistOwner(editingWishlist)) {
      setEditWishlistError('You do not have permission to edit this wishlist');
      return;
    }
    
    // Check if wishlist still exists
    const wishlistExists = wishlists.some(w => w.id === editingWishlist.id);
    if (!wishlistExists) {
      setEditWishlistError('Wishlist no longer exists');
      return;
    }
    
    // Validate form
    if (!editWishlistForm.title.trim()) {
      setEditWishlistError('Title is required');
      return;
    }
    
    setEditWishlistLoading(true);
    setEditWishlistError(null);
    
    try {
      console.log('Sending update request with data:', {
        title: editWishlistForm.title,
        description: editWishlistForm.description || null,
        category: editWishlistForm.category || null,
        isPublic: editWishlistForm.isPublic,
        allowedViewerIds: editWishlistForm.isPublic ? [] : editWishlistForm.allowedViewerIds
      });
      
      await updateWishlist(editingWishlist.id, {
        title: editWishlistForm.title,
        description: editWishlistForm.description || null,
        category: editWishlistForm.category || null,
        isPublic: editWishlistForm.isPublic,
        allowedViewerIds: editWishlistForm.isPublic ? [] : editWishlistForm.allowedViewerIds
      });
      
      console.log('Update request successful, refreshing wishlists...');
      
      // Refresh wishlists data
      try {
        const refreshedWishlists = await getFeed(1, 20);
        console.log('Refreshed wishlists data:', refreshedWishlists);
        const mapped: UIWishlist[] = refreshedWishlists.map(w => ({
          id: w.id,
          user: { id: w.userId, name: w.username, avatar: w.avatarUrl || "", username: formatUsername(w.username) },
          title: w.title,
          description: w.description,
          category: w.category,
          isPublic: w.isPublic,
          gifts: [],
          likes: w.likeCount,
          isLiked: w.isLiked,
          isBookmarked: false,
          createdAt: new Date(w.createdAt).toLocaleString()
        }));
        console.log('Mapped wishlists:', mapped);
        setWishlists(mapped);
      } catch (error) {
        console.error('Failed to refresh wishlists:', error);
      }
      
      setIsEditWishlistOpen(false);
      setEditingWishlist(null);
      setEditWishlistForm({ title: '', description: '', category: '', isPublic: true, allowedViewerIds: [] });
      setSuccessMessage('Wishlist updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Edit wishlist error:', error);
      
      // Handle different types of errors
      if (error.response) {
        if (error.response.status === 403) {
          setEditWishlistError('You do not have permission to edit this wishlist');
        } else if (error.response.status === 404) {
          setEditWishlistError('Wishlist not found');
        } else if (error.response.status === 500) {
          setEditWishlistError('Server error occurred. Please try again later.');
        } else {
          setEditWishlistError(error.response.data?.message || 'Failed to update wishlist');
        }
      } else if (error.request) {
        setEditWishlistError('Network error. Please check your connection and try again.');
      } else {
        setEditWishlistError(error.message || 'Failed to update wishlist');
      }
    } finally {
      setEditWishlistLoading(false);
    }
  };

  const handleDeleteWishlist = async () => {
    if (!deletingWishlist) return;
    
    // Check authentication
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setSuccessMessage('You must be logged in to delete wishlists');
      setTimeout(() => setSuccessMessage(null), 5000);
      return;
    }
    
    // Double-check ownership
    if (!isWishlistOwner(deletingWishlist)) {
      setSuccessMessage('You do not have permission to delete this wishlist');
      setTimeout(() => setSuccessMessage(null), 5000);
      return;
    }
    
    // Check if wishlist still exists
    const wishlistExists = wishlists.some(w => w.id === deletingWishlist.id);
    if (!wishlistExists) {
      setSuccessMessage('Wishlist no longer exists');
      setTimeout(() => setSuccessMessage(null), 5000);
      return;
    }
    

    
    setDeleteWishlistLoading(true);
    
    try {
      await deleteWishlist(deletingWishlist.id);
      
      // Refresh wishlists data
      try {
        const refreshedWishlists = await getFeed(1, 20);
        const mapped: UIWishlist[] = refreshedWishlists.map(w => ({
          id: w.id,
          user: { id: w.userId, name: w.username, avatar: w.avatarUrl || "", username: formatUsername(w.username) },
          title: w.title,
          description: w.description,
          category: w.category,
          isPublic: w.isPublic,
          gifts: [],
          likes: w.likeCount,
          isLiked: w.isLiked,
          isBookmarked: false,
          createdAt: new Date(w.createdAt).toLocaleString()
        }));
        setWishlists(mapped);
      } catch (error) {
        console.error('Failed to refresh wishlists:', error);
      }
      
      setIsDeleteWishlistOpen(false);
      setDeletingWishlist(null);
      setSuccessMessage('Wishlist deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Delete wishlist error:', error);
      
      // Handle different types of errors
      if (error.response) {
        if (error.response.status === 403) {
          setSuccessMessage('You do not have permission to delete this wishlist');
        } else if (error.response.status === 404) {
          setSuccessMessage('Wishlist not found');
        } else if (error.response.status === 500) {
          setSuccessMessage('Server error occurred. Please try again later.');
        } else {
          setSuccessMessage(error.response.data?.message || 'Failed to delete wishlist');
        }
      } else if (error.request) {
        setSuccessMessage('Network error. Please check your connection and try again.');
      } else {
        setSuccessMessage(error.message || 'Failed to delete wishlist');
      }
      
      // Clear error message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } finally {
      setDeleteWishlistLoading(false);
    }
  };

  // Function to get translated categories
  const getTranslatedCategories = () => {
    return WISHLIST_CATEGORIES.map(category => {
      const categoryKey = category.toLowerCase().replace(/[^a-z]/g, '');
      return {
        value: category,
        label: t(`dashboard.categories.${categoryKey}`) || category
      };
    });
  };

  // Function to get translated category label
  const getTranslatedCategoryLabel = (category: string | null | undefined) => {
    if (!category) return '';
    const categoryKey = category.toLowerCase().replace(/[^a-z]/g, '');
    return t(`dashboard.categories.${categoryKey}`) || category;
  };

  // Function to properly format username with @ symbol
  const formatUsername = (username: string) => {
    // Remove any existing @ symbols and add one
    return '@' + username.replace(/^@+/, '');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation Bar */}
      <nav className="backdrop-blur-lg bg-white/90 dark:bg-gray-800/90 border-b border-gray-200/50 dark:border-gray-700/50 fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <WisheraLogo size="md" />

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative search-container">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={async (e) => {
                    const q = e.target.value;
                    setSearchQuery(q);
                    try {
                      if (q.trim().length >= 2) {
                        console.log('Searching for:', q);
                        const users = await searchUsers(q, 1, 5);
                        console.log('Search results:', users);
                        setSuggestedUsers(users);
                        setShowSearchDropdown(true);
                      } else {
                        setShowSearchDropdown(false);
                        if (currentUserId) {
                          const users = await getFollowing(currentUserId, 1, 5);
                          setSuggestedUsers(users);
                        } else {
                          setSuggestedUsers([]);
                        }
                      }
                    } catch (error) {
                      console.error('Search error:', error);
                      setSuggestedUsers([]);
                      setShowSearchDropdown(false);
                    }
                  }}
                  placeholder={t('dashboard.searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50/80 dark:bg-gray-700/80 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all duration-200"
                />
                
                {/* Search Results Dropdown */}
                {showSearchDropdown && searchQuery.trim().length >= 2 && suggestedUsers.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {suggestedUsers.map((user, index) => (
                      <div
                        key={user.id}
                        onClick={() => {
                          router.push(`/user/${user.id}`);
                          setSearchQuery("");
                          setSuggestedUsers([]);
                          setShowSearchDropdown(false);
                        }}
                        className="flex items-center p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      >
                        <img
                          src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username)}`}
                          alt={user.username}
                          className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-600"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {user.username}
                            </h3>
                            {user.isFollowing && (
                              <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full">
                                Following
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {user.isFollowing ? 'You are following this user' : 'Not following'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* No Results Message */}
                {showSearchDropdown && searchQuery.trim().length >= 2 && suggestedUsers.length === 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3">
                    <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                      No users found for "{searchQuery}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Controls: Theme + Language */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center space-x-2">
                <LanguageSelector />
                <ThemeToggle />
              </div>
              <div className="relative">
                <NotificationBadge 
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  size="md"
                />
                <NotificationDropdown 
                  isOpen={showNotificationDropdown}
                  onClose={() => setShowNotificationDropdown(false)}
                />
              </div>
              <button
                onClick={() => router.push('/chat')}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                title="Messages"
              >
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Settings"
              >
                <Cog6ToothIcon className="h-6 w-6" />
              </button>
              <button
                onClick={logout}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Global Success Message */}
      {successMessage && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg shadow-lg">
            {successMessage}
          </div>
        </div>
      )}


      <div className="flex pt-14">
        {/* Left Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed left-0 top-14 bottom-0 overflow-y-auto">
          <div className="p-6">
            <nav className="space-y-3">
              <button
                onClick={() => setActiveTab('home')}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                  activeTab === 'home' 
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600 dark:border-indigo-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-indigo-50/30 dark:hover:from-gray-800/50 dark:hover:to-indigo-900/10 hover:translate-x-1 border-l-4 border-transparent'
                }`}
              >
                <HomeIcon className="h-5 w-5 mr-3" />
                <span className="font-medium">{t('dashboard.home')}</span>
              </button>
              <button
                 onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                  activeTab === 'profile' 
                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-600 dark:text-purple-400 border-l-4 border-purple-600 dark:border-purple-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50/30 dark:hover:from-gray-800/50 dark:hover:to-purple-900/10 hover:translate-x-1 border-l-4 border-transparent'
                }`}
              >
                <UserIcon className="h-5 w-5 mr-3" />
                <span className="font-medium">{t('dashboard.profile')}</span>
              </button>
              <button
                onClick={() => setActiveTab('my-gifts')}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                  activeTab === 'my-gifts' 
                    ? 'bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 text-pink-600 dark:text-pink-400 border-l-4 border-pink-600 dark:border-pink-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-pink-50/30 dark:hover:from-gray-800/50 dark:hover:to-pink-900/10 hover:translate-x-1 border-l-4 border-transparent'
                }`}
              >
                <GiftIcon className="h-5 w-5 mr-3" />
                <span className="font-medium">{t('dashboard.myGifts')}</span>
              </button>
              <button
                onClick={() => router.push('/reserved-gifts')}
                className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:translate-x-1 border-l-4 border-transparent"
              >
                <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{t('reservedGifts.title')}</span>
              </button>
              <button
                onClick={() => router.push('/events')}
                className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:translate-x-1 border-l-4 border-transparent"
              >
                <CalendarIcon className="h-5 w-5 mr-3" />
                <span className="font-medium">Events</span>
              </button>
              <button
                onClick={() => setActiveTab('liked')}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                  activeTab === 'liked' 
                    ? 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 text-red-600 dark:text-red-400 border-l-4 border-red-600 dark:border-red-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-red-50/30 dark:hover:from-gray-800/50 dark:hover:to-red-900/10 hover:translate-x-1 border-l-4 border-transparent'
                }`}
              >
                <HeartIcon className="h-5 w-5 mr-3" />
                <span className="font-medium">{t('dashboard.liked')}</span>
              </button>
            </nav>

            {/* Create New Wishlist Button */}
            <div className="mt-8">
              <button
                onClick={() => {
                  setIsCreateOpen(true);
                  loadAvailableGifts();
                }}
                className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-xl transform hover:scale-[1.02] font-semibold"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                {t('dashboard.createWishlist')}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-64 mr-80 px-4 py-6">
          <div className={`mx-auto ${activeTab === 'liked' ? 'w-full' : 'max-w-3xl'}`}>

            {/* Birthday Countdown Banner */}
            {showBirthdayNotification && (
              <div className="mb-6">
                <BirthdayCountdownBanner 
                  onClose={() => {
                    console.log('Birthday banner closed');
                    setShowBirthdayNotification(false);
                  }}
                />
              </div>
            )}

            {/* Feed / Profile */}
            <div className="space-y-8">
                            {activeTab === 'profile' && profile && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                        <img
                          src={profile.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.username)}`}
                          alt={profile.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{formatUsername(profile.username)}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {profile.followers.length} {t('dashboard.followers')} • {profile.following.length} {t('dashboard.following')}
                        </div>
                        {profile.birthday && (
                          <div className="mt-2 text-xs text-pink-600 dark:text-pink-400 font-medium">
                            {getBirthdayCountdownMessage(profile.birthday, true)}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditProfileForm({
                          username: profile.username,
                          bio: profile.bio || "",
                          interests: profile.interests || [],
                          isPrivate: profile.isPrivate || false,
                          birthday: profile.birthday || ""
                        });
                        setIsEditProfileOpen(true);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                    >
                      {t('dashboard.editProfile')}
                    </button>
                  </div>
                  {(profile.bio || (profile.interests && profile.interests.length > 0)) && (
                    <div className="mt-2 mb-6 space-y-2">
                      {profile.bio && (
                        <p className="text-gray-700 dark:text-gray-300">{profile.bio}</p>
                      )}
                      {profile.interests && profile.interests.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {profile.interests.map((it, idx) => (
                            <span key={idx} className="px-2.5 py-1 text-xs rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm">
                              {it}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{t('dashboard.myWishlists')}</h4>
                      </div>
                      <div className="space-y-2">
                        {profile.myWishlists.map(w => (
                          <div key={w.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer">
                            <div className="font-medium text-gray-900 dark:text-white">{w.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{w.createdAt}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{t('dashboard.friends')}</h4>
                      </div>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {/* Mutuals */}
                        {(() => {
                          const mutuals = profile.followers.filter(follower => 
                            profile.following.some(followed => followed.id === follower.id)
                          );
                          if (mutuals.length === 0) return null;
                          return (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400">Mutuals</h5>
                                <span className="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                                  {mutuals.length}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {mutuals.map(u => (
                                  <div key={u.id} className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200">
                                    <div 
                                      className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-1"
                                      onClick={() => router.push(`/user/${u.id}`)}
                                    >
                                      <img src={u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.username)}`} alt={u.username} className="w-8 h-8 rounded-full border-2 border-green-300 dark:border-green-700" />
                                      <span className="text-xs font-medium text-gray-900 dark:text-white">{formatUsername(u.username)}</span>
                                    </div>
                                    <button
                                      onClick={async () => {
                                        try {
                                          await unfollowUser(u.id);
                                          setProfile(prev => prev ? { ...prev, following: prev.following.filter(x => x.id !== u.id) } : prev);
                                        } catch {}
                                      }}
                                      className="text-xs px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200 font-medium"
                                    >Unfollow</button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Followers Only */}
                        {(() => {
                          const followersOnly = profile.followers.filter(follower => 
                            !profile.following.some(followed => followed.id === follower.id)
                          );
                          if (followersOnly.length === 0) return null;
                          return (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400">Following You</h5>
                                <span className="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                                  {followersOnly.length}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {followersOnly.map(u => (
                                  <div key={u.id} className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200">
                                    <div 
                                      className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-1"
                                      onClick={() => router.push(`/user/${u.id}`)}
                                    >
                                      <img src={u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.username)}`} alt={u.username} className="w-8 h-8 rounded-full border-2 border-blue-300 dark:border-blue-700" />
                                      <span className="text-xs font-medium text-gray-900 dark:text-white">{formatUsername(u.username)}</span>
                                    </div>
                                    <button
                                      onClick={async () => {
                                        try {
                                          await followUser(u.id);
                                          setProfile(prev => prev ? { ...prev, following: [...prev.following, u] } : prev);
                                        } catch {}
                                      }}
                                      className="text-xs px-2 py-1 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 font-medium"
                                    >Follow</button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Following Only */}
                        {(() => {
                          const followingOnly = profile.following.filter(followed => 
                            !profile.followers.some(follower => follower.id === followed.id)
                          );
                          if (followingOnly.length === 0) return null;
                          return (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400">You Follow</h5>
                                <span className="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                                  {followingOnly.length}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {followingOnly.map(u => (
                                  <div key={u.id} className="flex items-center justify-between p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-200">
                                    <div 
                                      className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-1"
                                      onClick={() => router.push(`/user/${u.id}`)}
                                    >
                                      <img src={u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.username)}`} alt={u.username} className="w-8 h-8 rounded-full border-2 border-purple-300 dark:border-purple-700" />
                                      <span className="text-xs font-medium text-gray-900 dark:text-white">{formatUsername(u.username)}</span>
                                    </div>
                                    <button
                                      onClick={async () => {
                                        try {
                                          await unfollowUser(u.id);
                                          setProfile(prev => prev ? { ...prev, following: prev.following.filter(x => x.id !== u.id) } : prev);
                                        } catch {}
                                      }}
                                      className="text-xs px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200 font-medium"
                                    >Unfollow</button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {profile.followers.length === 0 && profile.following.length === 0 && (
                          <div className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                            No friends yet
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {loading && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-6">{t('common.loading') || 'Loading...'}</div>
              )}
              {error && (
                <div className="text-center text-red-500 py-6">{error}</div>
              )}
              {/* Feed and other tabs */}
              {!loading && !error && activeTab === 'home' && uniqWishlists.map((wishlist) => (
                <motion.div
                  key={wishlist.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200"
                >
                  {/* Wishlist Header */}
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-indigo-50/50 via-purple-50/50 to-pink-50/50 dark:from-indigo-900/10 dark:via-purple-900/10 dark:to-pink-900/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="relative cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => router.push(`/user/${wishlist.user.id}`)}
                        >
                          <img
                            src={wishlist.user.avatar}
                            alt={wishlist.user.name}
                            className="w-11 h-11 rounded-full border-2 border-gray-200 dark:border-gray-600"
                          />
                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                        </div>
                        <div 
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => router.push(`/user/${wishlist.user.id}`)}
                        >
                          <div className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            {wishlist.user.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {wishlist.user.username} • {wishlist.createdAt}
                          </div>
                        </div>
                      </div>
                      <div className="relative dropdown-container">
                        <button 
                          onClick={() => setActiveDropdown(wishlist.id === activeDropdown ? null : wishlist.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                        >
                          <EllipsisHorizontalIcon className="h-5 w-5" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {activeDropdown === wishlist.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                            <div className="py-2">
                              {/* View Details */}
                              <button
                                onClick={() => {
                                  setActiveDropdown(null);
                                  // Navigate to wishlist details page
                                  router.push(`/wishlist/${wishlist.id}`);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                              >
                                <div className="flex items-center gap-2">
                                  <EyeIcon className="h-4 w-4" />
                                  {t('dashboard.viewDetails')}
                                </div>
                              </button>
                              
                              {/* Share */}
                              <button
                                onClick={async () => {
                                  setActiveDropdown(null);
                                  try {
                                    const shareUrl = `${window.location.origin}/wishlist/${wishlist.id}`;
                                    await navigator.clipboard.writeText(shareUrl);
                                    setSuccessMessage(t('dashboard.wishlistShared'));
                                    setTimeout(() => setSuccessMessage(null), 3000);
                                  } catch (error) {
                                    console.error('Failed to copy to clipboard:', error);
                                    // Fallback for older browsers
                                    const textArea = document.createElement('textarea');
                                    textArea.value = `${window.location.origin}/wishlist/${wishlist.id}`;
                                    document.body.appendChild(textArea);
                                    textArea.select();
                                    document.execCommand('copy');
                                    document.body.removeChild(textArea);
                                    setSuccessMessage(t('dashboard.wishlistShared'));
                                    setTimeout(() => setSuccessMessage(null), 3000);
                                  }
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                              >
                                <div className="flex items-center gap-2">
                                  <ShareIcon className="h-4 w-4" />
                                  {t('dashboard.share')}
                                </div>
                              </button>
                              
                              {/* Edit - Only show for user's own wishlists */}
                              {isWishlistOwner(wishlist) && (
                                <button
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    setEditingWishlist(wishlist);
                                    setEditWishlistForm({
                                      title: wishlist.title,
                                      description: wishlist.description || '',
                                      category: wishlist.category || '',
                                      isPublic: wishlist.isPublic ?? true,
                                      allowedViewerIds: [] // TODO: Load actual allowed viewer IDs from wishlist data
                                    });
                                    setIsEditWishlistOpen(true);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                                >
                                  <div className="flex items-center gap-2">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    {t('dashboard.edit')}
                                  </div>
                                </button>
                              )}
                              
                              {/* Delete - Only show for user's own wishlists */}
                              {isWishlistOwner(wishlist) && (
                                <button
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    setDeletingWishlist(wishlist);
                                    setIsDeleteWishlistOpen(true);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                                >
                                  <div className="flex items-center gap-2">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    {t('dashboard.delete')}
                                  </div>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Wishlist Content */}
                  <div className="p-5 min-h-0">
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {wishlist.title}
                      </h3>
                      {wishlist.category && (
                        <span className="inline-block px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-sm">
                          {getTranslatedCategoryLabel(wishlist.category)}
                        </span>
                      )}
                    </div>
                    {wishlist.description && (
                      <div className="mb-5">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50/50 dark:bg-gray-700/30 rounded-lg p-3">
                          {wishlist.description}
                        </p>
                      </div>
                    )}

                    {/* Gifts Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {wishlist.gifts.length > 0 && wishlist.gifts.map((gift) => (
                        <div 
                          key={gift.id} 
                          onClick={() => router.push(`/wishlist/${wishlist.id}`)}
                          className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] cursor-pointer group relative"
                          title="Click to view wishlist details"
                        >
                          {gift.image && (
                            <img
                              src={gift.image}
                              alt={gift.name}
                              className="w-full h-48 object-cover"
                            />
                          )}
                          <div className="p-3">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1.5">
                              {gift.name}
                            </h4>
                            {gift.price != null && (
                              <p className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                                ${gift.price}
                              </p>
                            )}
                            {/* View Details Indicator */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="bg-black/60 backdrop-blur-sm rounded-full p-1.5">
                                <EyeIcon className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/80 via-indigo-50/20 to-purple-50/20 dark:from-gray-800/50 dark:via-indigo-900/5 dark:to-purple-900/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleLike(wishlist.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-200 ${
                            wishlist.isLiked 
                              ? 'text-white bg-gradient-to-r from-red-500 to-pink-600 shadow-sm' 
                              : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20'
                          }`}
                        >
                          {wishlist.isLiked ? (
                            <HeartIconSolid className="h-5 w-5" />
                          ) : (
                            <HeartIcon className="h-5 w-5" />
                          )}
                          <span className="text-sm font-medium">{wishlist.likes}</span>
                        </button>
                        <button 
                          onClick={() => router.push(`/wishlist/${wishlist.id}`)}
                          className="flex items-center gap-1.5 text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-3 py-1.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
                          <EyeIcon className="h-4 w-4" />
                          <span className="text-sm font-medium hidden sm:inline">{t('dashboard.view')}</span>
                        </button>
                      </div>
                      <button
                        onClick={() => handleBookmark(wishlist.id)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          wishlist.isBookmarked 
                            ? 'text-indigo-600 dark:text-purple-400 bg-indigo-50 dark:bg-indigo-900/20' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-purple-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                        }`}
                      >
                        <BookmarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* My Gifts tab */}
              {activeTab === 'my-gifts' && (
                <div className="space-y-4">
                  {/* Top controls split into two cards to fit better */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Add Gift */}
                    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('dashboard.addGift')}</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder={t('dashboard.name')}
                          value={giftForm.name}
                          onChange={(e)=> setGiftForm({ ...giftForm, name: e.target.value })}
                          className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-0 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder={t('dashboard.price')}
                          value={giftForm.price}
                          onChange={(e)=> setGiftForm({ ...giftForm, price: e.target.value })}
                          className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-0 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        />
                        <select
                          value={giftForm.category}
                          onChange={(e) => setGiftForm({ ...giftForm, category: e.target.value })}
                          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">{t('dashboard.selectCategory')}</option>
                          {getTranslatedCategories().map((category) => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e)=> setGiftForm({ ...giftForm, imageFile: e.target.files?.[0] || null })}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-center text-gray-500 dark:text-gray-400 hover:border-indigo-400 transition-colors duration-200">
                            <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {t('dashboard.uploadImage')}
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={async ()=>{
                            try {
                              const priceNumber = Number(giftForm.price);
                              if (!giftForm.name.trim() || Number.isNaN(priceNumber)) return;
                              console.log('Creating gift with data:', {
                                name: giftForm.name.trim(),
                                price: priceNumber,
                                category: giftForm.category.trim() || 'General',
                                hasImage: !!giftForm.imageFile
                              });
                              
                              // Get user's wishlists to associate the gift with one
                              let wishlistId: string | undefined;
                              try {
                                const userWishlists = await getUserWishlists(currentUserId || '');
                                if (userWishlists.length > 0) {
                                  // Use the first wishlist
                                  wishlistId = userWishlists[0].id;
                                  console.log('Associating gift with wishlist:', wishlistId);
                                } else {
                                  // Create a default wishlist for the user
                                  console.log('No wishlists found, creating default wishlist');
                                  const defaultWishlist = await createWishlist({
                                    title: 'My Wishlist',
                                    description: 'Default wishlist for my gifts',
                                    category: 'General',
                                    isPublic: false,
                                    allowedViewerIds: []
                                  });
                                  wishlistId = defaultWishlist.id;
                                  console.log('Created default wishlist:', wishlistId);
                                }
                              } catch (error) {
                                console.error('Failed to get/create wishlist:', error);
                                // Continue without wishlistId - gift will be orphaned but created
                              }
                              
                              await createGift({
                                name: giftForm.name.trim(),
                                price: priceNumber,
                                category: giftForm.category.trim() || 'General',
                                wishlistId: wishlistId,
                                imageFile: giftForm.imageFile || undefined,
                              });
                              setGiftForm({ name: '', price: '', category: '', imageFile: null });
                              const refreshed = await getMyGifts({ category: giftCategoryFilter || undefined, sortBy: giftSortBy || undefined });
                              setGifts(refreshed);
                              console.log('Gift created successfully');
                              
                              // If we're on a wishlist details page, refresh it to show the new gift
                              if (typeof window !== 'undefined' && window.location.pathname.startsWith('/wishlist/')) {
                                console.log('Refreshing wishlist details page to show new gift');
                                window.location.reload();
                              }
                            } catch (error: unknown) {
                              console.error('Failed to create gift:', error);
                              const errorMessage = error && typeof error === 'object' && 'response' in error 
                                ? (error.response as { data?: { message?: string } })?.data?.message 
                                : 'Failed to create gift';
                              setError(errorMessage || 'Failed to create gift');
                            }
                          }}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >{t('common.add')}</button>
                      </div>
                    </div>
                    {/* Filters & Sorting */}
                    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('dashboard.filtersSorting')}</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <select
                          value={giftCategoryFilter}
                          onChange={(e) => setGiftCategoryFilter(e.target.value)}
                          className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-0 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">{t('dashboard.filterByCategory')}</option>
                          {getTranslatedCategories().map((category) => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={giftSortBy}
                          onChange={(e)=> setGiftSortBy(e.target.value as "price-asc" | "price-desc" | "name-asc" | "name-desc" | "")}
                          className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-0 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">{t('dashboard.sortBy')}</option>
                          <option value="price-asc">{t('dashboard.sort.priceAsc')}</option>
                          <option value="price-desc">{t('dashboard.sort.priceDesc')}</option>
                          <option value="name-asc">{t('dashboard.sort.nameAsc')}</option>
                          <option value="name-desc">{t('dashboard.sort.nameDesc')}</option>
                        </select>
                      </div>
                      <div className="mt-6 flex items-center gap-3 justify-end">
                        <button
                          onClick={async ()=>{
                            try {
                              setGiftsLoading(true);
                              const data = await getMyGifts({ category: giftCategoryFilter || undefined, sortBy: giftSortBy || undefined });
                              setGifts(data);
                            } finally {
                              setGiftsLoading(false);
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium hover:from-emerald-600 hover:to-teal-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                        >{t('dashboard.apply')}</button>
                        <button
                          onClick={async ()=>{
                            setGiftCategoryFilter('');
                            setGiftSortBy('');
                            try {
                              setGiftsLoading(true);
                              const data = await getMyGifts({});
                              setGifts(data);
                            } finally {
                              setGiftsLoading(false);
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                        >{t('dashboard.clear')}</button>
                      </div>
                    </div>
                  </div>

                  {/* Gifts List */}
                  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('dashboard.myGifts')}</h3>
                      </div>
                      <span className="px-3 py-1 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900 dark:to-rose-900 text-pink-800 dark:text-pink-200 rounded-full text-sm font-medium">{gifts.length} {gifts.length === 1 ? t('dashboard.item') : t('dashboard.items')}</span>
                    </div>
                    {giftsLoading && (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <span className="ml-3 text-gray-500">{t('common.loading')}</span>
                      </div>
                    )}
                    {giftsError && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400">
                        {giftsError}
                      </div>
                    )}
                    {!giftsLoading && !giftsError && gifts.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-lg">{t('dashboard.noGiftsYet')}</p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{t('dashboard.addYourFirstGift')}</p>
                      </div>
                    )}
                    {!giftsLoading && !giftsError && gifts.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {gifts.map((g)=> (
                          <div key={g.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <div className="relative">
                              {g.imageUrl ? (
                                <img src={g.imageUrl} alt={g.name} className="w-full h-40 object-cover" />
                              ) : (
                                <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                              {g.reservedByUsername && (
                                <span className="absolute top-3 left-3 text-xs px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-lg">
                                  {t('common.reserved')}
                                </span>
                              )}
                              <div className="absolute top-3 right-3">
                                <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center">
                                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-gray-900 dark:text-white truncate" title={g.name}>{g.name}</h4>
                                <div className="text-lg font-bold text-indigo-600 dark:text-purple-400">${g.price}</div>
                              </div>
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-indigo-800 dark:text-indigo-200 font-medium">
                                  {getTranslatedCategoryLabel(g.category) || 'General'}
                                </span>
                                {g.reservedByUsername && (
                                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                    {t('dashboard.by')} {g.reservedByUsername}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={async ()=>{ try { await deleteGift(g.id); setGifts(prev=> prev.filter(x=> x.id !== g.id)); } catch {} }}
                                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-all duration-200 font-medium"
                                >
                                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  {t('common.delete')}
                                </button>
                                <button
                                  onClick={async ()=>{
                                    try {
                                      if (g.reservedByUserId) {
                                        await cancelGiftReservation(g.id);
                                        setGifts(prev=> prev.map(x=> x.id===g.id ? { ...x, reservedByUserId: null, reservedByUsername: null } : x));
                                      } else {
                                        const res = await reserveGift(g.id);
                                        const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
                                        setGifts(prev=> prev.map(x=> x.id===g.id ? { ...x, reservedByUserId: currentUserId || x.reservedByUserId, reservedByUsername: res.reservedBy } : x));
                                      }
                                    } catch (error) {
                                      console.error('Failed to reserve/cancel gift:', error);
                                      setError('Failed to reserve/cancel gift. Please try again.');
                                      setTimeout(() => setError(null), 3000);
                                    }
                                  }}
                                  className="flex-1 px-3 py-2 text-sm rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                                >
                                  {g.reservedByUserId ? (
                                    <>
                                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      {t('common.cancel')}
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      {t('common.reserve')}
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Liked Wishlists tab */}
              {!loading && !error && activeTab === 'liked' && likedWishlists.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                  <HeartIcon className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('dashboard.noLikedWishlists') || 'No liked wishlists yet'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('dashboard.noLikedWishlistsDescription') || 'Start liking wishlists to see them here!'}
                  </p>
                </div>
              )}

              {!loading && !error && activeTab === 'liked' && likedWishlists.map((wishlist) => (
                <motion.div
                  key={wishlist.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {/* Wishlist Header */}
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-indigo-50/50 via-purple-50/50 to-pink-50/50 dark:from-indigo-900/10 dark:via-purple-900/10 dark:to-pink-900/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="relative cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => router.push(`/user/${wishlist.userId}`)}
                        >
                          <img
                            src={wishlist.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(wishlist.username)}`}
                            alt={wishlist.username}
                            className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-600 shadow-md"
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-600"></div>
                        </div>
                        <div 
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => router.push(`/user/${wishlist.userId}`)}
                        >
                          <div className="font-bold text-gray-900 dark:text-white text-lg hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            {wishlist.username}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(wishlist.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="relative dropdown-container">
                        <button 
                          onClick={() => setActiveDropdown(wishlist.id === activeDropdown ? null : wishlist.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                        >
                          <EllipsisHorizontalIcon className="h-5 w-5" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {activeDropdown === wishlist.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                            <div className="py-2">
                              {/* View Details */}
                              <button
                                onClick={() => {
                                  setActiveDropdown(null);
                                  router.push(`/wishlist/${wishlist.id}`);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                              >
                                <div className="flex items-center gap-2">
                                  <EyeIcon className="h-4 w-4" />
                                  {t('dashboard.viewDetails')}
                                </div>
                              </button>
                              
                              {/* Share */}
                              <button
                                onClick={async () => {
                                  setActiveDropdown(null);
                                  try {
                                    const shareUrl = `${window.location.origin}/wishlist/${wishlist.id}`;
                                    await navigator.clipboard.writeText(shareUrl);
                                    setSuccessMessage(t('dashboard.wishlistShared'));
                                    setTimeout(() => setSuccessMessage(null), 3000);
                                  } catch (error) {
                                    console.error('Failed to copy to clipboard:', error);
                                    const textArea = document.createElement('textarea');
                                    textArea.value = `${window.location.origin}/wishlist/${wishlist.id}`;
                                    document.body.appendChild(textArea);
                                    textArea.select();
                                    document.execCommand('copy');
                                    document.body.removeChild(textArea);
                                    setSuccessMessage(t('dashboard.wishlistShared'));
                                    setTimeout(() => setSuccessMessage(null), 3000);
                                  }
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                              >
                                <div className="flex items-center gap-2">
                                  <ShareIcon className="h-4 w-4" />
                                  {t('dashboard.share')}
                                </div>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Wishlist Content */}
                  <div className="p-6 min-h-0">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            onClick={() => router.push(`/wishlist/${wishlist.id}`)}>
                          {wishlist.title}
                        </h2>
                        {wishlist.category && (
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full mt-1">
                            {getTranslatedCategoryLabel(wishlist.category)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mb-6">
                      <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed text-center break-words whitespace-normal overflow-visible px-2 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        {wishlist.description}
                      </p>
                    </div>

                    {/* Gifts Grid */}
                    {(wishlist as any).gifts && (wishlist as any).gifts.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {(wishlist as any).gifts.map((gift: any) => (
                          <div 
                            key={gift.id} 
                            onClick={() => router.push(`/wishlist/${wishlist.id}`)}
                            className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 cursor-pointer group relative"
                            title="Click to view wishlist details"
                          >
                            {gift.image && (
                              <img
                                src={gift.image}
                                alt={gift.name}
                                className="w-full h-36 object-cover"
                              />
                            )}
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                                {gift.name}
                              </h4>
                              {gift.price != null && (
                                <div className="flex items-center justify-between">
                                  <p className="text-lg font-bold text-indigo-600 dark:text-purple-400">
                                    ${gift.price}
                                  </p>
                                  <div className="w-6 h-6 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                            {/* View Details Indicator */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="bg-black/50 backdrop-blur-sm rounded-full p-2">
                                <EyeIcon className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-6">
                        <button
                          onClick={() => handleLike(wishlist.id)}
                          className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition-all duration-200"
                        >
                          {wishlist.isLiked ? (
                            <HeartIconSolid className="h-5 w-5" />
                          ) : (
                            <HeartIcon className="h-5 w-5" />
                          )}
                          <span className="text-sm font-medium">{wishlist.likeCount}</span>
                        </button>
                        <button className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-2 rounded-lg transition-all duration-200">
                          <ShareIcon className="h-5 w-5" />
                          <span className="text-sm font-medium">{t('dashboard.share')}</span>
                        </button>
                      </div>
                      <button
                        onClick={() => router.push(`/wishlist/${wishlist.id}`)}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        {t('dashboard.view')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 fixed right-0 top-14 bottom-0 overflow-y-auto">
          <div className="p-6">
            {/* Birthday Calendar */}
            <BirthdayCalendar className="mb-6" />
          </div>
        </div>

        {/* Create Wishlist Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.createWishlist')}</h3>
              {createError && <div className="text-red-500 text-sm mb-2">{createError}</div>}
              <div className="space-y-4">
                {/* Wishlist Details */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Wishlist Details</h4>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder={t('dashboard.title')}
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder={t('dashboard.description')}
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">{t('dashboard.selectCategory')}</option>
                    {getTranslatedCategories().map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  {!createForm.isPublic && (
                    <UserSearchAutocomplete
                      value={createForm.allowedViewerIds}
                      onChange={(userIds) => setCreateForm({ ...createForm, allowedViewerIds: userIds })}
                      placeholder="Search and add people to share with..."
                      className="w-full"
                    />
                  )}
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={createForm.isPublic}
                      onChange={(e) => setCreateForm({ ...createForm, isPublic: e.target.checked })}
                    />
                    {createForm.isPublic ? t('dashboard.public') : t('dashboard.private')}
                  </label>
                </div>

                {/* Existing Gifts Section */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Add Existing Gifts</h4>
                  {availableGiftsLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading your gifts...</p>
                    </div>
                  ) : availableGifts.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {availableGifts.map((gift) => (
                        <label key={gift.id} className="flex items-center space-x-3 p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedExistingGifts.includes(gift.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedExistingGifts([...selectedExistingGifts, gift.id]);
                              } else {
                                setSelectedExistingGifts(selectedExistingGifts.filter(id => id !== gift.id));
                              }
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              {gift.imageUrl && (
                                <img 
                                  src={gift.imageUrl} 
                                  alt={gift.name}
                                  className="w-8 h-8 rounded object-cover"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {gift.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {gift.category} • ${gift.price}
                                </p>
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No existing gifts found. Create new gifts below!
                    </p>
                  )}
                </div>

                {/* New Gifts Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">Create New Gifts</h4>
                    <button
                      type="button"
                      onClick={() => setCreateForm({
                        ...createForm,
                        gifts: [...createForm.gifts, { name: "", price: "", category: "" }]
                      })}
                      className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                    >
                      + Add New Gift
                    </button>
                  </div>
                  
                  {createForm.gifts.map((gift, index) => (
                    <div key={index} className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Gift {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => setCreateForm({
                            ...createForm,
                            gifts: createForm.gifts.filter((_, i) => i !== index)
                          })}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        type="text"
                        value={gift.name}
                        onChange={(e) => {
                          const newGifts = [...createForm.gifts];
                          newGifts[index] = { ...newGifts[index], name: e.target.value };
                          setCreateForm({ ...createForm, gifts: newGifts });
                        }}
                        placeholder="Gift name"
                        className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={gift.price}
                          onChange={(e) => {
                            const newGifts = [...createForm.gifts];
                            newGifts[index] = { ...newGifts[index], price: e.target.value };
                            setCreateForm({ ...createForm, gifts: newGifts });
                          }}
                          placeholder="Price"
                          className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <select
                          value={gift.category}
                          onChange={(e) => {
                            const newGifts = [...createForm.gifts];
                            newGifts[index] = { ...newGifts[index], category: e.target.value };
                            setCreateForm({ ...createForm, gifts: newGifts });
                          }}
                          className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Category</option>
                          {getTranslatedCategories().map((category) => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const newGifts = [...createForm.gifts];
                            newGifts[index] = { ...newGifts[index], imageFile: file };
                            setCreateForm({ ...createForm, gifts: newGifts });
                          }
                        }}
                        className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  ))}
                  
                  {createForm.gifts.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No new gifts added yet. Click "Add New Gift" to get started!
                    </p>
                  )}
                </div>

                {/* Summary Section */}
                {(selectedExistingGifts.length > 0 || createForm.gifts.some(g => g.name.trim())) && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Wishlist Summary</h5>
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p>• {selectedExistingGifts.length} existing gift{selectedExistingGifts.length !== 1 ? 's' : ''} selected</p>
                      <p>• {createForm.gifts.filter(g => g.name.trim()).length} new gift{createForm.gifts.filter(g => g.name.trim()).length !== 1 ? 's' : ''} to create</p>
                      <p className="font-medium mt-1">
                        Total: {selectedExistingGifts.length + createForm.gifts.filter(g => g.name.trim()).length} gift{selectedExistingGifts.length + createForm.gifts.filter(g => g.name.trim()).length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button 
                  onClick={() => {
                    setIsCreateOpen(false);
                    setCreateForm({ 
                      title: '', 
                      description: '', 
                      category: '', 
                      isPublic: true, 
                      allowedViewerIds: [],
                      gifts: []
                    });
                    setSelectedExistingGifts([]);
                  }} 
                  className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={createLoading}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={async () => {
                    try {
                      setCreateError(null);
                      setCreateLoading(true);
                      
                      // Create the wishlist first
                      const payload: CreateWishlistDTO = {
                        title: createForm.title,
                        description: createForm.description || undefined,
                        category: createForm.category || undefined,
                        isPublic: createForm.isPublic,
                        allowedViewerIds: createForm.isPublic
                          ? []
                          : createForm.allowedViewerIds
                      };
                      const created = await createWishlist(payload);
                      
                      // Add existing gifts to the wishlist
                      const addedGifts: Array<{ id: string; name: string; price: number; category: string; imageUrl: string | null }> = [];
                      
                      // Add selected existing gifts
                      for (const giftId of selectedExistingGifts) {
                        const existingGift = availableGifts.find(g => g.id === giftId);
                        if (existingGift) {
                          try {
                            // Update the existing gift to link it to this wishlist
                            const giftResponse = await fetch(`${process.env.NEXT_PUBLIC_GIFT_API_URL || 'http://localhost:5003/api'}/gifts/${giftId}`, {
                              method: 'PUT',
                              headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                name: existingGift.name,
                                price: existingGift.price,
                                category: existingGift.category,
                                wishlistId: created.id
                              })
                            });
                            
                            if (giftResponse.ok) {
                              addedGifts.push({
                                id: existingGift.id,
                                name: existingGift.name,
                                price: existingGift.price,
                                category: existingGift.category,
                                imageUrl: existingGift.imageUrl
                              });
                            }
                          } catch (giftError) {
                            console.error('Failed to add existing gift:', giftError);
                            // Continue with other gifts even if one fails
                          }
                        }
                      }
                      
                      // Create new gifts if any were added
                      for (const gift of createForm.gifts) {
                        if (gift.name.trim()) {
                          try {
                            const giftData = new FormData();
                            giftData.append('name', gift.name);
                            giftData.append('price', gift.price || '0');
                            giftData.append('category', gift.category || '');
                            giftData.append('wishlistId', created.id);
                            if (gift.imageFile) {
                              giftData.append('imageFile', gift.imageFile);
                            }
                            
                            const giftResponse = await fetch(`${process.env.NEXT_PUBLIC_GIFT_API_URL || 'http://localhost:5003/api'}/gifts`, {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                              },
                              body: giftData
                            });
                            
                            if (giftResponse.ok) {
                              const giftResult = await giftResponse.json();
                              addedGifts.push({
                                id: giftResult.id,
                                name: gift.name,
                                price: parseFloat(gift.price) || 0,
                                category: gift.category,
                                imageUrl: gift.imageFile ? 'uploaded' : null
                              });
                            }
                          } catch (giftError) {
                            console.error('Failed to create gift:', giftError);
                            // Continue with other gifts even if one fails
                          }
                        }
                      }
                      
                      // Prepend to feed for instant feedback (dedupe by id)
                      setWishlists(prev => dedupeById([{
                        id: created.id,
                        user: { id: created.userId, name: created.username, avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(created.username)}`, username: formatUsername(created.username) },
                        title: created.title,
                        description: created.description,
                        category: created.category,
                        isPublic: created.isPublic,
                        gifts: addedGifts,
                        likes: created.likeCount,
                        isLiked: created.isLiked,
                        isBookmarked: false,
                        createdAt: new Date(created.createdAt).toLocaleString()
                      }, ...prev]));
                      
                      setIsCreateOpen(false);
                      setCreateForm({ 
                        title: '', 
                        description: '', 
                        category: '', 
                        isPublic: true, 
                        allowedViewerIds: [],
                        gifts: []
                      });
                      setSelectedExistingGifts([]);
                    } catch (e: any) {
                      setCreateError(e?.response?.data?.message || 'Failed to create');
                    } finally {
                      setCreateLoading(false);
                    }
                  }}
                  className="px-4 py-2 rounded bg-indigo-600 dark:bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={createLoading}
                >
                  {createLoading ? 'Creating...' : t('common.save')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('dashboard.editProfile')}</h3>
              </div>
              
              {editProfileError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400">
                  {editProfileError}
                </div>
              )}

              <div className="space-y-4">
                {/* Avatar Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('dashboard.avatar')}
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-center text-gray-500 dark:text-gray-400 hover:border-indigo-400 transition-colors duration-200">
                      <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {avatarFile ? avatarFile.name : t('dashboard.uploadAvatar')}
                    </div>
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('dashboard.username')}
                  </label>
                  <input
                    type="text"
                    value={editProfileForm.username}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, username: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    placeholder={t('dashboard.username')}
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('dashboard.bio')}
                  </label>
                  <textarea
                    value={editProfileForm.bio}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, bio: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    placeholder={t('dashboard.bioPlaceholder')}
                  />
                </div>

                {/* Birthday */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('dashboard.birthday')}
                  </label>
                  <input
                    type="date"
                    value={editProfileForm.birthday}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, birthday: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    placeholder={t('dashboard.birthdayPlaceholder')}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('dashboard.birthdayHelp')}
                  </p>
                </div>

                {/* Interests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('dashboard.interests')}
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editProfileForm.interests.map((it, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 text-xs">
                        {it}
                        <button
                          type="button"
                          onClick={() => setEditProfileForm({
                            ...editProfileForm,
                            interests: editProfileForm.interests.filter((_, i) => i !== idx)
                          })}
                          className="ml-1 text-gray-500 hover:text-red-600"
                          aria-label="Remove interest"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          const next = interestInput.trim();
                          if (next) {
                            setEditProfileForm({
                              ...editProfileForm,
                              interests: Array.from(new Set([...editProfileForm.interests, next]))
                            });
                            setInterestInput("");
                          }
                        }
                      }}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      placeholder={t('dashboard.interestsPlaceholder') || 'Type an interest and press Enter'}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = interestInput.trim();
                        if (next) {
                          setEditProfileForm({
                            ...editProfileForm,
                            interests: Array.from(new Set([...editProfileForm.interests, next]))
                          });
                          setInterestInput("");
                        }
                      }}
                      className="px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                    >
                      {t('common.add') || 'Add'}
                    </button>
                  </div>
                </div>

                {/* Privacy Setting */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={editProfileForm.isPrivate}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, isPrivate: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="isPrivate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('dashboard.privateProfile')}
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setIsEditProfileOpen(false);
                    setEditProfileError(null);
                    setAvatarFile(null);
                  }} 
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={async () => {
                    try {
                      setEditProfileLoading(true);
                      setEditProfileError(null);
                      
                      // Update avatar first if selected
                      if (avatarFile) {
                        await updateUserAvatar(avatarFile);
                      }
                      
                      // Update profile data
                      const updatedProfile = await updateUserProfile({
                        username: editProfileForm.username,
                        bio: editProfileForm.bio,
                        interests: editProfileForm.interests,
                        isPrivate: editProfileForm.isPrivate,
                        birthday: editProfileForm.birthday
                      });
                      
                      // Update local profile state
                      if (profile) {
                        setProfile({
                          ...profile,
                          username: updatedProfile.username,
                          bio: updatedProfile.bio,
                          interests: updatedProfile.interests,
                          isPrivate: updatedProfile.isPrivate,
                          birthday: updatedProfile.birthday,
                          avatarUrl: avatarFile ? updatedProfile.avatarUrl : profile.avatarUrl
                        });
                      }
                      
                      setIsEditProfileOpen(false);
                      setAvatarFile(null);
                    } catch (e: any) {
                      setEditProfileError(e?.response?.data?.message || 'Failed to update profile');
                    } finally {
                      setEditProfileLoading(false);
                    }
                  }}
                  disabled={editProfileLoading}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editProfileLoading ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Wishlist Modal */}
      {isEditWishlistOpen && editingWishlist && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setIsEditWishlistOpen(false);
            setEditWishlistError(null);
            setEditingWishlist(null);
            setEditWishlistForm({ title: '', description: '', category: '', isPublic: true, allowedViewerIds: [] });
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t('dashboard.editWishlist') || 'Edit Wishlist'}
              </h3>
              
              {editWishlistError && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {editWishlistError}
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm">
                  {successMessage}
                </div>
              )}

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('dashboard.title') || 'Title'}
                  </label>
                  <input
                    type="text"
                    value={editWishlistForm.title}
                    onChange={(e) => setEditWishlistForm({ ...editWishlistForm, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    placeholder={t('dashboard.title') || 'Title'}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('dashboard.description') || 'Description'}
                  </label>
                  <textarea
                    value={editWishlistForm.description}
                    onChange={(e) => setEditWishlistForm({ ...editWishlistForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    placeholder={t('dashboard.description') || 'Description'}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('dashboard.category') || 'Category'}
                  </label>
                  <select
                    value={editWishlistForm.category}
                    onChange={(e) => setEditWishlistForm({ ...editWishlistForm, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">{t('dashboard.selectCategory')}</option>
                    {getTranslatedCategories().map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Privacy Setting */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={editWishlistForm.isPublic}
                    onChange={(e) => setEditWishlistForm({ ...editWishlistForm, isPublic: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="isPublic" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('dashboard.publicWishlist') || 'Public Wishlist'}
                  </label>
                </div>

                {/* Allowed Viewers - Only show for private wishlists */}
                {!editWishlistForm.isPublic && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Share with specific people
                    </label>
                    <UserSearchAutocomplete
                      value={editWishlistForm.allowedViewerIds}
                      onChange={(userIds) => setEditWishlistForm({ ...editWishlistForm, allowedViewerIds: userIds })}
                      placeholder="Search and add people to share with..."
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setIsEditWishlistOpen(false);
                    setEditWishlistError(null);
                    setEditingWishlist(null);
                    setEditWishlistForm({ title: '', description: '', category: '', isPublic: true, allowedViewerIds: [] });
                  }} 
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleEditWishlist}
                  disabled={editWishlistLoading}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {editWishlistLoading && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {editWishlistLoading ? (t('common.saving') || 'Saving') : (t('common.save') || 'Save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Wishlist Confirmation Modal */}
      {isDeleteWishlistOpen && deletingWishlist && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setIsDeleteWishlistOpen(false);
            setDeletingWishlist(null);
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t('dashboard.deleteWishlist') || 'Delete Wishlist'}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {t('dashboard.deleteWishlistConfirm') || 'Are you sure you want to delete'} <strong>"{deletingWishlist.title}"</strong>? {t('dashboard.deleteWishlistWarning') || 'This action cannot be undone.'}
              </p>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setIsDeleteWishlistOpen(false);
                    setDeletingWishlist(null);
                  }} 
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleDeleteWishlist}
                  disabled={deleteWishlistLoading}
                  className="px-6 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deleteWishlistLoading && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {deleteWishlistLoading ? (t('common.deleting') || 'Deleting') : (t('common.delete') || 'Delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <Dashboard />
    </Suspense>
  );
}

export default DashboardWrapper; 