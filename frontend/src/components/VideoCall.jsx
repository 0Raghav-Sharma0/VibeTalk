// src/components/VideoCall.jsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import Peer from "simple-peer";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import {
  X,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const VideoCall = () => {
  const {
    isCallActive,
    isIncomingCall,
    isCalling,
    callType,
    incomingCallFrom,
    localStream,
    remoteStream,
    clearIncomingCall,
    setCallActive,
    setCalling,
    resetCallState,
    setLocalStream,
    setRemoteStream,
    callOffer,
    setIncomingCall,
    peerId,
  } = useVideoCallStore();

  const { authUser, socket } = useAuthStore();
  const { selectedUser } = useChatStore();

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const ringtoneAudioRef = useRef(null);
  const peerRef = useRef(null);
  const originalStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  
  // Stability refs
  const callStartedRef = useRef(false);
  const socketInitializedRef = useRef(false);
  const componentMountedRef = useRef(true);

  // State
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState("");

  // ==================== UTILITIES ====================
  const getTargetUserId = useCallback(() => {
    return selectedUser?._id || peerId || incomingCallFrom;
  }, [selectedUser, peerId, incomingCallFrom]);

  // ==================== RINGTONE ====================
  const playRingtone = useCallback(() => {
    try {
      if (!ringtoneAudioRef.current) {
        ringtoneAudioRef.current = new Audio("/songs/new.mp3");
        ringtoneAudioRef.current.loop = true;
        ringtoneAudioRef.current.volume = 0.7;
      }
      ringtoneAudioRef.current.currentTime = 0;
      ringtoneAudioRef.current.play().catch(() => {});
    } catch (e) {
      console.warn("Ringtone play error:", e);
    }
  }, []);

  const stopRingtone = useCallback(() => {
    try {
      ringtoneAudioRef.current?.pause();
      if (ringtoneAudioRef.current) ringtoneAudioRef.current.currentTime = 0;
    } catch (e) {
      console.warn("Ringtone stop error:", e);
    }
  }, []);

  // ==================== MEDIA MANAGEMENT ====================
  const initializeLocalStream = useCallback(async () => {
    try {
      console.log("🎥 Initializing local stream for:", callType);
      
      let stream;
      if (callType === "video") {
        // For video calls, get both video and audio
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
            facingMode: "user"
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        console.log("📹 Video tracks:", stream.getVideoTracks().length);
        console.log("🎤 Audio tracks:", stream.getAudioTracks().length);
        
        // Set up local video element immediately
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(err => {
            console.error("❌ Failed to play local video:", err);
          });
        }
      } else {
        // For audio calls, only get audio
        stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      }
      
      originalStreamRef.current = stream;
      setLocalStream(stream);

      // Apply initial track states
      if (stream.getAudioTracks().length > 0) {
        stream.getAudioTracks().forEach(track => {
          track.enabled = isAudioEnabled;
          console.log("🎤 Audio track enabled:", track.enabled);
        });
      }
      
      if (callType === "video" && stream.getVideoTracks().length > 0) {
        stream.getVideoTracks().forEach(track => {
          track.enabled = isVideoEnabled;
          console.log("📹 Video track enabled:", track.enabled);
        });
      }

      console.log("✅ Local stream initialized successfully");
      return stream;
    } catch (error) {
      console.error("❌ Failed to get local media:", error);
      setCallStatus("Media Access Failed");
      resetCallState();
      return null;
    }
  }, [callType, isAudioEnabled, isVideoEnabled, setLocalStream, resetCallState]);

  const cleanupMedia = useCallback(() => {
    console.log("🧹 Cleaning up media streams");
    
    // Stop all media tracks
    [originalStreamRef.current, screenStreamRef.current].forEach(stream => {
      if (stream) {
        stream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            // Track might already be stopped
          }
        });
      }
    });

    // Clear refs
    originalStreamRef.current = null;
    screenStreamRef.current = null;

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }
  }, []);

  const cleanupPeer = useCallback(() => {
    console.log("🧹 Cleaning up peer connection");
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {
        console.warn("Peer destroy error:", e);
      }
      peerRef.current = null;
    }
  }, []);

  const cleanupCall = useCallback(() => {
    if (componentMountedRef.current) {
      console.log("🧹 Full call cleanup");
      callStartedRef.current = false;
      stopRingtone();
      cleanupPeer();
      cleanupMedia();
      
      setIsScreenSharing(false);
      setIsVideoEnabled(true);
      setIsAudioEnabled(true);
      setCallStatus("");
      
      // Use setTimeout to avoid state updates during render
      setTimeout(() => {
        if (componentMountedRef.current) {
          resetCallState();
        }
      }, 100);
    }
  }, [stopRingtone, cleanupPeer, cleanupMedia, resetCallState]);

  // ==================== CALL CONTROLS ====================
  const endCall = useCallback(() => {
    console.log("📞 Ending call");
    const targetUserId = getTargetUserId();
    if (socket && targetUserId) {
      socket.emit("end-call", { targetUserId });
    }
    cleanupCall();
  }, [socket, getTargetUserId, cleanupCall]);

  const handleRemoteEnd = useCallback(() => {
    console.log("📞 Remote ended call");
    setCallStatus("Call Ended");
    setTimeout(cleanupCall, 1000);
  }, [cleanupCall]);

  // ==================== SIMPLE-PEER SETUP ====================
  const createPeer = useCallback((initiator, stream) => {
    const targetUserId = getTargetUserId();
    if (!targetUserId) {
      console.error("❌ No target user ID for peer creation");
      return null;
    }

    console.log(`🎯 Creating ${initiator ? 'initiator' : 'receiver'} peer for:`, targetUserId);

    // Cleanup existing peer
    cleanupPeer();

    try {
      const peer = new Peer({
        initiator,
        trickle: false,
        stream: stream || null,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      peer.on('signal', (data) => {
        console.log("📡 Peer signal generated:", data.type);
        if (!socket || !componentMountedRef.current) return;
        
        socket.emit("call-signal", {
          to: targetUserId,
          from: authUser?._id,
          data,
          callType,
        });
      });

      peer.on('stream', (remoteStream) => {
        if (!componentMountedRef.current) return;
        
        console.log("📹 Received remote stream");
        console.log("📹 Remote video tracks:", remoteStream.getVideoTracks().length);
        console.log("🎤 Remote audio tracks:", remoteStream.getAudioTracks().length);
        
        setRemoteStream(remoteStream);
        
        // Handle video call
        if (callType === "video") {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(err => {
              console.error("❌ Failed to play remote video:", err);
            });
          }
        } 
        // Handle audio call
        else {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.play().catch(console.error);
          }
        }

        setCallActive(true);
        setCallStatus("Connected");
        setCalling(false);
        clearIncomingCall();
        stopRingtone();
      });

      peer.on('connect', () => {
        if (!componentMountedRef.current) return;
        console.log("✅ Peer connected");
        setCallStatus("Connected");
      });

      peer.on('close', () => {
        if (!componentMountedRef.current) return;
        console.log("🔌 Peer connection closed");
        handleRemoteEnd();
      });

      peer.on('error', (err) => {
        if (!componentMountedRef.current) return;
        console.error("❌ Peer error:", err);
        setCallStatus("Connection Error");
        handleRemoteEnd();
      });

      peerRef.current = peer;
      return peer;
    } catch (error) {
      console.error("❌ Failed to create peer:", error);
      return null;
    }
  }, [socket, authUser, callType, getTargetUserId, cleanupPeer, setCallActive, setCalling, clearIncomingCall, handleRemoteEnd, stopRingtone]);

  // ==================== CALL FLOWS ====================
  const startOutgoingCall = useCallback(async () => {
    if (callStartedRef.current || !componentMountedRef.current) {
      console.log("🔄 Call already started or component unmounted, skipping");
      return;
    }

    callStartedRef.current = true;
    
    const targetUserId = getTargetUserId();
    if (!targetUserId) {
      console.error("❌ No target user for outgoing call");
      setCalling(false);
      callStartedRef.current = false;
      return;
    }

    console.log("📞 Starting outgoing call to:", targetUserId);
    setCallStatus("Calling...");
    
    const stream = await initializeLocalStream();
    if (!stream) {
      setCalling(false);
      callStartedRef.current = false;
      return;
    }

    const peer = createPeer(true, stream);
    if (!peer) {
      setCalling(false);
      callStartedRef.current = false;
      return;
    }
  }, [getTargetUserId, setCalling, initializeLocalStream, createPeer]);

  const acceptCall = useCallback(async () => {
    if (!incomingCallFrom || !callOffer || !componentMountedRef.current) {
      console.error("❌ Missing call data for acceptance or component unmounted");
      return;
    }

    if (callStartedRef.current) {
      console.log("🔄 Call already accepted, skipping");
      return;
    }

    callStartedRef.current = true;

    console.log("📞 Accepting incoming call from:", incomingCallFrom);
    clearIncomingCall();
    setCalling(true);
    setCallStatus("Connecting...");

    const stream = await initializeLocalStream();
    if (!stream) {
      setCalling(false);
      callStartedRef.current = false;
      return;
    }

    const peer = createPeer(false, stream);
    if (!peer) {
      setCalling(false);
      callStartedRef.current = false;
      return;
    }

    // Apply the received offer
    try {
      console.log("📡 Applying call offer");
      peer.signal(callOffer);
    } catch (error) {
      console.error("❌ Failed to signal peer:", error);
      setCallStatus("Connection Failed");
      cleanupCall();
    }
  }, [incomingCallFrom, callOffer, clearIncomingCall, setCalling, initializeLocalStream, createPeer, cleanupCall]);

  const rejectCall = useCallback(() => {
    console.log("📞 Rejecting call");
    if (incomingCallFrom && socket) {
      socket.emit("call-rejected", { callerId: incomingCallFrom });
    }
    resetCallState();
  }, [incomingCallFrom, socket, resetCallState]);

  // ==================== VIDEO CONTROLS ====================
  const toggleVideo = useCallback(() => {
    if (callType !== "video") return;
    
    const newState = !isVideoEnabled;
    console.log("📹 Toggling video:", newState);
    setIsVideoEnabled(newState);
    
    if (originalStreamRef.current) {
      const videoTracks = originalStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach(track => {
          track.enabled = newState;
          console.log("📹 Video track enabled:", track.enabled);
        });
      } else {
        console.warn("❌ No video tracks found to toggle");
      }
    }
  }, [isVideoEnabled, callType]);

  const toggleAudio = useCallback(() => {
    const newState = !isAudioEnabled;
    console.log("🎤 Toggling audio:", newState);
    setIsAudioEnabled(newState);
    
    if (originalStreamRef.current) {
      const audioTracks = originalStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks.forEach(track => {
          track.enabled = newState;
        });
      }
    }
    
    if (screenStreamRef.current) {
      const audioTracks = screenStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks.forEach(track => {
          track.enabled = newState;
        });
      }
    }
  }, [isAudioEnabled]);

  // ==================== SCREEN SHARING ====================
  const startScreenShare = useCallback(async () => {
    if (callType !== "video" || !peerRef.current || !componentMountedRef.current) return;

    try {
      console.log("🖥️ Starting screen share");
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          cursor: "always",
          displaySurface: "window"
        },
        audio: true,
      });

      screenStreamRef.current = screenStream;
      
      // Update local preview
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
        localVideoRef.current.play().catch(err => {
          console.error("❌ Failed to play screen share:", err);
        });
      }

      // Replace tracks in peer connection
      const peer = peerRef.current;
      const senders = peer._pc.getSenders();

      const screenVideoTrack = screenStream.getVideoTracks()[0];
      const screenAudioTrack = screenStream.getAudioTracks()[0];

      // Replace video track
      if (screenVideoTrack) {
        const videoSender = senders.find(s => s.track?.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(screenVideoTrack);
          console.log("✅ Screen video track replaced");
        }
      }

      // Replace audio track if available
      if (screenAudioTrack) {
        const audioSender = senders.find(s => s.track?.kind === 'audio');
        if (audioSender) {
          await audioSender.replaceTrack(screenAudioTrack);
          console.log("✅ Screen audio track replaced");
        }
      }

      setIsScreenSharing(true);

      // Handle screen share end
      screenVideoTrack.onended = () => {
        console.log("🖥️ Screen share ended by user");
        stopScreenShare();
      };

    } catch (error) {
      console.error("❌ Screen share failed:", error);
    }
  }, [callType]);

  const stopScreenShare = useCallback(async () => {
    if (!peerRef.current || !originalStreamRef.current || !componentMountedRef.current) return;

    try {
      console.log("🖥️ Stopping screen share");
      
      // Stop screen stream
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }

      // Restore original stream to local preview
      if (localVideoRef.current && originalStreamRef.current) {
        localVideoRef.current.srcObject = originalStreamRef.current;
        localVideoRef.current.play().catch(err => {
          console.error("❌ Failed to restore local video:", err);
        });
      }

      // Restore original tracks in peer connection
      const peer = peerRef.current;
      const senders = peer._pc.getSenders();
      const originalVideoTrack = originalStreamRef.current.getVideoTracks()[0];
      const originalAudioTrack = originalStreamRef.current.getAudioTracks()[0];

      // Restore video track
      if (originalVideoTrack) {
        const videoSender = senders.find(s => s.track?.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(originalVideoTrack);
          console.log("✅ Original video track restored");
        }
      }

      // Restore audio track
      if (originalAudioTrack) {
        const audioSender = senders.find(s => s.track?.kind === 'audio');
        if (audioSender) {
          await audioSender.replaceTrack(originalAudioTrack);
          console.log("✅ Original audio track restored");
        }
      }

      setIsScreenSharing(false);
    } catch (error) {
      console.error("❌ Stop screen share failed:", error);
    }
  }, []);

  // ==================== SOCKET HANDLERS ====================
  useEffect(() => {
    if (!socket || socketInitializedRef.current || !componentMountedRef.current) {
      return;
    }

    socketInitializedRef.current = true;
    console.log("🔌 Setting up socket handlers for VideoCall");

    const handleCallSignal = (data) => {
      if (!data || data.to !== authUser?._id || !componentMountedRef.current) return;

      console.log("📡 Received call signal from:", data.from);

      // If we have a peer and are calling, this is an answer
      if (peerRef.current && isCalling) {
        try {
          console.log("📡 Applying answer signal");
          peerRef.current.signal(data.data);
        } catch (error) {
          console.error("❌ Failed to process signal:", error);
        }
        return;
      }

      // Otherwise, it's an incoming call
      console.log("📞 Incoming call from:", data.from);
      setIncomingCall(data.from, data.data, data.callType || "video");
    };

    const handleCallEnded = () => {
      if (!componentMountedRef.current) return;
      console.log("📞 Call ended by remote");
      handleRemoteEnd();
    };

    const handleCallRejected = () => {
      if (!componentMountedRef.current) return;
      console.log("📞 Call rejected by remote");
      setCallStatus("Call Rejected");
      cleanupCall();
    };

    socket.on("call-signal", handleCallSignal);
    socket.on("call-ended", handleCallEnded);
    socket.on("call-rejected", handleCallRejected);

    return () => {
      console.log("🔌 Cleaning up VideoCall socket handlers");
      socketInitializedRef.current = false;
      socket.off("call-signal", handleCallSignal);
      socket.off("call-ended", handleCallEnded);
      socket.off("call-rejected", handleCallRejected);
    };
  }, [socket, authUser, isCalling, setIncomingCall, handleRemoteEnd, cleanupCall]);

  // ==================== EFFECTS ====================
  // Ringtone management
  useEffect(() => {
    if (!componentMountedRef.current) return;

    if (isIncomingCall || (isCalling && !isCallActive)) {
      console.log("🔊 Playing ringtone");
      playRingtone();
    } else {
      console.log("🔇 Stopping ringtone");
      stopRingtone();
    }
  }, [isIncomingCall, isCalling, isCallActive, playRingtone, stopRingtone]);

  // Auto-start outgoing call
  useEffect(() => {
    if (!componentMountedRef.current) return;

    if (isCalling && !isIncomingCall && !isCallActive && !callStartedRef.current) {
      console.log("🚀 Auto-starting outgoing call");
      startOutgoingCall();
    }
  }, [isCalling, isIncomingCall, isCallActive, startOutgoingCall]);

  // Update local video when localStream changes
  useEffect(() => {
    if (callType === "video" && localStream && localVideoRef.current) {
      console.log("🔄 Updating local video element with stream");
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(err => {
        console.error("❌ Failed to play local video:", err);
      });
    }
  }, [localStream, callType]);

  // Component mount/unmount management
  useEffect(() => {
    componentMountedRef.current = true;
    
    return () => {
      console.log("🧹 VideoCall component unmounting");
      componentMountedRef.current = false;
      
      // Only cleanup if there's an active call
      const { isCalling, isCallActive, isIncomingCall } = useVideoCallStore.getState();
      if (isCalling || isCallActive || isIncomingCall) {
        cleanupCall();
      }
    };
  }, [cleanupCall]);

  // ==================== RENDER ====================
  // Don't render if no call activity
  if (!isIncomingCall && !isCallActive && !isCalling) {
    return null;
  }

  console.log("🎨 Rendering VideoCall component - Type:", callType);
  console.log("📹 Local stream available:", !!localStream);
  console.log("📹 Remote stream available:", !!remoteStream);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] bg-base-100/95 backdrop-blur-xl flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* MAIN VIDEO/AUDIO CONTAINER */}
        <div className="relative w-full h-full flex">
          {/* REMOTE STREAM */}
          <div className="flex-1 relative bg-black">
            {remoteStream ? (
              callType === "video" ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted={false}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                // Audio call UI
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <div className="text-center">
                    <Phone size={80} className="mx-auto mb-6 opacity-60" />
                    <p className="text-2xl font-semibold">{callStatus || "Connected"}</p>
                    <p className="text-lg opacity-70 mt-4">
                      {selectedUser?.fullName || "Unknown User"}
                    </p>
                    <p className="text-sm opacity-50 mt-2">Audio Call</p>
                  </div>
                </div>
              )
            ) : (
              // Connecting/No stream UI
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                {callType === "video" ? (
                  <div className="text-center">
                    <Video size={80} className="mx-auto mb-6 opacity-60" />
                    <p className="text-2xl font-semibold">{callStatus || "Connecting..."}</p>
                    <p className="text-lg opacity-70 mt-4">
                      {selectedUser?.fullName || "Connecting..."}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Phone size={80} className="mx-auto mb-6 opacity-60" />
                    <p className="text-2xl font-semibold">{callStatus || "Connecting..."}</p>
                    <p className="text-lg opacity-70 mt-4">
                      {selectedUser?.fullName || "Connecting..."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* LOCAL VIDEO PIP - Only for video calls */}
          {callType === "video" && (
            <div className="absolute top-6 right-6 w-64 h-48 bg-black/90 border-2 border-white/30 rounded-xl overflow-hidden shadow-2xl">
              {localStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <VideoOff size={40} className="text-white/50" />
                </div>
              )}
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <VideoOff size={40} className="text-white/70" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* HIDDEN AUDIO FOR AUDIO CALLS */}
        <audio 
          ref={remoteAudioRef} 
          autoPlay 
          playsInline 
          style={{ display: "none" }} 
        />

        {/* CONTROLS */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 items-center">
          {isIncomingCall ? (
            <>
              <button
                className="btn btn-error w-16 h-16 rounded-full shadow-lg hover:scale-110 transition-transform"
                onClick={rejectCall}
              >
                <PhoneOff size={30} />
              </button>
              <button
                className="btn btn-success w-16 h-16 rounded-full shadow-lg hover:scale-110 transition-transform"
                onClick={acceptCall}
              >
                <Phone size={30} />
              </button>
            </>
          ) : (
            <>
              <button
                className={`btn w-14 h-14 rounded-full border-2 shadow-lg hover:scale-110 transition-transform ${
                  isAudioEnabled ? "btn-ghost border-white/20" : "btn-error border-error"
                }`}
                onClick={toggleAudio}
              >
                {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
              </button>

              {callType === "video" && (
                <>
                  <button
                    className={`btn w-14 h-14 rounded-full border-2 shadow-lg hover:scale-110 transition-transform ${
                      isVideoEnabled ? "btn-ghost border-white/20" : "btn-error border-error"
                    }`}
                    onClick={toggleVideo}
                  >
                    {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                  </button>

                  <button
                    onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                    className={`btn w-14 h-14 rounded-full border-2 shadow-lg hover:scale-110 transition-transform ${
                      isScreenSharing ? "btn-warning border-warning" : "btn-ghost border-white/20"
                    }`}
                  >
                    {isScreenSharing ? <MonitorOff size={22} /> : <Monitor size={22} />}
                  </button>
                </>
              )}

              <button
                className="btn btn-error w-14 h-14 rounded-full shadow-lg hover:scale-110 transition-transform"
                onClick={endCall}
              >
                <PhoneOff size={24} />
              </button>
            </>
          )}
        </div>

        {/* CALL STATUS */}
        {callStatus && (
          <div className="absolute top-6 left-6 text-white bg-black/70 px-4 py-2 rounded-full backdrop-blur-sm">
            {callStatus}
          </div>
        )}

        {/* CLOSE BUTTON */}
        <button
          className="absolute top-6 right-6 text-white hover:bg-white/20 w-12 h-12 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
          onClick={endCall}
        >
          <X size={28} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoCall;