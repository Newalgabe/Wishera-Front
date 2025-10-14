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
  EllipsisHorizontalIcon
} from "@heroicons/react/24/outline";
import { 
  GiftIcon as GiftIconSolid,
  CalendarIcon as CalendarIconSolid,
  HeartIcon as HeartIconSolid
} from "@heroicons/react/24/solid";
import { NotificationDTO } from "../types";
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadNotificationCount
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
      const [notificationsData, unreadCountData] = await Promise.all([
        getNotifications(1, 20),
        getUnreadNotificationCount()
      ]);
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
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

  const getNotificationIcon = (type: string, isRead: boolean) => {
    const iconClass = `w-5 h-5 ${isRead ? 'text-gray-400' : 'text-indigo-500'}`;
    
    switch (type) {
      case 'birthday':
        return isRead ? (
          <CalendarIcon className={iconClass} />
        ) : (
          <CalendarIconSolid className={iconClass} />
        );
      case 'gift_reserved':
        return isRead ? (
          <GiftIcon className={iconClass} />
        ) : (
          <GiftIconSolid className={iconClass} />
        );
      case 'wishlist_liked':
        return isRead ? (
          <HeartIcon className={iconClass} />
        ) : (
          <HeartIconSolid className={iconClass} />
        );
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

  const getNotificationColor = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-gray-50 dark:bg-gray-800/50';
    
    switch (type) {
      case 'birthday':
        return 'bg-pink-50 dark:bg-pink-900/20 border-l-pink-500';
      case 'gift_reserved':
        return 'bg-green-50 dark:bg-green-900/20 border-l-green-500';
      case 'wishlist_liked':
        return 'bg-purple-50 dark:bg-purple-900/20 border-l-purple-500';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-l-blue-500';
    }
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
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
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
                            <h4 className={`text-sm font-medium ${notification.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                              {notification.title}
                            </h4>
                            <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                              {notification.message}
                            </p>
                            
                            {/* Related user info */}
                            {notification.relatedUsername && (
                              <div className="flex items-center gap-2 mt-2">
                                {notification.relatedUserAvatar ? (
                                  <img
                                    src={notification.relatedUserAvatar}
                                    alt={notification.relatedUsername}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                    <UserIcon className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                                  </div>
                                )}
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {notification.relatedUsername}
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
                            <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                              <EllipsisHorizontalIcon className="w-4 h-4 text-gray-400" />
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


