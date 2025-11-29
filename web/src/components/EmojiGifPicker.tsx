"use client";
import { useState } from 'react';
import { FaceSmileIcon } from '@heroicons/react/24/outline';
import EmojiGifPickerModal from './EmojiGifPickerModal';

interface EmojiGifPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onGifSelect: (gifUrl: string, gifTitle: string) => void;
}

export default function EmojiGifPicker({ onEmojiSelect, onGifSelect }: EmojiGifPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleEmojiSelect = (emoji: string) => {
    onEmojiSelect(emoji);
    // Keep picker open for multiple emoji selections
  };

  const handleGifSelect = (gifUrl: string, gifTitle: string) => {
    onGifSelect(gifUrl, gifTitle);
    setShowPicker(false);
  };

  return (
    <div className="relative">
      {/* Single Emoji Button */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className={`p-2 rounded-xl transition-all duration-200 ${
          showPicker
            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
        title="Add emoji or GIF"
      >
        <FaceSmileIcon className="w-5 h-5" />
      </button>

      {/* Combined Picker Modal */}
      <EmojiGifPickerModal
        onEmojiSelect={handleEmojiSelect}
        onGifSelect={handleGifSelect}
        onClose={() => setShowPicker(false)}
        isOpen={showPicker}
      />
    </div>
  );
}
