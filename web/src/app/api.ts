import axios, { type AxiosRequestConfig } from 'axios';
import { BirthdayReminderDTO } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '/api' : 'http://localhost:5155/api');
const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:5219/api';
const CHAT_API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL || 'http://localhost:5002/api';
const GIFT_API_URL = process.env.NEXT_PUBLIC_GIFT_API_URL || 'http://localhost:5003/api';
const USER_API_URL = process.env.NEXT_PUBLIC_USER_API_URL || 'http://localhost:5001/api';

// Ensure Authorization header is attached to all requests when token exists
axios.defaults.timeout = 10000;
axios.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    // Do not attach Authorization for public auth endpoints
    const url = String(config.url || '').toLowerCase();
    const isAuthPublic = url.includes('/auth/login')
      || url.includes('/auth/register')
      || url.includes('/auth/forgot-password')
      || url.includes('/auth/reset-password')
      || url.includes('/auth/check-email')
      || url.includes('/auth/check-username');

    if (token && !isAuthPublic) {
      // Support both AxiosHeaders instance and plain object headers
      const headers: any = config.headers;
      if (headers && typeof headers.set === 'function') {
        headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers = {
          ...(config.headers || {} as any),
          Authorization: `Bearer ${token}`,
        } as any;
      }
    }
  }
  return config;
});

// Static categories for consistency across the application
export const WISHLIST_CATEGORIES = [
  'Electronics',
  'Books',
  'Clothing',
  'Home & Garden',
  'Sports & Outdoors',
  'Beauty & Personal Care',
  'Toys & Games',
  'Food & Beverages',
  'Health & Wellness',
  'Automotive',
  'Travel',
  'Music',
  'Movies & TV',
  'Art & Crafts',
  'Jewelry & Accessories',
  'Pet Supplies',
  'Office & School',
  'Baby & Kids',
  'Other'
] as const;

export type WishlistCategory = typeof WISHLIST_CATEGORIES[number];

// Auth endpoints (no auth header required)
export async function login(email: string, password: string) {
  try {
    console.log('API: Attempting login to:', `${AUTH_API_URL}/auth/login`);
    const response = await axios.post(`${AUTH_API_URL}/auth/login`, { email, password });
    console.log('API: Login successful');
    return response.data;
  } catch (error) {
    console.error('API: Login failed:', error);
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Authentication service is not available. Please check if the auth service is running on port 5219.');
      }
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password.');
      }
      if (error.response?.status === 404) {
        throw new Error('Login endpoint not found. Please check the auth service configuration.');
      }
    }
    throw error;
  }
}

export async function register(username: string, email: string, password: string) {
  try {
    console.log('API: Attempting registration to:', `${AUTH_API_URL}/auth/register`);
    const response = await axios.post(`${AUTH_API_URL}/auth/register`, { username, email, password });
    console.log('API: Registration successful');
    return response.data;
  } catch (error) {
    console.error('API: Registration failed:', error);
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Authentication service is not available. Please check if the auth service is running on port 5219.');
      }
      if (error.response?.status === 400) {
        throw new Error('Registration failed. Please check your input data.');
      }
      if (error.response?.status === 409) {
        throw new Error('Username or email already exists.');
      }
    }
    throw error;
  }
}

export async function forgotPassword(email: string) {
  const response = await axios.post(`${AUTH_API_URL}/auth/forgot-password`, { email });
  return response.data;
}

export async function resetPassword(token: string, newPassword: string) {
  const response = await axios.post(`${AUTH_API_URL}/auth/reset-password`, { token, newPassword });
  return response.data;
}

export async function checkEmailAvailability(email: string) {
  const response = await axios.get(`${AUTH_API_URL}/auth/check-email?email=${encodeURIComponent(email)}`);
  return response.data;
}

export async function checkUsernameAvailability(username: string) {
  const response = await axios.get(`${AUTH_API_URL}/auth/check-username?username=${encodeURIComponent(username)}`);
  return response.data;
}

// Helpers for authorized requests
function authConfig(): AxiosRequestConfig {
  if (typeof window === 'undefined') return {} as AxiosRequestConfig;
  const token = localStorage.getItem('token');
  return token
    ? { 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000 // 10 second timeout
      }
    : { timeout: 10000 };
}

