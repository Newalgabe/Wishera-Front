"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BellIcon } from "@heroicons/react/24/outline";
import { BellIcon as BellIconSolid } from "@heroicons/react/24/solid";
import { getUnreadNotificationCount } from "../app/api";

interface NotificationBadgeProps {
  className?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function NotificationBadge({ 
  className = "", 
  onClick,
  size = 'md'
}: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const badgeSizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm'
  };

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadNotificationCount();
        const previousCount = localStorage.getItem('lastNotificationCount');
        const lastCount = previousCount ? parseInt(previousCount, 10) : 0;
        
        setUnreadCount(count);
        setIsLoading(false);
        
        // Show animation if count increased
        if (count > lastCount && lastCount > 0) {
          setHasNewNotifications(true);
          setTimeout(() => setHasNewNotifications(false), 2000);
        }
        
        localStorage.setItem('lastNotificationCount', count.toString());
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
        setIsLoading(false);
      }
    };

    fetchUnreadCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    onClick?.();
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`relative ${sizeClasses[size]} rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      {/* Bell Icon */}
      <motion.div
        animate={hasNewNotifications ? { 
          rotate: [0, -10, 10, -10, 0],
          scale: [1, 1.1, 1]
        } : {}}
        transition={{ duration: 0.5 }}
      >
        {unreadCount > 0 ? (
          <BellIconSolid className={`${iconSizeClasses[size]} text-indigo-600 dark:text-indigo-400`} />
        ) : (
          <BellIcon className={`${iconSizeClasses[size]} text-gray-600 dark:text-gray-300`} />
        )}
      </motion.div>

      {/* Unread Count Badge */}
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute -top-1 -right-1 ${badgeSizeClasses[size]} bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg border-2 border-white dark:border-gray-800`}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </motion.div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Pulse animation for new notifications */}
      {hasNewNotifications && (
        <motion.div
          className="absolute inset-0 rounded-full bg-indigo-500/20"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{ duration: 1, repeat: 2 }}
        />
      )}
    </motion.button>
  );
}


