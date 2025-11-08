import axios, { type AxiosRequestConfig } from 'axios';
import { BirthdayReminderDTO, Event, EventInvitation, EventInvitationListResponse, EventListResponse, InvitationStatus, CreateEventRequest, UpdateEventRequest, RespondToInvitationRequest, NotificationListDTO } from '../types';

// Helper function to ensure HTTPS URLs (prevent mixed content) and block localhost in production
export function ensureHttps(url: string): string {
  if (!url || typeof url !== 'string') return url || '';
  
  // CRITICAL: Check if we're in production (Vercel deployment)
  const isProduction = typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1' &&
    !window.location.hostname.startsWith('192.168.') &&
    !window.location.hostname.startsWith('10.') &&
    window.location.hostname !== '';
  
  // ALWAYS block localhost/127.0.0.1 in production, regardless of protocol
  if (isProduction) {
    const hasLocalhost = url.includes('localhost') || 
                         url.includes('127.0.0.1') || 
                         url.includes(':5219') || 
                         url.includes(':5001') || 
                         url.includes(':5002') || 
                         url.includes(':5003') ||
                         url.includes(':3000') ||
                         url.match(/http:\/\/\d+\.\d+\.\d+\.\d+/); // Block any IP address with http
    
    if (hasLocalhost) {
      console.error('🚫 BLOCKED localhost/IP URL in production:', url);
      // Return default Render URL based on service type
      if (url.includes('auth') || url.includes('5219') || url.includes('/auth/')) {
        return 'https://wishera-auth-service.onrender.com/api';
      }
      if (url.includes('user') || url.includes('5001') || url.includes('/users/') || url.includes('/notifications/')) {
        return 'https://wishera-user-service.onrender.com/api';
      }
      if (url.includes('gift') || url.includes('5003') || url.includes('/wishlists/') || url.includes('/gift')) {
        return 'https://wishera-gift-service.onrender.com/api';
      }
      if (url.includes('chat') || url.includes('5002') || url.includes('/chat/')) {
        return 'https://wishera-chat-service.onrender.com/api';
      }
      return 'https://wishera-app.onrender.com/api';
    }
  }
  
  // If page is served over HTTPS, ensure API URL is also HTTPS
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    // Block any HTTP URLs when page is HTTPS
    if (url.startsWith('http://') && !url.startsWith('https://')) {
      const httpsUrl = url.replace(/^http:\/\//, 'https://');
      console.warn('🔒 Upgraded HTTP to HTTPS:', url, '->', httpsUrl);
      return httpsUrl;
    }
  }
  
  return url;
}

// Get secure URL at runtime (not at module load time)
function getSecureApiUrl(envVar: string | undefined, defaultValue: string): string {
  const rawUrl = envVar || defaultValue;
  return ensureHttps(rawUrl);
}

// Use getter functions to ensure URLs are checked at runtime, not build time
function getApiUrl(): string {
  return getSecureApiUrl(
    process.env.NEXT_PUBLIC_API_URL,
    typeof window !== 'undefined' ? '/api' : 'https://wishera-app.onrender.com/api'
  );
}

function getAuthApiUrl(): string {
  const url = getSecureApiUrl(
    process.env.NEXT_PUBLIC_AUTH_API_URL,
    'https://wishera-auth-service.onrender.com/api'
  );
  
  // Ensure the URL always ends with /api
  // Remove trailing slashes first
  let normalizedUrl = url.trim().replace(/\/+$/, '');
  
  // If it doesn't end with /api, add it
  if (!normalizedUrl.endsWith('/api')) {
    // If it ends with /auth, replace it with /api
    if (normalizedUrl.endsWith('/auth')) {
      normalizedUrl = normalizedUrl.replace(/\/auth$/, '/api');
    } else {
      // Otherwise, append /api
      normalizedUrl = normalizedUrl + '/api';
    }
  }
  
  return normalizedUrl;
}

function getChatApiUrl(): string {
  return getSecureApiUrl(
    process.env.NEXT_PUBLIC_CHAT_API_URL,
    'https://wishera-chat-service.onrender.com/api'
  );
}

function getGiftApiUrl(): string {
  return getSecureApiUrl(
    process.env.NEXT_PUBLIC_GIFT_API_URL,
    'https://wishera-gift-service.onrender.com/api'
  );
}

function getuserApiUrl(): string {
  return getSecureApiUrl(
    process.env.NEXT_PUBLIC_USER_API_URL,
    'https://wishera-user-service.onrender.com/api'
  );
}

// Export getters that are called at runtime
export const API_URL = () => getApiUrl();
export const AUTH_API_URL = () => getAuthApiUrl();
export const CHAT_API_URL = () => getChatApiUrl();
export const GIFT_API_URL = () => getGiftApiUrl();
export const USER_API_URL = () => getuserApiUrl();

