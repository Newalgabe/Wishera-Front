"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeftIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import Footer from "../../components/Footer";
import { useLanguage } from "../../contexts/LanguageContext";

export default function CommunityGuidelinesPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col transition-colors duration-300">
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-8 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>{t('settings.backToDashboard')}</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sm:p-12 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <UserGroupIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                {t('community.title')}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {t('community.lastUpdated')}: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('community.section1.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('community.section1.description')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('community.section2.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('community.section2.description')}
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                <li>{t('community.section2.inclusive')}</li>
                <li>{t('community.section2.respect')}</li>
                <li>{t('community.section2.considerate')}</li>
                <li>{t('community.section2.avoid')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('community.section3.title')}</h2>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('community.section3.appropriateTitle')}</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('community.section3.appropriateDescription')}
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                <li>{t('community.section3.appropriate1')}</li>
                <li>{t('community.section3.appropriate2')}</li>
                <li>{t('community.section3.appropriate3')}</li>
                <li>{t('community.section3.appropriate4')}</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('community.section3.prohibitedTitle')}</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('community.section3.prohibitedDescription')}
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                <li>{t('community.section3.prohibited1')}</li>
                <li>{t('community.section3.prohibited2')}</li>
                <li>{t('community.section3.prohibited3')}</li>
                <li>{t('community.section3.prohibited4')}</li>
                <li>{t('community.section3.prohibited5')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('community.section4.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('community.section4.description')}
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                <li>{t('community.section4.reserve1')}</li>
                <li>{t('community.section4.reserve2')}</li>
                <li>{t('community.section4.reserve3')}</li>
                <li>{t('community.section4.reserve4')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('community.section5.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('community.section5.description')}
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                <li>{t('community.section5.privacy1')}</li>
                <li>{t('community.section5.privacy2')}</li>
                <li>{t('community.section5.privacy3')}</li>
                <li>{t('community.section5.privacy4')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('community.section6.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('community.section6.description')}
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                <li>{t('community.section6.report1')}</li>
                <li>{t('community.section6.report2')}</li>
                <li>{t('community.section6.report3')}</li>
                <li>{t('community.section6.report4')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('community.section7.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('community.section7.description')}
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                <li>{t('community.section7.consequence1')}</li>
                <li>{t('community.section7.consequence2')}</li>
                <li>{t('community.section7.consequence3')}</li>
                <li>{t('community.section7.consequence4')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('community.section8.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('community.section8.description')}
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                <li>{t('community.section8.positive1')}</li>
                <li>{t('community.section8.positive2')}</li>
                <li>{t('community.section8.positive3')}</li>
                <li>{t('community.section8.positive4')}</li>
                <li>{t('community.section8.positive5')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('community.section9.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('community.section9.description')}
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('community.section9.email')}
              </p>
            </section>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
