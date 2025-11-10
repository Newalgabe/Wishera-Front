"use client";
import { useState, useRef, useEffect } from "react";
import { PlayIcon, PauseIcon } from "@heroicons/react/24/solid";

interface VoiceMessagePlayerProps {
  audioUrl: string;
  duration: number;
  isOwn?: boolean;
}

export default function VoiceMessagePlayer({ audioUrl, duration, isOwn = false }: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg max-w-xs ${
      isOwn 
        ? "bg-blue-500 text-white" 
        : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
    }`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Play/Pause button */}
      <button
        onClick={togglePlayPause}
        className={`flex-shrink-0 p-2 rounded-full transition-colors ${
          isOwn
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
        }`}
      >
        {isPlaying ? (
          <PauseIcon className="w-5 h-5" />
        ) : (
          <PlayIcon className="w-5 h-5" />
        )}
      </button>

      {/* Waveform / Progress */}
      <div className="flex-1 min-w-0">
        <div className="relative h-8 flex items-center">
          {/* Background waveform bars */}
          <div className="absolute inset-0 flex items-center gap-1">
            {[...Array(30)].map((_, i) => {
              const height = 30 + Math.sin(i * 0.5) * 30 + Math.random() * 20;
              const isActive = (i / 30) * 100 <= progress;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-colors ${
                    isActive
                      ? isOwn
                        ? "bg-white"
                        : "bg-blue-500"
                      : isOwn
                      ? "bg-blue-400"
                      : "bg-gray-400 dark:bg-gray-600"
                  }`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
          
          {/* Invisible range input for seeking */}
          <input
            type="range"
            min="0"
            max={audioDuration || 0}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>
        
        {/* Time display */}
        <div className={`text-xs mt-1 ${isOwn ? "text-blue-100" : "text-gray-600 dark:text-gray-400"}`}>
          {formatTime(currentTime)} / {formatTime(audioDuration)}
        </div>
      </div>
    </div>
  );
}

