"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { deleteAccount } from "../api";

export default function SettingsPage() {
  const router = useRouter();
  const [showDeleteSection, setShowDeleteSection] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showFinalWarning, setShowFinalWarning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const username = typeof window !== 'undefined' ? localStorage.getItem("username") : '';

  const handleDeleteClick = () => {
    setShowDeleteSection(true);
  };

  const handleConfirmDelete = () => {
    if (confirmText !== "DELETE MY ACCOUNT") {
      setError("Please type the exact phrase to continue");
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
      setError(err.response?.data?.message || "Failed to delete account");
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
          <span>Back to Dashboard</span>
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Account Settings</h1>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-2 border-red-200 dark:border-red-900">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">⚠️ Danger Zone</h2>
          
          {!showDeleteSection ? (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                onClick={handleDeleteClick}
                className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors border border-red-300 dark:border-red-800"
              >
                Delete Account
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
                  ⚠️ WARNING: This action is PERMANENT and IRREVERSIBLE
                </h3>
                
                <div className="space-y-3 text-red-700 dark:text-red-300 text-sm mb-6">
                  <p className="font-semibold">You will lose ALL of the following:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>All your wishlists and gift items</li>
                    <li>All your followers and following connections</li>
                    <li>Your profile information and settings</li>
                    <li>All your messages and conversations</li>
                    <li>Your account history and activity</li>
                    <li>Access to any shared wishlists</li>
                  </ul>
                  <p className="font-bold mt-4 text-base">
                    This data CANNOT be recovered once deleted!
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 rounded border border-red-300 dark:border-red-700 mb-4">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Before you go, consider these alternatives:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm ml-4">
                    <li>Making your account private to limit who sees your profile</li>
                    <li>Unfollowing users you don't want to see</li>
                    <li>Setting your wishlists to private instead of deleting them</li>
                    <li>Turning off notifications to reduce distractions</li>
                    <li>Just logging out and taking a break</li>
                    <li>Deleting specific wishlists instead of your entire account</li>
                  </ul>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 italic">
                    All of these options are reversible. Account deletion is not.
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">
                    Type <span className="font-mono bg-red-100 dark:bg-red-900 px-2 py-1 rounded">DELETE MY ACCOUNT</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-red-300 dark:border-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Type here..."
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
                    Cancel (Keep My Account)
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={confirmText !== "DELETE MY ACCOUNT"}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    I Understand, Delete Forever
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
                  Last Chance!
                </h2>
                
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Are you absolutely sure you want to delete your account?
                </p>
                
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">
                  {username || 'Your account'}
                </p>
                
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-red-800 dark:text-red-300 font-semibold">
                    This action will PERMANENTLY delete ALL your data.
                    You will NOT be able to sign in again or recover anything.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold text-lg"
                  >
                    Keep My Account
                  </button>
                  <button
                    onClick={handleFinalDelete}
                    disabled={isDeleting}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
                  >
                    {isDeleting ? "Deleting..." : "Delete Forever"}
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

