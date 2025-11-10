"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeftIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import Footer from "../../components/Footer";
import { useLanguage } from "../../contexts/LanguageContext";

export default function CookiePolicyPage() {
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
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Cog6ToothIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                {t('cookies.title')}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {t('cookies.lastUpdated')}: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('cookies.section1.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('cookies.section1.description')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('cookies.section2.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('cookies.section2.description')}
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                <li><strong>{t('cookies.section2.essential')}</strong></li>
                <li><strong>{t('cookies.section2.authentication')}</strong></li>
                <li><strong>{t('cookies.section2.preferences')}</strong></li>
                <li><strong>{t('cookies.section2.analytics')}</strong></li>
                <li><strong>{t('cookies.section2.functionality')}</strong></li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('cookies.section3.title')}</h2>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('cookies.section3.sessionTitle')}</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('cookies.section3.sessionDescription')}
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('cookies.section3.persistentTitle')}</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('cookies.section3.persistentDescription')}
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('cookies.section3.thirdPartyTitle')}</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('cookies.section3.thirdPartyDescription')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('cookies.section4.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('cookies.section4.description')}
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                <li>{t('cookies.section4.view')}</li>
                <li>{t('cookies.section4.block')}</li>
                <li>{t('cookies.section4.blockAll')}</li>
                <li>{t('cookies.section4.delete')}</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('cookies.section4.note')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('cookies.section5.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('cookies.section5.description')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('cookies.section6.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('cookies.section6.description')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('cookies.section7.title')}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('cookies.section7.description')}
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('cookies.section7.email')}
              </p>
            </section>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
