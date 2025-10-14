/**
 * Comprehensive logout utility that clears all authentication data
 */

import { clearAuthCookies } from './cookieUtils';

/**
 * Clear all authentication-related data from localStorage
 */
function clearLocalStorageAuth(): void {
  if (typeof window === 'undefined') return;

  // Clear known auth keys
  const knownAuthKeys = [
    'token',
    'user',
    'userId', 
    'username',
    'auth_token',
    'access_token',
    'refresh_token',
    'session_id',
    'user_session',
    'auth_session',
    'login_token'
  ];

  knownAuthKeys.forEach(key => {
    localStorage.removeItem(key);
  });

  // Clear any other potential auth-related localStorage items
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('auth') || 
      key.includes('user') || 
      key.includes('token') || 
      key.includes('session') ||
      key.includes('login')
    )) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

/**
 * Clear all sessionStorage data
 */
function clearSessionStorage(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.clear();
  }
}

/**
 * Comprehensive logout function that clears all authentication data
 * This includes:
 * - localStorage (all auth-related keys)
 * - sessionStorage (all data)
 * - Cookies (all auth-related cookies)
 */
export function performCompleteLogout(): void {
  console.log('Performing complete logout - clearing all authentication data');
  
  // Clear localStorage
  clearLocalStorageAuth();
  
  // Clear sessionStorage
  clearSessionStorage();
  
  // Clear cookies
  clearAuthCookies();
  
  console.log('Logout complete - all authentication data cleared');
}

/**
 * Get all current authentication data for debugging purposes
 */
export function getAuthDataDebugInfo(): {
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  cookies: string;
} {
  const localStorageData: Record<string, string> = {};
  const sessionStorageData: Record<string, string> = {};

  if (typeof window !== 'undefined') {
    // Get localStorage data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        localStorageData[key] = localStorage.getItem(key) || '';
      }
    }

    // Get sessionStorage data
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        sessionStorageData[key] = sessionStorage.getItem(key) || '';
      }
    }
  }

  return {
    localStorage: localStorageData,
    sessionStorage: sessionStorageData,
    cookies: typeof document !== 'undefined' ? document.cookie : ''
  };
}
