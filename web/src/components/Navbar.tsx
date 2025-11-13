"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HomeIcon, ArrowRightOnRectangleIcon, SparklesIcon, CalendarIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";
import WisheraLogo from "./WisheraLogo";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../hooks/useAuth";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { t } = useLanguage();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Handle scroll effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Close mobile menu when route changes
    setMobileMenuOpen(false);
  }, [router]);

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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4 flex items-center justify-between w-full">
        {/* Logo and name */}
        <div className="flex-shrink-0">
          <WisheraLogo size="md" />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex gap-4 xl:gap-6 2xl:gap-8 text-gray-600 dark:text-gray-300 font-medium text-sm xl:text-base items-center">
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

        {/* Desktop Language selector, Theme toggle and Auth buttons */}
        <div className="hidden md:flex gap-2 lg:gap-3 items-center">
          <LanguageSelector />
          <ThemeToggle />
          
          {isAuthenticated ? (
            <div className="flex gap-2 lg:gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href="/dashboard" 
                  className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 dark:from-emerald-500 dark:via-green-500 dark:to-emerald-600 text-white font-semibold text-xs lg:text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 dark:hover:from-emerald-600 dark:hover:via-green-600 dark:hover:to-emerald-700 whitespace-nowrap"
                >
                  <span className="hidden xl:inline">Dashboard</span>
                  <span className="xl:hidden">Dash</span>
                </Link>
              </motion.div>
              <motion.button
                onClick={logout}
                className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl bg-gradient-to-r from-red-500 via-pink-500 to-red-600 dark:from-pink-500 dark:via-red-500 dark:to-pink-600 text-white font-semibold text-xs lg:text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:from-red-600 hover:via-pink-600 hover:to-red-700 dark:hover:from-pink-600 dark:hover:via-red-600 dark:hover:to-pink-700 flex items-center gap-1.5 lg:gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowRightOnRectangleIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span className="hidden lg:inline">{t('navigation.logout')}</span>
              </motion.button>
            </div>
          ) : (
            <div className="flex gap-2 lg:gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href="/login" 
                  className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 dark:from-purple-500 dark:via-indigo-500 dark:to-purple-600 text-white font-semibold text-xs lg:text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-700 dark:hover:from-purple-600 dark:hover:via-indigo-600 dark:hover:to-purple-700 whitespace-nowrap"
                >
                  {t('navigation.login')}
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href="/register" 
                  className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 dark:from-orange-500 dark:via-yellow-500 dark:to-orange-600 text-white font-semibold text-xs lg:text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:from-yellow-600 hover:via-orange-600 hover:to-yellow-700 dark:hover:from-orange-600 dark:hover:via-yellow-600 dark:hover:to-orange-700 whitespace-nowrap"
                >
                  {t('navigation.signup')}
                </Link>
              </motion.div>
            </div>
          )}
        </div>

        {/* Mobile menu button and controls */}
        <div className="flex md:hidden gap-2 items-center">
          <LanguageSelector />
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-3">
              <Link 
                href="/" 
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 group"
                onClick={() => setMobileMenuOpen(false)}
              >
                <HomeIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-medium">{t('navigation.home')}</span>
              </Link>
              <Link 
                href="/about" 
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="font-medium">{t('navigation.about')}</span>
              </Link>
              {isAuthenticated && (
                <>
                  <Link 
                    href="/events" 
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 group"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <CalendarIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                    <span className="font-medium">Events</span>
                  </Link>
                  <Link 
                    href="/dashboard" 
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white font-semibold shadow-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 via-pink-500 to-red-600 text-white font-semibold shadow-lg"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <span>{t('navigation.logout')}</span>
                  </button>
                </>
              )}
              {!isAuthenticated && (
                <>
                  <Link 
                    href="/login" 
                    className="flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white font-semibold shadow-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('navigation.login')}
                  </Link>
                  <Link 
                    href="/register" 
                    className="flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 text-white font-semibold shadow-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('navigation.signup')}
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
} 