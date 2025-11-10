"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { UserIcon, GiftIcon, LockClosedIcon, ShareIcon, CloudIcon, SparklesIcon, ChevronLeftIcon, ChevronRightIcon, HomeIcon, InformationCircleIcon, ChatBubbleLeftRightIcon, StarIcon, UserGroupIcon, ClockIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useLanguage } from "../contexts/LanguageContext";

const testimonials = [
  {
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    name: "Emily R.",
    key: "emily",
    rating: 5
  },
  {
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "James P.",
    key: "james",
    rating: 5
  },
  {
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "Sophia L.",
    key: "sophia",
    rating: 5
  },
  {
    avatar: "https://randomuser.me/api/portraits/men/65.jpg",
    name: "Michael T.",
    key: "michael",
    rating: 5
  },
];

function AnimatedBlobs() {
  return (
    <>
      <motion.div
        className="absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br from-blue-400 to-indigo-500 opacity-20 rounded-full blur-3xl z-0"
        animate={{ 
          y: [0, 30, 0], 
          x: [0, 20, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 15, repeat: Infinity, repeatType: "mirror" }}
      />
      <motion.div
        className="absolute top-40 -right-32 w-80 h-80 bg-gradient-to-br from-pink-400 to-rose-500 opacity-15 rounded-full blur-3xl z-0"
        animate={{ 
          y: [0, -20, 0], 
          x: [0, -30, 0],
          scale: [1, 0.9, 1]
        }}
        transition={{ duration: 18, repeat: Infinity, repeatType: "mirror" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/2 w-72 h-72 bg-gradient-to-br from-purple-400 to-indigo-500 opacity-15 rounded-full blur-3xl z-0"
        animate={{ 
          y: [0, 20, 0], 
          x: [0, 10, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "mirror" }}
      />
      <motion.div
        className="absolute top-10 left-1/3 w-40 h-40 bg-gradient-to-br from-yellow-300 to-orange-400 opacity-20 rounded-full blur-2xl z-0"
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360]
        }}
        transition={{ duration: 12, repeat: Infinity, repeatType: "mirror" }}
      />
      <motion.div
        className="absolute bottom-10 right-1/4 w-32 h-32 bg-gradient-to-br from-green-300 to-emerald-400 opacity-20 rounded-full blur-2xl z-0"
        animate={{ 
          scale: [1, 0.95, 1],
          rotate: [0, -180, -360]
        }}
        transition={{ duration: 14, repeat: Infinity, repeatType: "mirror" }}
      />
      {/* Enhanced dotted pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 z-0 opacity-10 pointer-events-none select-none">
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none">
          <defs>
            <pattern id="dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="url(#gradient)" />
            </pattern>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#dots)" />
        </svg>
      </div>
    </>
  );
}

function TrustedBy() {
  const { t } = useLanguage();
  const avatars = [
    "https://randomuser.me/api/portraits/men/32.jpg",
    "https://randomuser.me/api/portraits/women/44.jpg",
    "https://randomuser.me/api/portraits/men/65.jpg",
    "https://randomuser.me/api/portraits/women/68.jpg",
    "https://randomuser.me/api/portraits/men/12.jpg",
  ];
  return (
    <motion.div
      className="flex flex-col items-center mt-12 mb-4"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.8 }}
    >
      <div className="text-gray-400 dark:text-gray-500 text-sm mb-3 font-medium tracking-wide transition-colors duration-300">{t('home.trustedBy')}</div>
      <div className="flex gap-2 sm:gap-4">
        {avatars.map((src, idx) => (
          <motion.div
            key={src}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white dark:border-gray-600 shadow-lg overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 transition-colors duration-300"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
            style={{ zIndex: avatars.length - idx }}
          >
            <img src={src} alt={`User ${idx + 1}`} className="w-full h-full object-cover" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function TestimonialCarousel() {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setIndex((i) => (i + 1) % testimonials.length), 4000);
    return () => clearTimeout(timer);
  }, [index]);
  const prev = () => setIndex((i) => (i - 1 + testimonials.length) % testimonials.length);
  const next = () => setIndex((i) => (i + 1) % testimonials.length);
  
  return (
    <div className="relative flex flex-col items-center glass-card rounded-3xl shadow-2xl px-6 py-8 mt-8 mb-2 max-w-sm mx-auto min-h-[280px] transition-all duration-300 hover:shadow-3xl">
      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
        <motion.button 
          onClick={prev} 
          className="p-2 rounded-full bg-white/80 dark:bg-gray-700/80 hover:bg-indigo-100 dark:hover:bg-gray-600 transition-colors duration-200 shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeftIcon className="w-5 h-5 text-indigo-400 dark:text-purple-400" />
        </motion.button>
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
        <motion.button 
          onClick={next} 
          className="p-2 rounded-full bg-white/80 dark:bg-gray-700/80 hover:bg-indigo-100 dark:hover:bg-gray-600 transition-colors duration-200 shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRightIcon className="w-5 h-5 text-indigo-400 dark:text-purple-400" />
        </motion.button>
      </div>
      <motion.div
        key={index}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center w-full"
      >
        <motion.div
          className="relative mb-4"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <img
            src={testimonials[index].avatar}
            alt={testimonials[index].name}
            className="w-16 h-16 rounded-full shadow-lg object-cover border-4 border-white dark:border-gray-600"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
            <StarIcon className="w-3 h-3 text-white" />
          </div>
        </motion.div>
        <blockquote className="italic text-gray-700 dark:text-gray-300 text-center mb-3 text-base sm:text-lg transition-colors duration-300 leading-relaxed">
          "{t(`testimonials.${testimonials[index].key}`)}"
        </blockquote>
        <div className="flex items-center gap-2 mb-2">
          {[...Array(testimonials[index].rating)].map((_, i) => (
            <StarIcon key={i} className="w-4 h-4 text-yellow-400 fill-current" />
          ))}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 font-semibold transition-colors duration-300">{testimonials[index].name}</div>
      </motion.div>
      <div className="flex gap-2 mt-4 justify-center">
        {testimonials.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => setIndex(i)}
            className={`inline-block w-2 h-2 rounded-full focus:outline-none transition-all duration-200 ${
              i === index 
                ? "bg-gradient-to-r from-indigo-400 to-purple-400 scale-125" 
                : "bg-gray-300 dark:bg-gray-600"
            }`}
            whileHover={{ scale: 1.2 }}
            aria-label={`Go to testimonial ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function ScrollIndicator() {
  const { t } = useLanguage();
  return (
    <motion.div
      className="absolute left-1/2 -translate-x-1/2 bottom-4 z-20 flex flex-col items-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: [10, 0, 10] }}
      transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
    >
      <motion.svg 
        width="28" 
        height="28" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="url(#scrollGradient)" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="animate-bounce"
      >
        <defs>
          <linearGradient id="scrollGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <polyline points="6 9 12 15 18 9" />
      </motion.svg>
      <span className="text-xs bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mt-1 font-medium">
        {t('common.scroll')}
      </span>
    </motion.div>
  );
}

function StatisticsDisplay() {
  const { t } = useLanguage();
  
  const stats = [
    {
      number: "10K+",
      labelKey: "about.stats.happyUsers",
      icon: UserGroupIcon,
      gradient: "from-blue-500 to-indigo-600",
      bgGradient: "from-blue-500/20 to-indigo-600/20"
    },
    {
      number: "50K+",
      labelKey: "about.stats.wishlistsCreated",
      icon: GiftIcon,
      gradient: "from-pink-500 to-rose-600",
      bgGradient: "from-pink-500/20 to-rose-600/20"
    },
    {
      number: "100K+",
      labelKey: "about.stats.giftsReserved",
      icon: SparklesIcon,
      gradient: "from-purple-500 to-fuchsia-600",
      bgGradient: "from-purple-500/20 to-fuchsia-600/20"
    },
    {
      number: "99.9%",
      labelKey: "about.stats.uptime",
      icon: ClockIcon,
      gradient: "from-green-500 to-emerald-600",
      bgGradient: "from-green-500/20 to-emerald-600/20"
    }
  ];

  return (
    <motion.div
      className="relative z-10 glass-card rounded-3xl shadow-2xl border border-gray-100/50 dark:border-gray-700/50 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg p-6 sm:p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-3xl"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.labelKey}
              className="relative overflow-hidden rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-4 sm:p-5 border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -4 }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-30 dark:opacity-20`} />
              <div className="relative z-10 flex flex-col items-center text-center">
                <motion.div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3 shadow-lg`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </motion.div>
                <motion.div
                  className="text-2xl sm:text-3xl font-extrabold mb-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.9 + index * 0.1 }}
                >
                  <span className={`bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                    {stat.number}
                  </span>
                </motion.div>
                <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300 text-center leading-tight">
                  {t(stat.labelKey)}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function FeaturesBackground() {
  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none select-none">
      <svg width="100%" height="100%" viewBox="0 0 1200 200" fill="none" className="hidden md:block">
        <defs>
          <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c7d2fe" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#a5b4fc" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path d="M100 100 Q 300 0 500 100 T 900 100 T 1100 100" stroke="url(#curveGradient)" strokeWidth="3" fill="none" />
      </svg>
      <svg width="100%" height="100%" viewBox="0 0 400 200" fill="none" className="block md:hidden">
        <defs>
          <linearGradient id="curveGradientMobile" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c7d2fe" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#a5b4fc" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.25" />
          </linearGradient>
        </defs>
        <path d="M20 100 Q 100 20 200 100 T 380 100" stroke="url(#curveGradientMobile)" strokeWidth="2" fill="none" />
      </svg>
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();

  const features = [
    {
      titleKey: "features.userAuth.title",
      descriptionKey: "features.userAuth.description",
      benefitKey: "features.userAuth.benefit",
      icon: UserIcon,
      color: "bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700",
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      titleKey: "features.wishlistManagement.title",
      descriptionKey: "features.wishlistManagement.description",
      benefitKey: "features.wishlistManagement.benefit",
      icon: GiftIcon,
      color: "bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600",
      gradient: "from-pink-500 to-rose-500"
    },
    {
      titleKey: "features.giftReservations.title",
      descriptionKey: "features.giftReservations.description",
      benefitKey: "features.giftReservations.benefit",
      icon: LockClosedIcon,
      color: "bg-gradient-to-br from-green-400 via-emerald-500 to-green-600",
      gradient: "from-green-400 to-emerald-600"
    },
    {
      titleKey: "features.wishlistSharing.title",
      descriptionKey: "features.wishlistSharing.description",
      benefitKey: "features.wishlistSharing.benefit",
      icon: ShareIcon,
      color: "bg-gradient-to-br from-yellow-400 via-orange-500 to-yellow-600",
      gradient: "from-yellow-400 to-orange-500"
    },
    {
      titleKey: "features.cloudImages.title",
      descriptionKey: "features.cloudImages.description",
      benefitKey: "features.cloudImages.benefit",
      icon: CloudIcon,
      color: "bg-gradient-to-br from-purple-500 via-fuchsia-600 to-purple-700",
      gradient: "from-purple-500 to-fuchsia-600"
    },
    {
      titleKey: "features.glassmorphismUI.title",
      descriptionKey: "features.glassmorphismUI.description",
      benefitKey: "features.glassmorphismUI.benefit",
      icon: SparklesIcon,
      color: "bg-gradient-to-br from-cyan-400 via-blue-500 to-cyan-600",
      gradient: "from-cyan-400 to-blue-500"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col transition-colors duration-300">
      <Navbar />
      {/* Hero Section */}
      <section className="relative flex flex-col-reverse md:flex-row items-center justify-center py-16 sm:py-24 px-4 sm:px-8 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden w-full transition-colors duration-300">
        <AnimatedBlobs />
        <div className="relative z-10 flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full max-w-xl">
          <motion.h1
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-gray-100 mb-6 tracking-tight drop-shadow-lg w-full transition-colors duration-300"
          >
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 dark:from-purple-400 dark:via-indigo-400 dark:to-purple-500 bg-clip-text text-transparent">
              {t('home.heroTitle')}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mb-8 w-full transition-colors duration-300 leading-relaxed"
          >
            {t('home.heroSubtitle')}
          </motion.p>
          <TrustedBy />
          <TestimonialCarousel />
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="inline-block mt-6"
          >
            <Link
              href="/about"
              className="inline-block px-8 py-4 rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 dark:from-orange-500 dark:via-yellow-500 dark:to-orange-600 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:from-yellow-500 hover:via-orange-600 hover:to-yellow-700 dark:hover:from-orange-600 dark:hover:via-yellow-600 dark:hover:to-orange-700"
            >
              {t('home.learnMore')}
            </Link>
          </motion.div>
        </div>
        <div className="relative z-10 flex-1 flex justify-center mb-8 md:mb-0 w-full max-w-md">
          <StatisticsDisplay />
        </div>
        <ScrollIndicator />
      </section>
      {/* Features Section */}
      <section id="features" className="relative flex flex-col gap-16 sm:gap-20 py-12 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <FeaturesBackground />
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 dark:from-purple-400 dark:via-indigo-400 dark:to-purple-500 bg-clip-text text-transparent">
              {t('home.featuresTitle')}
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('home.featuresSubtitle')}
          </p>
        </motion.div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.titleKey}
                className="glass-card rounded-3xl shadow-xl flex flex-col items-center text-center p-8 min-h-[360px] w-full max-w-md mx-auto relative overflow-hidden transition-all duration-300 hover:shadow-2xl group"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.7, delay: idx * 0.15 }}
                whileHover={{ y: -8 }}
              >
                <motion.div
                  className={`w-20 h-20 mb-6 rounded-2xl ${feature.color} flex items-center justify-center shadow-xl border-4 border-white/40 dark:border-gray-600/40 group-hover:shadow-2xl`}
                  whileHover={{ scale: 1.1, rotate: 6 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Icon className="w-10 h-10 text-white drop-shadow-lg" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 transition-colors duration-300">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-base mb-4 transition-colors duration-300 leading-relaxed">
                  {t(feature.descriptionKey)}
                </p>
                <div className={`text-transparent bg-clip-text bg-gradient-to-r ${feature.gradient} font-semibold text-sm italic mb-3 transition-colors duration-300`}>
                  {t(feature.benefitKey)}
                </div>
                {/* Enhanced divider */}
                <div className={`w-16 h-1 rounded-full bg-gradient-to-r ${feature.gradient} opacity-40 mx-auto mt-2 group-hover:opacity-60 transition-opacity duration-300`} />
              </motion.div>
            );
          })}
        </div>
      </section>
      <Footer />
    </div>
  );
}
