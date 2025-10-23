# Custom Wallpaper Frontend Integration Guide

This guide explains how the custom wallpaper upload functionality has been integrated into the web frontend.

## ✅ **Frontend Integration Complete**

### **New Features Added to Web Frontend:**

1. **📤 Custom Wallpaper Upload UI**
   - Upload button in wallpaper picker
   - File input for image selection
   - Form fields for name, description, and mode compatibility
   - Real-time upload progress indication

2. **🎨 Enhanced Wallpaper Picker**
   - Wider picker (320px) to accommodate upload form
   - Scrollable wallpaper grid with max height
   - Visual distinction between default and custom wallpapers
   - Delete button for custom wallpapers (appears on hover)

3. **🔄 Updated API Integration**
   - New API functions for custom wallpaper management
   - Support for both default and custom wallpapers in catalog
   - Automatic catalog refresh after upload/delete operations

### **Updated Files:**

#### **`web/src/app/api.ts`**
- Added `uploadCustomWallpaper()` function
- Added `getCustomWallpapers()` function  
- Added `deleteCustomWallpaper()` function
- Updated `getWallpaperCatalog()` to accept userId parameter
- Updated `WallpaperCatalogItemDTO` to include 'custom' category
- Updated `WallpaperPrefDTO` to include `wallpaperUrl` field

#### **`web/src/app/chat/page.tsx`**
- Added custom wallpaper upload state management
- Added upload and delete handlers
- Enhanced wallpaper picker UI with upload form
- Updated wallpaper catalog loading to include custom wallpapers
- Added visual indicators for custom wallpapers

### **How It Works:**

1. **Upload Process:**
   - User clicks "Upload" button in wallpaper picker
   - Upload form appears with file input and metadata fields
   - User selects image file and fills optional details
   - Image is uploaded to Cloudinary via backend API
   - Wallpaper catalog refreshes automatically
   - New wallpaper is auto-applied to current conversation

2. **Wallpaper Management:**
   - Custom wallpapers appear in the same grid as default wallpapers
   - Custom wallpapers show a delete button on hover
   - All wallpapers (default + custom) are loaded when user opens picker
   - Wallpaper preferences work the same for both types

3. **Visual Design:**
   - Upload form is contained in a gray background section
   - Custom wallpapers have delete buttons that appear on hover
   - Form includes checkboxes for dark/light mode compatibility
   - Upload button shows loading state during upload

### **User Experience:**

1. **Accessing Upload:**
   - Click the 🎨 wallpaper button in chat header
   - Click "Upload" button in the wallpaper picker
   - Upload form slides down

2. **Uploading Wallpaper:**
   - Select image file (JPG, PNG, etc.)
   - Optionally add name and description
   - Choose dark/light mode compatibility
   - Click "Upload Wallpaper" button
   - Wallpaper appears in grid and is auto-applied

3. **Managing Wallpapers:**
   - Hover over custom wallpapers to see delete button
   - Click delete button to remove wallpaper
   - All wallpapers work the same way for selection

### **Technical Details:**

- **File Validation:** Frontend accepts only image files
- **Size Limit:** Backend enforces 10MB limit
- **Image Processing:** Cloudinary handles optimization (1920x1080, 85% quality)
- **State Management:** React state handles form data and upload progress
- **Error Handling:** Console logging for failed operations
- **Auto-refresh:** Catalog updates automatically after changes

### **Integration with Existing Features:**

- **Wallpaper Preferences:** Custom wallpapers work with existing preference system
- **Opacity Control:** Same opacity slider works for all wallpaper types
- **Conversation-specific:** Each conversation can have different wallpaper
- **Persistence:** Wallpaper choices are saved per conversation
- **Backward Compatibility:** All existing default wallpapers continue to work

### **Browser Compatibility:**

- Uses standard HTML5 file input
- FormData API for file uploads
- Modern CSS for styling and animations
- Works with all modern browsers

The custom wallpaper functionality is now fully integrated into the web frontend and ready for use! Users can upload their own wallpapers, manage them, and use them in chat conversations alongside the default wallpapers.
