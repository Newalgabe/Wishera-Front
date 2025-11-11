"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeftIcon,
  ShareIcon,
  HeartIcon,
  BookmarkIcon,
  PlusIcon,
  EyeIcon,
  UserIcon,
  CalendarIcon,
  TagIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useLanguage } from "../../../contexts/LanguageContext";
import {
  getWishlistDetails,
  likeWishlist,
  unlikeWishlist,
  type WishlistResponseDTO,
  followUser,
  unfollowUser,
  type UserSearchDTO,
  getMyGifts,
  addGiftToWishlist,
  removeGiftFromWishlist,
  createGift,
  reserveGift,
  cancelGiftReservation,
  type GiftDTO
} from "../../api";

export default function WishlistDetailsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const wishlistId = params.id as string;
  
  const [wishlist, setWishlist] = useState<WishlistResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [myGifts, setMyGifts] = useState<GiftDTO[]>([]);
  const [showGiftSelector, setShowGiftSelector] = useState(false);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [createGiftForm, setCreateGiftForm] = useState<{ name: string; price: string; category: string; imageFile: File | null }>({ name: "", price: "", category: "", imageFile: null });
  const [createGiftLoading, setCreateGiftLoading] = useState(false);
  const [createGiftError, setCreateGiftError] = useState<string | null>(null);
  const [reservingGiftId, setReservingGiftId] = useState<string | null>(null);

  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    async function loadWishlistDetails() {
      try {
        setLoading(true);
        const details = await getWishlistDetails(wishlistId);
        console.log('Wishlist details:', details);
        console.log('Current user ID:', currentUserId);
        console.log('Wishlist owner ID:', details.userId);
        console.log('Is owner:', details.isOwner);
        setWishlist(details);
        // For now, we'll assume the user is not following since we don't have this info in the wishlist response
        // In a real app, you might want to make a separate API call to check follow status
        setIsFollowing(false);
      } catch (error: unknown) {
        console.error('Failed to load wishlist details:', error);
        const errorMessage = error && typeof error === 'object' && 'response' in error 
          ? (error.response as { data?: { message?: string } })?.data?.message 
          : 'Failed to load wishlist details';
        setError(errorMessage || 'Failed to load wishlist details');
      } finally {
        setLoading(false);
      }
    }

    if (wishlistId) {
      loadWishlistDetails();
    }
  }, [wishlistId, router]);

  const loadMyGifts = async () => {
    if (!currentUserId) return;
    
    try {
      setLoadingGifts(true);
      const gifts = await getMyGifts();
      setMyGifts(gifts);
    } catch (error: unknown) {
      console.error('Failed to load gifts:', error);
    } finally {
      setLoadingGifts(false);
    }
  };

  const handleAddGiftToWishlist = async (giftId: string) => {
    if (!wishlist) return;
    
    try {
      await addGiftToWishlist(giftId, wishlist.id);
      setSuccessMessage('Gift added to wishlist successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Reload wishlist details to show the new gift
      const details = await getWishlistDetails(wishlistId);
      setWishlist(details);
      
      // Hide the gift selector
      setShowGiftSelector(false);
    } catch (error: unknown) {
      console.error('Failed to add gift to wishlist:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error.response as { data?: { message?: string } })?.data?.message 
        : 'Failed to add gift to wishlist';
      setError(errorMessage || 'Failed to add gift to wishlist');
    }
  };

  const handleCreateGiftAndAdd = async () => {
    if (!wishlist) return;
    const name = createGiftForm.name.trim();
    const priceNum = Number(createGiftForm.price);
    if (!name) {
      setCreateGiftError('Name is required');
      return;
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setCreateGiftError('Price must be a valid non-negative number');
      return;
    }
    try {
      setCreateGiftLoading(true);
      setCreateGiftError(null);
      await createGift({
        name,
        price: priceNum,
        category: createGiftForm.category.trim() || 'Other',
        wishlistId: wishlist.id,
        imageFile: createGiftForm.imageFile
      });
      setSuccessMessage('Gift created and added to wishlist!');
      setTimeout(() => setSuccessMessage(null), 3000);
      const details = await getWishlistDetails(wishlistId);
      setWishlist(details);
      // reset form
      setCreateGiftForm({ name: "", price: "", category: "", imageFile: null });
      setShowGiftSelector(false);
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error.response as { data?: { message?: string } })?.data?.message 
        : 'Failed to create gift';
      setCreateGiftError(errorMessage || 'Failed to create gift');
    } finally {
      setCreateGiftLoading(false);
    }
  };

  const handleRemoveGiftFromWishlist = async (giftId: string) => {
    if (!wishlist) return;
    
    try {
      await removeGiftFromWishlist(giftId);
      setSuccessMessage('Gift removed from wishlist successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Reload wishlist details to reflect the removal
      const details = await getWishlistDetails(wishlistId);
      setWishlist(details);
    } catch (error: unknown) {
      console.error('Failed to remove gift from wishlist:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error.response as { data?: { message?: string } })?.data?.message 
        : 'Failed to remove gift from wishlist';
      setError(errorMessage || 'Failed to remove gift from wishlist');
    }
  };

  const handleReserveGift = async (giftId: string, isReserved: boolean) => {
    if (!wishlist) return;
    
    console.log('Reserving gift:', { giftId, isReserved, wishlistItems: wishlist.items?.length });
    setReservingGiftId(giftId);
    
    // Optimistically update the UI immediately
    setWishlist(prevWishlist => {
      if (!prevWishlist || !prevWishlist.items || !Array.isArray(prevWishlist.items)) return prevWishlist;
      
      return {
        ...prevWishlist,
        items: prevWishlist.items.map(gift => {
          if (gift.giftId === giftId) {
            if (isReserved) {
              // Cancel reservation - remove reservation info
              return {
                ...gift,
                reservedByUserId: null,
                reservedByUsername: null
              };
            } else {
              // Reserve gift - add reservation info
              return {
                ...gift,
                reservedByUserId: currentUserId,
                reservedByUsername: 'You' // We'll update this with the actual username from the API response
              };
            }
          }
          return gift;
        })
      };
    });
    
    try {
      if (isReserved) {
        await cancelGiftReservation(giftId);
        setSuccessMessage('Gift reservation cancelled successfully!');
      } else {
        const response = await reserveGift(giftId);
        setSuccessMessage('Gift reserved successfully!');
        
        // Update with the actual username from the API response
        setWishlist(prevWishlist => {
          if (!prevWishlist || !prevWishlist.items || !Array.isArray(prevWishlist.items)) return prevWishlist;
          
          return {
            ...prevWishlist,
            items: prevWishlist.items.map(gift => {
              if (gift.giftId === giftId) {
                return {
                  ...gift,
                  reservedByUsername: response.reservedBy || 'You'
                };
              }
              return gift;
            })
          };
        });
      }
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: unknown) {
      console.error('Failed to reserve/cancel gift:', error);

      // Revert the optimistic update on error
      setWishlist(prevWishlist => {
        if (!prevWishlist || !prevWishlist.items || !Array.isArray(prevWishlist.items)) return prevWishlist;
        
        return {
          ...prevWishlist,
          items: prevWishlist.items.map(gift => {
            if (gift.giftId === giftId) {
              if (isReserved) {
                // Revert cancellation - restore reservation info
                return {
                  ...gift,
                  reservedByUserId: currentUserId,
                  reservedByUsername: 'You'
                };
              } else {
                // Revert reservation - remove reservation info
                return {
                  ...gift,
                  reservedByUserId: null,
                  reservedByUsername: null
                };
              }
            }
            return gift;
          })
        };
      });

      let errorMessage = 'Failed to reserve/cancel gift';

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.status === 404) {
          errorMessage = 'Gift not found. Please refresh the page and try again.';
        } else if (axiosError.response?.status === 0 || axiosError.code === 'ECONNREFUSED') {
          errorMessage = 'Gift service is currently unavailable. Please try again later.';
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as Error).message;
      }

      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setReservingGiftId(null);
    }
  };

  const handleLike = async () => {
    if (!wishlist || !currentUserId) return;
    
    try {
      if (wishlist.isLiked) {
        await unlikeWishlist(wishlist.id);
        setWishlist(prev => prev ? { ...prev, isLiked: false, likeCount: prev.likeCount - 1 } : null);
      } else {
        await likeWishlist(wishlist.id);
        setWishlist(prev => prev ? { ...prev, isLiked: true, likeCount: prev.likeCount + 1 } : null);
      }
    } catch (error: unknown) {
      console.error('Failed to like/unlike wishlist:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error.response as { data?: { message?: string } })?.data?.message 
        : 'Failed to update like status';
      setError(errorMessage || 'Failed to update like status');
    }
  };

  const handleFollow = async () => {
    if (!wishlist || !currentUserId) return;
    
    try {
      if (isFollowing) {
        await unfollowUser(wishlist.userId);
        setIsFollowing(false);
      } else {
        await followUser(wishlist.userId);
        setIsFollowing(true);
      }
          } catch (error: unknown) {
        console.error('Failed to follow/unfollow user:', error);
        const errorMessage = error && typeof error === 'object' && 'response' in error 
          ? (error.response as { data?: { message?: string } })?.data?.message 
          : 'Failed to update follow status';
        setError(errorMessage || 'Failed to update follow status');
      }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/wishlist/${wishlistId}`;
      await navigator.clipboard.writeText(shareUrl);
      setSuccessMessage(t('dashboard.wishlistShared'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = `${window.location.origin}/wishlist/${wishlistId}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setSuccessMessage(t('dashboard.wishlistShared'));
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getTranslatedCategoryLabel = (category: string | null) => {
    if (!category) return t('dashboard.categories.other');
    const key = category.toLowerCase().replace(/[^a-z]/g, '');
    return t(`dashboard.categories.${key}`) || category;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !wishlist) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <EyeIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Wishlist Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'This wishlist could not be found.'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mr-4"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Wishlist Details</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleShare}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Share wishlist"
              >
                <ShareIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Wishlist Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{wishlist.title}</h2>
                  {wishlist.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{wishlist.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      {formatDate(wishlist.createdAt)}
                    </div>
                    {wishlist.category && (
                      <div className="flex items-center">
                        <TagIcon className="w-4 h-4 mr-1" />
                        {getTranslatedCategoryLabel(wishlist.category)}
                      </div>
                    )}
                    <div className="flex items-center">
                      <EyeIcon className="w-4 h-4 mr-1" />
                      {wishlist.isPublic ? t('dashboard.public') : t('dashboard.private')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleLike}
                    className={`p-2 rounded-lg transition-colors ${
                      wishlist.isLiked
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {wishlist.isLiked ? (
                      <HeartIconSolid className="w-5 h-5" />
                    ) : (
                      <HeartIcon className="w-5 h-5" />
                    )}
                  </button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{wishlist.likeCount}</span>
                </div>
              </div>
            </motion.div>

            {/* Gifts Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Gifts ({wishlist.items.length})</h3>
                {wishlist.isOwner && (
                  <button
                    onClick={() => {
                      if (showGiftSelector) {
                        setShowGiftSelector(false);
                      } else {
                        loadMyGifts();
                        setShowGiftSelector(true);
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Gift</span>
                  </button>
                )}
              </div>
              
              {wishlist.items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PlusIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">No gifts added yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wishlist.items.map((gift, index) => (
                    <div
                      key={index}
                      className={`border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow ${
                        reservingGiftId === gift.giftId ? 'ring-2 ring-indigo-500 ring-opacity-50 bg-indigo-50 dark:bg-indigo-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {gift.imageUrl ? (
                          <img
                            src={gift.imageUrl}
                            alt={gift.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <PlusIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">{gift.title}</h4>
                          {gift.price && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">${gift.price}</p>
                          )}
                          {gift.category && (
                            <span className="inline-block px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full mt-1">
                              {getTranslatedCategoryLabel(gift.category)}
                            </span>
                          )}
                          {gift.reservedByUsername && !wishlist.isOwner && (
                            <div className="mt-2">
                              <span className="inline-block px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full">
                                Reserved by {gift.reservedByUsername}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col space-y-2">
                          {!wishlist.isOwner && gift.giftId && (
                            <button
                              onClick={() => handleReserveGift(gift.giftId!, !!gift.reservedByUserId)}
                              className={`px-3 py-1 text-sm rounded transition-colors flex items-center gap-2 ${
                                gift.reservedByUserId && gift.reservedByUserId === currentUserId
                                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                  : gift.reservedByUserId
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              }`}
                              title={gift.reservedByUserId ? "Cancel reservation" : "Reserve gift"}
                              disabled={gift.reservedByUserId && gift.reservedByUserId !== currentUserId || reservingGiftId === gift.giftId}
                            >
                              {reservingGiftId === gift.giftId ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Processing...</span>
                                </>
                              ) : (
                                <>
                                  {gift.reservedByUserId && gift.reservedByUserId === currentUserId 
                                    ? "Cancel Reserve" 
                                    : gift.reservedByUserId 
                                      ? "Reserved" 
                                      : "Reserve"}
                                </>
                              )}
                            </button>
                          )}
                          {wishlist.isOwner && gift.giftId && (
                            <button
                              onClick={() => handleRemoveGiftFromWishlist(gift.giftId!)}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                              title="Remove from wishlist"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Gift Selector Modal */}
              {showGiftSelector && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Select Gift to Add</h4>
                    <button
                      onClick={() => setShowGiftSelector(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      ✕
                    </button>
                  </div>
                  {/* Create new gift */}
                  <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-3">Create New Gift</h5>
                    {createGiftError && (
                      <div className="mb-3 text-sm text-red-500">{createGiftError}</div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Name"
                        value={createGiftForm.name}
                        onChange={(e) => setCreateGiftForm(f => ({ ...f, name: e.target.value }))}
                        className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={createGiftForm.price}
                        onChange={(e) => setCreateGiftForm(f => ({ ...f, price: e.target.value }))}
                        className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                      />
                      <input
                        type="text"
                        placeholder="Category"
                        value={createGiftForm.category}
                        onChange={(e) => setCreateGiftForm(f => ({ ...f, category: e.target.value }))}
                        className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCreateGiftForm(f => ({ ...f, imageFile: e.target.files?.[0] || null }))}
                        className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={handleCreateGiftAndAdd}
                        disabled={createGiftLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {createGiftLoading ? 'Creating...' : 'Create and Add to Wishlist'}
                      </button>
                    </div>
                  </div>

                  {/* Existing gifts list */}
                  {loadingGifts ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">Loading your gifts...</p>
                    </div>
                  ) : myGifts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400 mb-4">No gifts found in your collection</p>
                      <button
                        onClick={() => router.push('/gifts')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Go to My Gifts
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                      {myGifts.map((gift) => (
                        <div
                          key={gift.id}
                          className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                        >
                          <div className="flex items-start space-x-3">
                            {gift.imageUrl ? (
                              <img
                                src={gift.imageUrl}
                                alt={gift.name}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <PlusIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-gray-900 dark:text-white truncate">{gift.name}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">${gift.price}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">{gift.category}</p>
                            </div>
                            <button
                              onClick={() => handleAddGiftToWishlist(gift.id)}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* User Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6"
            >
              <div className="text-center">
                <div 
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => router.push(`/user/${wishlist.userId}`)}
                >
                  <img
                    src={wishlist.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(wishlist.username)}`}
                    alt={wishlist.username}
                    className="w-20 h-20 rounded-full border-4 border-gray-200 dark:border-gray-600 mx-auto mb-4 object-cover"
                  />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {wishlist.username}
                  </h3>
                </div>
                {currentUserId !== wishlist.userId && (
                  <button
                    onClick={handleFollow}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isFollowing
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {isFollowing ? t('dashboard.unfollow') : t('dashboard.follow')}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}
    </div>
  );
}
