"use client";
import React, { useState, useRef, useEffect } from 'react';
import { PhotoIcon, XMarkIcon, MagnifyingGlassIcon, ClockIcon } from '@heroicons/react/24/outline';
import { getRecentSearches, saveSearchQuery } from '../utils/gifSearchHistory';

interface GifPickerProps {
  onGifSelect: (gifUrl: string, gifTitle: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

interface GifData {
  id: string;
  title: string;
  images: {
    fixed_width?: {
      url: string;
      width: string;
      height: string;
    };
    downsized_medium?: {
      url: string;
      width: string;
      height: string;
    };
    downsized?: {
      url: string;
      width: string;
      height: string;
    };
    original: {
      url: string;
      width: string;
      height: string;
    };
  };
}

const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
const GIPHY_BASE_URL = 'https://api.giphy.com/v1/gifs';

// Individual GIF item component with error handling
function GifItem({ gif, onSelect }: { gif: GifData; onSelect: () => void }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentImageUrl, setCurrentImageUrl] = useState(
    gif.images.fixed_width?.url || 
    gif.images.downsized_medium?.url || 
    gif.images.downsized?.url || 
    gif.images.original.url
  );
  const [retryCount, setRetryCount] = useState(0);

  // Test if the URL is accessible
  const testImageUrl = (url: string) => {
    const testImg = new Image();
    testImg.onload = () => console.log(`Test image loaded successfully: ${url}`);
    testImg.onerror = () => console.log(`Test image failed to load: ${url}`);
    testImg.src = url;
  };

  // Test the initial URL when component mounts
  React.useEffect(() => {
    console.log(`Testing initial URL: ${currentImageUrl}`);
    testImageUrl(currentImageUrl);
  }, []);

  const handleImageError = () => {
    console.log(`Image failed to load: ${currentImageUrl}, retry count: ${retryCount}`);
    console.log('Available image sizes:', Object.keys(gif.images));
    
    if (retryCount === 0) {
      // Try downsized_medium first
      const fallbackUrl = gif.images.downsized_medium?.url || gif.images.downsized?.url || gif.images.original.url;
      console.log(`Trying downsized_medium URL: ${fallbackUrl}`);
      setCurrentImageUrl(fallbackUrl);
      setRetryCount(1);
    } else if (retryCount === 1) {
      // Try downsized as second fallback
      const fallbackUrl = gif.images.downsized?.url || gif.images.original.url;
      console.log(`Trying downsized URL: ${fallbackUrl}`);
      setCurrentImageUrl(fallbackUrl);
      setRetryCount(2);
    } else if (retryCount === 2) {
      // Try the original size as last resort
      console.log(`Trying original URL: ${gif.images.original.url}`);
      setCurrentImageUrl(gif.images.original.url);
      setRetryCount(3);
    } else {
      // All attempts failed
      console.log(`All image loading attempts failed for GIF: ${gif.title}`);
      setImageError(true);
      setImageLoading(false);
    }
  };

  const handleImageLoad = () => {
    console.log(`Successfully loaded image: ${currentImageUrl}`);
    setImageLoading(false);
    
    // Check if the image is actually visible
    setTimeout(() => {
      const img = document.querySelector(`img[src="${currentImageUrl}"]`);
      if (img) {
        const rect = img.getBoundingClientRect();
        console.log(`Image dimensions: ${rect.width}x${rect.height}, visible: ${rect.width > 0 && rect.height > 0}`);
        console.log(`Image computed styles:`, window.getComputedStyle(img));
      }
    }, 100);
  };

  return (
    <button
      onClick={onSelect}
      className="relative group rounded-lg overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
      title={gif.title}
    >
      {imageLoading && (
        <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        </div>
      )}
      
      {!imageError ? (
        <img
          src={currentImageUrl}
          alt={gif.title}
          style={{ 
            width: '100%', 
            height: '96px', 
            objectFit: 'cover',
            display: imageLoading ? 'none' : 'block'
          }}
          onError={handleImageError}
          onLoad={handleImageLoad}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
          <PhotoIcon className="w-6 h-6 mb-1" />
          <span className="text-xs text-center px-1">Image unavailable</span>
          <span className="text-xs text-center px-1 break-all">{currentImageUrl.substring(0, 30)}...</span>
        </div>
      )}
      
    </button>
  );
}

export default function GifPicker({ onGifSelect, onClose, isOpen }: GifPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<GifData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load recent searches when component mounts
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
    }
  }, [isOpen]);

  // Trending GIFs on component mount
  useEffect(() => {
    if (isOpen && gifs.length === 0) {
      if (GIPHY_API_KEY) {
        fetchTrendingGifs();
      } else {
        setError('GIPHY API key not configured. Please add NEXT_PUBLIC_GIPHY_API_KEY to your environment variables.');
      }
    }
  }, [isOpen]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchTrendingGifs = async () => {
    if (!GIPHY_API_KEY) {
      setError('GIPHY API key not configured. Please add NEXT_PUBLIC_GIPHY_API_KEY to your environment variables.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${GIPHY_BASE_URL}/trending?api_key=${GIPHY_API_KEY}&limit=20`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (data.data) {
        console.log('GIPHY API response:', data.data[0]); // Log first GIF to see structure
        setGifs(data.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load GIFs';
      setError(errorMessage);
      console.error('Error fetching trending GIFs:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      fetchTrendingGifs();
      return;
    }

    if (!GIPHY_API_KEY) {
      setError('GIPHY API key not configured. Please add NEXT_PUBLIC_GIPHY_API_KEY to your environment variables.');
      return;
    }

    // Save search query to history
    saveSearchQuery(query);
    setRecentSearches(getRecentSearches());
    setShowRecentSearches(false);

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${GIPHY_BASE_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (data.data) {
        setGifs(data.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search GIFs';
      setError(errorMessage);
      console.error('Error searching GIFs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchGifs(searchQuery);
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    searchGifs(query);
  };

  const handleSearchInputFocus = () => {
    if (recentSearches.length > 0) {
      setShowRecentSearches(true);
    }
  };

  const handleSearchInputBlur = () => {
    // Delay hiding to allow clicking on recent searches
    setTimeout(() => setShowRecentSearches(false), 150);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full mb-2 left-0 w-96 h-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">GIFs</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={GIPHY_API_KEY ? "Search GIFs..." : "API key required to search GIFs"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchInputFocus}
              onBlur={handleSearchInputBlur}
              disabled={!GIPHY_API_KEY}
              className="w-full pl-10 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900 dark:text-white placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            
            {/* Recent searches dropdown */}
            {showRecentSearches && recentSearches.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <ClockIcon className="w-3 h-3" />
                    <span>Recent searches</span>
                  </div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !GIPHY_API_KEY}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '...' : 'Search'}
          </button>
        </form>
      </div>

      {/* GIFs Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400 px-4">
            <PhotoIcon className="w-8 h-8 mb-2" />
            <p className="text-sm text-center mb-2">{error}</p>
            {error.includes('API key') ? (
              <div className="text-center">
                <a
                  href="https://developers.giphy.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline"
                >
                  Get free API key from GIPHY
                </a>
                <p className="text-xs mt-1">Add it to your .env.local file</p>
              </div>
            ) : (
              <button
                onClick={fetchTrendingGifs}
                className="mt-2 px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        ) : gifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <PhotoIcon className="w-8 h-8 mb-2" />
            <p className="text-sm">No GIFs found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((gif, index) => (
              <GifItem
                key={`${gif.id}-${index}`}
                gif={gif}
                onSelect={() => {
                  onGifSelect(gif.images.original.url, gif.title);
                  onClose();
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Powered by <span className="font-semibold">GIPHY</span>
        </p>
      </div>
    </div>
  );
}
