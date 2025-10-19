"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HomeIcon, ArrowRightOnRectangleIcon, SparklesIcon, CalendarIcon } from "@heroicons/react/24/outline";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";
import WisheraLogo from "./WisheraLogo";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../hooks/useAuth";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Navbar() {
  const { t } = useLanguage();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Handle scroll effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav 
      className={`w-full sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg' 
          : 'bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-b border-gray-200/30 dark:border-gray-700/30'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between w-full">
        {/* Logo and name */}
        <WisheraLogo size="md" />

        {/* Navigation */}
        <div className="hidden md:flex gap-6 lg:gap-8 text-gray-600 dark:text-gray-300 font-medium text-sm sm:text-base items-center">
          <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
            <Link 
              href="/" 
              className="flex items-center gap-2 hover:text-indigo-500 dark:hover:text-purple-400 transition-colors duration-200 group"
            >
              <HomeIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              {t('navigation.home')}
            </Link>
          </motion.div>
          <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
            <Link 
              href="/about" 
              className="hover:text-indigo-500 dark:hover:text-purple-400 transition-colors duration-200"
            >
              {t('navigation.about')}
            </Link>
          </motion.div>
          {isAuthenticated && (
            <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
              <Link 
                href="/events" 
                className="flex items-center gap-2 hover:text-indigo-500 dark:hover:text-purple-400 transition-colors duration-200 group"
              >
                <CalendarIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                Events
              </Link>
            </motion.div>
          )}
        </div>

        {/* Language selector, Theme toggle and Auth buttons */}
        <div className="flex gap-3 items-center">
          <LanguageSelector />
          <ThemeToggle />
          
          {isAuthenticated ? (
            <div className="flex gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href="/dashboard" 
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 dark:from-emerald-500 dark:via-green-500 dark:to-emerald-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 dark:hover:from-emerald-600 dark:hover:via-green-600 dark:hover:to-emerald-700"
                >
                  Dashboard
                </Link>
              </motion.div>
              <motion.button
                onClick={logout}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 via-pink-500 to-red-600 dark:from-pink-500 dark:via-red-500 dark:to-pink-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:from-red-600 hover:via-pink-600 hover:to-red-700 dark:hover:from-pink-600 dark:hover:via-red-600 dark:hover:to-pink-700 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                {t('navigation.logout')}
              </motion.button>
            </div>
          ) : (
            <div className="flex gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href="/login" 
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 dark:from-purple-500 dark:via-indigo-500 dark:to-purple-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-700 dark:hover:from-purple-600 dark:hover:via-indigo-600 dark:hover:to-purple-700"
                >
                  {t('navigation.login')}
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href="/register" 
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 dark:from-orange-500 dark:via-yellow-500 dark:to-orange-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:from-yellow-600 hover:via-orange-600 hover:to-yellow-700 dark:hover:from-orange-600 dark:hover:via-yellow-600 dark:hover:to-orange-700"
                >
                  {t('navigation.signup')}
                </Link>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
} 