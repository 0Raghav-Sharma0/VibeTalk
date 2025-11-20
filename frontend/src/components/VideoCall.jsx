// src/components/VideoCall.jsx
import React, { useEffect, useRef, useState } from "react";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import {
  X,
  Phone,
  PhoneOff,
  Video as VideoIcon,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  StopCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * VideoCall component (keeps architecture A)
 * - Uses useVideoCallStore for flags/streams
 * - Uses useAuthStore.getState().socket for signaling
 * - Robust cleanup + toggle handlers
 */

const VideoCall = () => {
  const {
    isIncomingCall,
    isCalling,
    isCallActive,
    callType,
    incomingCallFrom,
    callOffer,
    setLocalStream,
    setRemoteStream,
    setCallActive,
    setCalling,
    clearIncomingCall,
    resetCallState,
  } = useVideoCallStore();

  const socket = useAuthStore.getState().socket;
  const authUser = useAuthStore.getState().authUser;
  const { selectedUser } = useChatStore();

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const screenStreamRef = useRef(null);

  // UI toggles
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState("Connecting...");

  const targetUserId = selectedUser?._id || incomingCallFrom;

  // Create a new RTCPeerConnection
  const createPeerConnection = (targetId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    });

    pc.ontrack = (event) => {
      const remote = event.streams && event.streams[0];
      if (remote) {
        setRemoteStream(remote);
        if (remoteVideoRef.current && callType === "video") {
          remoteVideoRef.current.srcObject = remote;
        } else if (remote) {
          const audioEl = document.createElement("audio");
          audioEl.autoplay = true;
          audioEl.srcObject = remote;
          audioEl.style.display = "none";
          document.body.appendChild(audioEl);
        }
        setCallActive(true);
        setCallStatus("Connected");
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && socket && targetId) {
        socket.emit("webrtc-ice-candidate", {
          targetUserId: targetId,
          candidate: e.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log("pc state:", state);
      if (["disconnected", "failed", "closed"].includes(state)) {
        cleanupCall();
      }
    };

    return pc;
  };

  // Get local media (camera/mic or screen)
  const getLocalMedia = async (useScreen = false) => {
    try {
      if (useScreen) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        setLocalStream(screenStream);
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        return screenStream;
      }

      const constraints =
        callType === "video"
          ? { video: { width: 640, height: 480 }, audio: true }
          : { video: false, audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      if (localVideoRef.current && callType === "video") {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error("getLocalMedia error:", err);
      alert("Could not access camera/microphone");
      cleanupCall();
      return null;
    }
  };

  // Outgoing call
  const startOutgoingCall = async () => {
    if (!authUser || !targetUserId || !socket) {
      console.warn("Cannot start call - missing auth/socket/target");
      setCalling(false);
      return;
    }

    setCallStatus("Calling...");
    setCalling(true);

    const stream = await getLocalMedia(false);
    if (!stream) {
      setCalling(false);
      return;
    }

    const pc = createPeerConnection(targetUserId);
    pcRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call-user", {
        targetUserId,
        offer,
        callType,
        from: authUser._id,
      });

      setCallStatus("Waiting for answer...");
    } catch (err) {
      console.error("startOutgoingCall error:", err);
      cleanupCall();
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!callOffer || !incomingCallFrom || !socket) return;

    clearIncomingCall();
    setCalling(true);

    const stream = await getLocalMedia(false);
    if (!stream) {
      setCalling(false);
      return;
    }

    const pc = createPeerConnection(incomingCallFrom);
    pcRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    try {
      await pc.setRemoteDescription(callOffer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call-accepted", {
        callerId: incomingCallFrom,
        answer,
      });

      setCallStatus("Connected");
      setCalling(false);
    } catch (err) {
      console.error("acceptCall error:", err);
      cleanupCall();
    }
  };

  const rejectCall = () => {
    if (incomingCallFrom && socket) {
      socket.emit("call-rejected", { callerId: incomingCallFrom });
    }
    clearIncomingCall();
    resetCallState();
  };

  // END CALL: notify other side and cleanup
  const endCall = () => {
    const other = selectedUser?._id || incomingCallFrom;
    if (other && socket) {
      socket.emit("end-call", { targetUserId: other });
    }
    cleanupCall();
  };

  // CLEANUP — correct order: close pc → stop tracks → reset state
  const cleanupCall = () => {
    console.log("🔻 CLEANING UP CALL");

    try {
      if (pcRef.current) {
        pcRef.current.onicecandidate = null;
        pcRef.current.ontrack = null;
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.close();
        pcRef.current = null;
      }
    } catch (err) {
      console.warn("PC close error:", err);
    }

    try {
      const local = useVideoCallStore.getState().localStream;
      if (local) local.getTracks().forEach((t) => t.stop());
    } catch (e) {}

    try {
      const remote = useVideoCallStore.getState().remoteStream;
      if (remote) remote.getTracks().forEach((t) => t.stop());
    } catch (e) {}

    try {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
    } catch (e) {}

    // Reset the store AFTER tracks/stops
    resetCallState();

    setIsScreenSharing(false);
    setIsAudioEnabled(true);
    setIsVideoEnabled(true);
    setCallStatus("Disconnected");

    console.log("✅ CALL CLEANED");
  };

  // Toggle audio (mute/unmute)
  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);

    const local = useVideoCallStore.getState().localStream;
    local?.getAudioTracks()?.forEach((t) => (t.enabled = newState));

    if (pcRef.current) {
      pcRef.current
        .getSenders()
        .filter((s) => s.track && s.track.kind === "audio")
        .forEach((sender) => {
          if (sender.track) sender.track.enabled = newState;
        });
    }
  };

  // Toggle video (camera on/off)
  const toggleVideo = () => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);

    const local = useVideoCallStore.getState().localStream;
    local?.getVideoTracks()?.forEach((t) => (t.enabled = newState));

    if (pcRef.current) {
      pcRef.current
        .getSenders()
        .filter((s) => s.track && s.track.kind === "video")
        .forEach((sender) => {
          if (sender.track) sender.track.enabled = newState;
        });
    }
  };

  // Screen share
  const startScreenShare = async () => {
    if (!pcRef.current) {
      console.warn("No PC for screen share");
      return;
    }

    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screen;
      setIsScreenSharing(true);

      const videoSender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === "video");
      if (videoSender) {
        await videoSender.replaceTrack(screen.getVideoTracks()[0]);
      } else {
        pcRef.current.addTrack(screen.getVideoTracks()[0], screen);
      }

      if (localVideoRef.current) localVideoRef.current.srcObject = screen;

      screen.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error("startScreenShare error:", err);
    }
  };

  const stopScreenShare = async () => {
    if (!pcRef.current) return;

    try {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setLocalStream(cameraStream);
      if (localVideoRef.current) localVideoRef.current.srcObject = cameraStream;

      const videoSender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === "video");
      if (videoSender) {
        await videoSender.replaceTrack(cameraStream.getVideoTracks()[0]);
      } else {
        pcRef.current.addTrack(cameraStream.getVideoTracks()[0], cameraStream);
      }
    } catch (err) {
      console.warn("stopScreenShare fallback error:", err);
    } finally {
      screenStreamRef.current = null;
      setIsScreenSharing(false);
    }
  };

  /* ---------------------------
     Socket listeners
  --------------------------- */
  useEffect(() => {
    if (!socket) return;

    const onIncomingCall = (d) => {
      // d: { from, offer, callType }
      const myId = authUser?._id;
      if (!d || !d.from) return;
      if (myId === d.from) return; // ignore self

      // If busy -> reject
      if (useVideoCallStore.getState().isCallActive || useVideoCallStore.getState().isCalling) {
        socket.emit("call-rejected", { callerId: d.from });
        return;
      }

      useVideoCallStore.getState().setIncomingCall(d.from, d.offer, d.callType);
    };

    const onCallAccepted = async (d) => {
      if (!pcRef.current) return;
      try {
        if (d.answer) {
          await pcRef.current.setRemoteDescription(d.answer);
          setCallStatus("Connected");
          setCalling(false);
          setCallActive(true);
        }
      } catch (err) {
        console.error("onCallAccepted error", err);
      }
    };

    const onCallRejected = () => {
      alert("Call rejected by the other user.");
      cleanupCall();
    };

    const onWebrtcIce = async (d) => {
      if (!pcRef.current) return;
      try {
        if (d?.candidate) await pcRef.current.addIceCandidate(d.candidate);
      } catch (err) {
        console.warn("addIceCandidate error", err);
      }
    };

    const onCallEnded = () => cleanupCall();

    const onCallFailed = ({ reason }) => {
      alert("Call failed: " + (reason || "Unknown"));
      cleanupCall();
    };

    socket.on("incoming-call", onIncomingCall);
    socket.on("call-accepted", onCallAccepted);
    socket.on("call-rejected", onCallRejected);
    socket.on("webrtc-ice-candidate", onWebrtcIce);
    socket.on("call-ended", onCallEnded);
    socket.on("call-failed", onCallFailed);

    return () => {
      socket.off("incoming-call", onIncomingCall);
      socket.off("call-accepted", onCallAccepted);
      socket.off("call-rejected", onCallRejected);
      socket.off("webrtc-ice-candidate", onWebrtcIce);
      socket.off("call-ended", onCallEnded);
      socket.off("call-failed", onCallFailed);
    };
  }, [socket, authUser]);

  // Start outgoing when store flags request it
  useEffect(() => {
    if (isCalling && !isIncomingCall && !isCallActive) {
      startOutgoingCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCalling, isIncomingCall, isCallActive, targetUserId]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach local/remote video elements
  useEffect(() => {
    const local = useVideoCallStore.getState().localStream;
    if (localVideoRef.current && local && callType === "video") {
      localVideoRef.current.srcObject = local;
    }
  }, [useVideoCallStore.getState().localStream, callType]);

  useEffect(() => {
    const remote = useVideoCallStore.getState().remoteStream;
    if (remoteVideoRef.current && remote && callType === "video") {
      remoteVideoRef.current.srcObject = remote;
    }
  }, [useVideoCallStore.getState().remoteStream, callType]);

  if (!isIncomingCall && !isCallActive && !isCalling) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="video-call"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-base-100/95 backdrop-blur-xl flex items-center justify-center"
      >
        <div className="relative w-full h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            {useVideoCallStore.getState().remoteStream ? (
              callType === "video" ? (
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="p-8 bg-base-200 rounded-xl">
                  <p className="text-lg">Connected</p>
                </div>
              )
            ) : (
              <div className="text-center p-8 bg-base-200 border rounded-xl">
                {callType === "video" ? <VideoIcon size={48} /> : <Phone size={48} />}
                <p className="mt-2">{callStatus}</p>
              </div>
            )}

            {useVideoCallStore.getState().localStream && callType === "video" && (
              <div className="absolute top-6 right-6 w-44 h-32 rounded-lg overflow-hidden border bg-base-200">
                <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
            {isIncomingCall ? (
              <>
                <button onClick={rejectCall} className="btn btn-error w-16 h-16 rounded-full"><PhoneOff size={24} /></button>
                <button onClick={acceptCall} className="btn btn-success w-16 h-16 rounded-full"><Phone size={24} /></button>
              </>
            ) : (
              <>
                <button onClick={toggleAudio} className="btn btn-ghost w-14 h-14 rounded-full border">
                  {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </button>

                {callType === "video" && (
                  <button onClick={toggleVideo} className="btn btn-ghost w-14 h-14 rounded-full border">
                    {isVideoEnabled ? <VideoIcon size={20} /> : <VideoOff size={20} />}
                  </button>
                )}

                {callType === "video" && (
                  <button
                    onClick={() => (isScreenSharing ? stopScreenShare() : startScreenShare())}
                    className={`btn w-14 h-14 rounded-full border ${isScreenSharing ? "btn-warning" : "btn-ghost"}`}
                  >
                    {isScreenSharing ? <StopCircle size={18} /> : <Monitor size={18} />}
                  </button>
                )}

                <button onClick={endCall} className="btn btn-error w-14 h-14 rounded-full"><PhoneOff size={20} /></button>
              </>
            )}
          </div>

          <button onClick={endCall} className="absolute top-4 right-4 text-base-content/70 hover:text-base-content">
            <X size={28} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoCall;
