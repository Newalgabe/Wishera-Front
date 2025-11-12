"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { 
  HeartIcon, 
  UserGroupIcon, 
  SparklesIcon, 
  ShieldCheckIcon, 
  GlobeAltIcon, 
  AcademicCapIcon,
  LightBulbIcon,
  RocketLaunchIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useLanguage } from "../../contexts/LanguageContext";

const faqKeys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'];

const values = [
  {
    titleKey: "about.values.userCentric.title",
    descriptionKey: "about.values.userCentric.description",
    icon: HeartIcon,
    color: "bg-gradient-to-br from-pink-500 to-rose-500"
  },
  {
    titleKey: "about.values.privacyFirst.title",
    descriptionKey: "about.values.privacyFirst.description",
    icon: ShieldCheckIcon,
    color: "bg-gradient-to-br from-green-400 to-emerald-600"
  },
  {
    titleKey: "about.values.innovation.title",
    descriptionKey: "about.values.innovation.description",
    icon: SparklesIcon,
    color: "bg-gradient-to-br from-purple-500 to-fuchsia-600"
  },
  {
    titleKey: "about.values.community.title",
    descriptionKey: "about.values.community.description",
    icon: UserGroupIcon,
    color: "bg-gradient-to-br from-blue-500 to-indigo-600"
  }
];

const statsData = [
  { number: "10K+", labelKey: "about.stats.happyUsers" },
  { number: "50K+", labelKey: "about.stats.wishlistsCreated" },
  { number: "100K+", labelKey: "about.stats.giftsReserved" },
  { number: "99.9%", labelKey: "about.stats.uptime" }
];

function AnimatedBackground() {
  return (
    <>
      <motion.div
        className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400 opacity-20 rounded-full blur-3xl z-0"
        animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, repeatType: "mirror" }}
      />
      <motion.div
        className="absolute top-40 -right-32 w-80 h-80 bg-pink-400 opacity-15 rounded-full blur-3xl z-0"
        animate={{ y: [0, -20, 0], x: [0, -30, 0] }}
        transition={{ duration: 15, repeat: Infinity, repeatType: "mirror" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 w-72 h-72 bg-purple-400 opacity-15 rounded-full blur-3xl z-0"
        animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
        transition={{ duration: 18, repeat: Infinity, repeatType: "mirror" }}
      />
    </>
  );
}

function StatsSection() {
  const { t } = useLanguage();
  return (
    <section className="relative py-16 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8 }}
        >
          {statsData.map((stat, idx) => (
            <motion.div
              key={stat.labelKey}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <div className="text-3xl md:text-4xl font-bold text-indigo-600 dark:text-purple-400 mb-2 transition-colors duration-300">
                {stat.number}
              </div>
              <div className="text-gray-600 dark:text-gray-300 font-medium transition-colors duration-300">{t(stat.labelKey)}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FAQSection() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative py-16 px-4 sm:px-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors duration-300">
            {t('about.faqTitle')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300">
            {t('about.faqSubtitle')}
          </p>
        </motion.div>
        
        <div className="space-y-4">
          {faqKeys.map((faqKey, idx) => (
            <motion.div
              key={faqKey}
              className="backdrop-blur-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden transition-colors duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <button
                onClick={() => toggleFAQ(idx)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 pr-4 transition-colors duration-300">
                  {t(`about.faqs.${faqKey}.question`)}
                </h3>
                <motion.div
                  animate={{ rotate: openIndex === idx ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <svg
                    className="w-5 h-5 text-indigo-500 dark:text-purple-400 transition-colors duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </motion.div>
              </button>
              <motion.div
                initial={false}
                animate={{
                  height: openIndex === idx ? "auto" : 0,
                  opacity: openIndex === idx ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-4">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed transition-colors duration-300">
                    {t(`about.faqs.${faqKey}.answer`)}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ValuesSection() {
  const { t } = useLanguage();
  return (
    <section className="relative py-16 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors duration-300">
            {t('about.ourValues')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300">
            {t('about.valuesSubtitle')}
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {values.map((value, idx) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={value.titleKey}
                className="backdrop-blur-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-xl p-8 transition-colors duration-300"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.7, delay: idx * 0.15 }}
                whileHover={{ y: -4 }}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-2xl ${value.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors duration-300">
                      {t(value.titleKey)}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed transition-colors duration-300">
                      {t(value.descriptionKey)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MissionSection() {
  const { t } = useLanguage();
  return (
    <section className="relative py-16 px-4 sm:px-8 bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 dark:from-purple-500 dark:to-indigo-500 flex items-center justify-center shadow-lg">
            <RocketLaunchIcon className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6 transition-colors duration-300">
            {t('about.ourMission')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8 transition-colors duration-300">
            {t('about.missionText1')}
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8 transition-colors duration-300">
            {t('about.missionText2')}
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 dark:from-purple-500 dark:to-indigo-500 text-white font-semibold text-lg shadow-lg hover:scale-105 transition-transform"
          >
            {t('about.joinCommunity')}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default function About() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex flex-col transition-colors duration-300">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-8 bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 overflow-hidden transition-colors duration-300">
        <AnimatedBackground />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6 transition-colors duration-300">
              {t('about.title')}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed transition-colors duration-300">
              {t('about.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 transition-colors duration-300">
                <GlobeAltIcon className="w-6 h-6" />
                <span>{t('about.globalCommunity')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 transition-colors duration-300">
                <LightBulbIcon className="w-6 h-6" />
                <span>{t('about.innovativeDesign')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 transition-colors duration-300">
                <AcademicCapIcon className="w-6 h-6" />
                <span>{t('about.continuousLearning')}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <StatsSection />
      <ValuesSection />
      <FAQSection />
      <MissionSection />
      
      <Footer />
    </div>
  );
} 