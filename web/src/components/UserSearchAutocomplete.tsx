"use client";
import { useState, useEffect, useRef } from "react";
import { MagnifyingGlassIcon, UserIcon, CheckIcon } from "@heroicons/react/24/outline";
import { searchUsers, type UserSearchDTO } from "../app/api";

interface UserSearchAutocompleteProps {
  value: string[];
  onChange: (userIds: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function UserSearchAutocomplete({
  value,
  onChange,
  placeholder = "Search and add people...",
  className = "",
  disabled = false
}: UserSearchAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchDTO[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Get selected users for display
  const [selectedUsers, setSelectedUsers] = useState<UserSearchDTO[]>([]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchUsers(searchQuery, 1, 10);
        // Filter out already selected users
        const filteredResults = results.filter(user => !value.includes(user.id));
        setSearchResults(filteredResults);
        setShowDropdown(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Failed to search users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, value]);

  // Load selected users data when value changes
  useEffect(() => {
    // This would ideally fetch user details for the selected IDs
    // For now, we'll just clear the selected users when value changes
    setSelectedUsers([]);
  }, [value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleUserSelect = (user: UserSearchDTO) => {
    if (!value.includes(user.id)) {
      onChange([...value, user.id]);
    }
    setSearchQuery("");
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleRemoveUser = (userId: string) => {
    onChange(value.filter(id => id !== userId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleUserSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected Users Display */}
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((userId) => (
            <div
              key={userId}
              className="flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 rounded-full text-sm"
            >
              <UserIcon className="w-4 h-4" />
              <span>{userId}</span>
              <button
                type="button"
                onClick={() => handleRemoveUser(userId)}
                className="ml-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
                disabled={disabled}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && searchResults.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {searchResults.map((user, index) => (
            <div
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className={`flex items-center p-3 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-indigo-50 dark:bg-indigo-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              } ${index === 0 ? 'rounded-t-lg' : ''} ${
                index === searchResults.length - 1 ? 'rounded-b-lg' : ''
              }`}
            >
              <img
                src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username)}`}
                alt={user.username}
                className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-600"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {user.username}
                  </h3>
                  {user.isFollowing && (
                    <CheckIcon className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.isFollowing ? 'Following' : 'Not following'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {showDropdown && searchResults.length === 0 && searchQuery.trim().length >= 2 && !isSearching && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3">
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
            No users found for "{searchQuery}"
          </p>
        </div>
      )}
    </div>
  );
}



