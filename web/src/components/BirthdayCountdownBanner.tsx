'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, GiftIcon as GiftIconSolid, CalendarIcon as CalendarIconSolid, CalendarDaysIcon as CalendarIcon } from '@heroicons/react/24/solid';
import { getUpcomingBirthdays } from '../app/api';
import { BirthdayReminderDTO } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface BirthdayCountdownBannerProps {
  onClose: () => void;
}

export default function BirthdayCountdownBanner({ onClose }: BirthdayCountdownBannerProps) {
  const [birthdays, setBirthdays] = useState<BirthdayReminderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const fetchBirthdays = async () => {
    try {
      console.log('BirthdayCountdownBanner: Fetching birthdays...');
      setLoading(true);
      setError(null);
      
      const data = await getUpcomingBirthdays();
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
    } else {
      return t('notifications.birthdayCountdown', { username: birthday.username, days: daysLeft });
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
    
    if (birthday.isToday) {
      return "bg-gradient-to-r from-pink-500 to-rose-500";
    } else if (birthday.isTomorrow) {
      return "bg-gradient-to-r from-orange-500 to-red-500";
    } else if (daysLeft <= 7) {
      return "bg-gradient-to-r from-blue-500 to-indigo-500";
    } else {
      return "bg-gradient-to-r from-purple-500 to-violet-500";
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
    
    // Backend logic: Show if daysUntilBirthday <= 7 and isToday = true for "today" banner
    // Frontend logic: Show all birthdays returned by backend (since backend already filters)
    
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
    
    console.log(`Not showing ${birthday.username} - more than 7 days away`);
    return false;
  };

  if (loading) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <div className="animate-pulse flex items-center space-x-3">
          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded flex-1"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
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
          key={`${birthday.userId}-${birthday.birthday}`}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ 
            duration: 0.3, 
            delay: index * 0.1,
            ease: "easeOut"
          }}
          className={`${getBannerColor(birthday)} rounded-lg p-4 mb-4 shadow-lg`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getCountdownIcon(birthday)}
              <div className="text-white">
                <p className="font-semibold text-lg">
                  {formatCountdownMessage(birthday)}
                </p>
                {birthday.avatarUrl && (
                  <div className="flex items-center space-x-2 mt-1">
                    <img 
                      src={birthday.avatarUrl} 
                      alt={birthday.username}
                      className="w-6 h-6 rounded-full border-2 border-white/30"
                    />
                    <span className="text-sm opacity-90">
                      {birthday.username}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors duration-200 p-1 rounded-full hover:bg-white/10"
              aria-label="Close notification"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress bar for countdown */}
          {!birthday.isToday && (
            <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
              <motion.div
                className="bg-white/40 h-full rounded-full"
                initial={{ width: "100%" }}
                animate={{ 
                  width: `${Math.max(0, (7 - getDaysUntilBirthday(birthday)) / 7 * 100)}%` 
                }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />
            </div>
          )}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}