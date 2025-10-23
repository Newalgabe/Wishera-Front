# GIF Search History Feature

## Overview
This feature adds the ability to show the last 3 most recent GIF search queries in both the `EmojiGifPickerModal` and `GifPicker` components.

## Implementation Details

### 1. Utility Functions (`web/src/utils/gifSearchHistory.ts`)
- `getRecentSearches()`: Retrieves the last 3 search queries from localStorage
- `saveSearchQuery(query)`: Saves a search query to history (removes duplicates, keeps only 3 most recent)
- `clearSearchHistory()`: Clears all search history

### 2. Updated Components

#### EmojiGifPickerModal (`web/src/components/EmojiGifPickerModal.tsx`)
- Added recent searches state management
- Shows dropdown with recent searches when focusing on GIF search input
- Saves search queries automatically when performing searches
- Displays recent searches with clock icon and "Recent searches" label

#### GifPicker (`web/src/components/GifPicker.tsx`)
- Same functionality as EmojiGifPickerModal
- Integrated with existing search functionality
- Maintains consistent UI/UX with the modal version

### 3. Features
- **Automatic Saving**: Search queries are automatically saved when users perform GIF searches
- **Duplicate Handling**: Duplicate searches are moved to the top instead of creating new entries
- **Case-Insensitive**: "Cats" and "cats" are treated as the same search
- **Limited History**: Only keeps the 3 most recent searches
- **Persistent Storage**: Uses localStorage to persist across browser sessions
- **Clean UI**: Recent searches appear in a dropdown below the search input
- **Easy Access**: Click on any recent search to instantly search for it again

### 4. User Experience
1. User opens GIF picker (either modal or standalone)
2. User focuses on the search input field
3. If there are recent searches, a dropdown appears showing them
4. User can click on any recent search to instantly search for it
5. New searches are automatically added to the history
6. Only the 3 most recent searches are kept

### 5. Technical Implementation
- Uses React hooks for state management
- Implements proper focus/blur handling for dropdown visibility
- Includes proper TypeScript types
- Follows existing code patterns and styling
- No external dependencies required

## Usage
The feature works automatically - no additional setup required. Users will see their recent GIF searches when they focus on the search input in either GIF picker component.
