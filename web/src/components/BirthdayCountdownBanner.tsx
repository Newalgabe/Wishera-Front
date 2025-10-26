'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, GiftIcon as GiftIconSolid, CalendarIcon as CalendarIconSolid, CalendarDaysIcon as CalendarIcon, EyeIcon } from '@heroicons/react/24/solid';
import { getUpcomingBirthdays } from '../app/api';
import { BirthdayReminderDTO } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from 'next/navigation';

interface BirthdayCountdownBannerProps {
  onClose: () => void;
}

export default function BirthdayCountdownBanner({ onClose }: BirthdayCountdownBannerProps) {
  const [birthdays, setBirthdays] = useState<BirthdayReminderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const fetchBirthdays = async () => {
    try {
      console.log('BirthdayCountdownBanner: Fetching birthdays...');
      setLoading(true);
      setError(null);
      
      const data = await getUpcomingBirthdays(30); // Request 30 days of birthdays
      console.log('BirthdayCountdownBanner: Received birthdays:', data);
      
      // Filter birthdays that should be shown
      const filteredBirthdays = data.filter(shouldShowNotification);
      console.log('BirthdayCountdownBanner: Filtered birthdays:', filteredBirthdays);
      
      setBirthdays(filteredBirthdays);
    } catch (err) {
      console.error('BirthdayCountdownBanner: Error fetching birthdays:', err);
      setError('Failed to load birthday notifications');
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilBirthday = (birthday: BirthdayReminderDTO) => {
    return birthday.daysUntilBirthday;
  };

  const formatCountdownMessage = (birthday: BirthdayReminderDTO) => {
    const daysLeft = getDaysUntilBirthday(birthday);
    
    if (birthday.isToday) {
      return t('notifications.birthdayToday', { username: birthday.username });
    } else if (birthday.isTomorrow) {
      return t('notifications.birthdayTomorrow', { username: birthday.username });
    } else if (daysLeft <= 7) {
      return t('notifications.birthdayThisWeek', { username: birthday.username, days: daysLeft });
    } else if (daysLeft <= 30) {
      return t('notifications.birthdayThisMonth', { username: birthday.username, days: daysLeft });
    } else {
      return t('notifications.birthdayNextMonth', { username: birthday.username, days: daysLeft });
    }
  };

  const getCountdownIcon = (birthday: BirthdayReminderDTO) => {
    const daysLeft = getDaysUntilBirthday(birthday);
    
    if (birthday.isToday) {
      return <GiftIconSolid className="w-6 h-6 text-pink-500" />;
    } else if (daysLeft <= 7) {
      return <CalendarIconSolid className="w-6 h-6 text-orange-500" />;
    } else {
      return <CalendarIcon className="w-6 h-6 text-blue-500" />;
    }
  };

  const getBannerColor = (birthday: BirthdayReminderDTO) => {
    const daysLeft = getDaysUntilBirthday(birthday);
    
    // Clean design with border-left accent
    if (birthday.isToday) {
      return "bg-pink-50 dark:bg-pink-900/20 border-l-4 border-pink-500";
    } else if (birthday.isTomorrow) {
      return "bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500";
    } else if (daysLeft <= 7) {
      return "bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500";
    } else if (daysLeft <= 30) {
      return "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500";
    } else {
      return "bg-gray-50 dark:bg-gray-800/50 border-l-4 border-gray-400";
    }
  };

  const shouldShowNotification = (birthday: BirthdayReminderDTO) => {
    const daysLeft = getDaysUntilBirthday(birthday);
    
    console.log(`Checking birthday for ${birthday.username}:`, {
      daysLeft,
      birthday: birthday.birthday,
      isToday: birthday.isToday,
      isTomorrow: birthday.isTomorrow
    });
    
    // Don't show past birthdays (safety check, backend should already filter these)
    if (daysLeft < 0) {
      console.log(`Not showing ${birthday.username} - birthday has passed`);
      return false;
    }
    
    // Show notifications for:
    // - Today
    // - Tomorrow  
    // - Within 1 week (7 days)
    // - Within 1 month (30 days)
    
    if (birthday.isToday) {
      console.log(`Showing ${birthday.username} - today`);
      return true;
    }
    
    if (birthday.isTomorrow) {
      console.log(`Showing ${birthday.username} - tomorrow`);
      return true;
    }
    
    if (daysLeft <= 7) {
      console.log(`Showing ${birthday.username} - within 7 days`);
      return true;
    }
    
    if (daysLeft <= 30) {
      console.log(`Showing ${birthday.username} - within 30 days (next month)`);
      return true;
    }
    
    console.log(`Not showing ${birthday.username} - more than 30 days away`);
    return false;
  };

  const handleBrowseWishlist = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-4">
        <div className="animate-pulse flex items-center space-x-3">
          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded flex-1"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
          <CalendarIcon className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (birthdays.length === 0) {
    return null; // Don't show anything if no birthdays
  }

  return (
    <AnimatePresence>
      {birthdays.map((birthday, index) => (
        <motion.div
          key={`${birthday.userId}-${birthday.birthday}-${index}`}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ 
            duration: 0.3, 
            delay: index * 0.1,
            ease: "easeOut"
          }}
          className={`${getBannerColor(birthday)} border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-3 shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              {getCountdownIcon(birthday)}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  {birthday.avatarUrl && (
                    <img 
                      src={birthday.avatarUrl} 
                      alt={birthday.username}
                      className="w-9 h-9 rounded-full border-2 border-gray-200 dark:border-gray-600"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCountdownMessage(birthday)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {birthday.username}
                    </p>
                  </div>
                </div>
                
                {/* Browse Wishlist Button */}
                <motion.button
                  onClick={() => handleBrowseWishlist(birthday.userId)}
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <EyeIcon className="w-3.5 h-3.5" />
                  <span>{t('notifications.browseWishlist')}</span>
                </motion.button>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ml-3"
              aria-label="Close notification"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          
          {/* Progress bar for countdown */}
          {!birthday.isToday && (
            <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden relative">
              <motion.div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 h-full rounded-full"
                initial={{ width: "0%" }}
                animate={{ 
                  width: `${Math.max(0, (30 - getDaysUntilBirthday(birthday)) / 30 * 100)}%` 
                }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{ width: `${Math.max(0, (30 - getDaysUntilBirthday(birthday)) / 30 * 100)}%` }}
                animate={{
                  x: ["-100%", "200%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: 1
                }}
              />
            </div>
          )}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}