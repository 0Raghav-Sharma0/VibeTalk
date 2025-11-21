// src/components/VideoCall.jsx
import React, { useRef, useEffect, useState } from "react";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { showSystemNotification } from "../utils/notifications";


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

const STUN_CONFIG = {
  iceServers: [
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
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
  const remoteAudioRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const ringtoneAudioRef = useRef(null);

  const originalCameraRef = useRef(null);
  const screenStreamRef = useRef(null);
  const iceBufferRef = useRef([]);

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState("Connecting...");

  /* ==========================
     Ringtone Functions
  ========================== */
  const playRingtone = () => {
    try {
      if (!ringtoneAudioRef.current) {
        ringtoneAudioRef.current = new Audio("/songs/new.mp3");
        ringtoneAudioRef.current.loop = true;
        ringtoneAudioRef.current.volume = 0.7;
      }
      
      // Reset audio to beginning and play
      ringtoneAudioRef.current.currentTime = 0;
      ringtoneAudioRef.current.play().catch(e => {
        console.warn("Failed to play ringtone:", e);
      });
      
      console.log("🔔 Playing ringtone");
    } catch (error) {
      console.error("Error playing ringtone:", error);
    }
  };

  const stopRingtone = () => {
    try {
      if (ringtoneAudioRef.current) {
        ringtoneAudioRef.current.pause();
        ringtoneAudioRef.current.currentTime = 0;
        console.log("🔕 Stopped ringtone");
      }
    } catch (error) {
      console.error("Error stopping ringtone:", error);
    }
  };

  /* ==========================
     Play ringtone for incoming calls
  ========================== */
  useEffect(() => {
    if (isIncomingCall) {
      console.log("📞 Incoming call detected - playing ringtone");
      playRingtone();
    } else {
      stopRingtone();
    }
  }, [isIncomingCall]);

  /* ==========================
     Play ringtone for outgoing calls (while calling)
  ========================== */
  useEffect(() => {
    if (isCalling && !isCallActive) {
      console.log("📞 Outgoing call - playing ringtone");
      playRingtone();
    } else {
      stopRingtone();
    }
  }, [isCalling, isCallActive]);

  /* ==========================
     Stop ringtone when call is answered or ended
  ========================== */
  useEffect(() => {
    if (isCallActive) {
      console.log("📞 Call answered - stopping ringtone");
      stopRingtone();
    }
  }, [isCallActive]);

  /* ==========================
     Cleanup ringtone on component unmount
  ========================== */
  useEffect(() => {
    return () => {
      stopRingtone();
    };
  }, []);

  const setLocalVideoObject = (stream) => {
    try {
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    } catch (e) {
      console.warn("Failed to set local video srcObject", e);
    }
  };

  const setRemoteVideoObject = (stream) => {
    try {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
    } catch (e) {
      console.warn("Failed to set remote video srcObject", e);
    }
  };

  const setRemoteAudioObject = (stream) => {
    try {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        const p = remoteAudioRef.current.play?.();
        if (p && p.catch) p.catch(() => {});
      }
    } catch (e) {
      console.warn("Failed to set remote audio srcObject", e);
    }
  };

  const initializeLocalStream = async () => {
    try {
      const constraints =
        callType === "video"
          ? { video: true, audio: true }
          : { video: false, audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      originalCameraRef.current = stream;
      setLocalStream(stream);
      setLocalVideoObject(stream);

      stream.getAudioTracks().forEach((t) => (t.enabled = isAudioEnabled));
      if (stream.getVideoTracks().length) {
        stream.getVideoTracks().forEach((t) => (t.enabled = isVideoEnabled));
      }
      return stream;
    } catch (err) {
      console.error("getUserMedia error:", err);
      alert("Unable to access camera/mic. Check permissions.");
      resetCallState();
      return null;
    }
  };

  /* ==========================
     Peer connection factory
  ========================== */
  const createPeerConnection = (targetUserId) => {
    const pc = new RTCPeerConnection(STUN_CONFIG);
    let inboundStream = remoteStream || new MediaStream();

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit("webrtc-ice-candidate", {
          targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      try {
        if (event.streams && event.streams[0]) {
          inboundStream = event.streams[0];
        } else if (event.track) {
          inboundStream = inboundStream || new MediaStream();
          inboundStream.addTrack(event.track);
        }

        setRemoteStream(inboundStream);

        if (callType === "video") setRemoteVideoObject(inboundStream);
        else setRemoteAudioObject(inboundStream);

        setCallActive(true);
        setCallStatus("Connected");
      } catch (err) {
        console.error("ontrack error", err);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("PC connectionState:", pc.connectionState);
      setCallStatus(pc.connectionState);
      if (pc.connectionState === "connected") setCallStatus("Connected");
      else if (["failed", "disconnected", "closed"].includes(pc.connectionState))
        handleRemoteEnd();
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
      if (["failed", "disconnected"].includes(pc.iceConnectionState)) {
        handleRemoteEnd();
      }
    };

    pc._remoteIceBuffer = [];
    return pc;
  };

  /* ==========================
     Enhanced Cleanup - Stops ALL media tracks completely
  ========================== */
  const cleanupCall = () => {
    console.log("🧹 FULL CLEANUP - Stopping all media tracks...");

    // Stop ringtone first
    stopRingtone();

    // 1) Stop screen share tracks
    try {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => {
          console.log("🛑 Stopping screen track:", track.kind, track.id);
          track.stop();
          track.enabled = false;
        });
        screenStreamRef.current = null;
      }
    } catch (e) {
      console.warn("Error stopping screen share:", e);
    }

    // 2) Stop original camera stream
    try {
      if (originalCameraRef.current) {
        originalCameraRef.current.getTracks().forEach((track) => {
          console.log("🛑 Stopping camera track:", track.kind, track.id);
          track.stop();
          track.enabled = false;
        });
        originalCameraRef.current = null;
      }
    } catch (e) {
      console.warn("Error stopping camera:", e);
    }

    // 3) Stop current local stream
    try {
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          console.log("🛑 Stopping local stream track:", track.kind, track.id);
          track.stop();
          track.enabled = false;
        });
      }
    } catch (e) {
      console.warn("Error stopping local stream:", e);
    }

    // 4) Close peer connection
    try {
      if (peerConnectionRef.current) {
        console.log("🔌 Closing RTCPeerConnection...");
        // Remove all event listeners first
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.onconnectionstatechange = null;
        peerConnectionRef.current.oniceconnectionstatechange = null;
        
        // Close connection
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    } catch (e) {
      console.warn("Error closing peer connection:", e);
    }

    // 5) Clear all video/audio elements
    try {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    } catch (e) {
      console.warn("Error clearing media elements:", e);
    }

    // 6) Reset all UI states
    setIsScreenSharing(false);
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
    setCallStatus("Ended");

    // 7) Force a small delay to ensure all tracks are stopped
    setTimeout(() => {
      // 8) Reset store - this will trigger component unmount
      resetCallState();
      console.log("✅ FULL CLEANUP COMPLETED - All media stopped");
    }, 100);
  };

  /* ==========================
     Enhanced End Call - Stops both sides
  ========================== */
  const endCall = () => {
    console.log("📞 ENDING CALL - Stopping media on both sides...");
    
    const targetUserId = selectedUser?._id || incomingCallFrom || peerId;
    
    // Send end-call signal to other user FIRST
    if (targetUserId && socket) {
      socket.emit("end-call", { targetUserId });
      console.log("📤 Sent end-call signal to:", targetUserId);
    }

    // Then cleanup locally
    cleanupCall();
  };

  const handleRemoteEnd = () => {
    console.log("📞 REMOTE ENDED CALL - Cleaning up locally...");
    cleanupCall();
  };

  /* ==========================
     Outgoing call (caller)
  ========================== */
  const startOutgoingCall = async () => {
    const receiverId = selectedUser?._id || peerId;
    if (!receiverId) {
      setCalling(false);
      return;
    }

    setCallStatus("Calling...");
    const stream = await initializeLocalStream();
    if (!stream) {
      setCalling(false);
      return;
    }

    const pc = createPeerConnection(receiverId);
    peerConnectionRef.current = pc;

    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket?.emit("call-user", {
          targetUserId: receiverId,
          offer: pc.localDescription,
          callType,
        });
      } catch (err) {
        console.error("Error during offer/negotiation", err);
      }
    };

    try {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    } catch (err) {
      console.error("Error adding local tracks:", err);
    }

    setLocalVideoObject(stream);
  };

  /* ==========================
     Accept incoming (callee)
  ========================== */
  const acceptCall = async () => {
    if (!incomingCallFrom || !callOffer) return;

    clearIncomingCall();
    setCalling(true);
    setCallStatus("Connecting...");

    const stream = await initializeLocalStream();
    if (!stream) {
      setCalling(false);
      return;
    }

    const pc = createPeerConnection(incomingCallFrom);
    peerConnectionRef.current = pc;

    try {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    } catch (err) {
      console.error("Error adding local tracks (acceptCall):", err);
    }

    setLocalVideoObject(stream);

    try {
      const remoteDesc =
        typeof callOffer === "object" && callOffer.type
          ? callOffer
          : { type: "offer", sdp: callOffer?.sdp || callOffer };
      await pc.setRemoteDescription(new RTCSessionDescription(remoteDesc));

      if (pc._remoteIceBuffer && pc._remoteIceBuffer.length) {
        for (const c of pc._remoteIceBuffer) {
          try { await pc.addIceCandidate(c); } catch (e) { console.warn("addIceCandidate buffered failed", e); }
        }
        pc._remoteIceBuffer = [];
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket?.emit("call-accepted", {
        callerId: incomingCallFrom,
        answer: pc.localDescription,
      });

      setCallStatus("Connected");
    } catch (err) {
      console.error("Error accepting call:", err);
      resetCallState();
    }
  };

  const rejectCall = () => {
    if (incomingCallFrom) socket?.emit("call-rejected", { callerId: incomingCallFrom });
    resetCallState();
  };

  /* ==========================
     SOCKET HANDLERS
  ========================== */
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {

  // Only notify if tab not focused
  if (document.hidden) {
    showSystemNotification({
      title: "Incoming Call",
      body: `${data.callerName || "Someone"} is calling you...`,
      icon: "/call_icon.png",
      onClick: () => {
        window.focus();
      },
    });
  }

  setIncomingCall(data.from, data.offer, data.callType);
};


    const handleCallAccepted = async (data) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      try {
        const remoteDesc =
          typeof data.answer === "object" && data.answer.type
            ? data.answer
            : { type: "answer", sdp: data.answer?.sdp || data.answer };

        await pc.setRemoteDescription(new RTCSessionDescription(remoteDesc));

        // FIX: Caller must drain ICE buffer after applying answer
        if (pc._remoteIceBuffer && pc._remoteIceBuffer.length) {
          for (const candidate of pc._remoteIceBuffer) {
            try { await pc.addIceCandidate(candidate); } catch (e) { console.warn("Buffered ICE apply failed", e); }
          }
          pc._remoteIceBuffer = [];
        }

        setCallStatus("Connected");
      } catch (err) {
        console.error("Error setting remote description (answer):", err);
      }
    };

    const handleIceCandidate = async (data) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        if (!pc.remoteDescription || !pc.remoteDescription.type) {
          pc._remoteIceBuffer = pc._remoteIceBuffer || [];
          pc._remoteIceBuffer.push(data.candidate);
          return;
        }
        await pc.addIceCandidate(data.candidate);
      } catch (err) {
        console.error("Error adding ICE candidate", err);
      }
    };

    const handleCallEnded = () => {
      console.log("📞 Received call-ended signal from remote");
      handleRemoteEnd();
    };

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("webrtc-ice-candidate", handleIceCandidate);
    socket.on("call-ended", handleCallEnded);
    socket.on("call-rejected", () => resetCallState());
    socket.on("call-failed", () => resetCallState());

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
      socket.off("call-ended", handleCallEnded);
      socket.off("call-rejected");
      socket.off("call-failed");
    };
  }, [socket, setIncomingCall]);

  /* ==========================
     Auto-start outgoing when store flag is set
  ========================== */
  useEffect(() => {
    if (isCalling && !isIncomingCall && !isCallActive) startOutgoingCall();
  }, [isCalling, isIncomingCall, isCallActive, selectedUser?._id, peerId]);

  /* ==========================
     Screen share (ENHANCED)
  ========================== */
  const startScreenShare = async () => {
    if (callType !== "video") return;
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      // Request display media (may include system audio where supported)
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      if (!screenStream) return;

      screenStreamRef.current = screenStream;

      const screenVideoTrack = screenStream.getVideoTracks()[0];
      const screenAudioTrack = screenStream.getAudioTracks()[0];

      // Replace or add video sender
      let videoSender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (videoSender && screenVideoTrack) {
        await videoSender.replaceTrack(screenVideoTrack);
      } else if (screenVideoTrack) {
        try { pc.addTrack(screenVideoTrack, screenStream); } catch (e) { console.warn("addTrack(screenVideo) failed", e); }
      }

      // Replace or add audio sender (if displayMedia provides it)
      if (screenAudioTrack) {
        let audioSender = pc.getSenders().find((s) => s.track?.kind === "audio");
        if (audioSender) {
          try { await audioSender.replaceTrack(screenAudioTrack); } catch (e) { console.warn("replaceTrack(screenAudioAudio) failed", e); }
        } else {
          try { pc.addTrack(screenAudioTrack, screenStream); } catch (e) { console.warn("addTrack(screenAudio) failed", e); }
        }
      }

      // Show the screen stream in local preview (use combined stream where possible)
      setLocalVideoObject(screenStream);

      // When user stops sharing (browser stop), revert automatically
      const onScreenEnded = async () => {
        // small delay to allow track state to settle
        try { await stopScreenShare(); } catch (e) { console.warn("stopScreenShare on ended failed", e); }
      };

      // attach handlers for all tracks ending
      screenStream.getTracks().forEach((t) => (t.onended = onScreenEnded));

      setIsScreenSharing(true);
    } catch (err) {
      console.error("Error starting screen share:", err);
    }
  };

  const stopScreenShare = async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      // Stop and clear screen stream tracks
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => { try { t.stop(); } catch (e) {} });
        screenStreamRef.current = null;
      }

      // Restore camera/video sender to original camera track (if available)
      const cameraStream = originalCameraRef.current;
      const cameraVideoTrack = cameraStream?.getVideoTracks()[0];
      const cameraAudioTrack = cameraStream?.getAudioTracks()[0];

      // Find the current senders
      const videoSender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (videoSender) {
        if (cameraVideoTrack) {
          try { await videoSender.replaceTrack(cameraVideoTrack); } catch (e) { console.warn("replaceTrack(cameraVideo) failed", e); }
        } else {
          // no camera - stop sending video
          try { await videoSender.replaceTrack(null); } catch (e) { console.warn("remove video sender failed", e); }
        }
      }

      const audioSender = pc.getSenders().find((s) => s.track?.kind === "audio");
      if (audioSender) {
        if (cameraAudioTrack) {
          try { await audioSender.replaceTrack(cameraAudioTrack); } catch (e) { console.warn("replaceTrack(cameraAudio) failed", e); }
        } else {
          try { await audioSender.replaceTrack(null); } catch (e) { console.warn("remove audio sender failed", e); }
        }
      }

      // Restore local preview to camera or existing local stream
      if (cameraStream) setLocalVideoObject(cameraStream);
      else if (localStream) setLocalVideoObject(localStream);
      else setLocalVideoObject(null);

      setIsScreenSharing(false);
    } catch (err) {
      console.error("Error stopping screen share:", err);
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
        localStream.getAudioTracks().forEach((t) => (t.enabled = nextState));
      }
      if (originalCameraRef.current) {
        originalCameraRef.current
          .getAudioTracks()
          .forEach((t) => (t.enabled = nextState));
      }
    } catch (e) {
      console.warn("toggleAudio failed", e);
    }
  };

  const toggleVideo = () => {
    if (callType !== "video") return;
    const nextState = !isVideoEnabled;
    setIsVideoEnabled(nextState);
    try {
      if (localStream) {
        localStream.getVideoTracks().forEach((t) => (t.enabled = nextState));
      }
      if (originalCameraRef.current) {
        originalCameraRef.current
          .getVideoTracks()
          .forEach((t) => (t.enabled = nextState));
      }
    } catch (e) {
      console.warn("toggleVideo failed", e);
    }
  };

  /* ==========================
     Render
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
        {/* MAIN VIDEO CONTAINER */}
        <div className="relative w-full h-full flex">
          {/* REMOTE VIDEO — FULL SCREEN */}
          <div className="flex-1 relative bg-black">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                {callType === "video" ? (
                  <div className="text-center">
                    <Video size={60} className="mx-auto mb-4 opacity-60" />
                    <p className="text-xl">{callStatus}</p>
                    <p className="text-sm opacity-70 mt-2">
                      {selectedUser?.fullName || "Connecting..."}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Phone size={60} className="mx-auto mb-4 opacity-60" />
                    <p className="text-xl">{callStatus}</p>
                    <p className="text-sm opacity-70 mt-2">
                      {selectedUser?.fullName || "Connecting..."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* LOCAL VIDEO — PiP */}
          {localStream && callType === "video" && (
            <div className="absolute top-6 right-6 w-52 h-36 bg-black/80 border-2 border-white/20 rounded-xl overflow-hidden shadow-2xl">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <VideoOff size={30} className="text-white/70" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hidden audio element for audio-only calls */}
        <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />

        {/* CONTROLS */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 items-center">
          {isIncomingCall ? (
            <>
              <button
                className="btn btn-error w-16 h-16 rounded-full shadow-lg"
                onClick={rejectCall}
              >
                <PhoneOff size={30} />
              </button>
              <button
                className="btn btn-success w-16 h-16 rounded-full shadow-lg"
                onClick={acceptCall}
              >
                <Phone size={30} />
              </button>
            </>
          ) : (
            <>
              <button
                className={`btn w-14 h-14 rounded-full border-2 ${
                  isAudioEnabled ? "btn-ghost border-white/20" : "btn-error border-error"
                }`}
                onClick={toggleAudio}
              >
                {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
              </button>

              {callType === "video" && (
                <>
                  <button
                    className={`btn w-14 h-14 rounded-full border-2 ${
                      isVideoEnabled ? "btn-ghost border-white/20" : "btn-error border-error"
                    }`}
                    onClick={toggleVideo}
                  >
                    {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                  </button>

                  <button
                    onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                    className={`btn w-14 h-14 rounded-full border-2 ${
                      isScreenSharing ? "btn-warning border-warning" : "btn-ghost border-white/20"
                    }`}
                  >
                    {isScreenSharing ? <MonitorOff size={22} /> : <Monitor size={22} />}
                  </button>
                </>
              )}

              <button
                className="btn btn-error w-14 h-14 rounded-full shadow-lg"
                onClick={endCall}
              >
                <PhoneOff size={24} />
              </button>
            </>
          )}
        </div>

        {/* CALL STATUS */}
        <div className="absolute top-6 left-6 text-white bg-black/50 px-4 py-2 rounded-full">
          {callStatus}
        </div>

        {/* CLOSE BUTTON */}
        <button
          className="absolute top-6 right-6 text-white hover:bg-white/20 w-12 h-12 rounded-full flex items-center justify-center transition-colors"
          onClick={endCall}
        >
          <X size={28} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoCall;