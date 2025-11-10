"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeftIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import Footer from "../../components/Footer";
import { useLanguage } from "../../contexts/LanguageContext";

export default function TermsOfServicePage() {
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
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <DocumentTextIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                {t('settings.termsOfService')}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                By accessing and using Wishera, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Wishera is a wishlist management platform that allows users to create, share, and manage wishlists with friends 
                and family. The service includes features for gift reservations, profile management, and social interactions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">3. User Accounts</h2>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">3.1 Account Creation</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                You must create an account to use certain features of our service. You agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized use</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">3.2 Account Termination</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We reserve the right to suspend or terminate your account if you violate these terms or engage in any 
                fraudulent, abusive, or illegal activity.
              </p>
            </section>

            <section id="community" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">4. User Content</h2>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">4.1 Content Ownership</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                You retain ownership of all content you create and share on Wishera, including wishlists, gift items, 
                images, and profile information.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">4.2 Content License</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                By posting content, you grant Wishera a worldwide, non-exclusive, royalty-free license to use, display, 
                and distribute your content solely for the purpose of providing and improving our service.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">4.3 Prohibited Content</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                You agree not to post content that is:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                <li>Illegal, harmful, or violates any laws</li>
                <li>Infringes on intellectual property rights</li>
                <li>Contains hate speech, harassment, or discrimination</li>
                <li>Is spam, fraudulent, or misleading</li>
                <li>Contains viruses or malicious code</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">5. Privacy</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, 
                to understand our practices regarding the collection and use of your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">6. Gift Reservations</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                The gift reservation feature allows users to mark gifts as reserved. Reservations are made in good faith and 
                do not constitute a legal obligation to purchase. Wishera is not responsible for ensuring that reserved gifts 
                are actually purchased or delivered.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">7. Intellectual Property</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                The service and its original content, features, and functionality are owned by Wishera and are protected by 
                international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">8. Disclaimers</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                The service is provided "as is" and "as available" without warranties of any kind, either express or implied. 
                We do not guarantee that the service will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                To the maximum extent permitted by law, Wishera shall not be liable for any indirect, incidental, special, 
                consequential, or punitive damages resulting from your use or inability to use the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">10. Changes to Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We reserve the right to modify these terms at any time. We will notify users of any material changes by posting 
                the new terms on this page and updating the "Last updated" date. Your continued use of the service after such 
                changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">11. Governing Law</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                These terms shall be governed by and construed in accordance with the laws of the State of California, United States, 
                without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">12. Contact Information</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Email: wisheraapp@gmail.com<br />
                Address: Wishera Legal Team, San Francisco, CA
              </p>
            </section>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}

