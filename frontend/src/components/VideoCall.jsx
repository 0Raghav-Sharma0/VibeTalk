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
  } = useVideoCallStore();

  const { socket } = useAuthStore();
  const { selectedUser, users } = useChatStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [callStatus, setCallStatus] = useState("Connecting...");

  const callerUser = users.find((u) => u._id === incomingCallFrom);

  /* ---------------------------------------------------
        STREAM + WEBRTC
  --------------------------------------------------- */

  const initializeLocalStream = async () => {
    try {
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
    } catch {
      alert("Unable to access camera/mic.");
      resetCallState();
      return null;
    }
  };

  const createPeerConnection = (stream, targetUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    });

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      const remote = event.streams[0];
      setRemoteStream(remote);

      if (callType === "video" && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remote;
      } else {
        const audioEl = document.createElement("audio");
        audioEl.srcObject = remote;
        audioEl.autoplay = true;
        document.body.appendChild(audioEl);
      }

      setCallActive(true);
      setCallStatus("Connected");
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-ice-candidate", {
          targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (["failed", "disconnected"].includes(pc.connectionState)) {
        handleRemoteEnd();
      }
    };

    return pc;
  };

  const startOutgoingCall = async () => {
    setCallStatus("Calling...");
    const stream = await initializeLocalStream();
    if (!stream) return;

    const pc = createPeerConnection(stream, selectedUser._id);
    peerConnectionRef.current = pc;

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call-user", {
        targetUserId: selectedUser._id,
        offer,
        callType,
      });
    } catch {
      resetCallState();
    }
  };

  const acceptCall = async () => {
    clearIncomingCall();
    setCalling(true);
    setCallActive(true);

    const stream = await initializeLocalStream();
    if (!stream) return;

    const pc = createPeerConnection(stream, incomingCallFrom);
    peerConnectionRef.current = pc;

    try {
      await pc.setRemoteDescription(callOffer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call-accepted", {
        callerId: incomingCallFrom,
        answer,
      });

      setCallStatus("Connecting...");
    } catch {
      resetCallState();
    }
  };

  const rejectCall = () => {
    socket.emit("call-rejected", { callerId: incomingCallFrom });
    resetCallState();
  };

  const endCall = () => {
    const target = selectedUser?._id || incomingCallFrom;
    if (target) socket.emit("end-call", { targetUserId: target });
    cleanupCall();
  };

  const handleRemoteEnd = () => {
    alert("Call ended by other user.");
    cleanupCall();
  };

  const cleanupCall = () => {
    if (localStream) localStream.getTracks().forEach((t) => t.stop());

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    resetCallState();
  };

  /* ---------------------------------------------------
        SOCKET EVENTS
  --------------------------------------------------- */
  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", (d) =>
      useVideoCallStore.getState().setIncomingCall(
        d.from,
        d.offer,
        d.callType
      )
    );

    socket.on("call-accepted", async (d) => {
      const pc = peerConnectionRef.current;
      if (pc) await pc.setRemoteDescription(d.answer);
      setCallStatus("Connected");
    });

    socket.on("webrtc-ice-candidate", async (d) => {
      const pc = peerConnectionRef.current;
      if (pc && d.candidate) await pc.addIceCandidate(d.candidate);
    });

    socket.on("call-ended", handleRemoteEnd);

    return () => {
      socket.off("incoming-call");
      socket.off("call-accepted");
      socket.off("webrtc-ice-candidate");
      socket.off("call-ended");
    };
  }, [socket]);

  useEffect(() => {
    if (isCalling && !isIncomingCall && !isCallActive) {
      startOutgoingCall();
    }
  }, [isCalling, isIncomingCall, isCallActive]);

  useEffect(() => () => cleanupCall(), []);

  /* ---------------------------------------------------
        IMPORTANT FIXES
  --------------------------------------------------- */

  useEffect(() => {
    if (localVideoRef.current && localStream && callType === "video") {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callType]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && callType === "video") {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callType]);

  /* ---------------------------------------------------
        UI — FIXED MIC TOGGLE 
  --------------------------------------------------- */

  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);

    // 1. Mute local device mic
    localStream?.getAudioTracks()?.forEach((track) => {
      track.enabled = newState;
    });

    // 2. Mute the actual WebRTC sender (this controls what remote hears)
    const pc = peerConnectionRef.current;
    if (pc) {
      pc.getSenders()
        .filter((s) => s.track && s.track.kind === "audio")
        .forEach((sender) => {
          sender.track.enabled = newState;
        });
    }
  };

  const toggleVideo = () => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);

    localStream?.getVideoTracks()?.forEach((track) => {
      track.enabled = newState;
    });

    const pc = peerConnectionRef.current;
    if (pc) {
      pc.getSenders()
        .filter((s) => s.track && s.track.kind === "video")
        .forEach((sender) => {
          sender.track.enabled = newState;
        });
    }
  };

  /* ---------------------------------------------------
        RENDER
  --------------------------------------------------- */

  if (!isIncomingCall && !isCallActive && !isCalling) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="call"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="
          fixed inset-0 z-[9999]
          bg-base-100/95 backdrop-blur-xl
          flex items-center justify-center
        "
      >
        <div className="relative w-full h-full flex">
          {/* REMOTE VIDEO */}
          <div className="flex-1 flex items-center justify-center">
            {remoteStream ? (
              callType === "video" ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <p className="text-base-content text-xl">Connected</p>
              )
            ) : (
              <div className="text-center p-8 bg-base-200 border border-base-300 rounded-xl">
                {callType === "video" ? (
                  <Video size={50} className="text-primary mx-auto mb-4" />
                ) : (
                  <Phone size={50} className="text-primary mx-auto mb-4" />
                )}
                <p className="text-base-content">{callStatus}</p>
              </div>
            )}
          </div>

          {/* LOCAL PiP */}
          {localStream && callType === "video" && (
            <div
              className="
                absolute top-6 right-6 
                w-52 h-36 rounded-lg overflow-hidden
                border border-base-300 bg-base-200/70 backdrop-blur-lg
              "
            >
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* CONTROLS */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4">
          {isIncomingCall ? (
            <>
              <button
                onClick={rejectCall}
                className="btn btn-error w-16 h-16 rounded-full text-error-content"
              >
                <PhoneOff size={28} />
              </button>

              <button
                onClick={acceptCall}
                className="btn btn-success w-16 h-16 rounded-full text-success-content"
              >
                <Phone size={28} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleAudio}
                className="btn btn-ghost w-14 h-14 rounded-full border border-base-300"
              >
                {isAudioEnabled ? (
                  <Mic size={24} className="text-base-content" />
                ) : (
                  <MicOff size={24} className="text-error" />
                )}
              </button>

              {callType === "video" && (
                <button
                  onClick={toggleVideo}
                  className="btn btn-ghost w-14 h-14 rounded-full border border-base-300"
                >
                  {isVideoEnabled ? (
                    <Video size={24} className="text-base-content" />
                  ) : (
                    <VideoOff size={24} className="text-error" />
                  )}
                </button>
              )}

              <button
                onClick={endCall}
                className="btn btn-error w-14 h-14 rounded-full text-error-content"
              >
                <PhoneOff size={26} />
              </button>
            </>
          )}
        </div>

        <button
          onClick={endCall}
          className="absolute top-6 right-6 text-base-content/70 hover:text-base-content"
        >
          <X size={32} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoCall;
