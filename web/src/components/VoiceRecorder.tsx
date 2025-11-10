"use client";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { MicrophoneIcon, StopIcon, PauseIcon, PlayIcon, XMarkIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid";

interface VoiceRecorderProps {
  onSend: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const {
    isRecording,
    recordingTime,
    isPaused,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder();

  const handleStartRecording = async () => {
    const success = await startRecording();
    if (!success) {
      alert("Could not access microphone. Please check your permissions.");
      onCancel();
    }
  };

  const handleSend = async () => {
    try {
      const recording = await stopRecording();
      onSend(recording.blob, recording.duration);
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
  };

  const handleCancel = () => {
    cancelRecording();
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Auto-start recording when component mounts
  if (!isRecording && recordingTime === 0) {
    handleStartRecording();
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
      {/* Recording indicator */}
      <div className="flex items-center gap-2 flex-1">
        <div className="relative">
          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75" />
        </div>
        <span className="font-mono text-lg font-semibold text-gray-900 dark:text-gray-100">
          {formatTime(recordingTime)}
        </span>
        {isPaused && (
          <span className="text-sm text-gray-600 dark:text-gray-400">(Paused)</span>
        )}
      </div>

      {/* Waveform animation */}
      {!isPaused && (
        <div className="flex items-center gap-1 h-8">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-red-500 rounded-full"
              style={{
                height: `${20 + Math.random() * 60}%`,
                animationName: 'pulse',
                animationDuration: `${0.5 + Math.random() * 0.5}s`,
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Pause/Resume */}
        <button
          onClick={isPaused ? resumeRecording : pauseRecording}
          className="p-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full transition-colors"
          title={isPaused ? "Resume" : "Pause"}
        >
          {isPaused ? (
            <PlayIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <PauseIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>

        {/* Cancel */}
        <button
          onClick={handleCancel}
          className="p-3 bg-gray-200 dark:bg-gray-700 hover:bg-red-200 dark:hover:bg-red-900 rounded-full transition-colors"
          title="Cancel"
        >
          <XMarkIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
        </button>

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={recordingTime < 1}
          className="p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full transition-colors"
          title="Send"
        >
          <PaperAirplaneIcon className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}