// Ensure Authorization header is attached to all requests when token exists
// Increased timeout for Render free tier (can be slow to wake up)
axios.defaults.timeout = 60000; // 60 seconds for Render services
axios.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // CRITICAL: Fix URLs at request time to prevent localhost in production
    // This is the LAST LINE OF DEFENSE - catches everything!
    if (config.url) {
      const originalUrl = String(config.url);
      const fixedUrl = ensureHttps(originalUrl);
      if (fixedUrl !== originalUrl) {
        console.error('🔧 INTERCEPTOR FIXED URL:', originalUrl, '->', fixedUrl);
        config.url = fixedUrl;
      }
    }
    
    // Also fix baseURL if present
    if (config.baseURL) {
      const originalBaseUrl = String(config.baseURL);
      const fixedBaseUrl = ensureHttps(originalBaseUrl);
      if (fixedBaseUrl !== originalBaseUrl) {
        console.error('🔧 INTERCEPTOR FIXED baseURL:', originalBaseUrl, '->', fixedBaseUrl);
        config.baseURL = fixedBaseUrl;
      }
    }
    
    // Fix full URL if it's constructed from baseURL + url
    if (config.baseURL && config.url && !config.url.startsWith('http')) {
      const fullUrl = config.baseURL + (config.url.startsWith('/') ? config.url : '/' + config.url);
      const fixedFullUrl = ensureHttps(fullUrl);
      if (fixedFullUrl !== fullUrl) {
        console.error('🔧 INTERCEPTOR FIXED full URL:', fullUrl, '->', fixedFullUrl);
        // Extract the base URL from the fixed URL
        try {
          const urlObj = new URL(fixedFullUrl);
          config.baseURL = urlObj.origin + urlObj.pathname.split('/').slice(0, -1).join('/');
          config.url = urlObj.pathname.split('/').pop() || config.url;
        } catch (e) {
          // If URL parsing fails, just use the fixed full URL as the url
          config.url = fixedFullUrl;
          config.baseURL = '';
        }
      }
    }
    
    const token = localStorage.getItem('token');
    // Do not attach Authorization for public auth endpoints
    // Check for both /auth/ and /Auth/ (case-insensitive matching)
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
    // Get the URL and ensure it's secure
    // getAuthApiUrl() already ensures the URL ends with /api
    let authUrl = AUTH_API_URL();
    
    // Double-check with ensureHttps (in case env var slipped through)
    authUrl = ensureHttps(authUrl);
    
    // Normalize the URL to remove any double slashes and ensure proper formatting
    authUrl = authUrl.trim().replace(/\/+$/, ''); // Remove trailing slashes
    if (!authUrl.endsWith('/api')) {
      // Ensure it ends with /api
      if (authUrl.endsWith('/auth')) {
        authUrl = authUrl.replace(/\/auth$/, '/api');
      } else {
        authUrl = authUrl + '/api';
      }
    }
    
    // Backend route is [Route("api/[controller]")] with [HttpPost("login")]
    // ASP.NET Core default is /api/Auth/login (capital A), but some configs use lowercase
    // Try uppercase first (ASP.NET Core default), then lowercase if that fails
    const loginUrlUpper = `${authUrl}/Auth/login`;
    const loginUrlLower = `${authUrl}/auth/login`;
    
    // Log for debugging
    console.log('🔍 LOGIN DEBUG:', {
      envVar: process.env.NEXT_PUBLIC_AUTH_API_URL,
      computedUrl: authUrl,
      tryingUrl: loginUrlUpper,
      fallbackUrl: loginUrlLower,
      isProduction: typeof window !== 'undefined' && window.location.hostname !== 'localhost',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
      protocol: typeof window !== 'undefined' ? window.location.protocol : 'N/A'
    });
    
    // Final safety check - if URL still contains localhost, throw error
    if (typeof window !== 'undefined' && 
        window.location.hostname !== 'localhost' && 
        (loginUrlUpper.includes('localhost') || loginUrlLower.includes('localhost'))) {
      console.error('❌ CRITICAL: Localhost detected in login URL after all checks!');
      throw new Error('Invalid API URL configuration. Please contact support.');
    }
    
    // Try uppercase first (ASP.NET Core default)
    try {
      console.log('API: Attempting login to:', loginUrlUpper);
      const response = await axios.post(loginUrlUpper, { email, password }, { timeout: 60000 });
      console.log('API: Login successful');
      return response.data;
    } catch (upperError: any) {
      // If 404, try lowercase path
      if (axios.isAxiosError(upperError) && upperError.response?.status === 404) {
        console.log('API: Uppercase path failed with 404, trying lowercase:', loginUrlLower);
        try {
          const response = await axios.post(loginUrlLower, { email, password }, { timeout: 60000 });
          console.log('API: Login successful with lowercase path');
          return response.data;
        } catch (lowerError) {
          // If lowercase also fails, throw the original error
          throw upperError;
        }
      }
      // For other errors (400, 401, etc.), throw the original error
      throw upperError;
    }
  } catch (error) {
    console.error('API: Login failed:', error);
    if (axios.isAxiosError(error)) {
      // Log detailed error information
      if (error.response) {
        console.error('API: Login error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          url: error.config?.url
        });
      }
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Request timed out. The service may be starting up. Please try again in a moment.');
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Authentication service is not available. Please check if the auth service is running.');
      }
      if (error.response?.status === 400) {
        // 400 Bad Request - provide more details
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Invalid request. Please check your email and password.';
        throw new Error(errorMessage);
      }
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password.');
      }
      if (error.response?.status === 404) {
        throw new Error('Login endpoint not found. Please check the auth service configuration.');
      }
      if (error.response?.status === 0 || !error.response) {
        throw new Error('Unable to connect to the authentication service. The service may be starting up or unavailable.');
      }
      // Pass through the error message from the backend if available
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
    }
    throw error;
  }
}

