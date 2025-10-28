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
  TagIcon,
  EllipsisHorizontalIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useLanguage } from "../../../contexts/LanguageContext";
import { getBirthdayInfo } from "../../../utils/birthdayUtils";
import {
  getUserProfile,
  followUser,
  unfollowUser,
  type UserProfileDTO,
  getUserWishlists,
  getFollowers,
  getFollowing,
  type UserSearchDTO,
  type WishlistResponseDTO
} from "../../api";

type UIWishlist = {
  id: string;
  user: { id: string; name: string; avatar: string; username: string };
  title: string;
  description?: string | null;
  category?: string | null;
  isPublic?: boolean;
  gifts: { id: string; name: string; price?: number | null; image?: string | null }[];
  likes: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
};

export default function UserProfilePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [profile, setProfile] = useState<UserProfileDTO | null>(null);
  const [wishlists, setWishlists] = useState<UIWishlist[]>([]);
  const [followers, setFollowers] = useState<UserSearchDTO[]>([]);
  const [following, setFollowing] = useState<UserSearchDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'wishlists' | 'friends'>('wishlists');

  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const isOwnProfile = currentUserId === userId;

  // Categorize friends
  const mutuals = followers.filter(follower => 
    following.some(followed => followed.id === follower.id)
  );
  
  const followersOnly = followers.filter(follower => 
    !following.some(followed => followed.id === follower.id)
  );
  
  const followingOnly = following.filter(followed => 
    !followers.some(follower => follower.id === followed.id)
  );

  const formatUsername = (username: string) => {
    return username.startsWith('@') ? username : `@${username}`;
  };

  useEffect(() => {
    async function loadUserProfile() {
      if (!userId) return;
      
      try {
        setLoading(true);
        const [userProfile, userWishlists, userFollowers, userFollowing] = await Promise.all([
          getUserProfile(userId),
          getUserWishlists(userId, 1, 20),
          getFollowers(userId, 1, 10),
          getFollowing(userId, 1, 10)
        ]);

        const mappedWishlists: UIWishlist[] = userWishlists.map(w => ({
          id: w.id,
          user: { 
            id: w.userId, 
            name: userProfile.username, 
            avatar: w.avatarUrl || "", 
            username: formatUsername(userProfile.username) 
          },
          title: w.title,
          description: w.description,
          category: w.category,
          isPublic: w.isPublic,
          gifts: [],
          likes: w.likeCount,
          isLiked: w.isLiked,
          isBookmarked: false,
          createdAt: new Date(w.createdAt).toLocaleString()
        }));

        setProfile(userProfile);
        setWishlists(mappedWishlists);
        setFollowers(userFollowers);
        setFollowing(userFollowing);
      } catch (err) {
        console.error('Error loading user profile:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [userId]);

  const handleFollow = async () => {
    if (!profile) return;
    
    try {
      if (profile.isFollowing) {
        await unfollowUser(profile.id);
        setProfile(prev => prev ? { ...prev, isFollowing: false, followersCount: prev.followersCount - 1 } : null);
        setSuccessMessage(t('userProfile.unfollowedSuccessfully'));
      } else {
        await followUser(profile.id);
        setProfile(prev => prev ? { ...prev, isFollowing: true, followersCount: prev.followersCount + 1 } : null);
        setSuccessMessage(t('userProfile.followedSuccessfully'));
      }
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error following/unfollowing:', err);
      setError(t('userProfile.failedToFollow'));
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `https://wishera.vercel.app/user/${userId}`;
      await navigator.clipboard.writeText(shareUrl);
              setSuccessMessage(t('userProfile.profileLinkCopied'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setError(t('userProfile.failedToCopyLink'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            {t('userProfile.loading')}
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-red-500 py-12">
            {error || t('userProfile.userNotFound')}
          </div>
          <button
            onClick={() => router.back()}
            className="mx-auto flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {t('userProfile.goBack')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="p-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            >
              <ShareIcon className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg border-4 border-gray-200 dark:border-gray-700">
                <img
                  src={profile.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.username)}`}
                  alt={profile.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {formatUsername(profile.username)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {profile.followersCount} {t('dashboard.followers')} • {profile.followingCount} {t('dashboard.following')} • {profile.wishlistCount} wishlists
                </div>
                {profile.bio && (
                  <p className="text-gray-700 dark:text-gray-300 max-w-md">{profile.bio}</p>
                )}
                {profile.birthday && (() => {
                  const birthdayInfo = getBirthdayInfo(profile.birthday, false);
                  return (
                    <div className="mt-3 p-3 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl border border-pink-200 dark:border-pink-800">
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {birthdayInfo.formattedDate}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        Age: {birthdayInfo.age} years old
                      </div>
                      <div className="mt-1 text-xs text-pink-600 dark:text-pink-400 font-medium">
                        {birthdayInfo.countdownMessage}
                      </div>
                    </div>
                  );
                })()}
                {profile.interests && profile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {profile.interests.map((interest, idx) => (
                      <span key={idx} className="px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {!isOwnProfile && (
              <button
                onClick={handleFollow}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  profile.isFollowing
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {profile.isFollowing ? t('dashboard.unfollow') : t('dashboard.follow')}
              </button>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mb-8"
        >
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('wishlists')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'wishlists'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t('userProfile.wishlists')} ({wishlists.length})
            </button>
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'friends'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Friends ({followers.length + following.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'wishlists' && (
              <div className="space-y-4">
                {wishlists.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    {t('userProfile.noWishlists')}
                  </div>
                ) : (
                  wishlists.map((wishlist) => (
                    <div
                      key={wishlist.id}
                      className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200 cursor-pointer"
                      onClick={() => router.push(`/wishlist/${wishlist.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{wishlist.title}</h3>
                          {wishlist.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{wishlist.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{wishlist.gifts.length} items</span>
                            <span>{wishlist.likes} likes</span>
                            <span>{wishlist.createdAt}</span>
                          </div>
                        </div>
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'friends' && (
              <div className="space-y-6">
                {followers.length === 0 && following.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No friends yet
                  </div>
                ) : (
                  <>
                    {/* Mutuals Section */}
                    {mutuals.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Mutuals
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                            {mutuals.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {mutuals.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer"
                              onClick={() => router.push(`/user/${user.id}`)}
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.username)}`}
                                  alt={user.username}
                                  className="w-10 h-10 rounded-full border-2 border-green-300 dark:border-green-700"
                                />
                                <div>
                                  <span className="font-medium text-gray-900 dark:text-white block">
                                    {formatUsername(user.username)}
                                  </span>
                                  <span className="text-xs text-green-600 dark:text-green-400">
                                    Following each other
                                  </span>
                                </div>
                              </div>
                              <ArrowLeftIcon className="h-4 w-4 text-green-600 dark:text-green-400 rotate-180" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Followers Only Section */}
                    {followersOnly.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Following You
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                            {followersOnly.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {followersOnly.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                              onClick={() => router.push(`/user/${user.id}`)}
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.username)}`}
                                  alt={user.username}
                                  className="w-10 h-10 rounded-full border-2 border-blue-300 dark:border-blue-700"
                                />
                                <div>
                                  <span className="font-medium text-gray-900 dark:text-white block">
                                    {formatUsername(user.username)}
                                  </span>
                                  <span className="text-xs text-blue-600 dark:text-blue-400">
                                    Follows you
                                  </span>
                                </div>
                              </div>
                              <ArrowLeftIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 rotate-180" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Following Only Section */}
                    {followingOnly.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            You Follow
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                            {followingOnly.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {followingOnly.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors cursor-pointer"
                              onClick={() => router.push(`/user/${user.id}`)}
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.username)}`}
                                  alt={user.username}
                                  className="w-10 h-10 rounded-full border-2 border-purple-300 dark:border-purple-700"
                                />
                                <div>
                                  <span className="font-medium text-gray-900 dark:text-white block">
                                    {formatUsername(user.username)}
                                  </span>
                                  <span className="text-xs text-purple-600 dark:text-purple-400">
                                    You follow them
                                  </span>
                                </div>
                              </div>
                              <ArrowLeftIcon className="h-4 w-4 text-purple-600 dark:text-purple-400 rotate-180" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
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
