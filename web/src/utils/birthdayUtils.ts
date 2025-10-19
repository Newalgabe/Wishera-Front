/**
 * Utility functions for birthday calculations and formatting
 */

export interface BirthdayInfo {
  age: number;
  daysUntilNext: number;
  isToday: boolean;
  isTomorrow: boolean;
  formattedDate: string;
  countdownMessage: string;
}

/**
 * Calculate age from birthday
 */
export function calculateAge(birthday: string): number {
  const birthDate = new Date(birthday);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1;
  }
  return age;
}

/**
 * Calculate days until next birthday
 */
export function getDaysUntilBirthday(birthday: string): number {
  const birthDate = new Date(birthday);
  const today = new Date();

  // Use start-of-day to avoid fractional-day rounding issues
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

  if (thisYearBirthday < todayStart) {
    thisYearBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
  }

  const dayMs = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((thisYearBirthday.getTime() - todayStart.getTime()) / dayMs);
  // Clamp to 0..365 to avoid showing 366 days (leap year) which leads to 13 months
  return Math.max(0, Math.min(365, diffDays));
}

/**
 * Check if birthday is today
 */
export function isBirthdayToday(birthday: string): boolean {
  return getDaysUntilBirthday(birthday) === 0;
}

/**
 * Check if birthday is tomorrow
 */
export function isBirthdayTomorrow(birthday: string): boolean {
  return getDaysUntilBirthday(birthday) === 1;
}

/**
 * Format birthday date
 */
export function formatBirthdayDate(birthday: string, locale: string = 'en-US'): string {
  return new Date(birthday).toLocaleDateString(locale, { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Get countdown message for birthday
 */
export function getBirthdayCountdownMessage(birthday: string, isOwn: boolean = false): string {
  const daysUntil = getDaysUntilBirthday(birthday);
  const prefix = isOwn ? 'Your' : 'Birthday';
  
  if (daysUntil === 0) {
    return `🎉 ${prefix} birthday is today!`;
  } else if (daysUntil === 1) {
    return `🎂 ${prefix} birthday is tomorrow!`;
  } else if (daysUntil <= 7) {
    return `🎂 ${prefix} birthday is in ${daysUntil} days`;
  } else if (daysUntil <= 30) {
    return `📅 ${prefix} birthday is in ${daysUntil} days`;
  } else {
    // Convert days to months, cap at 12 to avoid "13 months"
    const approxMonths = Math.max(1, Math.min(12, Math.round(daysUntil / 30.44)));
    return `📅 ${prefix} birthday is in ${approxMonths} month${approxMonths === 1 ? '' : 's'}`;
  }
}

/**
 * Get complete birthday information
 */
export function getBirthdayInfo(birthday: string, isOwn: boolean = false): BirthdayInfo {
  const age = calculateAge(birthday);
  const daysUntil = getDaysUntilBirthday(birthday);
  const isToday = daysUntil === 0;
  const isTomorrow = daysUntil === 1;
  const formattedDate = formatBirthdayDate(birthday);
  const countdownMessage = getBirthdayCountdownMessage(birthday, isOwn);
  
  return {
    age,
    daysUntilNext: daysUntil,
    isToday,
    isTomorrow,
    formattedDate,
    countdownMessage
  };
}