export async function register(username: string, email: string, password: string) {
  try {
    // Get the URL and ensure it's secure
    // getAuthApiUrl() already ensures the URL ends with /api
    let authUrl = AUTH_API_URL();
    
    // Double-check with ensureHttps (in case env var slipped through)
    authUrl = ensureHttps(authUrl);
    
    // Normalize the URL to remove any double slashes and ensure proper formatting
    authUrl = authUrl.trim().replace(/\/+$/, ''); // Remove trailing slashes
    if (!authUrl.endsWith('/api')) {
      // Ensure it ends with /api
      if (authUrl.endsWith('/auth')) {
        authUrl = authUrl.replace(/\/auth$/, '/api');
      } else {
        authUrl = authUrl + '/api';
      }
    }
    
    // Backend route is [Route("api/[controller]")] with [HttpPost("register")]
    // ASP.NET Core default is /api/Auth/register (capital A), but some configs use lowercase
    // Try uppercase first (ASP.NET Core default), then lowercase if that fails
    const registerUrlUpper = `${authUrl}/Auth/register`;
    const registerUrlLower = `${authUrl}/auth/register`;
    
    // Log for debugging
    console.log('🔍 REGISTER DEBUG:', {
      envVar: process.env.NEXT_PUBLIC_AUTH_API_URL,
      computedUrl: authUrl,
      tryingUrl: registerUrlUpper,
      fallbackUrl: registerUrlLower,
      isProduction: typeof window !== 'undefined' && window.location.hostname !== 'localhost',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
      protocol: typeof window !== 'undefined' ? window.location.protocol : 'N/A'
    });
    
    // Final safety check - if URL still contains localhost, throw error
    if (typeof window !== 'undefined' && 
        window.location.hostname !== 'localhost' && 
        (registerUrlUpper.includes('localhost') || registerUrlLower.includes('localhost'))) {
      console.error('❌ CRITICAL: Localhost detected in register URL after all checks!');
      throw new Error('Invalid API URL configuration. Please contact support.');
    }
    
    // Try uppercase first (ASP.NET Core default)
    try {
      console.log('API: Attempting registration to:', registerUrlUpper);
      const response = await axios.post(registerUrlUpper, { username, email, password }, { timeout: 60000 });
      console.log('API: Registration successful');
      return response.data;
    } catch (upperError: any) {
      // If 404, try lowercase path
      if (axios.isAxiosError(upperError) && upperError.response?.status === 404) {
        console.log('API: Uppercase path failed with 404, trying lowercase:', registerUrlLower);
        try {
          const response = await axios.post(registerUrlLower, { username, email, password }, { timeout: 60000 });
          console.log('API: Registration successful with lowercase path');
          return response.data;
        } catch (lowerError) {
          // If lowercase also fails, throw the original error
          throw upperError;
        }
      }
      // For other errors (400, 401, etc.), throw the original error
      throw upperError;
    }
  } catch (error) {
    console.error('API: Registration failed:', error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        console.error('❌ 404 Error - Endpoint not found. URL was:', error.config?.url);
        throw new Error('Registration endpoint not found. The service may be misconfigured. Please contact support.');
      }
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Request timed out. The service may be starting up. Please try again in a moment.');
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Authentication service is not available. Please check if the auth service is running.');
      }
      if (error.response?.status === 0 || !error.response) {
        throw new Error('Unable to connect to the authentication service. The service may be starting up or unavailable.');
      }
      // Pass through the actual error message from the backend
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      // Fallback messages for specific status codes
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
  const authUrl = AUTH_API_URL().trim().replace(/\/+$/, '');
  const response = await axios.post(`${authUrl}/auth/forgot-password`, { email });
  return response.data;
}

export async function verifyEmail(token: string) {
  const authUrl = AUTH_API_URL().trim().replace(/\/+$/, '');
  const response = await axios.get(`${authUrl}/auth/verify-email`, { params: { token } });
  return response.data;
}

