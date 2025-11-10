"use client";
import { useEffect, useRef } from "react";
import { 
  PhoneIcon, 
  VideoCameraIcon, 
  XMarkIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  VideoCameraSlashIcon,
  MicrophoneIcon,
  NoSymbolIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";
import { CallInfo, CallType } from "@/hooks/useCall";

interface CallModalProps {
  callInfo: CallInfo | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
}

export default function CallModal({
  callInfo,
  localStream,
  remoteStream,
  isMuted,
  isVideoEnabled,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onToggleVideo,
  localVideoRef,
  remoteVideoRef,
}: CallModalProps) {
  // Ensure audio plays when remote stream is received
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log("Setting up remote video element with stream");
      const videoElement = remoteVideoRef.current;
      videoElement.srcObject = remoteStream;
      
      // Ensure volume is at maximum
      videoElement.volume = 1.0;
      videoElement.muted = false;
      
      // Add event listeners to debug audio
      videoElement.onloadedmetadata = () => {
        console.log("Video element metadata loaded");
        console.log("Video element details:", {
          muted: videoElement.muted,
          volume: videoElement.volume,
          paused: videoElement.paused,
          readyState: videoElement.readyState,
        });
      };
      
      videoElement.onplay = () => {
        console.log("Video element started playing");
      };
      
      videoElement.onerror = (e) => {
        console.error("Video element error:", e);
      };
      
      // Explicitly play the video element to ensure audio plays
      videoElement.play().then(() => {
        console.log("Successfully started playing remote stream");
        console.log("Final video element state:", {
          muted: videoElement.muted,
          volume: videoElement.volume,
          paused: videoElement.paused,
        });
      }).catch((error) => {
        console.error("Error playing remote stream:", error);
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        // Retry after user interaction if autoplay was blocked
        if (error.name === "NotAllowedError" || error.name === "NotSupportedError") {
          console.log("Autoplay was blocked, will retry on user interaction");
          // Try to play on next user interaction
          const playOnInteraction = () => {
            console.log("Retrying play after user interaction");
            videoElement.play().then(() => {
              console.log("Successfully played after user interaction");
            }).catch(err => {
              console.error("Still failed to play:", err);
            });
            document.removeEventListener('click', playOnInteraction);
          };
          document.addEventListener('click', playOnInteraction, { once: true });
        }
      });
      
      // Log audio tracks
      remoteStream.getAudioTracks().forEach((track, index) => {
        console.log(`Remote audio track ${index}:`, {
          id: track.id,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
        });
        
        // Ensure track is enabled
        track.enabled = true;
        console.log(`Enabled track ${index}, new state:`, track.enabled);
      });
    }
  }, [remoteStream, remoteVideoRef]);

  if (!callInfo) return null;

  const isIncoming = callInfo.isIncoming;
  const isConnected = callInfo.state === "connected";
  const isRinging = callInfo.state === "ringing";
  const isConnecting = callInfo.state === "connecting";

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                {callInfo.callType === "video" ? (
                  <VideoCameraIcon className="w-8 h-8" />
                ) : (
                  <PhoneIcon className="w-8 h-8" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {isIncoming ? "Incoming Call" : "Outgoing Call"}
                </h2>
                <p className="text-blue-100">
                  {callInfo.callType === "video" ? "Video Call" : "Audio Call"}
                </p>
                <p className="text-sm text-blue-200">
                  {isRinging && "Ringing..."}
                  {isConnecting && "Connecting..."}
                  {isConnected && "Connected"}
                </p>
              </div>
            </div>
            <button
              onClick={onReject}
              className="p-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Video Area */}
        <div className="relative bg-gray-900 aspect-video">
          {/* Remote Video - Always render for audio playback, even in audio-only calls */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${callInfo.callType === "audio" ? "invisible" : ""}`}
          />
          
          {/* Local Video */}
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ 
                display: localStream && callInfo.callType === "video" ? "block" : "none",
                transform: "scaleX(-1)" // Mirror the video horizontally
              }}
            />
          </div>

          {/* Placeholder when no video or during audio call */}
          {(callInfo.callType === "audio" || !remoteStream) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  {callInfo.callType === "video" ? (
                    <VideoCameraIcon className="w-12 h-12" />
                  ) : (
                    <PhoneIcon className="w-12 h-12" />
                  )}
                </div>
                <p className="text-xl font-semibold">
                  {remoteStream ? "Audio Call" : "Waiting for connection..."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-50 dark:bg-gray-700 p-6">
          {isIncoming && !isConnected ? (
            // Incoming call controls
            <div className="flex justify-center space-x-6">
              <button
                onClick={onReject}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
              >
                <XMarkIcon className="w-8 h-8 text-white" />
              </button>
              <button
                onClick={onAccept}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
              >
                <PhoneIcon className="w-8 h-8 text-white" />
              </button>
            </div>
          ) : (
            // Active call controls
            <div className="flex justify-center space-x-6">
              <button
                onClick={onToggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  isMuted 
                    ? "bg-red-500 hover:bg-red-600" 
                    : "bg-gray-500 hover:bg-gray-600"
                }`}
              >
                {isMuted ? (
                  <NoSymbolIcon className="w-6 h-6 text-white" />
                ) : (
                  <MicrophoneIcon className="w-6 h-6 text-white" />
                )}
              </button>

              {callInfo.callType === "video" && (
                <button
                  onClick={onToggleVideo}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                    !isVideoEnabled 
                      ? "bg-red-500 hover:bg-red-600" 
                      : "bg-gray-500 hover:bg-gray-600"
                  }`}
                >
                  {!isVideoEnabled ? (
                    <VideoCameraSlashIcon className="w-6 h-6 text-white" />
                  ) : (
                    <VideoCameraIcon className="w-6 h-6 text-white" />
                  )}
                </button>
              )}

              <button
                onClick={onEnd}
                className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
              >
                <PhoneIcon className="w-6 h-6 text-white rotate-45" />
              </button>
            </div>
          )}

          {/* Call Status */}
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isRinging && "Ringing..."}
              {isConnecting && "Connecting..."}
              {isConnected && "Connected"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
