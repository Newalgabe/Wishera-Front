"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BellIcon, 
  XMarkIcon,
  GiftIcon,
  CalendarIcon,
  UserIcon,
  HeartIcon,
  CheckIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { 
  GiftIcon as GiftIconSolid,
  CalendarIcon as CalendarIconSolid,
  HeartIcon as HeartIconSolid
} from "@heroicons/react/24/solid";
import { NotificationDTO, NotificationType, NotificationListDTO } from "../types";
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  deleteNotification
} from "../app/api";
import { useLanguage } from "../contexts/LanguageContext";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export default function NotificationDropdown({ 
  isOpen, 
  onClose, 
  className = "" 
}: NotificationDropdownProps) {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await getNotifications(1, 20);
      
      // Handle NotificationListDTO response structure
      if (data && typeof data === 'object') {
        if ('notifications' in data) {
          // New API structure with pagination
          const listData = data as NotificationListDTO;
          setNotifications(listData.notifications || []);
          setUnreadCount(listData.unreadCount || 0);
        } else if (Array.isArray(data)) {
          // Fallback for array response
          setNotifications(data);
          const unreadCountData = await getUnreadNotificationCount();
          setUnreadCount(unreadCountData);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDelete = async (notificationId: string, isRead: boolean) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      if (!isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type: NotificationType, isRead: boolean) => {
    const iconClass = `w-5 h-5 ${isRead ? 'text-gray-400' : 'text-indigo-500'}`;
    
    switch (type) {
      case NotificationType.BirthdayReminder:
      case NotificationType.EventInvitation:
      case NotificationType.EventReminder:
        return isRead ? (
          <CalendarIcon className={iconClass} />
        ) : (
          <CalendarIconSolid className={iconClass} />
        );
      case NotificationType.GiftReserved:
      case NotificationType.GiftReceived:
        return isRead ? (
          <GiftIcon className={iconClass} />
        ) : (
          <GiftIconSolid className={iconClass} />
        );
      case NotificationType.LikeReceived:
      case NotificationType.WishlistShared:
        return isRead ? (
          <HeartIcon className={iconClass} />
        ) : (
          <HeartIconSolid className={iconClass} />
        );
      case NotificationType.FriendRequest:
      case NotificationType.FriendAccepted:
      case NotificationType.UserSuggestion:
        return <UserIcon className={iconClass} />;
      default:
        return <BellIcon className={iconClass} />;
    }
  };

  const formatTimeAgo = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return t('notifications.justNow');
    if (diffInMinutes < 60) return t('notifications.minutesAgo', { minutes: diffInMinutes });
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t('notifications.hoursAgo', { hours: diffInHours });
    
    const diffInDays = Math.floor(diffInHours / 24);
    return t('notifications.daysAgo', { days: diffInDays });
  };

  const getNotificationColor = (type: NotificationType, isRead: boolean) => {
    if (isRead) return 'bg-gray-50 dark:bg-gray-800/50';
    
    switch (type) {
      case NotificationType.BirthdayReminder:
        return 'bg-pink-50 dark:bg-pink-900/20 border-l-pink-500';
      case NotificationType.GiftReserved:
      case NotificationType.GiftReceived:
        return 'bg-green-50 dark:bg-green-900/20 border-l-green-500';
      case NotificationType.LikeReceived:
      case NotificationType.WishlistShared:
        return 'bg-purple-50 dark:bg-purple-900/20 border-l-purple-500';
      case NotificationType.FriendRequest:
      case NotificationType.FriendAccepted:
      case NotificationType.UserSuggestion:
        return 'bg-indigo-50 dark:bg-indigo-900/20 border-l-indigo-500';
      case NotificationType.EventInvitation:
      case NotificationType.EventReminder:
        return 'bg-blue-50 dark:bg-blue-900/20 border-l-blue-500';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-l-gray-500';
    }
  };

  const getNotificationTitleKey = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.GiftReserved:
        return 'notifications.titles.giftReserved';
      case NotificationType.GiftReceived:
        return 'notifications.titles.giftReceived';
      case NotificationType.LikeReceived:
        return 'notifications.titles.wishlistLiked';
      case NotificationType.FriendRequest:
        return 'notifications.titles.friendRequest';
      case NotificationType.FriendAccepted:
        return 'notifications.titles.newFollower';
      case NotificationType.EventInvitation:
        return 'notifications.titles.eventInvitation';
      case NotificationType.EventReminder:
        return 'notifications.titles.eventReminder';
      case NotificationType.BirthdayReminder:
        return 'notifications.titles.birthdayReminder';
      case NotificationType.WishlistShared:
        return 'notifications.titles.wishlistShared';
      case NotificationType.CommentAdded:
        return 'notifications.titles.commentAdded';
      case NotificationType.UserSuggestion:
        return 'notifications.titles.userSuggestion';
      default:
        return 'notifications.title';
    }
  };

  const getNotificationMessageKey = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.GiftReserved:
        return 'notifications.messages.giftReserved';
      case NotificationType.GiftReceived:
        return 'notifications.messages.giftReceived';
      case NotificationType.LikeReceived:
        return 'notifications.messages.wishlistLiked';
      case NotificationType.FriendRequest:
        return 'notifications.messages.friendRequest';
      case NotificationType.FriendAccepted:
        return 'notifications.messages.newFollower';
      case NotificationType.EventInvitation:
        return 'notifications.messages.eventInvitation';
      case NotificationType.EventReminder:
        return 'notifications.messages.eventReminder';
      case NotificationType.WishlistShared:
        return 'notifications.messages.wishlistShared';
      case NotificationType.CommentAdded:
        return 'notifications.messages.commentAdded';
      case NotificationType.UserSuggestion:
        return 'notifications.messages.userSuggestion';
      default:
        return '';
    }
  };

  const translateNotification = (notification: NotificationDTO) => {
    const titleKey = getNotificationTitleKey(notification.type);
    let title = t(titleKey);
    
    // If translation key doesn't exist or returns the key itself, fallback to original
    if (title === titleKey) {
      title = notification.title;
    }

    const messageKey = getNotificationMessageKey(notification.type);
    let message = '';
    
    if (messageKey) {
      // Extract parameters from notification message or metadata
      let username = notification.relatedUserUsername || '';
      const metadata = notification.metadata || {};
      
      // If username not in relatedUserUsername, try to extract from message
      if (!username) {
        // Try common patterns: "Username verb..." or "Username's..."
        const usernameMatch = notification.message.match(/^([A-Za-zА-Яа-яА-Яа-я\s]+?)\s+(?:reserved|liked|started|sent|invited|accepted|commented|shared)/i);
        if (usernameMatch) {
          username = usernameMatch[1].trim();
        }
      }
      
      // Try to extract giftName, wishlistName, eventName from the original message or metadata
      let giftName = metadata.giftName || '';
      let wishlistName = metadata.wishlistName || '';
      let eventName = metadata.eventName || '';
      
      // If not in metadata, try to parse from the original message
      if (!giftName && notification.type === NotificationType.GiftReserved) {
        // Try to extract gift name from message like "Amina reserved 'Hot wheels' from your wishlist"
        const match = notification.message.match(/'([^']+)'/);
        if (match) giftName = match[1];
      }
      
      if (!wishlistName && notification.type === NotificationType.LikeReceived) {
        // Try to extract wishlist name from message like "Gabe Newal liked your wishlist 'For BD'"
        const match = notification.message.match(/'([^']+)'/);
        if (match) wishlistName = match[1];
      }
      
      if (!eventName && (notification.type === NotificationType.EventInvitation || notification.type === NotificationType.EventReminder)) {
        // Try to extract event name from message
        const match = notification.message.match(/'([^']+)'/);
        if (match) eventName = match[1];
      }
      
      const params: Record<string, string> = {};
      if (username) params.username = username;
      if (giftName) params.giftName = giftName;
      if (wishlistName) params.wishlistName = wishlistName;
      if (eventName) params.eventName = eventName;
      
      message = t(messageKey, params);
      
      // If translation returns the key itself, fallback to original message
      if (message === messageKey) {
        message = notification.message;
      }
    } else {
      message = notification.message;
    }
    
    return { title, message };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`absolute top-full right-0 mt-2 w-80 max-w-sm bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-50 ${className}`}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('notifications.title')}
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
                  >
                    {t('notifications.markAllRead')}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <XMarkIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('notifications.unreadCount', { count: unreadCount })}
              </p>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {t('notifications.loading')}
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('notifications.empty')}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                {(Array.isArray(notifications) ? notifications : []).map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`p-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors duration-200 border-l-4 ${getNotificationColor(notification.type, notification.isRead)}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type, notification.isRead)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            {(() => {
                              const translated = translateNotification(notification);
                              return (
                                <>
                                  <h4 className={`text-sm font-medium ${notification.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                    {translated.title}
                                  </h4>
                                  <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {translated.message}
                                  </p>
                                </>
                              );
                            })()}
                            
                            {/* Related user info */}
                            {notification.relatedUserUsername && (
                              <div className="flex items-center gap-2 mt-2">
                                {notification.relatedUserAvatarUrl ? (
                                  <img
                                    src={notification.relatedUserAvatarUrl}
                                    alt={notification.relatedUserUsername}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                    <UserIcon className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                                  </div>
                                )}
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {notification.relatedUserUsername}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            {!notification.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                title={t('notifications.markAsRead')}
                              >
                                <CheckIcon className="w-4 h-4 text-gray-400 hover:text-green-500" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(notification.id, notification.isRead)}
                              className="p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 group"
                              title={t('notifications.delete')}
                            >
                              <TrashIcon className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                            </button>
                          </div>
                        </div>

                        {/* Timestamp */}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200/50 dark:border-gray-700/50">
              <button className="w-full text-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors duration-200">
                {t('notifications.viewAll')}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}


