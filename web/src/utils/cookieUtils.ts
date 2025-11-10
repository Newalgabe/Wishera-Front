/**
 * Utility functions for cookie management
 */

/**
 * Set a cookie with the given name, value, and options
 */
export function setCookie(
  name: string, 
  value: string, 
  options: {
    expires?: Date;
    maxAge?: number;
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  } = {}
) {
  if (typeof document === 'undefined') return;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.expires) {
    cookieString += `; expires=${options.expires.toUTCString()}`;
  }

  if (options.maxAge) {
    cookieString += `; max-age=${options.maxAge}`;
  }

  if (options.path) {
    cookieString += `; path=${options.path}`;
  }

  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  if (options.secure) {
    cookieString += `; secure`;
  }

  if (options.httpOnly) {
    cookieString += `; httponly`;
  }

  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }

  document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const nameEQ = encodeURIComponent(name) + "=";
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
}

/**
 * Delete a cookie by name
 */
export function deleteCookie(name: string, path: string = '/', domain?: string) {
  if (typeof document === 'undefined') return;

  let cookieString = `${encodeURIComponent(name)}=; expires=${new Date(0).toUTCString()}; path=${path}`;
  
  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  document.cookie = cookieString;
}

/**
 * Clear all cookies
 */
export function clearAllCookies() {
  if (typeof document === 'undefined') return;

  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
}

/**
 * Clear all authentication-related cookies
 */
export function clearAuthCookies() {
  if (typeof document === 'undefined') return;

  const authCookieNames = [
    'token',
    'auth_token',
    'access_token',
    'refresh_token',
    'session_id',
    'user_session',
    'auth_session',
    'login_token'
  ];

  authCookieNames.forEach(cookieName => {
    deleteCookie(cookieName);
    deleteCookie(cookieName, '/');
    deleteCookie(cookieName, '/', window.location.hostname);
  });

  // Also clear any cookies that might contain auth-related keywords
  document.cookie.split(";").forEach(function(c) { 
    const cookieName = c.split("=")[0].trim();
    if (cookieName && (
      cookieName.includes('auth') || 
      cookieName.includes('token') || 
      cookieName.includes('session') ||
      cookieName.includes('login') ||
      cookieName.includes('user')
    )) {
      deleteCookie(cookieName);
    }
  });
}