// DTOs
export interface WishlistFeedDTO {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string | null;
  title: string;
  description?: string | null;
  category?: string | null;
  isPublic?: boolean;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  gifts?: { id: string; name: string; price?: number | null; image?: string | null }[];
}

export interface WishlistItemDTO {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  price?: number | null;
  url?: string | null;
  giftId?: string | null;
}

export interface WishlistResponseDTO {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string | null;
  title: string;
  description?: string | null;
  category?: string | null;
  isPublic: boolean;
  items: WishlistItemDTO[];
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isOwner: boolean;
}

export interface CreateWishlistDTO {
  title: string;
  description?: string | null;
  category?: string | null;
  isPublic?: boolean;
  allowedViewerIds?: string[];
}

export interface UpdateWishlistDTO {
  title?: string;
  description?: string | null;
  category?: string | null;
  isPublic?: boolean;
  allowedViewerIds?: string[];
}

// Authorized API calls for dashboard
export async function getFeed(page = 1, pageSize = 20): Promise<WishlistFeedDTO[]> {
  const response = await axios.get(`${GIFT_API_URL}/wishlists/feed?page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function getCategories(): Promise<string[]> {
  const response = await axios.get(`${GIFT_API_URL}/wishlists/categories`, authConfig());
  return response.data;
}

export async function getWishlistDetails(id: string): Promise<WishlistResponseDTO> {
  const response = await axios.get(`${GIFT_API_URL}/wishlists/${id}`, authConfig());
  return response.data;
}

export async function likeWishlist(id: string): Promise<boolean> {
  const response = await axios.post(`${GIFT_API_URL}/wishlists/${id}/like`, null, authConfig());
  return response.data;
}

export async function unlikeWishlist(id: string): Promise<boolean> {
  const response = await axios.delete(`${GIFT_API_URL}/wishlists/${id}/unlike`, authConfig());
  return response.data;
}

export async function createWishlist(payload: CreateWishlistDTO): Promise<WishlistResponseDTO> {
  const response = await axios.post(`${GIFT_API_URL}/wishlists`, payload, authConfig());
  return response.data;
}

export async function updateWishlist(id: string, payload: {
  title?: string;
  description?: string | null;
  category?: string | null;
  isPublic?: boolean;
  allowedViewerIds?: string[];
}): Promise<WishlistResponseDTO> {
  const response = await axios.put(`${GIFT_API_URL}/wishlists/${id}`, payload, authConfig());
  return response.data;
}

export async function deleteWishlist(id: string): Promise<void> {
  await axios.delete(`${GIFT_API_URL}/wishlists/${id}`, authConfig());
}

// Users API
export interface UserProfileDTO {
  id: string;
  username: string;
  email: string;
  bio?: string | null;
  interests?: string[] | null;
  avatarUrl?: string | null;
  birthday?: string | null;
  createdAt: string;
  followingCount: number;
  followersCount: number;
  wishlistCount: number;
  isPrivate: boolean;
  isFollowing: boolean;
}

export interface UserSearchDTO {
  id: string;
  username: string;
  avatarUrl?: string | null;
  isFollowing: boolean;
  mutualFriendsCount?: number;
}

export async function getUserProfile(id: string): Promise<UserProfileDTO> {
  const response = await axios.get(`${USER_API_URL}/users/${id}`, authConfig());
  return response.data;
}

export async function searchUsers(query: string, page = 1, pageSize = 10): Promise<UserSearchDTO[]> {
  const response = await axios.get(`${USER_API_URL}/users/search?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function getFollowers(id: string, page = 1, pageSize = 10): Promise<UserSearchDTO[]> {
  const response = await axios.get(`${USER_API_URL}/users/${id}/followers?page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function getFollowing(id: string, page = 1, pageSize = 10): Promise<UserSearchDTO[]> {
  const response = await axios.get(`${USER_API_URL}/users/${id}/following?page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function followUser(id: string): Promise<boolean> {
  const response = await axios.post(`${USER_API_URL}/users/follow/${id}`, null, authConfig());
  return response.data;
}

export async function unfollowUser(id: string): Promise<boolean> {
  const response = await axios.delete(`${USER_API_URL}/users/unfollow/${id}`, authConfig());
  return response.data;
}

export async function getSuggestedUsers(userId: string, page = 1, pageSize = 10): Promise<UserSearchDTO[]> {
  const response = await axios.get(`${USER_API_URL}/users/suggested?userId=${userId}&page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function updateUserProfile(updateData: {
  username?: string;
  bio?: string;
  interests?: string[];
  isPrivate?: boolean;
  birthday?: string;
}): Promise<UserProfileDTO> {
  const response = await axios.put(`${USER_API_URL}/users/profile`, updateData, authConfig());
  return response.data;
}

export async function updateUserAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(`${USER_API_URL}/users/avatar`, formData, {
    ...authConfig(),
    headers: {
      ...authConfig().headers,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

// User wishlists
export async function getUserWishlists(userId: string, page = 1, pageSize = 20): Promise<WishlistFeedDTO[]> {
  const response = await axios.get(`${GIFT_API_URL}/wishlists/user/${userId}?page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

// Liked wishlists
export async function getLikedWishlists(page = 1, pageSize = 20): Promise<WishlistFeedDTO[]> {
  const response = await axios.get(`${GIFT_API_URL}/wishlists/liked?page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

// Gifts API (uses GiftController)
export interface GiftDTO {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  wishlistId: string;
  reservedByUserId?: string | null;
  reservedByUsername?: string | null;
}

export interface GiftUpdateDTO {
  name?: string;
  price?: number;
  category?: string;
}

export async function createGift(params: {
  name: string;
  price: number;
  category: string;
  wishlistId?: string;
  imageFile?: File | null;
}): Promise<{ id: string; message: string }> {
  const form = new FormData();
  form.append('name', params.name);
  form.append('price', String(params.price));
  form.append('category', params.category);
  if (params.wishlistId) {
    form.append('wishlistId', params.wishlistId);
  }
  if (params.imageFile) {
    form.append('imageFile', params.imageFile);
  }
  const config = authConfig();
  const response = await axios.post(`${GIFT_API_URL}/gift`, form, {
    ...config,
    headers: {
      ...(config.headers || {}),
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
}

export async function getMyGifts(options?: { category?: string; sortBy?: 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' }): Promise<GiftDTO[]> {
  const query: string[] = [];
  if (options?.category) query.push(`category=${encodeURIComponent(options.category)}`);
  if (options?.sortBy) query.push(`sortBy=${encodeURIComponent(options.sortBy)}`);
  const qs = query.length ? `?${query.join('&')}` : '';
  const response = await axios.get(`${GIFT_API_URL}/gift/wishlist${qs}`, authConfig());
  return response.data;
}

export async function getGiftById(id: string): Promise<GiftDTO> {
  const response = await axios.get(`${GIFT_API_URL}/gift/${id}`, authConfig());
  return response.data;
}

export async function updateGift(id: string, payload: GiftUpdateDTO): Promise<void> {
  await axios.put(`${GIFT_API_URL}/gift/${id}`, payload, authConfig());
}

export async function deleteGift(id: string): Promise<void> {
  await axios.delete(`${GIFT_API_URL}/gift/${id}`, authConfig());
}

export async function uploadGiftImage(id: string, file: File): Promise<{ ImageUrl: string }> {
  const form = new FormData();
  form.append('imageFile', file);
  const config = authConfig();
  const response = await axios.post(`${GIFT_API_URL}/gift/${id}/upload-image`, form, {
    ...config,
    headers: {
      ...(config.headers || {}),
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
}

export async function reserveGift(id: string): Promise<{ message: string; reservedBy: string }>{
  const response = await axios.post(`${GIFT_API_URL}/gift/${id}/reserve`, null, authConfig());
  return response.data;
}

export async function cancelGiftReservation(id: string): Promise<{ message: string }>{
  const response = await axios.post(`${GIFT_API_URL}/gift/${id}/cancel-reserve`, null, authConfig());
  return response.data;
}

export async function getReservedGifts(): Promise<GiftDTO[]> {
  const response = await axios.get(`${GIFT_API_URL}/gift/reserved`, authConfig());
  return response.data;
}

export async function getSharedWishlistGifts(userId: string): Promise<GiftDTO[]> {
  const response = await axios.get(`${GIFT_API_URL}/gift/shared/${userId}`, authConfig());
  return response.data;
}

export async function addGiftToWishlist(giftId: string, wishlistId: string): Promise<{ message: string }> {
  const response = await axios.post(`${GIFT_API_URL}/gift/${giftId}/assign-to-wishlist`, { wishlistId }, authConfig());
  return response.data;
}

export async function removeGiftFromWishlist(giftId: string): Promise<{ message: string }> {
  const response = await axios.post(`${GIFT_API_URL}/gift/${giftId}/remove-from-wishlist`, null, authConfig());
  return response.data;
}

// Chat API (Chat microservice)
export async function createChatToken(userId: string, expiresInMinutes?: number): Promise<{ token: string }> {
  const response = await axios.post(`${CHAT_API_URL}/chat/token`, { userId, expiresInMinutes });
  return response.data;
}

export interface CreateOrJoinChannelDTO {
  channelType: string;
  channelId: string;
  createdByUserId: string;
  memberIds: string[];
  customData?: Record<string, any>;
}

export async function createOrJoinChatChannel(payload: CreateOrJoinChannelDTO): Promise<void> {
  await axios.post(`${CHAT_API_URL}/chat/channel`, payload, authConfig());
}

export interface SendChatMessageDTO {
  channelType: string;
  channelId: string;
  senderUserId: string;
  text: string;
  customData?: Record<string, any>;
}

export async function sendChatMessage(payload: SendChatMessageDTO): Promise<{ messageId: string }> {
  const response = await axios.post(`${CHAT_API_URL}/chat/message`, payload, authConfig());
  return response.data;
}

// Chat history (persisted in Mongo via chat-service)
export interface ChatHistoryItemDTO {
  id: string;
  conversationId: string;
  senderUserId: string;
  recipientUserId: string;
  text: string;
  sentAt: string;
  deliveredAt?: string | null;
  readAt?: string | null;
  clientMessageId?: string | null;
}

export async function getChatHistory(userA: string, userB: string, page = 0, pageSize = 50): Promise<ChatHistoryItemDTO[]> {
  const response = await axios.get(`${CHAT_API_URL}/chat/history?userA=${encodeURIComponent(userA)}&userB=${encodeURIComponent(userB)}&page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function editChatMessage(messageId: string, newText: string): Promise<{ updated: boolean }> {
  const response = await axios.post(`${CHAT_API_URL}/chat/message/edit`, { messageId, newText }, authConfig());
  return response.data;
}

export async function deleteChatMessage(messageId: string): Promise<{ deleted: boolean }> {
  const response = await axios.post(`${CHAT_API_URL}/chat/message/delete`, { messageId }, authConfig());
  return response.data;
}

// Chat preferences (e.g., per-conversation wallpaper)
export async function getConversationWallpaper(meUserId: string, peerUserId: string): Promise<{ url: string | null }> {
  const response = await axios.get(`${CHAT_API_URL}/chat/preferences/wallpaper?me=${encodeURIComponent(meUserId)}&peer=${encodeURIComponent(peerUserId)}`, authConfig());
  return response.data;
}

export async function setConversationWallpaper(meUserId: string, peerUserId: string, url: string | null): Promise<{ saved: boolean }> {
  const response = await axios.post(`${CHAT_API_URL}/chat/preferences/wallpaper`, { me: meUserId, peer: peerUserId, url }, authConfig());
  return response.data;
}

// Wallpaper catalog + preferences (id/opacity-based)
export interface WallpaperCatalogItemDTO {
  id: string;
  name: string;
  description: string;
  category: 'abstract' | 'nature' | 'minimal' | 'geometric';
  supportsDark: boolean;
  supportsLight: boolean;
  previewUrl: string;
}

export async function getWallpaperCatalog(): Promise<WallpaperCatalogItemDTO[]> {
  const response = await axios.get(`${CHAT_API_URL}/chat/wallpapers`, authConfig());
  return response.data;
}

export interface WallpaperPrefDTO { wallpaperId: string | null; opacity: number }
export async function getConversationWallpaperPref(meUserId: string, peerUserId: string): Promise<WallpaperPrefDTO> {
  const response = await axios.get(`${CHAT_API_URL}/chat/preferences/wallpaper?me=${encodeURIComponent(meUserId)}&peer=${encodeURIComponent(peerUserId)}`, authConfig());
  return response.data;
}

export async function setConversationWallpaperPref(params: { me: string; peer: string; wallpaperId: string | null; opacity?: number }): Promise<{ saved: boolean }>{
  const response = await axios.post(`${CHAT_API_URL}/chat/preferences/wallpaper`, params, authConfig());
  return response.data;
}

// Build absolute URLs for chat-server static assets (e.g., /wallpapers/*.svg)
export function chatAssetUrl(relativePath: string): string {
  const base = (CHAT_API_URL || '').replace(/\/?api$/i, '');
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${base}${path}`;
}

// Upload chat media (images/videos) to chat service -> Cloudinary
export async function uploadChatMedia(file: File): Promise<{ url: string; mediaType: 'image' | 'video' }>{
  const form = new FormData();
  form.append('file', file);
  const config = authConfig();
  const response = await axios.post(`${CHAT_API_URL}/chat/upload-media`, form, {
    ...config,
    headers: {
      ...(config.headers || {}),
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
}

// Notifications API
export interface NotificationDTO {
  id: string;
  type: 'birthday' | 'friend_request' | 'gift_reserved' | 'wishlist_liked' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
  relatedUserId?: string;
  relatedUsername?: string;
  relatedUserAvatar?: string;
}


export interface NotificationCountDTO {
  unreadCount: number;
  totalCount: number;
}

export async function getNotifications(page = 1, pageSize = 20): Promise<NotificationDTO[]> {
  // Use user service since NotificationsController is in user_service
  const response = await axios.get(`${USER_API_URL}/notifications?page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  // Use user service since NotificationsController is in user_service
  const response = await axios.get(`${USER_API_URL}/notifications/unread-count`, authConfig());
  return response.data.unreadCount;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  // Use user service since NotificationsController is in user_service
  await axios.put(`${USER_API_URL}/notifications/${notificationId}/read`, null, authConfig());
}

export async function markAllNotificationsAsRead(): Promise<void> {
  // Use user service since NotificationsController is in user_service
  await axios.put(`${USER_API_URL}/notifications/read-all`, null, authConfig());
}

export async function getUpcomingBirthdays(daysAhead: number = 7): Promise<BirthdayReminderDTO[]> {
  try {
    console.log('API: Fetching birthdays from:', `${USER_API_URL}/notifications/birthdays?daysAhead=${daysAhead}`);
    console.log('API: USER_API_URL:', USER_API_URL);
    
    // Try the user service first
    const response = await axios.get(`${USER_API_URL}/notifications/birthdays?daysAhead=${daysAhead}`, authConfig());
    console.log('API: Birthday response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Error fetching birthdays:', error);
    
    if (axios.isAxiosError(error)) {
      console.error('API: Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
      
      // If it's a 404, try alternative endpoints
      if (error.response?.status === 404) {
        console.log('API: Trying alternative endpoints...');
        
        // Try main API
        try {
          const mainResponse = await axios.get(`${API_URL}/notifications/birthdays?daysAhead=7`, authConfig());
          console.log('API: Main API success:', mainResponse.data);
          return mainResponse.data;
        } catch (mainError) {
          console.error('API: Main API failed:', mainError);
        }
        
        // Try without /api prefix
        try {
          const altResponse = await axios.get(`${USER_API_URL.replace('/api', '')}/notifications/birthdays?daysAhead=7`, authConfig());
          console.log('API: Alternative endpoint success:', altResponse.data);
          return altResponse.data;
        } catch (altError) {
          console.error('API: Alternative endpoint failed:', altError);
        }
      }
    }
    
    // No fallback - return empty array if all endpoints fail
    console.log('API: All endpoints failed, returning empty array');
    return [];
  }
}

export async function updateUserBirthday(birthday: string): Promise<void> {
  await axios.put(`${USER_API_URL}/users/birthday`, { birthday }, authConfig());
}
