'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../contexts/LanguageContext';
import { getMyReservedGifts, cancelGiftReservation } from '../api';
import { GiftDTO } from '../../types';
import { EyeIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ReservedGiftsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [reservedGifts, setReservedGifts] = useState<GiftDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    loadReservedGifts();
  }, [router]);

  const loadReservedGifts = async () => {
    try {
      setLoading(true);
      const gifts = await getMyReservedGifts();
      setReservedGifts(gifts);
    } catch (error) {
      console.error('Failed to load reserved gifts:', error);
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as Error).message;
        if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('Network Error')) {
          setError('Backend services are currently unavailable. Please make sure the backend services are running on ports 5155 and 5003.');
        } else if (errorMessage.includes('Unauthorized')) {
          setError('Unauthorized. Please login again.');
        } else {
          setError(errorMessage);
        }
      } else {
        setError('Failed to load reserved gifts. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (giftId: string) => {
    try {
      await cancelGiftReservation(giftId);
      setReservedGifts(prev => prev.filter(gift => gift.id !== giftId));
      setSuccessMessage('Gift reservation cancelled successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to cancel reservation:', error);
      setError('Failed to cancel reservation. Please try again.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const getTranslatedCategoryLabel = (category: string | null | undefined) => {
    if (!category) return t('dashboard.categories.other');
    const categoryKey = category.toLowerCase().replace(/[^a-z]/g, '');
    return t(`dashboard.categories.${categoryKey}`) || category;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reserved gifts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="font-medium">{t('common.back')}</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('reservedGifts.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('reservedGifts.description')}
          </p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
            <p className="text-green-800 dark:text-green-200">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-red-800 dark:text-red-200 font-medium mb-2">{error}</p>
                {error.includes('Backend services are currently unavailable') && (
                  <div className="text-sm text-red-700 dark:text-red-300">
                    <p className="mb-2">To fix this issue:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Make sure the Main App is running on port 5155</li>
                      <li>Make sure the Gift Service is running on port 5003</li>
                      <li>Check that the backend services are properly started</li>
                      <li>Verify the API endpoint `/reserved` exists on both services</li>
                    </ul>
                  </div>
                )}
                {error.includes('Unauthorized') && (
                  <div className="text-sm text-red-700 dark:text-red-300">
                    <p className="mb-2">Authentication issue:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Your session may have expired</li>
                      <li>Please try logging out and logging back in</li>
                      <li>Make sure you're logged in with a valid account</li>
                    </ul>
                  </div>
                )}
              </div>
              <button
                onClick={loadReservedGifts}
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Reserved Gifts Grid */}
        {!error && reservedGifts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <XMarkIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('reservedGifts.empty.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('reservedGifts.empty.description')}
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {t('reservedGifts.empty.browseGifts')}
            </button>
          </div>
        ) : !error && reservedGifts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {reservedGifts.map((gift) => (
              <div
                key={gift.id}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200"
              >
                {/* Gift Image */}
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  {gift.imageUrl ? (
                    <img
                      src={gift.imageUrl}
                      alt={gift.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🎁</span>
                    </div>
                  )}
                </div>

                {/* Gift Details */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate" title={gift.name}>
                      {gift.name}
                    </h3>
                    <div className="text-lg font-bold text-indigo-600 dark:text-purple-400">
                      ${gift.price}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-indigo-800 dark:text-indigo-200 font-medium">
                      {getTranslatedCategoryLabel(gift.category)}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium">
                      {t('reservedGifts.reserved')}
                    </span>
                  </div>

                  {gift.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {gift.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/wishlist/${gift.wishlistId}`)}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <EyeIcon className="w-4 h-4" />
                      {t('reservedGifts.viewWishlist')}
                    </button>
                    <button
                      onClick={() => handleCancelReservation(gift.id)}
                      className="px-3 py-2 text-sm rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <XMarkIcon className="w-4 h-4" />
                      {t('reservedGifts.cancelReservation')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
