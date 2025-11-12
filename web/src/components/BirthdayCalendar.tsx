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
  }, [currentDate]); // Reload when month changes

  const loadBirthdays = async () => {
    try {
      setLoading(true);
      // Calculate days ahead to cover the displayed month and beyond
      const today = new Date();
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const daysFromTodayToEndOfMonth = Math.max(0, Math.ceil((lastDayOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      
      // Fetch at least 365 days to show all birthdays throughout the year
      const daysAhead = Math.max(365, daysFromTodayToEndOfMonth + 30);
      
      console.log('Loading birthdays for', daysAhead, 'days ahead');
      const upcomingBirthdays = await getUpcomingBirthdays(daysAhead);
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
    const targetDay = date.getDate();
    const targetMonth = date.getMonth() + 1; // JavaScript months are 0-indexed
    
    const matchingBirthdays = birthdays.filter(birthday => {
      try {
        // Parse the birthday from the DTO
        // CRITICAL: Always use UTC parsing to avoid timezone shifts
        const birthdayStr = birthday.birthday;
        let birthdayDate: Date;
        
        // Parse the ISO string and extract year, month, day
        if (birthdayStr.includes('T') || birthdayStr.includes('Z')) {
          // Extract the date part before 'T' to avoid timezone conversion
          const datePart = birthdayStr.split('T')[0];
          const [year, month, day] = datePart.split('-').map(Number);
          birthdayDate = new Date(Date.UTC(year, month - 1, day));
        } else {
          // For date-only strings, parse as UTC to avoid timezone shifts
          const [year, month, day] = birthdayStr.split('-').map(Number);
          birthdayDate = new Date(Date.UTC(year, month - 1, day));
        }
        
        // Use UTC methods to avoid timezone issues
        const birthdayDay = birthdayDate.getUTCDate();
        const birthdayMonth = birthdayDate.getUTCMonth() + 1;
        
        // Match birthdays by day and month only (birthdays recur annually)
        const matches = birthdayDay === targetDay && birthdayMonth === targetMonth;
        
        if (matches) {
          console.log('Found birthday match:', {
            birthday: birthday.birthday,
            birthdayDate: birthdayDate.toISOString().split('T')[0],
            targetDate: date.toISOString().split('T')[0],
            username: birthday.username,
            birthdayDay,
            birthdayMonth,
            targetDay,
            targetMonth
          });
        }
        
        return matches;
      } catch (error) {
        console.error('Error parsing birthday date:', birthday.birthday, error);
        return false;
      }
    });
    
    return matchingBirthdays;
  };

  const isBirthdayPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    // Birthday is past if it's before today in the current year
    return compareDate < today && compareDate.getFullYear() === today.getFullYear();
  };

  const monthNames = [
    t('calendar.months.january'),
    t('calendar.months.february'),
    t('calendar.months.march'),
    t('calendar.months.april'),
    t('calendar.months.may'),
    t('calendar.months.june'),
    t('calendar.months.july'),
    t('calendar.months.august'),
    t('calendar.months.september'),
    t('calendar.months.october'),
    t('calendar.months.november'),
    t('calendar.months.december')
  ];

  const dayNames = [
    t('calendar.days.sun'),
    t('calendar.days.mon'),
    t('calendar.days.tue'),
    t('calendar.days.wed'),
    t('calendar.days.thu'),
    t('calendar.days.fri'),
    t('calendar.days.sat')
  ];

  const formatDate = (date: Date) => {
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    return `${monthNames[monthIndex]} ${year}`;
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
          const isPast = isBirthdayPast(date);
          
          return (
            <button
              key={day}
              onClick={() => setSelectedDate(date)}
              className={`h-7 w-7 rounded-lg text-xs transition-all duration-200 flex items-center justify-center relative ${
                isToday(date)
                  ? 'bg-indigo-600 text-white font-bold shadow-md'
                  : isSelected(date)
                  ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : hasBirthdays && isPast
                  ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/50 opacity-75'
                  : hasBirthdays
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/30'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {day}
              {hasBirthdays && (
                <div className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-white dark:border-gray-800 ${
                  isPast ? 'bg-gray-400 dark:bg-gray-500' : 'bg-green-500'
                }`}></div>
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
              {getBirthdaysForDate(selectedDate).map((birthday, index) => {
                const isPast = isBirthdayPast(selectedDate);
                return (
                  <div 
                    key={index} 
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      isPast 
                        ? 'bg-gray-50 dark:bg-gray-700/30 opacity-75' 
                        : 'bg-green-50 dark:bg-green-900/20'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isPast 
                        ? 'bg-gray-100 dark:bg-gray-600/30' 
                        : 'bg-green-100 dark:bg-green-900/30'
                    }`}>
                      <UserIcon className={`w-4 h-4 ${
                        isPast 
                          ? 'text-gray-500 dark:text-gray-400' 
                          : 'text-green-600 dark:text-green-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {birthday.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isPast 
                          ? t('calendar.alreadyPassed') || 'Already happened this year'
                          : birthday.daysUntilBirthday === 0 
                            ? t('calendar.today') 
                            : birthday.daysUntilBirthday === 1 
                            ? t('calendar.tomorrow')
                            : t('calendar.inDays', { days: birthday.daysUntilBirthday })
                        }
                      </p>
                    </div>
                  </div>
                );
              })}
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
