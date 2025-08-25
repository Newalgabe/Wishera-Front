"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HomeIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";
import { useLanguage } from "../contexts/LanguageContext";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in by looking for token in localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    // Clear all auth data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    
    // Update state
    setIsLoggedIn(false);
    
    // Redirect to login page
    router.push('/login');
  };

  return (
    <nav className="w-full sticky top-0 z-30 bg-gradient-to-br from-white/70 to-indigo-100/60 dark:from-gray-900/70 dark:to-gray-800/60 backdrop-blur-md border-b border-indigo-100/40 dark:border-gray-700/40 shadow-sm transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between w-full">
        {/* Logo and name */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-400 dark:from-purple-500 dark:to-indigo-400 flex items-center justify-center text-white font-extrabold text-lg sm:text-xl shadow">W</div>
          <span className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight transition-colors duration-300">{t('navigation.wishlistApp')}</span>
        </div>
        {/* Navigation */}
        <div className="flex gap-3 sm:gap-6 md:gap-8 text-gray-600 dark:text-gray-300 font-medium text-sm sm:text-base items-center">
          <Link href="/" className="flex items-center gap-1 hover:text-indigo-500 dark:hover:text-purple-400 transition-colors duration-200"><HomeIcon className="w-5 h-5" /> {t('navigation.home')}</Link>
          <Link href="/about" className="hover:text-indigo-500 dark:hover:text-purple-400 transition-colors duration-200">{t('navigation.about')}</Link>
        </div>
        {/* Language selector, Theme toggle and Auth buttons */}
        <div className="flex gap-2 items-center">
          <LanguageSelector />
          <ThemeToggle />
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 dark:from-emerald-500 dark:to-green-500 text-white font-semibold text-sm shadow hover:scale-105 transition-transform">Dashboard</Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 dark:from-pink-500 dark:to-red-500 text-white font-semibold text-sm shadow hover:scale-105 transition-transform flex items-center gap-1"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                {t('navigation.logout')}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 dark:from-purple-500 dark:to-indigo-500 text-white font-semibold text-sm shadow hover:scale-105 transition-transform">{t('navigation.login')}</Link>
              <Link href="/register" className="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 dark:from-orange-500 dark:to-red-500 text-white font-semibold text-sm shadow hover:scale-105 transition-transform">{t('navigation.signup')}</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 