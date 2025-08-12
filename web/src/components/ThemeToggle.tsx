"use client";
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    console.log('Theme toggle clicked, current theme:', theme);
    toggleTheme();
  };

  if (!mounted) {
    return (
      <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm border border-gray-200/30 w-9 h-9" />
    );
  }

  return (
    <motion.button
      onClick={handleToggle}
      className="p-2 rounded-full bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-800/30 transition-all duration-200"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {theme === 'light' ? (
          <MoonIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        ) : (
          <SunIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        )}
      </motion.div>
    </motion.button>
  );
}