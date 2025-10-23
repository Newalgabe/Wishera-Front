# GIF and Emoji Support Setup

This guide explains how to set up GIF and emoji support in the chat application.

## Features Added

### 🎭 Emoji Support
- **Emoji Picker**: Click the smiley face button to open a categorized emoji picker
- **Search**: Search through emojis by typing in the search box
- **Keyboard Shortcut**: Type `:` to quickly open the emoji picker
- **Enhanced Rendering**: Emojis are properly rendered with appropriate font families

### 🎬 GIF Support
- **GIF Picker**: Click the photo button to open a GIF search interface
- **GIPHY Integration**: Search and select GIFs from GIPHY's vast library
- **Smart Rendering**: GIFs are displayed as interactive images with hover effects
- **Compact View**: GIFs show as thumbnails in pinned messages and search results

## Setup Instructions

### 1. GIPHY API Key (Required for GIF functionality)
The GIF functionality requires a GIPHY API key. Without it, the GIF picker will show an error message with instructions.

**To get your free API key:**

1. Visit [GIPHY Developers](https://developers.giphy.com/)
2. Sign up for a free account (no credit card required)
3. Create a new app to get your API key
4. Add the API key to your environment variables:

```bash
# Create or edit .env.local file in the web directory
NEXT_PUBLIC_GIPHY_API_KEY=your_giphy_api_key_here
```

**Important**: 
- The free tier includes 100 requests per day
- No API key = GIF functionality disabled with helpful error message
- Restart your development server after adding the API key

### 2. Usage

#### Adding Emojis
1. **Button Method**: Click the 😊 button in the message input
2. **Keyboard Shortcut**: Type `:` and the emoji picker will open automatically
3. **Search**: Use the search box to find specific emojis
4. **Categories**: Browse through different emoji categories

#### Adding GIFs
1. Click the 📷 button in the message input
2. Search for GIFs using keywords
3. Click on any GIF to add it to your message
4. GIFs are sent in a special format: `![GIF](url)`

#### Message Rendering
- **Emojis**: Automatically detected and rendered with proper styling
- **GIFs**: Displayed as interactive images that can be clicked to open in a new tab
- **Mixed Content**: Text, emojis, and GIFs can be combined in a single message

## Technical Details

### Components Created
- `EmojiPicker.tsx`: Categorized emoji picker with search
- `GifPicker.tsx`: GIPHY-integrated GIF search and selection
- `EmojiGifPicker.tsx`: Combined picker component for the input area

### Message Format
- **Emojis**: Stored as Unicode characters in the message text
- **GIFs**: Stored as `![GIF](url)` markdown format
- **Rendering**: Enhanced `renderMessageContent` function handles all content types

### Keyboard Shortcuts
- `:` - Open emoji picker
- `Enter` - Send message
- `Escape` - Close pickers

## Browser Support
- **Emojis**: Supported in all modern browsers
- **GIFs**: Requires JavaScript and network access to GIPHY
- **Fonts**: Uses system emoji fonts for best compatibility

## Performance Notes
- GIFs are loaded lazily to improve performance
- Emoji picker uses a categorized approach to reduce initial load time
- Search functionality is debounced to prevent excessive API calls
