import axios, { type AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5155/api';
const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:5219/api';
const GIFT_API_URL = process.env.NEXT_PUBLIC_GIFT_API_URL || 'http://localhost:5221/api';
const CHAT_API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL || 'http://localhost:5000/api';

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
  const response = await axios.post(`${AUTH_API_URL}/Auth/login`, {
    username: email,
    password
  });
  return response.data;
}

export async function register(username: string, email: string, password: string) {
  const response = await axios.post(`${AUTH_API_URL}/Auth/register`, { username, email, password });
  return response.data;
}

export async function forgotPassword(email: string) {
  const response = await axios.post(`${AUTH_API_URL}/Auth/forgot-password`, { email });
  return response.data;
}

export async function resetPassword(token: string, newPassword: string) {
  const response = await axios.post(`${AUTH_API_URL}/Auth/reset-password`, { token, newPassword });
  return response.data;
}

export async function checkEmailAvailability(email: string) {
  const response = await axios.get(`${AUTH_API_URL}/Auth/check-email?email=${encodeURIComponent(email)}`);
  return response.data;
}

export async function checkUsernameAvailability(username: string) {
  const response = await axios.get(`${AUTH_API_URL}/Auth/check-username?username=${encodeURIComponent(username)}`);
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
  createdAt: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
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
  const response = await axios.get(`${GIFT_API_URL}/Wishlists/feed?page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function getCategories(): Promise<string[]> {
  const response = await axios.get(`${GIFT_API_URL}/Wishlists/categories`, authConfig());
  return response.data;
}

export async function getWishlistDetails(id: string): Promise<WishlistResponseDTO> {
  const response = await axios.get(`${GIFT_API_URL}/Wishlists/${id}`, authConfig());
  return response.data;
}

export async function likeWishlist(id: string): Promise<boolean> {
  const response = await axios.post(`${GIFT_API_URL}/Wishlists/${id}/like`, null, authConfig());
  return response.data;
}

export async function unlikeWishlist(id: string): Promise<boolean> {
  const response = await axios.delete(`${GIFT_API_URL}/Wishlists/${id}/unlike`, authConfig());
  return response.data;
}

export async function createWishlist(payload: CreateWishlistDTO): Promise<WishlistResponseDTO> {
  const response = await axios.post(`${GIFT_API_URL}/Wishlists`, payload, authConfig());
  return response.data;
}

export async function updateWishlist(id: string, payload: {
  title?: string;
  description?: string | null;
  category?: string | null;
  isPublic?: boolean;
  allowedViewerIds?: string[];
}): Promise<WishlistResponseDTO> {
  const response = await axios.put(`${GIFT_API_URL}/Wishlists/${id}`, payload, authConfig());
  return response.data;
}

export async function deleteWishlist(id: string): Promise<void> {
  await axios.delete(`${GIFT_API_URL}/Wishlists/${id}`, authConfig());
}

// Users API
export interface UserProfileDTO {
  id: string;
  username: string;
  email: string;
  bio?: string | null;
  interests?: string[] | null;
  avatarUrl?: string | null;
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
}

export async function getUserProfile(id: string): Promise<UserProfileDTO> {
  const response = await axios.get(`${API_URL}/Users/${id}`, authConfig());
  return response.data;
}

export async function searchUsers(query: string, page = 1, pageSize = 10): Promise<UserSearchDTO[]> {
  const response = await axios.get(`${API_URL}/Users/search?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function getFollowers(id: string, page = 1, pageSize = 10): Promise<UserSearchDTO[]> {
  const response = await axios.get(`${API_URL}/Users/${id}/followers?page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function getFollowing(id: string, page = 1, pageSize = 10): Promise<UserSearchDTO[]> {
  const response = await axios.get(`${API_URL}/Users/${id}/following?page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function followUser(id: string): Promise<boolean> {
  const response = await axios.post(`${API_URL}/Users/follow/${id}`, null, authConfig());
  return response.data;
}

export async function unfollowUser(id: string): Promise<boolean> {
  const response = await axios.delete(`${API_URL}/Users/unfollow/${id}`, authConfig());
  return response.data;
}

export async function updateUserProfile(updateData: {
  username?: string;
  bio?: string;
  interests?: string[];
  isPrivate?: boolean;
}): Promise<UserProfileDTO> {
  const response = await axios.put(`${API_URL}/Users/profile`, updateData, authConfig());
  return response.data;
}

export async function updateUserAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(`${API_URL}/Users/avatar`, formData, {
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
  const response = await axios.get(`${GIFT_API_URL}/Wishlists/user/${userId}?page=${page}&pageSize=${pageSize}`, authConfig());
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
  const response = await axios.post(`${GIFT_API_URL}/Gift`, form, {
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
  const response = await axios.get(`${GIFT_API_URL}/Gift/wishlist${qs}`, authConfig());
  return response.data;
}

export async function getGiftById(id: string): Promise<GiftDTO> {
  const response = await axios.get(`${GIFT_API_URL}/Gift/${id}`, authConfig());
  return response.data;
}

export async function updateGift(id: string, payload: GiftUpdateDTO): Promise<void> {
  await axios.put(`${GIFT_API_URL}/Gift/${id}`, payload, authConfig());
}

export async function deleteGift(id: string): Promise<void> {
  await axios.delete(`${GIFT_API_URL}/Gift/${id}`, authConfig());
}

export async function uploadGiftImage(id: string, file: File): Promise<{ ImageUrl: string }> {
  const form = new FormData();
  form.append('imageFile', file);
  const config = authConfig();
  const response = await axios.post(`${GIFT_API_URL}/Gift/${id}/upload-image`, form, {
    ...config,
    headers: {
      ...(config.headers || {}),
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
}

export async function reserveGift(id: string): Promise<{ message: string; reservedBy: string }>{
  const response = await axios.post(`${GIFT_API_URL}/Gift/${id}/reserve`, null, authConfig());
  return response.data;
}

export async function cancelGiftReservation(id: string): Promise<{ message: string }>{
  const response = await axios.post(`${GIFT_API_URL}/Gift/${id}/cancel-reserve`, null, authConfig());
  return response.data;
}

export async function getReservedGifts(): Promise<GiftDTO[]> {
  const response = await axios.get(`${GIFT_API_URL}/Gift/reserved`, authConfig());
  return response.data;
}

export async function getSharedWishlistGifts(userId: string): Promise<GiftDTO[]> {
  const response = await axios.get(`${GIFT_API_URL}/Gift/shared/${userId}`, authConfig());
  return response.data;
}

export async function addGiftToWishlist(giftId: string, wishlistId: string): Promise<{ message: string }> {
  const response = await axios.post(`${GIFT_API_URL}/Gift/${giftId}/assign-to-wishlist`, { wishlistId }, authConfig());
  return response.data;
}

export async function removeGiftFromWishlist(giftId: string): Promise<{ message: string }> {
  const response = await axios.post(`${GIFT_API_URL}/Gift/${giftId}/remove-from-wishlist`, null, authConfig());
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