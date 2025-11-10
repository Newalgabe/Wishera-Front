"use client";
import { SunIcon, MoonIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const { theme, toggleTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getThemeIcon = () => {
    if (theme === 'auto') {
      return <ComputerDesktopIcon className="w-3 h-3 text-blue-500" />;
    } else if (theme === 'light') {
      return <SunIcon className="w-3 h-3 text-yellow-500" />;
    } else {
      return <MoonIcon className="w-3 h-3 text-indigo-400" />;
    }
  };

  const getThemeLabel = () => {
    if (!mounted) return 'Auto'; // Default for SSR
    if (theme === 'auto') {
      return `Auto (${resolvedTheme})`;
    }
    return theme === 'light' ? 'Light' : 'Dark';
  };

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative w-12 h-6 rounded-full bg-gray-200 dark:bg-gray-700 p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-500"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'auto' : 'light'} mode`}
      title={`Current: ${getThemeLabel()}`}
    >
      <motion.div
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center"
        animate={{
          x: resolvedTheme === 'dark' ? 24 : 0,
          rotate: resolvedTheme === 'dark' ? 180 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            {getThemeIcon()}
          </motion.div>
        </AnimatePresence>
      </motion.div>
      
      {/* Background gradient animation */}
      <motion.div
        className="absolute inset-0 rounded-full opacity-0"
        animate={{
          opacity: resolvedTheme === 'dark' ? 0.1 : 0,
        }}
        transition={{ duration: 0.3 }}
        style={{
          background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
        }}
      />
    </motion.button>
  );
}