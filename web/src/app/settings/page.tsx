"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftIcon, DocumentTextIcon, ShieldCheckIcon, Cog6ToothIcon, UserGroupIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { deleteAccount } from "../api";
import { useLanguage } from "../../contexts/LanguageContext";

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [showDeleteSection, setShowDeleteSection] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showFinalWarning, setShowFinalWarning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const username = typeof window !== 'undefined' ? localStorage.getItem("username") : '';

  const policies = [
    {
      name: t('settings.privacyPolicy'),
      description: t('settings.privacyPolicyDescription'),
      icon: ShieldCheckIcon,
      href: "/privacy",
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      name: t('settings.termsOfService'),
      description: t('settings.termsOfServiceDescription'),
      icon: DocumentTextIcon,
      href: "/terms",
      gradient: "from-purple-500 to-indigo-600"
    },
    {
      name: t('settings.cookiePolicy'),
      description: t('settings.cookiePolicyDescription'),
      icon: Cog6ToothIcon,
      href: "/cookies",
      gradient: "from-orange-500 to-red-600"
    },
    {
      name: t('settings.communityGuidelines'),
      description: t('settings.communityGuidelinesDescription'),
      icon: UserGroupIcon,
      href: "/community",
      gradient: "from-green-500 to-emerald-600"
    }
  ];

  const handleDeleteClick = () => {
    setShowDeleteSection(true);
  };

  const handleConfirmDelete = () => {
    const deletePhrase = t('settings.deleteMyAccountPhrase');
    if (confirmText !== deletePhrase) {
      setError(t('settings.pleaseTypeExactPhrase'));
      return;
    }
    setShowFinalWarning(true);
    setError("");
  };

  const handleFinalDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      // Clear all local storage
      localStorage.clear();
      // Redirect to homepage
      window.location.href = "/";
    } catch (err: any) {
      setError(err.response?.data?.message || t('settings.failedToDelete'));
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setShowDeleteSection(false);
    setShowFinalWarning(false);
    setConfirmText("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>{t('settings.backToDashboard')}</span>
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">{t('settings.title')}</h1>

        {/* Policies & Legal Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policies.map((policy, index) => {
              const Icon = policy.icon;
              return (
                <Link
                  key={policy.href}
                  href={policy.href}
                  className="group"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-purple-500 transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${policy.gradient} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-indigo-600 dark:group-hover:text-purple-400 transition-colors">
                          {policy.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {policy.description}
                        </p>
                        <div className="flex items-center text-indigo-600 dark:text-purple-400 text-sm font-medium">
                          {t('settings.viewPolicy')}
                          <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-2 border-red-200 dark:border-red-900">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">⚠️ {t('settings.dangerZone')}</h2>
          
          {!showDeleteSection ? (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('settings.deleteAccountDescription')}
              </p>
              <button
                onClick={handleDeleteClick}
                className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors border border-red-300 dark:border-red-800"
              >
                {t('settings.deleteAccount')}
              </button>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-4"
            >
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-lg p-6">
                <h3 className="text-lg font-bold text-red-800 dark:text-red-300 mb-3">
                  {t('settings.deleteWarning')}
                </h3>
                
                <div className="space-y-3 text-red-700 dark:text-red-300 text-sm mb-6">
                  <p className="font-semibold">{t('settings.youWillLose')}</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('settings.loseWishlists')}</li>
                    <li>{t('settings.loseFollowers')}</li>
                    <li>{t('settings.loseProfile')}</li>
                    <li>{t('settings.loseMessages')}</li>
                    <li>{t('settings.loseHistory')}</li>
                    <li>{t('settings.loseSharedAccess')}</li>
                  </ul>
                  <p className="font-bold mt-4 text-base">
                    {t('settings.dataCannotBeRecovered')}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 rounded border border-red-300 dark:border-red-700 mb-4">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {t('settings.beforeYouGo')}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm ml-4">
                    <li>{t('settings.alternativePrivate')}</li>
                    <li>{t('settings.alternativeUnfollow')}</li>
                    <li>{t('settings.alternativePrivateWishlists')}</li>
                    <li>{t('settings.alternativeNotifications')}</li>
                    <li>{t('settings.alternativeBreak')}</li>
                    <li>{t('settings.alternativeDeleteWishlists')}</li>
                  </ul>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 italic">
                    {t('settings.alternativesReversible')}
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">
                    {(() => {
                      const confirmText = t('settings.typeToConfirm');
                      const parts = confirmText.split('{phrase}');
                      return (
                        <>
                          {parts[0]}
                          <span className="font-mono bg-red-100 dark:bg-red-900 px-2 py-1 rounded">{t('settings.deleteMyAccountPhrase')}</span>
                          {parts[1] || 'to confirm:'}
                        </>
                      );
                    })()}
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-red-300 dark:border-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder={t('settings.typeHere')}
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
                  >
                    {t('settings.cancelKeepAccount')}
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={confirmText !== t('settings.deleteMyAccountPhrase')}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    {t('settings.iUnderstandDelete')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Final Warning Modal */}
      <AnimatePresence>
        {showFinalWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border-4 border-red-500"
            >
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl">⚠️</span>
                </div>
                
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                  {t('settings.lastChance')}
                </h2>
                
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.areYouSure')}
                </p>
                
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">
                  {username || t('settings.yourAccount')}
                </p>
                
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-red-800 dark:text-red-300 font-semibold">
                    {t('settings.permanentlyDeleteWarning')}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold text-lg"
                  >
                    {t('settings.keepMyAccount')}
                  </button>
                  <button
                    onClick={handleFinalDelete}
                    disabled={isDeleting}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
                  >
                    {isDeleting ? t('settings.deleting') : t('settings.deleteForever')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

