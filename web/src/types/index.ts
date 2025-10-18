// API Response Types
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  dateOfBirth?: string;
  location?: string;
}

// Wishlist Types
export interface Wishlist {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  gifts: Gift[];
}

// Gift Types
export interface Gift {
  id: string;
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  category?: string;
  priority: 'low' | 'medium' | 'high';
  isReserved: boolean;
  reservedBy?: string;
  reservedAt?: string;
  wishlistId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GiftCreateRequest {
  name: string;
  description?: string;
  price?: number;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  wishlistId: string;
}

export interface GiftUpdateRequest {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
}

// Chat Types
export interface ChatMessage {
  id: string;
  text: string;
  senderUserId: string;
  channelId: string;
  createdAt: string;
  customData?: Record<string, unknown>;
}

export interface ChatChannel {
  id: string;
  type: string;
  memberIds: string[];
  createdAt: string;
  customData?: Record<string, unknown>;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  token: string;
  password: string;
  confirmPassword: string;
}

// Filter and Sort Types
export type GiftSortOption = 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'priority' | 'created';
export type GiftCategory = 'electronics' | 'clothing' | 'books' | 'home' | 'sports' | 'toys' | 'other';

export interface GiftFilters {
  category?: GiftCategory;
  sortBy?: GiftSortOption;
  priceMin?: number;
  priceMax?: number;
  priority?: 'low' | 'medium' | 'high';
  isReserved?: boolean;
}

// Theme and Language Types
export type Theme = 'light' | 'dark' | 'auto';
export type Language = 'en' | 'ru' | 'az';

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

// Notification Types
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

export interface BirthdayReminderDTO {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  birthday: string;
  isToday: boolean;
  isTomorrow: boolean;
  daysUntilBirthday: number;
}

export interface NotificationCountDTO {
  unreadCount: number;
  totalCount: number;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