export async function resendVerificationEmail(email: string) {
  const authUrl = AUTH_API_URL().trim().replace(/\/+$/, '');
  const response = await axios.post(`${authUrl}/auth/resend-verification`, { email });
  return response.data;
}

export async function deleteAccount() {
  const token = localStorage.getItem('token');
  const authUrl = AUTH_API_URL().trim().replace(/\/+$/, '');
  const response = await axios.delete(`${authUrl}/auth/delete-account`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

export async function resetPassword(token: string, newPassword: string) {
  const authUrl = AUTH_API_URL().trim().replace(/\/+$/, '');
  const response = await axios.post(`${authUrl}/auth/reset-password`, { token, newPassword });
  return response.data;
}

export async function checkEmailAvailability(email: string) {
  const authUrl = AUTH_API_URL().trim().replace(/\/+$/, '');
  const response = await axios.get(`${authUrl}/auth/check-email?email=${encodeURIComponent(email)}`);
  return response.data;
}

export async function checkUsernameAvailability(username: string) {
  const authUrl = AUTH_API_URL().trim().replace(/\/+$/, '');
  const response = await axios.get(`${authUrl}/auth/check-username?username=${encodeURIComponent(username)}`);
  return response.data;
}

// Helpers for authorized requests
function authConfig(): AxiosRequestConfig {
  if (typeof window === 'undefined') return {} as AxiosRequestConfig;
  const token = localStorage.getItem('token');
  return token
    ? { 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 60000 // 60 second timeout for Render services
      }
    : { timeout: 60000 };
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
  const response = await axios.get(`${GIFT_API_URL()}/wishlists/feed?page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function getCategories(): Promise<string[]> {
  const response = await axios.get(`${GIFT_API_URL()}/wishlists/categories`, authConfig());
  return response.data;
}

export async function getWishlistDetails(id: string): Promise<WishlistResponseDTO> {
  const response = await axios.get(`${GIFT_API_URL()}/wishlists/${id}`, authConfig());
  return response.data;
}

export async function getMyReservedGifts(): Promise<GiftDTO[]> {
  try {
    // Try the main API URL first, then fallback to gift service
    const mainApiUrl = API_URL();
    const giftServiceUrl = GIFT_API_URL();
    
    try {
      // Try main app first
      console.log('Trying main app endpoint:', `${mainApiUrl}/reserved`);
      const response = await axios.get(`${mainApiUrl}/reserved`, authConfig());
      console.log('Main app response successful');
      return response.data;
    } catch (mainError) {
      console.log('Main app endpoint failed, trying gift service...', mainError);
      // Fallback to gift service
      console.log('Trying gift service endpoint:', `${giftServiceUrl}/reserved`);
      const response = await axios.get(`${giftServiceUrl}/reserved`, authConfig());
      console.log('Gift service response successful');
      return response.data;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED' || error.response?.status === 0) {
        throw new Error('Backend services are currently unavailable. Please make sure the backend services are running on ports 5155 and 5003.');
      } else if (error.response?.status === 404) {
        throw new Error('Reserved gifts endpoint not found. Please check if the backend service is properly configured.');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized. Please login again.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
    }
    throw error;
  }
}

export async function likeWishlist(id: string): Promise<boolean> {
  const response = await axios.post(`${GIFT_API_URL()}/wishlists/${id}/like`, null, authConfig());
  return response.data;
}

export async function unlikeWishlist(id: string): Promise<boolean> {
  const response = await axios.delete(`${GIFT_API_URL()}/wishlists/${id}/unlike`, authConfig());
  return response.data;
}

export async function createWishlist(payload: CreateWishlistDTO): Promise<WishlistResponseDTO> {
  const response = await axios.post(`${GIFT_API_URL()}/wishlists`, payload, authConfig());
  return response.data;
}

export async function updateWishlist(id: string, payload: {
  title?: string;
  description?: string | null;
  category?: string | null;
  isPublic?: boolean;
  allowedViewerIds?: string[];
}): Promise<WishlistResponseDTO> {
  const response = await axios.put(`${GIFT_API_URL()}/wishlists/${id}`, payload, authConfig());
  return response.data;
}

export async function deleteWishlist(id: string): Promise<void> {
  await axios.delete(`${GIFT_API_URL()}/wishlists/${id}`, authConfig());
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
  const response = await axios.get(`${USER_API_URL()}/users/${id}`, authConfig());
  return response.data;
}

export async function searchUsers(query: string, page = 1, pageSize = 10): Promise<UserSearchDTO[]> {
  const response = await axios.get(`${USER_API_URL()}/users/search?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function getFollowers(id: string, page = 1, pageSize = 10): Promise<UserSearchDTO[]> {
  const response = await axios.get(`${USER_API_URL()}/users/${id}/followers?page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function getFollowing(id: string, page = 1, pageSize = 10): Promise<UserSearchDTO[]> {
  const response = await axios.get(`${USER_API_URL()}/users/${id}/following?page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function getMyFriends(page = 1, pageSize = 10): Promise<UserSearchDTO[]> {
  const response = await axios.get(`${USER_API_URL()}/users/my-friends?page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function followUser(id: string): Promise<boolean> {
  const response = await axios.post(`${USER_API_URL()}/users/follow/${id}`, null, authConfig());
  return response.data;
}

export async function unfollowUser(id: string): Promise<boolean> {
  const response = await axios.delete(`${USER_API_URL()}/users/unfollow/${id}`, authConfig());
  return response.data;
}

export async function getSuggestedUsers(userId: string, page = 1, pageSize = 10): Promise<UserSearchDTO[]> {
  const response = await axios.get(`${USER_API_URL()}/users/suggested?userId=${userId}&page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function updateUserProfile(updateData: {
  username?: string;
  bio?: string;
  interests?: string[];
  isPrivate?: boolean;
  birthday?: string;
}): Promise<UserProfileDTO> {
  const response = await axios.put(`${USER_API_URL()}/users/profile`, updateData, authConfig());
  return response.data;
}

export async function updateUserAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(`${USER_API_URL()}/users/avatar`, formData, {
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
  const response = await axios.get(`${GIFT_API_URL()}/wishlists/user/${userId}?page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

// Liked wishlists
export async function getLikedWishlists(page = 1, pageSize = 20): Promise<WishlistFeedDTO[]> {
  const response = await axios.get(`${GIFT_API_URL()}/wishlists/liked?page=${page}&pageSize=${pageSize}`, authConfig());
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
  const response = await axios.post(`${GIFT_API_URL()}/gift`, form, {
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
  const response = await axios.get(`${GIFT_API_URL()}/gift/wishlist${qs}`, authConfig());
  return response.data;
}

export async function getGiftById(id: string): Promise<GiftDTO> {
  const response = await axios.get(`${GIFT_API_URL()}/gift/${id}`, authConfig());
  return response.data;
}

export async function updateGift(id: string, payload: GiftUpdateDTO): Promise<void> {
  await axios.put(`${GIFT_API_URL()}/gift/${id}`, payload, authConfig());
}

export async function deleteGift(id: string): Promise<void> {
  await axios.delete(`${GIFT_API_URL()}/gift/${id}`, authConfig());
}

export async function uploadGiftImage(id: string, file: File): Promise<{ ImageUrl: string }> {
  const form = new FormData();
  form.append('imageFile', file);
  const config = authConfig();
  const response = await axios.post(`${GIFT_API_URL()}/gift/${id}/upload-image`, form, {
    ...config,
    headers: {
      ...(config.headers || {}),
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
}

export async function reserveGift(id: string): Promise<{ message: string; reservedBy: string }>{
  try {
    const response = await axios.post(`${GIFT_API_URL()}/gift/${id}/reserve`, null, authConfig());
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED' || error.response?.status === 0) {
        throw new Error('Gift service is currently unavailable. Please try again later.');
      } else if (error.response?.status === 404) {
        throw new Error('Gift not found. Please refresh the page and try again.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
    }
    throw error;
  }
}

export async function cancelGiftReservation(id: string): Promise<{ message: string }>{
  try {
    const response = await axios.post(`${GIFT_API_URL()}/gift/${id}/cancel-reserve`, null, authConfig());
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED' || error.response?.status === 0) {
        throw new Error('Gift service is currently unavailable. Please try again later.');
      } else if (error.response?.status === 404) {
        throw new Error('Gift not found. Please refresh the page and try again.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
    }
    throw error;
  }
}

export async function getReservedGifts(): Promise<GiftDTO[]> {
  const response = await axios.get(`${GIFT_API_URL()}/gift/reserved`, authConfig());
  return response.data;
}

export async function getSharedWishlistGifts(userId: string): Promise<GiftDTO[]> {
  const response = await axios.get(`${GIFT_API_URL()}/gift/shared/${userId}`, authConfig());
  return response.data;
}

export async function addGiftToWishlist(giftId: string, wishlistId: string): Promise<{ message: string }> {
  const response = await axios.post(`${GIFT_API_URL()}/gift/${giftId}/assign-to-wishlist`, { wishlistId }, authConfig());
  return response.data;
}

export async function removeGiftFromWishlist(giftId: string): Promise<{ message: string }> {
  const response = await axios.post(`${GIFT_API_URL()}/gift/${giftId}/remove-from-wishlist`, null, authConfig());
  return response.data;
}

// Chat API (Chat microservice)
export async function createChatToken(userId: string, expiresInMinutes?: number): Promise<{ token: string }> {
  const response = await axios.post(`${CHAT_API_URL()}/chat/token`, { userId, expiresInMinutes });
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
  await axios.post(`${CHAT_API_URL()}/chat/channel`, payload, authConfig());
}

export interface SendChatMessageDTO {
  channelType: string;
  channelId: string;
  senderUserId: string;
  text: string;
  customData?: Record<string, any>;
}

export async function sendChatMessage(payload: SendChatMessageDTO): Promise<{ messageId: string }> {
  const response = await axios.post(`${CHAT_API_URL()}/chat/message`, payload, authConfig());
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
  const response = await axios.get(`${CHAT_API_URL()}/chat/history?userA=${encodeURIComponent(userA)}&userB=${encodeURIComponent(userB)}&page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function editChatMessage(messageId: string, newText: string): Promise<{ updated: boolean }> {
  const response = await axios.post(`${CHAT_API_URL()}/chat/message/edit`, { messageId, newText }, authConfig());
  return response.data;
}

export async function deleteChatMessage(messageId: string): Promise<{ deleted: boolean }> {
  const response = await axios.post(`${CHAT_API_URL()}/chat/message/delete`, { messageId }, authConfig());
  return response.data;
}

// Chat pins (server-side)
export type PinScope = 'global' | 'personal';
export interface PinnedMessageDTO {
  id: string;
  conversationId: string;
  messageId: string;
  scope: PinScope;
  pinnedByUserId: string;
  createdAt: string;
}

function convKey(a: string, b: string): string {
  const [x, y] = [String(a || '').trim(), String(b || '').trim()].sort();
  return `${x}:${y}`;
}

export async function getPinnedMessages(meUserId: string, peerUserId: string): Promise<PinnedMessageDTO[]> {
  try {
    // Skip network if we've learned pins API isn't available
    if (typeof window !== 'undefined') {
      const supported = localStorage.getItem('chat:pins:supported');
      if (supported === '0') throw { response: { status: 404 } } as any;
    }
    const response = await axios.get(`${CHAT_API_URL()}/chat/pins?me=${encodeURIComponent(meUserId)}&peer=${encodeURIComponent(peerUserId)}`, authConfig());
    if (typeof window !== 'undefined') localStorage.setItem('chat:pins:supported', '1');
    return response.data;
  } catch (e: any) {
    if (e?.response?.status === 404 && typeof window !== 'undefined') {
      try {
        localStorage.setItem('chat:pins:supported', '0');
        const key = `chat:pins:global:${convKey(meUserId, peerUserId)}`;
        const raw = localStorage.getItem(key);
        const ids: string[] = raw ? JSON.parse(raw) : [];
        return ids.map((messageId, idx) => ({
          id: `local-${idx}-${messageId}`,
          conversationId: convKey(meUserId, peerUserId),
          messageId,
          scope: 'global' as PinScope,
          pinnedByUserId: meUserId,
          createdAt: new Date().toISOString()
        }));
      } catch { return []; }
    }
    throw e;
  }
}

export async function pinChatMessage(params: { me: string; peer: string; messageId: string; scope: PinScope }): Promise<{ pinned: boolean; id: string }>{
  try {
    if (typeof window !== 'undefined') {
      const supported = localStorage.getItem('chat:pins:supported');
      if (supported === '0') throw { response: { status: 404 } } as any;
    }
    const response = await axios.post(`${CHAT_API_URL()}/chat/pins`, params, authConfig());
    if (typeof window !== 'undefined') localStorage.setItem('chat:pins:supported', '1');
    return response.data;
  } catch (e: any) {
    if (e?.response?.status === 404 && typeof window !== 'undefined') {
      try {
        localStorage.setItem('chat:pins:supported', '0');
        if (params.scope === 'global') {
          const key = `chat:pins:global:${convKey(params.me, params.peer)}`;
          const raw = localStorage.getItem(key);
          const ids: string[] = raw ? JSON.parse(raw) : [];
          if (!ids.includes(params.messageId)) {
            const next = [params.messageId, ...ids];
            localStorage.setItem(key, JSON.stringify(next));
          }
          return { pinned: true, id: `local-${params.messageId}` };
        }
      } catch {}
    }
    throw e;
  }
}

export async function unpinChatMessage(params: { me: string; peer: string; messageId: string; scope?: PinScope }): Promise<{ unpinned: boolean }>{
  try {
    if (typeof window !== 'undefined') {
      const supported = localStorage.getItem('chat:pins:supported');
      if (supported === '0') throw { response: { status: 404 } } as any;
    }
    const response = await axios.request({ method: 'DELETE', url: `${CHAT_API_URL()}/chat/pins`, data: params, ...authConfig() });
    if (typeof window !== 'undefined') localStorage.setItem('chat:pins:supported', '1');
    return response.data;
  } catch (e: any) {
    if (e?.response?.status === 404 && typeof window !== 'undefined') {
      try {
        localStorage.setItem('chat:pins:supported', '0');
        if (params.scope === 'global') {
          const key = `chat:pins:global:${convKey(params.me, params.peer)}`;
          const raw = localStorage.getItem(key);
          const ids: string[] = raw ? JSON.parse(raw) : [];
          const next = ids.filter(id => id !== params.messageId);
          localStorage.setItem(key, JSON.stringify(next));
          return { unpinned: true };
        }
      } catch {}
    }
    throw e;
  }
}

// Chat preferences (e.g., per-conversation wallpaper)
export async function getConversationWallpaper(meUserId: string, peerUserId: string): Promise<{ url: string | null }> {
  const response = await axios.get(`${CHAT_API_URL()}/chat/preferences/wallpaper?me=${encodeURIComponent(meUserId)}&peer=${encodeURIComponent(peerUserId)}`, authConfig());
  return response.data;
}

export async function setConversationWallpaper(meUserId: string, peerUserId: string, url: string | null): Promise<{ saved: boolean }> {
  const response = await axios.post(`${CHAT_API_URL()}/chat/preferences/wallpaper`, { me: meUserId, peer: peerUserId, url }, authConfig());
  return response.data;
}

// Wallpaper catalog + preferences (id/opacity-based)
export interface WallpaperCatalogItemDTO {
  id: string;
  name: string;
  description: string;
  category: 'abstract' | 'nature' | 'minimal' | 'geometric' | 'custom';
  supportsDark: boolean;
  supportsLight: boolean;
  previewUrl: string;
}

export async function getWallpaperCatalog(userId?: string): Promise<WallpaperCatalogItemDTO[]> {
  const url = userId ? `${CHAT_API_URL()}/chat/wallpapers?userId=${encodeURIComponent(userId)}` : `${CHAT_API_URL()}/chat/wallpapers`;
  const response = await axios.get(url, authConfig());
  return response.data;
}

// Custom wallpaper management
export interface CustomWallpaperUploadDTO {
  wallpaperId: string;
  url: string;
  name: string;
  description: string;
  category: string;
  supportsDark: boolean;
  supportsLight: boolean;
}

export async function uploadCustomWallpaper(
  file: File, 
  userId: string, 
  name?: string, 
  description?: string, 
  category?: string, 
  supportsDark: boolean = true, 
  supportsLight: boolean = true
): Promise<CustomWallpaperUploadDTO> {
  const form = new FormData();
  form.append('file', file);
  form.append('userId', userId);
  if (name) form.append('name', name);
  if (description) form.append('description', description);
  if (category) form.append('category', category);
  form.append('supportsDark', supportsDark.toString());
  form.append('supportsLight', supportsLight.toString());

  const response = await axios.post(`${CHAT_API_URL()}/chat/upload-wallpaper`, form, {
    ...authConfig(),
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function getCustomWallpapers(userId: string): Promise<WallpaperCatalogItemDTO[]> {
  const response = await axios.get(`${CHAT_API_URL()}/chat/custom-wallpapers?userId=${encodeURIComponent(userId)}`, authConfig());
  return response.data;
}

export async function deleteCustomWallpaper(wallpaperId: string, userId: string): Promise<{ deleted: boolean }> {
  const response = await axios.delete(`${CHAT_API_URL()}/chat/custom-wallpapers/${encodeURIComponent(wallpaperId)}?userId=${encodeURIComponent(userId)}`, authConfig());
  return response.data;
}

export interface WallpaperPrefDTO { 
  wallpaperId: string | null; 
  opacity: number; 
  wallpaperUrl?: string | null; 
}
export async function getConversationWallpaperPref(meUserId: string, peerUserId: string): Promise<WallpaperPrefDTO> {
  const response = await axios.get(`${CHAT_API_URL()}/chat/preferences/wallpaper?me=${encodeURIComponent(meUserId)}&peer=${encodeURIComponent(peerUserId)}`, authConfig());
  return response.data;
}

export async function setConversationWallpaperPref(params: { me: string; peer: string; wallpaperId: string | null; opacity?: number }): Promise<{ saved: boolean }>{
  const response = await axios.post(`${CHAT_API_URL()}/chat/preferences/wallpaper`, params, authConfig());
  return response.data;
}

// Build absolute URLs for chat-server static assets (e.g., /wallpapers/*.svg)
export function chatAssetUrl(relativePath: string): string {
  const base = (CHAT_API_URL() || '').replace(/\/?api$/i, '');
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${base}${path}`;
}

// Upload chat media (images/videos) to chat service -> Cloudinary
export async function uploadChatMedia(file: File): Promise<{ url: string; mediaType: 'image' | 'video' | 'audio' }>{
  const form = new FormData();
  form.append('file', file);
  const config = authConfig();
  const response = await axios.post(`${CHAT_API_URL()}/chat/upload-media`, form, {
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

export async function getNotifications(page = 1, pageSize = 20) {
  // Use user service since NotificationsController is in user_service
  const userServiceUrl = USER_API_URL();
  const response = await axios.get(`${userServiceUrl}/notifications?page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  // Use user service
  const userServiceUrl = USER_API_URL();
  const response = await axios.get(`${userServiceUrl}/notifications/unread-count`, authConfig());
  return response.data.unreadCount;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  // Use user service - mark-read endpoint expects array of IDs
  const userServiceUrl = USER_API_URL();
  await axios.put(`${userServiceUrl}/notifications/mark-read`, {
    notificationIds: [notificationId]
  }, authConfig());
}

export async function markAllNotificationsAsRead(): Promise<void> {
  // Use user service
  const userServiceUrl = USER_API_URL();
  await axios.put(`${userServiceUrl}/notifications/mark-all-read`, null, authConfig());
}

export async function deleteNotification(notificationId: string): Promise<void> {
  // Use user service
  const userServiceUrl = USER_API_URL();
  await axios.delete(`${userServiceUrl}/notifications/${notificationId}`, authConfig());
}

export async function getUpcomingBirthdays(daysAhead: number = 7): Promise<BirthdayReminderDTO[]> {
  try {
    console.log('API: Fetching birthdays from:', `${USER_API_URL()}/notifications/birthdays?daysAhead=${daysAhead}`);
    console.log('API: USER_API_URL():', USER_API_URL());
    
    // Try the user service first
    const response = await axios.get(`${USER_API_URL()}/notifications/birthdays?daysAhead=${daysAhead}`, authConfig());
    console.log('API: Birthday response:', response.data);
    
    // The backend now returns BirthdayReminderDTO[] directly
    const birthdayDTOs = response.data || [];
    const birthdayReminders: BirthdayReminderDTO[] = birthdayDTOs.map((dto: any) => {
      return {
        id: dto.id || dto.userId,
        userId: dto.userId,
        username: dto.username,
        avatarUrl: dto.avatarUrl || '',
        birthday: dto.birthday,
        isToday: dto.isToday,
        isTomorrow: dto.isTomorrow,
        daysUntilBirthday: dto.daysUntilBirthday
      };
    });
    
    return birthdayReminders;
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
          const altResponse = await axios.get(`${USER_API_URL().replace('/api', '')}/notifications/birthdays?daysAhead=7`, authConfig());
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
  await axios.put(`${USER_API_URL()}/users/birthday`, { birthday }, authConfig());
}

// Events API
export async function createEvent(eventData: CreateEventRequest): Promise<Event> {
  // Convert eventTime from "HH:mm" to "HH:mm:ss" format for TimeSpan
  const formattedData = {
    ...eventData,
    eventTime: eventData.eventTime ? `${eventData.eventTime}:00` : undefined
  };
  
  const response = await axios.post(`${USER_API_URL()}/events`, formattedData, authConfig());
  return response.data;
}

export async function getEventById(id: string): Promise<Event> {
  const response = await axios.get(`${USER_API_URL()}/events/${id}`, authConfig());
  return response.data;
}

export async function getMyEvents(page = 1, pageSize = 10): Promise<EventListResponse> {
  const response = await axios.get(`${USER_API_URL()}/events/my-events?page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function getInvitedEvents(page = 1, pageSize = 10): Promise<EventListResponse> {
  const response = await axios.get(`${USER_API_URL()}/events/invited-events?page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function updateEvent(id: string, eventData: UpdateEventRequest): Promise<Event> {
  const response = await axios.put(`${USER_API_URL()}/events/${id}`, eventData, authConfig());
  return response.data;
}

export async function cancelEvent(id: string): Promise<{ message: string; success: boolean }> {
  const response = await axios.put(`${USER_API_URL()}/events/${id}/cancel`, null, authConfig());
  return response.data;
}

export async function deleteEvent(id: string): Promise<{ message: string; success: boolean }> {
  const response = await axios.delete(`${USER_API_URL()}/events/${id}`, authConfig());
  return response.data;
}

export async function getEventInvitations(eventId: string): Promise<EventInvitation[]> {
  const response = await axios.get(`${USER_API_URL()}/events/${eventId}/invitations`, authConfig());
  return response.data;
}

// Event Invitations API
export async function getMyInvitations(page = 1, pageSize = 10): Promise<EventInvitationListResponse> {
  const response = await axios.get(`${USER_API_URL()}/events/my-invitations?page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function getPendingInvitations(page = 1, pageSize = 10): Promise<EventInvitationListResponse> {
  const response = await axios.get(`${USER_API_URL()}/events/my-invitations?page=${page}&pageSize=${pageSize}`, authConfig());
  return response.data;
}

export async function respondToInvitation(invitationId: string, response: RespondToInvitationRequest): Promise<EventInvitation> {
  const axiosResponse = await axios.post(`${USER_API_URL()}/events/invitations/${invitationId}/respond`, response, authConfig());
  return axiosResponse.data;
}
