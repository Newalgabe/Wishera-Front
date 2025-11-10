/**
 * Utility functions for managing GIF search history
 */

const SEARCH_HISTORY_KEY = 'gif-search-history';
const MAX_HISTORY_ITEMS = 3;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

/**
 * Get recent search queries from localStorage
 */
export function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!stored) return [];
    
    const history: SearchHistoryItem[] = JSON.parse(stored);
    // Sort by timestamp (most recent first) and return only the query strings
    return history
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_HISTORY_ITEMS)
      .map(item => item.query);
  } catch (error) {
    console.error('Error reading GIF search history:', error);
    return [];
  }
}

/**
 * Save a search query to history
 */
export function saveSearchQuery(query: string): void {
  if (!query.trim()) return;
  
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    let history: SearchHistoryItem[] = stored ? JSON.parse(stored) : [];
    
    // Remove any existing entry with the same query
    history = history.filter(item => item.query.toLowerCase() !== query.toLowerCase());
    
    // Add the new search at the beginning
    history.unshift({
      query: query.trim(),
      timestamp: Date.now()
    });
    
    // Keep only the most recent searches
    history = history.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving GIF search history:', error);
  }
}

/**
 * Clear all search history
 */
export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing GIF search history:', error);
  }
}
