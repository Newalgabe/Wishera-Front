"use client";

import { useEffect } from "react";

type NotificationType = "success" | "error";

interface NotificationProps {
  type: NotificationType;
  message: string;
  isVisible?: boolean;
  onClose?: () => void;
  autoHideMs?: number;
}

export default function Notification({
  type,
  message,
  isVisible = true,
  onClose,
  autoHideMs = 3000,
}: NotificationProps) {
  useEffect(() => {
    if (!isVisible || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, autoHideMs);
    return () => clearTimeout(timer);
  }, [isVisible, onClose, autoHideMs]);

  if (!isVisible || !message) return null;

  const baseClasses =
    "fixed bottom-6 right-6 z-50 max-w-sm rounded-md px-4 py-3 shadow-lg border text-sm transition-opacity";

  const typeClasses =
    type === "success"
      ? "bg-green-50 border-green-200 text-green-900"
      : "bg-red-50 border-red-200 text-red-900";

  return (
    <div className={`${baseClasses} ${typeClasses}`} role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 inline-block h-2 w-2 flex-none rounded-full ${
            type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <div className="flex-1">
          <p>{message}</p>
        </div>
        {onClose && (
          <button
            type="button"
            aria-label="Close notification"
            onClick={onClose}
            className="ml-2 rounded p-1 text-current/70 hover:text-current focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}


