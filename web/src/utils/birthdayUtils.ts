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
  const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  
  if (thisYearBirthday < today) {
    thisYearBirthday.setFullYear(today.getFullYear() + 1);
  }
  
  return Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
    return `📅 ${prefix} birthday is in ${Math.ceil(daysUntil / 30)} months`;
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
