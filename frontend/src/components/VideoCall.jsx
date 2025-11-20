// src/components/VideoCall.jsx
import React, { useRef, useEffect, useState } from "react";
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
  User,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

const STUN_CONFIG = {
  iceServers: [
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

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

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const originalCameraRef = useRef(null);
  const screenStreamRef = useRef(null);

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState("Connecting...");

  /* ==========================
     Initialize local camera/mic stream - FIXED FOR AUDIO CALLS
  ========================== */
  const initializeLocalStream = async () => {
    try {
      console.log(`🎯 Initializing ${callType} call stream...`);
      
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
          sampleSize: 16
        },
        video: callType === "video" ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log("✅ Stream obtained with tracks:", 
        stream.getTracks().map(t => `${t.kind} (${t.enabled ? 'enabled' : 'disabled'})`)
      );

      // Store the original stream for reference
      originalCameraRef.current = stream;
      setLocalStream(stream);

      // For video calls, set the local video element
      if (callType === "video" && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Ensure initial state matches
      stream.getAudioTracks().forEach(track => {
        track.enabled = isAudioEnabled;
      });
      
      if (callType === "video") {
        stream.getVideoTracks().forEach(track => {
          track.enabled = isVideoEnabled;
        });
      }

      return stream;
    } catch (err) {
      console.error("❌ getUserMedia error:", err);
      alert(`Unable to access ${callType === 'video' ? 'camera/mic' : 'microphone'}. Please check permissions.`);
      resetCallState();
      return null;
    }
  };

  /* ==========================
     Create RTCPeerConnection with proper audio handling
  ========================== */
  const createPeerConnection = (targetUserId) => {
    console.log("🔗 Creating peer connection for:", callType);
    
    const pc = new RTCPeerConnection(STUN_CONFIG);

    // Track remote streams by kind
    const remoteStreams = {
      audio: new MediaStream(),
      video: new MediaStream()
    };

    pc.ontrack = (event) => {
      console.log("📨 Received remote track:", event.track.kind, event.streams);
      
      try {
        if (event.track) {
          // Add track to the appropriate stream
          if (event.track.kind === "audio") {
            remoteStreams.audio.addTrack(event.track);
          } else if (event.track.kind === "video") {
            remoteStreams.video.addTrack(event.track);
          }

          // For audio calls, we only care about audio stream
          if (callType === "audio" && event.track.kind === "audio") {
            setRemoteStream(remoteStreams.audio);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStreams.audio;
            }
          } 
          // For video calls, we want both but prioritize video for display
          else if (callType === "video") {
            const combinedStream = new MediaStream();
            [...remoteStreams.audio.getTracks(), ...remoteStreams.video.getTracks()]
              .forEach(track => combinedStream.addTrack(track));
            setRemoteStream(combinedStream);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = combinedStream;
            }
          }

          setCallActive(true);
          setCallStatus("Connected");
        }
      } catch (err) {
        console.error("❌ ontrack error:", err);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("❄️ Sending ICE candidate to:", targetUserId);
        socket?.emit("webrtc-ice-candidate", {
          targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log("🔗 Connection state:", state);
      setCallStatus(state.charAt(0).toUpperCase() + state.slice(1));
      
      if (state === "connected") {
        console.log("✅ Peer connection established!");
        setCallActive(true);
      } else if (["failed", "disconnected", "closed"].includes(state)) {
        console.log("❌ Peer connection failed/closed");
        handleRemoteEnd();
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log("🧊 ICE connection state:", state);
      
      if (["failed", "disconnected"].includes(state)) {
        console.log("❌ ICE connection failed");
        handleRemoteEnd();
      }
    };

    // Buffer for ICE candidates
    pc._remoteIceBuffer = [];

    return pc;
  };

  /* ==========================
     Clean up everything
  ========================== */
  const cleanupCall = () => {
    console.log("🧹 Cleaning up call...");

    // Stop screen share stream if present
    try {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
    } catch (e) {
      console.warn("Error stopping screen share:", e);
    }

    // Stop original camera stream
    try {
      if (originalCameraRef.current) {
        originalCameraRef.current.getTracks().forEach((t) => t.stop());
        originalCameraRef.current = null;
      }
    } catch (e) {
      console.warn("Error stopping camera:", e);
    }

    // Stop localStream in store
    try {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    } catch (e) {
      console.warn("Error stopping local stream:", e);
    }

    // Close PC
    try {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.onconnectionstatechange = null;
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    } catch (e) {
      console.warn("Error closing peer connection:", e);
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Reset UI states
    setIsScreenSharing(false);
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);

    // Reset store state
    resetCallState();
    console.log("✅ Call cleanup complete");
  };

  const handleRemoteEnd = () => {
    console.log("📞 Remote ended call");
    cleanupCall();
  };

  /* ==========================
     Outgoing call flow (caller) - FIXED FOR AUDIO
  ========================== */
  const startOutgoingCall = async () => {
    const receiverId = selectedUser?._id || peerId;
    if (!receiverId) {
      console.error("❌ No target to call");
      setCalling(false);
      return;
    }

    setCallStatus("Calling...");
    
    // 1) Get local media
    const stream = await initializeLocalStream();
    if (!stream) {
      setCalling(false);
      return;
    }

    // 2) Create PC
    const pc = createPeerConnection(receiverId);
    peerConnectionRef.current = pc;

    // 3) Add ALL tracks to PC (both audio and video if available)
    stream.getTracks().forEach((track) => {
      console.log(`➕ Adding ${track.kind} track to peer connection`);
      pc.addTrack(track, stream);
    });

    // 4) For video calls, set local video preview
    if (callType === "video" && localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    try {
      // 5) Create offer with proper media directions
      const offerOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video"
      };

      console.log("📝 Creating offer with options:", offerOptions);
      const offer = await pc.createOffer(offerOptions);
      await pc.setLocalDescription(offer);

      // 6) Send offer to remote
      socket?.emit("call-user", {
        targetUserId: receiverId,
        offer: pc.localDescription,
        callType,
      });

      setCallStatus(callType === "video" ? "Calling..." : "Calling...");
      console.log("✅ Outgoing call initiated");

    } catch (err) {
      console.error("❌ Error creating offer:", err);
      resetCallState();
    }
  };

  /* ==========================
     Accept incoming call (callee) - FIXED FOR AUDIO
  ========================== */
  const acceptCall = async () => {
    if (!incomingCallFrom || !callOffer) {
      console.error("❌ No incoming call data");
      return;
    }

    console.log("✅ Accepting call from:", incomingCallFrom);
    clearIncomingCall();
    setCalling(true);
    setCallStatus("Connecting...");

    // 1) Get local media
    const stream = await initializeLocalStream();
    if (!stream) {
      setCalling(false);
      return;
    }

    // 2) Create PC
    const pc = createPeerConnection(incomingCallFrom);
    peerConnectionRef.current = pc;

    // 3) Add ALL tracks to PC
    stream.getTracks().forEach((track) => {
      console.log(`➕ Adding ${track.kind} track to peer connection`);
      pc.addTrack(track, stream);
    });

    // 4) For video calls, set local video preview
    if (callType === "video" && localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    try {
      // 5) Set remote description
      const remoteDesc = new RTCSessionDescription(callOffer);
      await pc.setRemoteDescription(remoteDesc);
      console.log("✅ Remote description set");

      // 6) Process buffered ICE candidates
      if (pc._remoteIceBuffer && pc._remoteIceBuffer.length) {
        console.log(`📨 Processing ${pc._remoteIceBuffer.length} buffered ICE candidates`);
        for (const candidate of pc._remoteIceBuffer) {
          try {
            await pc.addIceCandidate(candidate);
          } catch (e) {
            console.warn("❌ Failed to add buffered ICE candidate:", e);
          }
        }
        pc._remoteIceBuffer = [];
      }

      // 7) Create answer
      const answerOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video"
      };

      const answer = await pc.createAnswer(answerOptions);
      await pc.setLocalDescription(answer);
      console.log("✅ Answer created and local description set");

      // 8) Send answer back to caller
      socket?.emit("call-accepted", {
        callerId: incomingCallFrom,
        answer: pc.localDescription,
      });

      setCallStatus("Connected");
      console.log("✅ Call accepted successfully");

    } catch (err) {
      console.error("❌ Error accepting call:", err);
      resetCallState();
    }
  };

  const rejectCall = () => {
    console.log("❌ Rejecting call from:", incomingCallFrom);
    if (incomingCallFrom) {
      socket?.emit("call-rejected", { callerId: incomingCallFrom });
    }
    resetCallState();
  };

  /* ==========================
     Socket event handlers
  ========================== */
  useEffect(() => {
    if (!socket) {
      console.log("❌ No socket available");
      return;
    }

    console.log("🔌 Setting up socket event listeners");

    const handleIncomingCall = (data) => {
      console.log("📞 Incoming call:", data);
      setIncomingCall(data.from, data.offer, data.callType);
      setCallStatus("Incoming call...");
    };

    const handleCallAccepted = async (data) => {
      console.log("✅ Call accepted:", data);
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        const remoteDesc = new RTCSessionDescription(data.answer);
        await pc.setRemoteDescription(remoteDesc);
        console.log("✅ Remote description (answer) set");

        // Process any buffered ICE candidates
        if (pc._remoteIceBuffer && pc._remoteIceBuffer.length) {
          for (const candidate of pc._remoteIceBuffer) {
            try {
              await pc.addIceCandidate(candidate);
            } catch (e) {
              console.warn("❌ Failed to add buffered ICE candidate:", e);
            }
          }
          pc._remoteIceBuffer = [];
        }

        setCallStatus("Connected");
      } catch (err) {
        console.error("❌ Error setting remote description:", err);
      }
    };

    const handleIceCandidate = async (data) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        // Buffer candidates if remote description isn't set yet
        if (!pc.remoteDescription || !pc.remoteDescription.type) {
          pc._remoteIceBuffer = pc._remoteIceBuffer || [];
          pc._remoteIceBuffer.push(new RTCIceCandidate(data.candidate));
          console.log("📨 Buffered ICE candidate (waiting for remote description)");
          return;
        }

        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log("✅ ICE candidate added");
      } catch (err) {
        console.error("❌ Error adding ICE candidate:", err);
      }
    };

    const handleCallEnded = () => {
      console.log("📞 Call ended by remote");
      handleRemoteEnd();
    };

    const handleCallRejected = () => {
      console.log("❌ Call rejected by callee");
      setCallStatus("Call rejected");
      setTimeout(() => resetCallState(), 2000);
    };

    const handleCallFailed = (data) => {
      console.error("❌ Call failed:", data);
      setCallStatus(`Failed: ${data.reason}`);
      setTimeout(() => resetCallState(), 3000);
    };

    // Register event listeners
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("webrtc-ice-candidate", handleIceCandidate);
    socket.on("call-ended", handleCallEnded);
    socket.on("call-rejected", handleCallRejected);
    socket.on("call-failed", handleCallFailed);

    // Cleanup
    return () => {
      console.log("🔌 Cleaning up socket listeners");
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
      socket.off("call-ended", handleCallEnded);
      socket.off("call-rejected", handleCallRejected);
      socket.off("call-failed", handleCallFailed);
    };
  }, [socket, setIncomingCall]);

  /* ==========================
     Start outgoing call when isCalling becomes true
  ========================== */
  useEffect(() => {
    if (isCalling && !isIncomingCall && !isCallActive) {
      console.log("🚀 Starting outgoing call process");
      startOutgoingCall();
    }
  }, [isCalling, isIncomingCall, isCallActive, selectedUser?._id, peerId]);

  /* ==========================
     Screen share (video calls only)
  ========================== */
  const startScreenShare = async () => {
    if (callType !== "video") return;
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      console.log("🖥️ Starting screen share...");
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
          displaySurface: "window"
        },
        audio: true,
      });

      screenStreamRef.current = screenStream;

      // Replace video track with screen share
      const screenVideoTrack = screenStream.getVideoTracks()[0];
      const senders = pc.getSenders();
      const videoSender = senders.find(sender => 
        sender.track && sender.track.kind === "video"
      );

      if (videoSender && screenVideoTrack) {
        await videoSender.replaceTrack(screenVideoTrack);
        console.log("✅ Screen share track replaced");
      }

      // Update local video to show screen share
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      // Handle when user stops screen share
      screenVideoTrack.onended = () => {
        console.log("🖥️ Screen share ended by user");
        stopScreenShare();
      };

      setIsScreenSharing(true);
      console.log("✅ Screen share started");

    } catch (err) {
      console.error("❌ Error starting screen share:", err);
    }
  };

  const stopScreenShare = async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !originalCameraRef.current) return;

    try {
      console.log("🖥️ Stopping screen share...");

      // Stop screen stream
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }

      // Switch back to camera
      const cameraStream = originalCameraRef.current;
      const cameraVideoTrack = cameraStream.getVideoTracks()[0];
      const senders = pc.getSenders();
      const videoSender = senders.find(sender => 
        sender.track && sender.track.kind === "video"
      );

      if (videoSender && cameraVideoTrack) {
        await videoSender.replaceTrack(cameraVideoTrack);
        console.log("✅ Camera track restored");
      }

      // Update local video back to camera
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = cameraStream;
      }

      setIsScreenSharing(false);
      console.log("✅ Screen share stopped");

    } catch (err) {
      console.error("❌ Error stopping screen share:", err);
    }
  };

  /* ==========================
     Toggle mic/cam
  ========================== */
  const toggleAudio = () => {
    const nextState = !isAudioEnabled;
    setIsAudioEnabled(nextState);
    
    try {
      if (localStream) {
        localStream.getAudioTracks().forEach(track => {
          track.enabled = nextState;
        });
      }
      if (originalCameraRef.current) {
        originalCameraRef.current.getAudioTracks().forEach(track => {
          track.enabled = nextState;
        });
      }
      console.log(`🎤 Audio ${nextState ? 'enabled' : 'disabled'}`);
    } catch (e) {
      console.warn("❌ toggleAudio failed", e);
    }
  };

  const toggleVideo = () => {
    if (callType !== "video") return;
    
    const nextState = !isVideoEnabled;
    setIsVideoEnabled(nextState);
    
    try {
      if (localStream) {
        localStream.getVideoTracks().forEach(track => {
          track.enabled = nextState;
        });
      }
      if (originalCameraRef.current) {
        originalCameraRef.current.getVideoTracks().forEach(track => {
          track.enabled = nextState;
        });
      }
      console.log(`📹 Video ${nextState ? 'enabled' : 'disabled'}`);
    } catch (e) {
      console.warn("❌ toggleVideo failed", e);
    }
  };

  /* ==========================
     End call
  ========================== */
  const endCall = () => {
    console.log("📞 Ending call...");
    const targetUserId = selectedUser?._id || incomingCallFrom || peerId;
    if (targetUserId) {
      socket?.emit("end-call", { targetUserId });
    }
    cleanupCall();
  };

  /* ==========================
     Render - UPDATED FOR AUDIO CALLS
  ========================== */
  if (!isIncomingCall && !isCallActive && !isCalling) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] bg-base-100/95 backdrop-blur-xl flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* MAIN CONTAINER */}
        <div className="relative w-full h-full flex">
          
          {/* REMOTE STREAM — FULL SCREEN */}
          <div className="flex-1 relative bg-black rounded-xl overflow-hidden">
            {remoteStream ? (
              callType === "video" ? (
                // VIDEO CALL: Show video
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted={false}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                // AUDIO CALL: Show user avatar and audio visualization
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gradient-to-br from-purple-900 to-blue-900">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-primary/30">
                      <User size={48} className="text-primary/60" />
                    </div>
                    <p className="text-2xl font-semibold mb-2">
                      {selectedUser?.fullName || "Audio Call"}
                    </p>
                    <p className="text-lg opacity-70">{callStatus}</p>
                    
                    {/* Audio visualization */}
                    <div className="mt-8 flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="w-2 bg-primary rounded-full animate-pulse"
                          style={{
                            height: `${Math.random() * 20 + 10}px`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )
            ) : (
              // NO REMOTE STREAM YET
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gradient-to-br from-gray-900 to-black">
                {callType === "video" ? (
                  <div className="text-center">
                    <Video size={60} className="mx-auto mb-4 opacity-60" />
                    <p className="text-xl font-semibold">{callStatus}</p>
                    <p className="text-sm opacity-70 mt-2">
                      {selectedUser?.fullName || "Connecting..."}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Phone size={60} className="mx-auto mb-4 opacity-60" />
                    <p className="text-xl font-semibold">{callStatus}</p>
                    <p className="text-sm opacity-70 mt-2">
                      {selectedUser?.fullName || incomingCallFrom || "Connecting..."}
                    </p>
                    
                    {/* Connecting animation for audio calls */}
                    <div className="mt-6 flex justify-center gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-2 bg-white/30 rounded-full animate-bounce"
                          style={{
                            animationDelay: `${i * 0.2}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* LOCAL VIDEO — PiP (Only for video calls) */}
          {callType === "video" && localStream && (
            <div className="absolute top-6 right-6 w-64 h-48 bg-black/90 border-2 border-white/30 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <VideoOff size={30} className="text-white/70" />
                </div>
              )}
              {isScreenSharing && (
                <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-md">
                  Screen Sharing
                </div>
              )}
            </div>
          )}
        </div>

        {/* CONTROLS */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 items-center">
          {isIncomingCall ? (
            <>
              {/* INCOMING CALL CONTROLS */}
              <button
                className="btn btn-error w-16 h-16 rounded-full shadow-lg hover:scale-105 transition-transform"
                onClick={rejectCall}
              >
                <PhoneOff size={30} />
              </button>
              <button
                className="btn btn-success w-16 h-16 rounded-full shadow-lg hover:scale-105 transition-transform"
                onClick={acceptCall}
              >
                <Phone size={30} />
              </button>
            </>
          ) : (
            <>
              {/* ACTIVE CALL CONTROLS */}
              <button
                className={`btn w-14 h-14 rounded-full border-2 shadow-lg hover:scale-105 transition-transform ${
                  isAudioEnabled 
                    ? 'btn-ghost border-white/20 hover:bg-white/10 text-white' 
                    : 'btn-error border-error bg-error/20 text-error'
                }`}
                onClick={toggleAudio}
              >
                {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
              </button>

              {callType === "video" && (
                <>
                  <button
                    className={`btn w-14 h-14 rounded-full border-2 shadow-lg hover:scale-105 transition-transform ${
                      isVideoEnabled 
                        ? 'btn-ghost border-white/20 hover:bg-white/10 text-white' 
                        : 'btn-error border-error bg-error/20 text-error'
                    }`}
                    onClick={toggleVideo}
                  >
                    {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                  </button>

                  <button
                    onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                    className={`btn w-14 h-14 rounded-full border-2 shadow-lg hover:scale-105 transition-transform ${
                      isScreenSharing 
                        ? 'btn-warning border-warning bg-warning/20 text-warning' 
                        : 'btn-ghost border-white/20 hover:bg-white/10 text-white'
                    }`}
                  >
                    {isScreenSharing ? <MonitorOff size={22} /> : <Monitor size={22} />}
                  </button>
                </>
              )}

              <button
                className="btn btn-error w-14 h-14 rounded-full shadow-lg hover:scale-105 transition-transform"
                onClick={endCall}
              >
                <PhoneOff size={24} />
              </button>
            </>
          )}
        </div>

        {/* CALL STATUS */}
        <div className="absolute top-6 left-6 text-white bg-black/70 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
          {callType === "video" ? "Video Call" : "Audio Call"} • {callStatus}
        </div>

        {/* CLOSE BUTTON */}
        <button
          className="absolute top-6 right-6 text-white hover:bg-white/20 w-12 h-12 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm border border-white/20"
          onClick={endCall}
        >
          <X size={28} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoCall;