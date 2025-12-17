// src/components/VideoCall.jsx - FIXED VERSION
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
    clearIncomingCall,
    setCallActive,
    setCalling,
    resetCallState,
    callOffer,
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
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const originalStreamRef = useRef(null);
  
  const processingCallRef = useRef(false);
  const mountedRef = useRef(true);
  const pendingSignalsRef = useRef([]);

  // State
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState("Initializing...");

  const getTargetUserId = useCallback(() => {
    return selectedUser?._id || peerId || incomingCallFrom;
  }, [selectedUser, peerId, incomingCallFrom]);

  const playRingtone = useCallback(() => {
    try {
      if (!ringtoneAudioRef.current) {
        ringtoneAudioRef.current = new Audio("/songs/new.mp3");
        ringtoneAudioRef.current.loop = true;
        ringtoneAudioRef.current.volume = 0.5;
      }
      ringtoneAudioRef.current.currentTime = 0;
      ringtoneAudioRef.current.play().catch(console.error);
    } catch (e) {
      console.warn("Ringtone error:", e);
    }
  }, []);

  const stopRingtone = useCallback(() => {
    try {
      ringtoneAudioRef.current?.pause();
      if (ringtoneAudioRef.current) ringtoneAudioRef.current.currentTime = 0;
    } catch (e) {}
  }, []);

  const getMediaConstraints = useCallback(() => {
    if (callType === "video") {
      return {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 24, max: 30 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      };
    }
    return {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
      },
    };
  }, [callType]);

  const initializeLocalStream = useCallback(async () => {
    if (localStreamRef.current) {
      console.log("✅ Local stream already exists");
      return localStreamRef.current;
    }

    try {
      console.log("🎥 Getting user media...");
      const constraints = getMediaConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      localStreamRef.current = stream;
      originalStreamRef.current = stream;

      stream.getAudioTracks().forEach(track => {
        track.enabled = isAudioEnabled;
      });

      if (callType === "video") {
        stream.getVideoTracks().forEach(track => {
          track.enabled = isVideoEnabled;
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          await localVideoRef.current.play().catch(console.error);
        }
      }

      console.log("✅ Local stream initialized", {
        hasVideo: stream.getVideoTracks().length > 0,
        hasAudio: stream.getAudioTracks().length > 0
      });
      return stream;
    } catch (error) {
      console.error("❌ Media access error:", error);
      setCallStatus("Cannot access camera/microphone");
      setTimeout(() => cleanupCall(), 2000);
      return null;
    }
  }, [callType, isAudioEnabled, isVideoEnabled, getMediaConstraints]);

  const cleanupStreams = useCallback(() => {
    console.log("🧹 Cleaning up streams");
    
    [localStreamRef.current, screenStreamRef.current, originalStreamRef.current].forEach(stream => {
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
        });
      }
    });

    localStreamRef.current = null;
    screenStreamRef.current = null;
    originalStreamRef.current = null;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  }, []);


    const handleCallEnd = useCallback(() => {
    setCallStatus("Call ended");
    setTimeout(() => cleanupCall(), 1000);
  }, []);

 

  const createPeerConnection = useCallback((initiator, stream) => {
  // 🔥 destroy old peer safely
  if (peerRef.current) {
    try {
      peerRef.current.destroy();
    } catch {}
    peerRef.current = null;
  }

  const targetUserId = getTargetUserId();
  if (!targetUserId) {
    console.error("❌ No target user");
    return null;
  }

  if (!stream) {
    console.error("❌ Stream missing");
    return null;
  }

  console.log(`🔗 Creating ${initiator ? "initiator" : "receiver"} peer`);

  const peer = new Peer({
    initiator,
    trickle: true,
    stream,
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    },
  });

  // ================= SIGNAL OUT =================
  peer.on("signal", (signal) => {
    if (!socket || !mountedRef.current) return;

    console.log("📤 Sending signal:", signal.type);

    socket.emit("call-signal", {
      to: targetUserId,
      from: authUser._id,
      data: signal,
      callType,
    });
  });

  // ================= STREAM IN =================
  peer.on("stream", (remoteStream) => {
    console.log("📥 Remote stream received", {
      audio: remoteStream.getAudioTracks().length,
      video: remoteStream.getVideoTracks().length,
    });

    if (callType === "video") {
     if (remoteVideoRef.current) {
  remoteVideoRef.current.srcObject = remoteStream;
  remoteVideoRef.current.play().catch(console.error);
}

    } else {
      if (remoteAudioRef.current) {
  remoteAudioRef.current.srcObject = remoteStream;
  remoteAudioRef.current.play().catch(console.error);
}

    }

    setCallActive(true);
    setCalling(false);
    clearIncomingCall();
    stopRingtone();
    setCallStatus("Connected");
  });

  peer.on("close", handleCallEnd);
  peer.on("error", (err) => {
    console.error("❌ Peer error:", err);
    handleCallEnd();
  });

  peerRef.current = peer;

  // ⭐ FLUSH BUFFERED SIGNALS
  if (pendingSignalsRef.current.length > 0) {
    console.log("📥 Applying buffered signals:", pendingSignalsRef.current.length);
    pendingSignalsRef.current.forEach((sig) => {
      try {
        peer.signal(sig);
      } catch (e) {
        console.error("❌ Buffered signal failed", e);
      }
    });
    pendingSignalsRef.current = [];
  }

  return peer;
}, [
  socket,
  authUser,
  callType,
  getTargetUserId,
  setCallActive,
  setCalling,
  clearIncomingCall,
  stopRingtone,
  handleCallEnd,
]);



  const startOutgoingCall = useCallback(async () => {
    if (processingCallRef.current) {
      console.log("⏭️ Call already processing");
      return;
    }

    processingCallRef.current = true;
    setCallStatus("Calling...");
    
    // ⭐ KEY FIX: Get stream FIRST, then create peer
    const stream = await initializeLocalStream();
    if (!stream) {
      console.error("❌ Failed to get local stream");
      processingCallRef.current = false;
      return;
    }

    console.log("📞 Creating initiator peer with stream");
    const peer = createPeerConnection(true, stream);
    if (!peer) {
      console.error("❌ Failed to create peer");
      processingCallRef.current = false;
      cleanupStreams();
    }
  }, [initializeLocalStream, createPeerConnection, cleanupStreams]);

  const acceptCall = useCallback(async () => {
    if (processingCallRef.current || !callOffer) {
      console.log("⏭️ Cannot accept call", { 
        processing: processingCallRef.current, 
        hasOffer: !!callOffer 
      });
      return;
    }

    processingCallRef.current = true;
    setCallStatus("Accepting...");
    clearIncomingCall();
    
    // ⭐ KEY FIX: Get stream FIRST, then create peer
    const stream = await initializeLocalStream();
    if (!stream) {
      console.error("❌ Failed to get local stream");
      processingCallRef.current = false;
      return;
    }

    console.log("📞 Creating receiver peer with stream");
    const peer = createPeerConnection(false, stream);
    if (!peer) {
      console.error("❌ Failed to create peer");
      processingCallRef.current = false;
      cleanupStreams();
      return;
    }

  }, [callOffer, initializeLocalStream, createPeerConnection, clearIncomingCall, cleanupStreams]);

  const rejectCall = useCallback(() => {
    console.log("❌ Rejecting call");
    const callerId = incomingCallFrom;
    if (callerId && socket) {
      socket.emit("call-rejected", { callerId });
    }
    cleanupCall();
  }, [incomingCallFrom, socket]);

  const endCall = useCallback(() => {
    console.log("📞 Ending call");
    const targetUserId = getTargetUserId();
    if (targetUserId && socket) {
      socket.emit("end-call", { targetUserId });
    }
    cleanupCall();
  }, [socket, getTargetUserId]);

  const cleanupCall = useCallback(() => {
    console.log("🧹 Full cleanup");
    
    processingCallRef.current = false;
    pendingSignalsRef.current = [];

    
    stopRingtone();
    cleanupStreams();
    
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {}
      peerRef.current = null;
    }

    setIsScreenSharing(false);
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
    setCallStatus("");
    
    setTimeout(() => {
      if (mountedRef.current) {
        resetCallState();
      }
    }, 100);
  }, [stopRingtone, cleanupStreams, resetCallState]);

  const toggleVideo = useCallback(() => {
    if (callType !== "video") return;
    
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    
    const stream = localStreamRef.current;
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = newState;
      });
    }
  }, [isVideoEnabled, callType]);

  const toggleAudio = useCallback(() => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    
    const stream = localStreamRef.current;
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = newState;
      });
    }
  }, [isAudioEnabled]);

  const startScreenShare = useCallback(async () => {
    if (callType !== "video" || !peerRef.current) return;

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: true,
      });

      screenStreamRef.current = screenStream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
        await localVideoRef.current.play();
      }

      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = peerRef.current._pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }

      setIsScreenSharing(true);

      videoTrack.onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error("❌ Screen share error:", error);
    }
  }, [callType]);

  const stopScreenShare = useCallback(async () => {
    if (!peerRef.current || !originalStreamRef.current) return;

    try {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = originalStreamRef.current;
        await localVideoRef.current.play();
      }

      const videoTrack = originalStreamRef.current.getVideoTracks()[0];
      const sender = peerRef.current._pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }

      setIsScreenSharing(false);
    } catch (error) {
      console.error("❌ Stop screen share error:", error);
    }
  }, []);

  useEffect(() => {
  if (!socket || !authUser) return;

  console.log("🎧 WebRTC signal listener attached");

  const handleSignal = (payload) => {
    if (!mountedRef.current) return;
    if (!payload || payload.to !== authUser._id) return;

    const signal = payload.data;
    if (!signal) return;

    console.log("📡 Incoming signal:", signal.type);

    // ⭐ CRITICAL FIX: buffer signals until peer exists
    if (!peerRef.current || peerRef.current.destroyed) {
      console.log("⏳ Peer not ready, buffering:", signal.type);
      pendingSignalsRef.current.push(signal);
      return;
    }

    try {
      peerRef.current.signal(signal);
    } catch (err) {
      console.error("❌ Signal apply failed:", err);
    }
  };

  const handleCallEnded = ({ by }) => {
    if (!mountedRef.current) return;
    console.log("📞 Call ended by:", by);
    handleCallEnd();
  };

  const handleCallRejected = ({ by }) => {
    if (!mountedRef.current) return;
    console.log("❌ Call rejected by:", by);
    setCallStatus("Call rejected");
    cleanupCall();
  };

  socket.on("call-signal", handleSignal);
  socket.on("call-ended", handleCallEnded);
  socket.on("call-rejected", handleCallRejected);

  return () => {
    console.log("🧹 WebRTC signal listener removed");
    socket.off("call-signal", handleSignal);
    socket.off("call-ended", handleCallEnded);
    socket.off("call-rejected", handleCallRejected);
  };
}, [socket, authUser, handleCallEnd, cleanupCall]);


  useEffect(() => {
    if (isIncomingCall || (isCalling && !isCallActive)) {
      playRingtone();
    } else {
      stopRingtone();
    }
  }, [isIncomingCall, isCalling, isCallActive, playRingtone, stopRingtone]);

  useEffect(() => {
    if (isCalling && !isIncomingCall && !isCallActive && !processingCallRef.current) {
      startOutgoingCall();
    }
  }, [isCalling, isIncomingCall, isCallActive, startOutgoingCall]);
