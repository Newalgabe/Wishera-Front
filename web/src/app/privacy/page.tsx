"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeftIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import Footer from "../../components/Footer";
import { useLanguage } from "../../contexts/LanguageContext";

export default function PrivacyPolicyPage() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

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
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <ShieldCheckIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                {t('settings.privacyPolicy')}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">1. Introduction</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Welcome to Wishera. We are committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">2.1 Personal Information</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                <li>Name and username</li>
                <li>Email address</li>
                <li>Profile information (bio, birthday, interests)</li>
                <li>Wishlist data and gift information</li>
                <li>Profile pictures and images</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">2.2 Usage Information</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We automatically collect information about how you interact with our service, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                <li>Device information and IP address</li>
                <li>Browser type and version</li>
                <li>Pages visited and time spent</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process your requests and transactions</li>
                <li>Send you notifications and updates</li>
                <li>Personalize your experience</li>
                <li>Detect and prevent fraud and abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">4. Data Security</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your personal information, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and authorization</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and monitoring</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">5. Your Rights</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                <li>Access your personal information</li>
                <li>Update or correct your information</li>
                <li>Delete your account and data</li>
                <li>Opt-out of certain communications</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section id="cookies" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">6. Cookies and Tracking</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to enhance your experience, analyze usage, and assist with 
                marketing efforts. You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">7. Third-Party Services</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We may use third-party services that collect, monitor, and analyze information to help us improve our service. 
                These services have their own privacy policies governing the use of your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">8. Children's Privacy</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Our service is not intended for children under the age of 13. We do not knowingly collect personal information 
                from children under 13. If we become aware that we have collected such information, we will take steps to delete it.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">9. Changes to This Policy</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new 
                Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy 
                periodically for any changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">10. Contact Us</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Email: wisheraapp@gmail.com<br />
                Address: Wishera Privacy Team, San Francisco, CA
              </p>
            </section>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}

