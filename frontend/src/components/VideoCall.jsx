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
  const remoteAudioRef = useRef(null); // <-- audio element for audio-only calls
  const peerConnectionRef = useRef(null);

  // Keep a permanent reference to the camera stream (so screen share can swap back)
  const originalCameraRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Buffer for remote ICE candidates that arrive before remoteDescription is set
  const iceBufferRef = useRef([]);

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState("Connecting...");

  /* ==========================
     Helpers: set DOM video/audio srcObject safely
  ========================== */
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
        // ensure playback attempt (should be allowed because user initiated call)
        const p = remoteAudioRef.current.play?.();
        if (p && p.catch) p.catch(() => {
          // autoplay may be blocked in some browsers; user interaction is typically required.
          // we silently ignore the rejection here.
        });
      }
    } catch (e) {
      console.warn("Failed to set remote audio srcObject", e);
    }
  };

  /* ==========================
     Initialize local camera/mic stream
  ========================== */
  const initializeLocalStream = async () => {
    try {
      const constraints =
        callType === "video"
          ? { video: true, audio: true }
          : { video: false, audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      originalCameraRef.current = stream; // keep camera for toggles / screen share fallback
      setLocalStream(stream);
      // For video calls we show camera in PIP; for audio-only we don't attempt to show video.
      // setLocalVideoObject is safe if localVideoRef is null / not rendered for audio-only.
      setLocalVideoObject(stream);

      // Ensure initial audio/video enabled state matches UI state
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
     Create RTCPeerConnection + handlers
     This returns a PC ready to accept addTrack and negotiation.
  ========================== */
  const createPeerConnection = (targetUserId) => {
    const pc = new RTCPeerConnection(STUN_CONFIG);

    // Create inbound MediaStream container for tracks (so ontrack can add)
    let inboundStream = remoteStream || null;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // send to peer via signaling
        socket?.emit("webrtc-ice-candidate", {
          targetUserId,
          candidate: event.candidate,
        });
      }
    };

    // Add incoming track to a MediaStream and attach to remote video/audio element
    pc.ontrack = (event) => {
      try {
        if (!inboundStream) inboundStream = new MediaStream();

        // event.streams[0] is most common; otherwise add track(s)
        if (event.streams && event.streams[0]) {
          inboundStream = event.streams[0];
        } else if (event.track) {
          inboundStream.addTrack(event.track);
        }

        // Save in store
        setRemoteStream(inboundStream);

        // Route the remote media to the correct element:
        // - video calls: attach to remote <video>
        // - audio calls: attach to hidden <audio>
        if (callType === "video") {
          setRemoteVideoObject(inboundStream);
        } else {
          // audio-only
          setRemoteAudioObject(inboundStream);
        }

        setCallActive(true);
        setCallStatus("Connected");
      } catch (err) {
        console.error("ontrack error", err);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("PC connectionState:", pc.connectionState);
      setCallStatus(pc.connectionState);
      if (pc.connectionState === "connected") {
        setCallStatus("Connected");
      } else if (
        ["failed", "disconnected", "closed"].includes(pc.connectionState)
      ) {
        handleRemoteEnd();
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
      if (["failed", "disconnected"].includes(pc.iceConnectionState)) {
        handleRemoteEnd();
      }
    };

    // convenience places to store buffered candidates on pc instance
    pc._remoteIceBuffer = [];

    return pc;
  };

  /* ==========================
     Clean up everything
  ========================== */
  const cleanupCall = () => {
    console.log("Cleaning up call...");

    // Stop screen share stream if present
    try {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
    } catch (e) {}

    // Stop original camera (kept in originalCameraRef)
    try {
      if (originalCameraRef.current) {
        originalCameraRef.current.getTracks().forEach((t) => t.stop());
        originalCameraRef.current = null;
      }
    } catch (e) {}

    // Stop localStream in store (if exists)
    try {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    } catch (e) {}

    // Close PC
    try {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.onconnectionstatechange = null;
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    } catch (e) {}

    // Clear remote audio element
    try {
      if (remoteAudioRef.current) {
        try {
          remoteAudioRef.current.pause();
        } catch {}
        remoteAudioRef.current.srcObject = null;
      }
    } catch (e) {}

    // Reset UI states
    setIsScreenSharing(false);
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
    setCallStatus("Ended");

    // Reset store state (streams cleared inside store)
    resetCallState();
  };

  const handleRemoteEnd = () => {
    console.log("Remote ended call / connection lost");
    cleanupCall();
  };

  /* ==========================
     Outgoing call flow (caller)
     - Ensure local stream added BEFORE creating offer
     - Use onnegotiationneeded to createOffer after tracks added
  ========================== */
  const startOutgoingCall = async () => {
    const receiverId = selectedUser?._id || peerId;
    if (!receiverId) {
      console.error("No target to call");
      setCalling(false);
      return;
    }

    setCallStatus("Calling...");
    // 1) get local media
    const stream = await initializeLocalStream();
    if (!stream) {
      setCalling(false);
      return;
    }

    // 2) create pc
    const pc = createPeerConnection(receiverId);
    peerConnectionRef.current = pc;

    // 3) add tracks
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // 4) set local video (camera)
    setLocalVideoObject(stream);

    // 5) negotiationneeded handler: create offer AFTER tracks added
    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // send actual localDescription (with sdp) to remote
        socket?.emit("call-user", {
          targetUserId: receiverId,
          offer: pc.localDescription,
          callType,
        });
      } catch (err) {
        console.error("Error during offer/negotiation", err);
      }
    };

    // If the browser doesn't always fire negotiationneeded immediately,
    // createOffer proactively (safe because we already added tracks)
    try {
      if (pc.signalingState === "stable" && !pc._didCreateOffer) {
        pc._didCreateOffer = true;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket?.emit("call-user", {
          targetUserId: receiverId,
          offer: pc.localDescription,
          callType,
        });
      }
    } catch (err) {
      // ignore; negotiationneeded will handle it
      console.debug("proactive offer error (ignored):", err);
    }
  };

  /* ==========================
     Accept incoming call (callee)
     - create pc
     - add local tracks BEFORE creating answer?
       Actually answer is created after setRemoteDescription, but local tracks must be added before setLocalDescription(answer)
  ========================== */
  const acceptCall = async () => {
    if (!incomingCallFrom || !callOffer) {
      console.error("No incoming call data");
      return;
    }

    clearIncomingCall();
    setCalling(true);
    setCallStatus("Connecting...");

    // 1) get local media
    const stream = await initializeLocalStream();
    if (!stream) {
      setCalling(false);
      return;
    }

    const pc = createPeerConnection(incomingCallFrom);
    peerConnectionRef.current = pc;

    // Add local tracks to pc BEFORE creating an answer (so tracks are included in answer)
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    setLocalVideoObject(stream);

    try {
      // 2) set remote description (offer from caller)
      const remoteDesc =
        typeof callOffer === "object" && callOffer.type
          ? callOffer
          : { type: "offer", sdp: callOffer?.sdp || callOffer };
      await pc.setRemoteDescription(new RTCSessionDescription(remoteDesc));

      // If we have any buffered remote ICE candidates, add them now
      if (pc._remoteIceBuffer && pc._remoteIceBuffer.length) {
        for (const c of pc._remoteIceBuffer) {
          try {
            await pc.addIceCandidate(c);
          } catch (e) {
            console.warn("addIceCandidate buffered failed", e);
          }
        }
        pc._remoteIceBuffer = [];
      }

      // 3) create answer and set local description
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // 4) send answer back to caller
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
    if (incomingCallFrom) {
      socket?.emit("call-rejected", { callerId: incomingCallFrom });
    }
    resetCallState();
  };

  /* ==========================
     Handle incoming socket messages: answer / ice / incoming-call / end
  ========================== */
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      // data: { from, offer, callType }
      console.log("Incoming call (socket):", data);
      setIncomingCall(data.from, data.offer, data.callType);
    };

    const handleCallAccepted = async (data) => {
      // data: { answer }
      console.log("Call accepted (socket):", data);
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        const remoteDesc =
          typeof data.answer === "object" && data.answer.type
            ? data.answer
            : { type: "answer", sdp: data.answer?.sdp || data.answer };

        await pc.setRemoteDescription(new RTCSessionDescription(remoteDesc));

        // drain buffered remote ICE candidates
        if (pc._remoteIceBuffer && pc._remoteIceBuffer.length) {
          for (const c of pc._remoteIceBuffer) {
            try {
              await pc.addIceCandidate(c);
            } catch (e) {
              console.warn("Error adding buffered candidate after answer", e);
            }
          }
          pc._remoteIceBuffer = [];
        }

        setCallStatus("Connected");
      } catch (err) {
        console.error("Error setting remote description (answer):", err);
      }
    };

    const handleIceCandidate = async (data) => {
      // data: { candidate }
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        // If remoteDescription not yet set, buffer candidate on pc
        if (!pc.remoteDescription || pc.remoteDescription.type === null) {
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
      console.log("Call ended by remote");
      handleRemoteEnd();
    };

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("webrtc-ice-candidate", handleIceCandidate);
    socket.on("call-ended", handleCallEnded);
    socket.on("call-rejected", () => {
      console.log("Call rejected by callee");
      resetCallState();
    });
    socket.on("call-failed", (d) => {
      console.warn("Call failed:", d);
      resetCallState();
    });

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
      socket.off("call-ended", handleCallEnded);
      socket.off("call-rejected");
      socket.off("call-failed");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, setIncomingCall]);

  /* ==========================
     Start outgoing call when isCalling becomes true
     (the store's startCall sets isCalling and peerId)
  ========================== */
  useEffect(() => {
    if (isCalling && !isIncomingCall && !isCallActive) {
      startOutgoingCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCalling, isIncomingCall, isCallActive, selectedUser?._id, peerId]);

  /* ==========================
     Screen share
  ========================== */
  const startScreenShare = async () => {
    if (callType !== "video") return;
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      screenStreamRef.current = screenStream;

      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");

      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }

      setLocalVideoObject(screenStream);

      videoTrack.onended = () => {
        stopScreenShare();
      };

      setIsScreenSharing(true);
    } catch (err) {
      console.error("Error starting screen share:", err);
    }
  };

  const stopScreenShare = async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }

      // restore camera track to sender
      const cameraStream = originalCameraRef.current;
      if (!cameraStream) return;

      const videoTrack = cameraStream.getVideoTracks()[0];
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");

      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }

      setLocalVideoObject(cameraStream);
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
     End call (local hangup)
  ========================== */
  const endCall = () => {
    const targetUserId = selectedUser?._id || incomingCallFrom || peerId;
    if (targetUserId) {
      socket?.emit("end-call", { targetUserId });
    }
    cleanupCall();
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
              {/* INCOMING CALL CONTROLS */}
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
              {/* ACTIVE CALL CONTROLS */}
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
