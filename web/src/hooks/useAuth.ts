import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '../types';
import { performCompleteLogout, getAuthDataDebugInfo } from '../utils/logoutUtils';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  checkAuth: () => boolean;
  debugAuthData: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        return true;
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }
    }
    return false;
  }, []);

  const login = useCallback((token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    // Perform comprehensive logout - clears all auth data
    performCompleteLogout();
    
    // Clear user state
    setUser(null);
    
    // Redirect to login page
    router.push('/login');
  }, [router]);

  useEffect(() => {
    checkAuth();
    setIsLoading(false);
  }, [checkAuth]);

  const debugAuthData = useCallback(() => {
    const debugInfo = getAuthDataDebugInfo();
    console.log('Current authentication data:', debugInfo);
    return debugInfo;
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkAuth,
    debugAuthData
  };
}