useEffect(() => {
  mountedRef.current = true;
  return () => {
    mountedRef.current = false;
  };
}, []);


  if (!isIncomingCall && !isCallActive && !isCalling) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 to-black flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Remote Stream */}
        <div className="relative w-full h-full">
          {callType === "video" ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <Phone size={80} className="mb-6 opacity-60" />
              <p className="text-3xl font-bold">{selectedUser?.fullName || "Audio Call"}</p>
              <p className="text-lg opacity-70 mt-2">{callStatus}</p>
            </div>
          )}

          {/* Local Video PIP */}
          {callType === "video" && (
            <motion.div
              className="absolute top-6 right-6 w-64 h-48 bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <VideoOff size={40} className="text-white/70" />
                </div>
              )}
            </motion.div>
          )}

          {/* Status Badge */}
          {callStatus && (
            <div className="absolute top-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-white text-sm">
              <span className="inline-block w-2 h-2 rounded-full mr-2 bg-green-500" />
              {callStatus}
            </div>
          )}
        </div>

        {/* Hidden Audio Element */}
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

        {/* Controls */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4">
          {isIncomingCall ? (
            <>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center shadow-lg"
                onClick={rejectCall}
              >
                <PhoneOff size={28} className="text-white" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-16 h-16 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center shadow-lg"
                onClick={acceptCall}
              >
                <Phone size={28} className="text-white" />
              </motion.button>
            </>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
                  isAudioEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
                }`}
                onClick={toggleAudio}
              >
                {isAudioEnabled ? <Mic size={24} className="text-white" /> : <MicOff size={24} className="text-white" />}
              </motion.button>

              {callType === "video" && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
                      isVideoEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
                    }`}
                    onClick={toggleVideo}
                  >
                    {isVideoEnabled ? <Video size={24} className="text-white" /> : <VideoOff size={24} className="text-white" />}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
                      isScreenSharing ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-700 hover:bg-gray-600"
                    }`}
                    onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                  >
                    {isScreenSharing ? <MonitorOff size={24} className="text-white" /> : <Monitor size={24} className="text-white" />}
                  </motion.button>
                </>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center shadow-lg"
                onClick={endCall}
              >
                <PhoneOff size={24} className="text-white" />
              </motion.button>
            </>
          )}
        </div>

        {/* Close Button */}
        <button
          className="absolute top-6 right-6 w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center transition-colors z-10"
          onClick={endCall}
        >
          <X size={24} className="text-white" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoCall;