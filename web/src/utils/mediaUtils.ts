"use client";

export interface MediaDeviceInfo {
  hasAudioInput: boolean;
  hasVideoInput: boolean;
  audioDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
}

export async function checkMediaDevices(): Promise<MediaDeviceInfo> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return {
        hasAudioInput: false,
        hasVideoInput: false,
        audioDevices: [],
        videoDevices: [],
      };
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = devices.filter(device => device.kind === 'audioinput');
    const videoDevices = devices.filter(device => device.kind === 'videoinput');

    return {
      hasAudioInput: audioDevices.length > 0,
      hasVideoInput: videoDevices.length > 0,
      audioDevices,
      videoDevices,
    };
  } catch (error) {
    console.error("Error checking media devices:", error);
    return {
      hasAudioInput: false,
      hasVideoInput: false,
      audioDevices: [],
      videoDevices: [],
    };
  }
}

export async function requestMediaPermissions(): Promise<boolean> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }

    // Request minimal permissions to check if access is granted
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: true, 
      video: false 
    });
    
    // Stop the stream immediately as we only needed to check permissions
    stream.getTracks().forEach(track => track.stop());
    
    return true;
  } catch (error) {
    console.error("Error requesting media permissions:", error);
    return false;
  }
}

export function getMediaErrorMessage(error: Error): string {
  switch (error.name) {
    case 'NotAllowedError':
      return "Camera/microphone access denied. Please allow access in your browser settings and try again.";
    case 'NotFoundError':
      return "No camera/microphone found. Please connect a device and try again.";
    case 'NotReadableError':
      return "Camera/microphone is being used by another application. Please close other applications and try again.";
    case 'OverconstrainedError':
      return "Camera/microphone doesn't support the required settings. Please try with different settings.";
    case 'SecurityError':
      return "Camera/microphone access blocked by security settings. Please check your browser security settings.";
    case 'AbortError':
      return "Camera/microphone access was interrupted. Please try again.";
    case 'TypeError':
      return "Invalid media constraints provided.";
    default:
      return `Camera/microphone error: ${error.message}`;
  }
}
