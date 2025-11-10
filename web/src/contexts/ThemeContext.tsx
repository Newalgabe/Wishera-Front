"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Theme system with automatic day/night switching
 * 
 * Supports three modes:
 * - 'light': Always use light theme
 * - 'dark': Always use dark theme  
 * - 'auto': Automatically follow system theme preference
 * 
 * The auto mode listens for system theme changes and updates accordingly.
 * Users can cycle through: light -> dark -> auto -> light
 */
type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark'; // The actual theme being applied
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('auto');
  const [mounted, setMounted] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Function to get system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  useEffect(() => {
    setMounted(true);
    // Check for saved theme preference or default to auto
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto')) {
      setThemeState(savedTheme);
      // Set resolved theme based on saved preference
      if (savedTheme === 'auto') {
        setResolvedTheme(getSystemTheme());
      } else {
        setResolvedTheme(savedTheme);
      }
    } else {
      // Default to auto theme to follow system preference
      setThemeState('auto');
      setResolvedTheme(getSystemTheme());
    }
  }, []);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = () => {
      if (theme === 'auto') {
        // Update resolved theme when system theme changes in auto mode
        setResolvedTheme(getSystemTheme());
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme, mounted]);

  // Update resolved theme when theme changes
  useEffect(() => {
    if (theme === 'auto') {
      setResolvedTheme(getSystemTheme());
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  useEffect(() => {
    if (mounted) {
      console.log('Applying theme:', theme, 'resolved to:', resolvedTheme);
      localStorage.setItem('theme', theme);
      
      if (resolvedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        console.log('Added dark class, current classes:', document.documentElement.className);
      } else {
        document.documentElement.classList.remove('dark');
        console.log('Removed dark class, current classes:', document.documentElement.className);
      }
    }
  }, [resolvedTheme, mounted]);

  const toggleTheme = () => {
    setThemeState(prev => {
      let newTheme: Theme;
      if (prev === 'light') {
        newTheme = 'dark';
      } else if (prev === 'dark') {
        newTheme = 'auto';
      } else {
        newTheme = 'light';
      }
      console.log('Toggling theme from', prev, 'to', newTheme);
      return newTheme;
    });
  };

  const setTheme = (newTheme: Theme) => {
    console.log('Setting theme to:', newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}