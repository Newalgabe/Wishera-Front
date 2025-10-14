/**
 * Test data for birthday notifications
 * This file can be used to test different birthday scenarios
 */

import { BirthdayReminderDTO } from '../types';

export const testBirthdayData: BirthdayReminderDTO[] = [
  // Today
  {
    id: "1",
    userId: "user1",
    username: "Alice",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Alice",
    birthday: "2025-10-15", // Today
    isToday: true,
    isTomorrow: false,
    daysUntilBirthday: 0
  },
  // Tomorrow
  {
    id: "2", 
    userId: "user2",
    username: "Bob",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Bob",
    birthday: "2025-10-16", // Tomorrow
    isToday: false,
    isTomorrow: true,
    daysUntilBirthday: 1
  },
  // This week (3 days)
  {
    id: "3",
    userId: "user3", 
    username: "Charlie",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Charlie",
    birthday: "2025-10-18", // 3 days
    isToday: false,
    isTomorrow: false,
    daysUntilBirthday: 3
  },
  // This week (7 days)
  {
    id: "4",
    userId: "user4",
    username: "Diana", 
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Diana",
    birthday: "2025-10-22", // 7 days
    isToday: false,
    isTomorrow: false,
    daysUntilBirthday: 7
  },
  // This month (15 days)
  {
    id: "5",
    userId: "user5",
    username: "Eve",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Eve", 
    birthday: "2025-10-30", // 15 days
    isToday: false,
    isTomorrow: false,
    daysUntilBirthday: 15
  },
  // This month (30 days)
  {
    id: "6",
    userId: "user6",
    username: "Frank",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Frank",
    birthday: "2025-11-14", // 30 days
    isToday: false,
    isTomorrow: false,
    daysUntilBirthday: 30
  }
];

/**
 * Get test data for a specific time period
 */
export function getTestBirthdaysForPeriod(period: 'today' | 'tomorrow' | 'week' | 'month'): BirthdayReminderDTO[] {
  switch (period) {
    case 'today':
      return testBirthdayData.filter(b => b.isToday);
    case 'tomorrow':
      return testBirthdayData.filter(b => b.isTomorrow);
    case 'week':
      return testBirthdayData.filter(b => b.daysUntilBirthday <= 7 && !b.isToday && !b.isTomorrow);
    case 'month':
      return testBirthdayData.filter(b => b.daysUntilBirthday > 7 && b.daysUntilBirthday <= 30);
    default:
      return testBirthdayData;
  }
}
