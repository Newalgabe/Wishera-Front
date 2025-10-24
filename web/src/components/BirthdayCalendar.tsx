'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getUpcomingBirthdays } from '../app/api';
import { BirthdayReminderDTO } from '../types';
import { CalendarIcon, UserIcon } from '@heroicons/react/24/outline';

interface BirthdayCalendarProps {
  className?: string;
}

export default function BirthdayCalendar({ className = '' }: BirthdayCalendarProps) {
  const { t } = useLanguage();
  const [birthdays, setBirthdays] = useState<BirthdayReminderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadBirthdays();
  }, []);

  const loadBirthdays = async () => {
    try {
      setLoading(true);
      const upcomingBirthdays = await getUpcomingBirthdays(30); // Get birthdays for next 30 days
      console.log('Loaded birthdays:', upcomingBirthdays);
      setBirthdays(upcomingBirthdays || []);
    } catch (error) {
      console.error('Failed to load birthdays:', error);
      // Set empty array on error so calendar still shows
      setBirthdays([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getBirthdaysForDate = (date: Date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    const matchingBirthdays = birthdays.filter(birthday => {
      const birthdayDate = new Date(birthday.birthday);
      const birthdayDay = birthdayDate.getDate();
      const birthdayMonth = birthdayDate.getMonth() + 1;
      const birthdayYear = birthdayDate.getFullYear();
      
      // Check if it's the same day and month, and the year is current or next
      const matches = birthdayDay === day && 
                     birthdayMonth === month && 
                     (birthdayYear === year || birthdayYear === year + 1);
      
      if (matches) {
        console.log('Found birthday match:', {
          birthday: birthday.birthday,
          birthdayDate: birthdayDate,
          targetDate: date,
          username: birthday.username
        });
      }
      
      return matches;
    });
    
    return matchingBirthdays;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() && 
           date.getMonth() === selectedDate.getMonth() && 
           date.getFullYear() === selectedDate.getFullYear();
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }


  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          {t('calendar.title')}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={loadBirthdays}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Refresh birthdays"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Month/Year */}
      <div className="text-center mb-4">
        <h4 className="text-xl font-bold text-gray-900 dark:text-white">
          {formatDate(currentDate)}
        </h4>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {/* Day Headers */}
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-1">
            {day}
          </div>
        ))}
        
        {/* Empty Days */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="h-7"></div>
        ))}
        
        {/* Calendar Days */}
        {days.map(day => {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const dayBirthdays = getBirthdaysForDate(date);
          const hasBirthdays = dayBirthdays.length > 0;
          
          return (
            <button
              key={day}
              onClick={() => setSelectedDate(date)}
              className={`h-7 w-7 rounded-lg text-xs transition-all duration-200 flex items-center justify-center relative ${
                isToday(date)
                  ? 'bg-indigo-600 text-white font-bold shadow-md'
                  : isSelected(date)
                  ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : hasBirthdays
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/30'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {day}
              {hasBirthdays && (
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-white dark:border-gray-800"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Birthdays */}
      {selectedDate && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h5>
          {getBirthdaysForDate(selectedDate).length > 0 ? (
            <div className="space-y-2">
              {getBirthdaysForDate(selectedDate).map((birthday, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {birthday.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {birthday.daysUntilBirthday === 0 
                        ? t('calendar.today') 
                        : birthday.daysUntilBirthday === 1 
                        ? t('calendar.tomorrow')
                        : t('calendar.inDays', { days: birthday.daysUntilBirthday })
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              {t('calendar.noBirthdays')}
            </p>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {t('calendar.upcomingBirthdays')}
          </span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            {birthdays.length}
          </span>
        </div>
      </div>
    </div>
  );
}
