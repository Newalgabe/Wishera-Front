"use client";
import { 
  PhoneIcon, 
  VideoCameraIcon, 
  XMarkIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import { CallInfo } from "@/hooks/useCall";

interface CallNotificationProps {
  callInfo: CallInfo;
  callerName?: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function CallNotification({
  callInfo,
  callerName,
  onAccept,
  onReject,
}: CallNotificationProps) {
  if (!callInfo.isIncoming || callInfo.state !== "ringing") {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm">
      <div className="flex items-center space-x-4">
        {/* Avatar */}
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          {callInfo.callType === "video" ? (
            <VideoCameraIcon className="w-8 h-8 text-white" />
          ) : (
            <PhoneIcon className="w-8 h-8 text-white" />
          )}
        </div>

        {/* Call Info */}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Incoming {callInfo.callType === "video" ? "Video" : "Audio"} Call
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {callerName || `User ${callInfo.callerUserId}`}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {callInfo.timestamp.toLocaleTimeString()}
          </p>
        </div>

        {/* Controls */}
        <div className="flex space-x-2">
          <button
            onClick={onReject}
            className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={onAccept}
            className="w-10 h-10 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
          >
            <CheckIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
