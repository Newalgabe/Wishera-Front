"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSignalRChat } from "./useSignalRChat";
import { checkMediaDevices, getMediaErrorMessage } from "@/utils/mediaUtils";

export type CallType = "audio" | "video";

export type CallState = 
  | "idle" 
  | "initiating" 
  | "ringing" 
  | "connecting" 
  | "connected" 
  | "ended" 
  | "rejected" 
  | "failed";

export type CallInfo = {
  callId: string;
  callerUserId: string;
  calleeUserId: string;
  callType: CallType;
  state: CallState;
  timestamp: Date;
  isIncoming: boolean;
};

export type CallHandlers = {
  onCallInitiated?: (callInfo: CallInfo) => void;
  onCallAccepted?: (callInfo: CallInfo) => void;
  onCallRejected?: (callInfo: CallInfo) => void;
  onCallEnded?: (callInfo: CallInfo) => void;
  onCallFailed?: (callInfo: CallInfo) => void;
  onCallSignal?: (callInfo: CallInfo, signalType: string, signalData: any) => void;
};

export type ChatConnection = ReturnType<typeof useSignalRChat>;

export function useCall(currentUserId: string | null, chat: ChatConnection, handlers: CallHandlers = {}) {
  const [currentCall, setCurrentCall] = useState<CallInfo | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const handlersRef = useRef(handlers);
  
  // Update handlers ref when handlers change
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  // WebRTC configuration
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  // Initialize peer connection
  const createPeerConnection = useCallback(() => {
    const peerConnection = new RTCPeerConnection(rtcConfig);
    
    // Handle incoming remote stream
    peerConnection.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind, event.track);
      const stream = event.streams[0];
      console.log("Remote stream:", stream);
      console.log("Remote stream tracks:");
      stream.getTracks().forEach((track, index) => {
        console.log(`  Remote track ${index}: ${track.kind}`, {
          id: track.id,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          label: track.label,
        });
      });
      
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        console.log("Setting remote stream on video element");
        remoteVideoRef.current.srcObject = stream;
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("ICE candidate generated:", event.candidate);
        // Use a timeout to ensure currentCall is set
        setTimeout(() => {
          const call = currentCall;
          if (call) {
            console.log("Sending ICE candidate to other party");
        chat.sendCallSignal?.(
              call.callerUserId === currentUserId ? call.calleeUserId : call.callerUserId,
              call.callId,
          "ice-candidate",
          event.candidate
        );
          }
        }, 100);
      } else {
        console.log("ICE gathering complete");
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log("Connection state:", peerConnection.connectionState);
      if (peerConnection.connectionState === "connected") {
        console.log("WebRTC connection established!");
        setCurrentCall(prev => prev ? { ...prev, state: "connected" } : null);
      } else if (peerConnection.connectionState === "failed") {
        console.log("WebRTC connection failed!");
        setCurrentCall(prev => prev ? { ...prev, state: "failed" } : null);
        // Call the handler if it exists
        setTimeout(() => {
          const call = currentCall;
          if (call) {
            handlersRef.current.onCallFailed?.(call);
          }
        }, 100);
      } else if (peerConnection.connectionState === "connecting") {
        console.log("WebRTC connection connecting...");
      } else if (peerConnection.connectionState === "disconnected") {
        console.log("WebRTC connection disconnected");
      }
    };

    return peerConnection;
  }, [currentUserId, chat]);

  // Get user media
  const getUserMedia = useCallback(async (callType: CallType) => {
    try {
      // Check if media devices are available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media devices not supported in this browser");
      }

      // Check for available devices first
      const deviceInfo = await checkMediaDevices();

      if (!deviceInfo.hasAudioInput) {
        throw new Error("No audio input device found");
      }

      if (callType === "video" && !deviceInfo.hasVideoInput) {
        throw new Error("No video input device found");
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: callType === "video" ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: "user",
          frameRate: { ideal: 30, max: 60 }
        } : false,
      };

      console.log("Requesting user media with constraints:", constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      
      // Log the tracks we got
      console.log("Got local stream with tracks:");
      stream.getTracks().forEach((track, index) => {
        console.log(`  Track ${index}: ${track.kind}`, {
          id: track.id,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          label: track.label,
        });
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      
      // Use the utility function for better error messages
      if (error instanceof Error) {
        throw new Error(getMediaErrorMessage(error));
      }
      
      throw error;
    }
  }, []);

  // Create WebRTC offer
  const createOffer = useCallback(async () => {
    if (!peerConnectionRef.current || !currentCall) {
      console.log("Cannot create offer: no peer connection or current call");
      return;
    }
    
    try {
      console.log("Creating WebRTC offer...");
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      console.log("Offer created:", offer);
      
      // Send the offer to the other party
      const otherUserId = currentCall.callerUserId === currentUserId 
        ? currentCall.calleeUserId 
        : currentCall.callerUserId;
      
      console.log("Sending offer to:", otherUserId);
      chat.sendCallSignal?.(
        otherUserId,
        currentCall.callId,
        "offer",
        offer
      );
    } catch (error) {
      console.error("Error creating offer:", error);
      setCurrentCall(prev => prev ? { ...prev, state: "failed" } : null);
    }
  }, [currentUserId, currentCall, chat]);

  // Handle WebRTC offer
  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current || !currentCall) return;

    try {
      console.log("Received offer, creating answer...");
      await peerConnectionRef.current.setRemoteDescription(offer);
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      console.log("Answer created and set as local description");

      const otherUserId = currentCall.callerUserId === currentUserId 
        ? currentCall.calleeUserId 
        : currentCall.callerUserId;
      
      console.log("Sending answer to other party");
      chat.sendCallSignal?.(
        otherUserId,
        currentCall.callId,
        "answer",
        answer
      );
    } catch (error) {
      console.error("Error handling offer:", error);
      setCurrentCall(prev => prev ? { ...prev, state: "failed" } : null);
    }
  }, [currentUserId, currentCall, chat]);

  // Handle WebRTC answer
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;
    
    try {
      console.log("Received answer, setting remote description...");
      await peerConnectionRef.current.setRemoteDescription(answer);
      console.log("Remote description set successfully");
    } catch (error) {
      console.error("Error handling answer:", error);
      setCurrentCall(prev => prev ? { ...prev, state: "failed" } : null);
    }
  }, []);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) return;
    
    try {
      console.log("Received ICE candidate, adding to peer connection...");
      await peerConnectionRef.current.addIceCandidate(candidate);
      console.log("ICE candidate added successfully");
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  }, []);

  // Start a call
  const startCall = useCallback(async (calleeUserId: string, callType: CallType) => {
    if (!currentUserId || currentCall) return;

    try {
      const callInfo: CallInfo = {
        callId: crypto.randomUUID(),
        callerUserId: currentUserId,
        calleeUserId,
        callType,
        state: "initiating",
        timestamp: new Date(),
        isIncoming: false,
      };

      setCurrentCall(callInfo);
      
      // Get local media
      await getUserMedia(callType);
      
      // Create peer connection
      peerConnectionRef.current = createPeerConnection();
      
      // Add local stream to peer connection
      if (localStreamRef.current) {
        console.log("Adding local tracks to peer connection (caller):");
        localStreamRef.current.getTracks().forEach(track => {
          console.log(`  Adding ${track.kind} track:`, track.id);
          peerConnectionRef.current?.addTrack(track, localStreamRef.current!);
        });
        console.log("All tracks added to peer connection");
      }

      // Test SignalR connection first
      console.log("Testing SignalR connection...");
      const connectionTest = await chat.testConnection?.();
      console.log("SignalR connection test result:", connectionTest);

      // Send call initiation signal
      console.log("Sending call initiation signal to:", calleeUserId);
      await chat.initiateCall?.(calleeUserId, callType, callInfo.callId);
      
      setCurrentCall(prev => prev ? { ...prev, state: "ringing" } : null);
      
      // Call the handler if it exists
      setTimeout(() => {
        handlersRef.current.onCallInitiated?.(callInfo);
      }, 100);

    } catch (error) {
      console.error("Error starting call:", error);
      setCurrentCall(prev => prev ? { ...prev, state: "failed" } : null);
      
      // Show user-friendly error message
      if (error instanceof Error) {
        alert(`Failed to start call: ${error.message}`);
      } else {
        alert("Failed to start call. Please check your camera and microphone permissions.");
      }
      
      // Call the handler if it exists
      setTimeout(() => {
        const call = currentCall;
        if (call) {
          handlersRef.current.onCallFailed?.(call);
        }
      }, 100);
    }
  }, [currentUserId, currentCall, getUserMedia, createPeerConnection, chat]);

  // Accept a call
  const acceptCall = useCallback(async (callInfo: CallInfo) => {
    if (!currentUserId || !callInfo) return;

    try {
      setCurrentCall(callInfo);
      
      // Get local media
      await getUserMedia(callInfo.callType);
      
      // Create peer connection
      peerConnectionRef.current = createPeerConnection();
      
      // Add local stream to peer connection
      if (localStreamRef.current) {
        console.log("Adding local tracks to peer connection (callee):");
        localStreamRef.current.getTracks().forEach(track => {
          console.log(`  Adding ${track.kind} track:`, track.id);
          peerConnectionRef.current?.addTrack(track, localStreamRef.current!);
        });
        console.log("All tracks added to peer connection");
      }

      // Send accept signal
      console.log("Sending call accept signal to:", callInfo.callerUserId);
      chat.acceptCall?.(callInfo.callerUserId, callInfo.callId);
      
      setCurrentCall(prev => prev ? { ...prev, state: "connecting" } : null);
      
      // Note: The caller will create the offer when they receive the "callaccepted" event
      // The callee waits for the offer and then creates an answer
      
      // Call the handler if it exists
      setTimeout(() => {
      handlersRef.current.onCallAccepted?.(callInfo);
      }, 100);

    } catch (error) {
      console.error("Error accepting call:", error);
      setCurrentCall(prev => prev ? { ...prev, state: "failed" } : null);
      
      // Show user-friendly error message
      if (error instanceof Error) {
        alert(`Failed to accept call: ${error.message}`);
      } else {
        alert("Failed to accept call. Please check your camera and microphone permissions.");
      }
      
      // Call the handler if it exists
      setTimeout(() => {
        const call = currentCall;
        if (call) {
          handlersRef.current.onCallFailed?.(call);
        }
      }, 100);
    }
  }, [currentUserId, getUserMedia, createPeerConnection, chat]);

  // Reject a call
  const rejectCall = useCallback((callInfo: CallInfo) => {
    if (!currentUserId || !callInfo) return;

    chat.rejectCall?.(callInfo.callerUserId, callInfo.callId);
    setCurrentCall(prev => prev ? { ...prev, state: "rejected" } : null);
    
    // Call the handler if it exists
    setTimeout(() => {
    handlersRef.current.onCallRejected?.(callInfo);
    }, 100);
    
    // Clean up after a short delay
    setTimeout(() => {
      setCurrentCall(null);
    }, 1000);
  }, [currentUserId, chat]);

  // End a call
  // Clean up resources
  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    setRemoteStream(null);
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    setTimeout(() => {
      setCurrentCall(null);
    }, 1000);
  }, []);

  const endCall = useCallback(() => {
    if (!currentCall || !currentUserId) return;

    const otherUserId = currentCall.callerUserId === currentUserId 
      ? currentCall.calleeUserId 
      : currentCall.callerUserId;

    // Notify the other side that the call is ending
    chat.endCall?.(otherUserId, currentCall.callId);
    
    // Update local state
    const callToEnd = currentCall;
    setCurrentCall(prev => prev ? { ...prev, state: "ended" } : null);
    
    // Call the handler if it exists
    setTimeout(() => {
      if (callToEnd) {
        handlersRef.current.onCallEnded?.(callToEnd);
      }
    }, 100);

    // Clean up resources immediately
    cleanup();
    
    // Clear the call state after cleanup
    setTimeout(() => {
      setCurrentCall(null);
    }, 200);
  }, [currentCall, currentUserId, chat, cleanup]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  // Register call handlers when connection is established
  useEffect(() => {
    console.log("=== CALL HANDLERS useEffect RUNNING ===");
    console.log("Setting up call signal handlers...");
    console.log("Chat connected:", chat.connected);
    console.log("Chat connection state:", chat.connectionState);
    console.log("Current user ID:", currentUserId);
    console.log("Chat object:", chat);
    console.log("Chat has onCallInitiated:", typeof chat.onCallInitiated === 'function');
    
    if (!currentUserId) {
      console.log("Not setting up handlers - no user ID");
      return;
    }
    
    if (!chat.connected) {
      console.log("Not setting up handlers - chat not connected. Connection state:", chat.connectionState);
      return;
    }
    
    // Ensure the SignalR connection is ready
    if (!chat.onCallInitiated) {
      console.error("onCallInitiated method not available on chat object!");
      return;
    }
    
    console.log("Registering call event handlers...");
    
    const handleCallInitiated = (payload: any) => {
      console.log("Call initiated received:", payload);
      console.log("Current user ID:", currentUserId);
      console.log("Caller user ID:", payload.callerUserId);
      console.log("Callee user ID:", payload.calleeUserId);
      
      // Determine if this is an incoming call (we are the callee)
      const isIncoming = payload.calleeUserId === currentUserId;
      console.log("Is incoming call:", isIncoming);
      
      const callInfo: CallInfo = {
        callId: payload.callId,
        callerUserId: payload.callerUserId,
        calleeUserId: payload.calleeUserId,
        callType: payload.callType,
        state: "ringing",
        timestamp: new Date(payload.timestamp || Date.now()),
        isIncoming: isIncoming,
      };

      if (isIncoming) {
        console.log("Setting incoming call state - showing notification");
        setCurrentCall(callInfo);
        // Call the handler if it exists
        setTimeout(() => {
          handlersRef.current.onCallInitiated?.(callInfo);
        }, 100);
      } else {
        console.log("This is an outgoing call from us, not handling as incoming");
        // For outgoing calls, we might want to set the call state too
        // But only if we don't already have a call in progress
        if (!currentCall) {
          console.log("Setting outgoing call state");
          setCurrentCall(callInfo);
        }
      }
    };

    const handleCallAccepted = (payload: any) => {
      console.log("Call accepted received:", payload);
      console.log("Current call:", currentCall);
      console.log("Call ID match:", currentCall?.callId === payload.callId);
      console.log("Payload callId:", payload.callId);
      console.log("Current user ID:", currentUserId);
      console.log("Payload callerUserId:", payload.callerUserId);
      console.log("Payload calleeUserId:", payload.calleeUserId);
      
      // Check if this call is relevant to us (we're either the caller or callee)
      const isCaller = payload.callerUserId === currentUserId;
      const isCallee = payload.calleeUserId === currentUserId;
      
      if (!isCaller && !isCallee) {
        console.log("Call accepted event is not for us, ignoring");
        return;
      }
      
      // Use a timeout to ensure currentCall is set, but also handle case where call might not be in state yet
      setTimeout(() => {
        const call = currentCall;
        const callIdMatches = call && call.callId === payload.callId;
        
        // If we have a matching call, update it
        if (callIdMatches) {
          console.log("Call accepted - updating state to connecting");
          setCurrentCall(prev => prev ? { ...prev, state: "connecting" } : null);
          
          // If we're the caller, create an offer
          if (isCaller && peerConnectionRef.current) {
            console.log("We are the caller, creating offer...");
            createOffer();
          } else if (isCallee) {
            console.log("We are the callee, waiting for offer...");
            // Callee should already have peer connection set up from acceptCall
            // Just ensure we're in connecting state
          } else {
            console.log("We are not the caller or no peer connection");
          }
          
          // Call the handler if it exists
          setTimeout(() => {
            handlersRef.current.onCallAccepted?.(call);
          }, 100);
        } else {
          // If call ID doesn't match but we're part of this call, try to create/update call state
          console.log("Call ID mismatch or no current call, but we're part of this call");
          console.log("Attempting to handle call accepted anyway");
          
          // Create call info from payload
          const callInfo: CallInfo = {
            callId: payload.callId,
            callerUserId: payload.callerUserId,
            calleeUserId: payload.calleeUserId,
            callType: payload.callType || 'audio',
            state: "connecting",
            timestamp: new Date(payload.timestamp || Date.now()),
            isIncoming: !isCaller,
          };
          
          setCurrentCall(callInfo);
          
          // If we're the caller, create an offer
          if (isCaller && peerConnectionRef.current) {
            console.log("We are the caller, creating offer after state update...");
            setTimeout(() => createOffer(), 200);
          }
        }
      }, 100);
    };

    const handleCallRejected = (payload: any) => {
      console.log("Call rejected received:", payload);
      // Use a timeout to ensure currentCall is set
      setTimeout(() => {
        const call = currentCall;
        if (call && call.callId === payload.callId) {
          setCurrentCall(prev => prev ? { ...prev, state: "rejected" } : null);
          // Call the handler if it exists
          setTimeout(() => {
            handlersRef.current.onCallRejected?.(call);
          }, 100);
          setTimeout(() => setCurrentCall(null), 1000);
        }
      }, 100);
    };

    const handleCallEnded = (payload: any) => {
      console.log("Call ended received:", payload);
      console.log("Current call before ending:", currentCall);
      
      // Always clean up when we receive a callended event, regardless of callId match
      // This ensures both sides end the call properly
      const call = currentCall;
      if (call) {
        // Update call state to ended
        setCurrentCall(prev => prev ? { ...prev, state: "ended" } : null);
        
        // Call the handler if it exists
        setTimeout(() => {
          handlersRef.current.onCallEnded?.(call);
        }, 100);
      }
      
      // Always clean up resources (streams, peer connection, etc.)
      cleanup();
      
      // Clear the call state after a short delay to ensure UI updates
      setTimeout(() => {
        setCurrentCall(null);
      }, 200);
    };

    const handleCallSignal = (payload: any) => {
      console.log("Call signal received:", payload);
      console.log("Signal type:", payload.signalType);
      console.log("Current call:", currentCall);
      console.log("Call ID match:", currentCall?.callId === payload.callId);
      
      // Use a timeout to ensure currentCall is set
      setTimeout(() => {
        const call = currentCall;
        if (!call || call.callId !== payload.callId) {
          console.log("No matching call found for signal");
          return;
        }

        const signalType = payload.signalType;
        const signalData = payload.signalData;

        console.log("Processing signal type:", signalType);
        if (signalType === "offer") {
          console.log("Handling offer signal");
          handleOffer(signalData);
        } else if (signalType === "answer") {
          console.log("Handling answer signal");
          handleAnswer(signalData);
        } else if (signalType === "ice-candidate") {
          console.log("Handling ICE candidate signal");
          handleIceCandidate(signalData);
        } else {
          console.log("Unknown signal type:", signalType);
        }

        // Call the handler if it exists
        setTimeout(() => {
          handlersRef.current.onCallSignal?.(call, signalType, signalData);
        }, 100);
      }, 100);
    };

    // Register event listeners using the proper SignalR hook methods
    console.log("Registering SignalR call event handlers...");
    console.log("Registering handlers with connection state:", chat.connectionState);
    console.log("Chat object methods:", Object.keys(chat));
    
    const offCallInitiated = chat.onCallInitiated(handleCallInitiated);
    console.log("onCallInitiated result:", offCallInitiated);
    const offCallAccepted = chat.onCallAccepted(handleCallAccepted);
    console.log("onCallAccepted result:", offCallAccepted);
    const offCallRejected = chat.onCallRejected(handleCallRejected);
    console.log("onCallRejected result:", offCallRejected);
    const offCallEnded = chat.onCallEnded(handleCallEnded);
    console.log("onCallEnded result:", offCallEnded);
    const offCallSignal = chat.onCallSignal(handleCallSignal);
    console.log("onCallSignal result:", offCallSignal);

    return () => {
      console.log("Cleaning up SignalR call event handlers...");
      offCallInitiated?.();
      offCallAccepted?.();
      offCallRejected?.();
      offCallEnded?.();
      offCallSignal?.();
    };
  }, [currentUserId, chat.connected, chat.onCallInitiated, chat.onCallAccepted, chat.onCallRejected, chat.onCallEnded, chat.onCallSignal, chat.initiateCall, chat.acceptCall, chat.rejectCall, chat.endCall, chat.sendCallSignal, createOffer, handleOffer, handleAnswer, handleIceCandidate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    currentCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    localVideoRef,
    remoteVideoRef,
  };
}
