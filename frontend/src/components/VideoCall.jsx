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

  /* ===========================
        INIT LOCAL STREAM
  ============================ */
  const initializeLocalStream = async () => {
    try {
      const constraints =
        callType === "video"
          ? { video: true, audio: true }
          : { video: false, audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      originalCameraRef.current = stream;
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (err) {
      console.error("getUserMedia error:", err);
      alert("Unable to access camera/mic");
      resetCallState();
      return null;
    }
  };

  /* ===========================
       CREATE PEER CONNECTION
  ============================ */
  const createPeerConnection = (stream, targetUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    });

    // Add tracks from stream
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    pc.ontrack = (event) => {
      console.log("Received remote stream");
      const remoteStream = event.streams[0];
      setRemoteStream(remoteStream);

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
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
      console.log("Connection state:", pc.connectionState);
      setCallStatus(pc.connectionState);
      
      if (pc.connectionState === "connected") {
        setCallStatus("Connected");
      } else if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
        handleRemoteEnd();
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
      if (["failed", "disconnected"].includes(pc.iceConnectionState)) {
        handleRemoteEnd();
      }
    };

    return pc;
  };

  /* ===========================
         OUTGOING CALL
  ============================ */
  const startOutgoingCall = async () => {
    if (!selectedUser?._id) {
      console.error("No user selected for call");
      return;
    }

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

      console.log("Outgoing call initiated to:", selectedUser._id);
    } catch (error) {
      console.error("Error creating offer:", error);
      resetCallState();
    }
  };

  /* ===========================
         ACCEPT CALL
  ============================ */
  const acceptCall = async () => {
    if (!incomingCallFrom || !callOffer) {
      console.error("No incoming call data");
      return;
    }

    clearIncomingCall();
    setCalling(true);
    setCallActive(true);
    setCallStatus("Connecting...");

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

      console.log("Call accepted");
    } catch (error) {
      console.error("Error accepting call:", error);
      resetCallState();
    }
  };

  const rejectCall = () => {
    if (incomingCallFrom) {
      socket.emit("call-rejected", { callerId: incomingCallFrom });
    }
    resetCallState();
  };

  /* ===========================
            END CALL
  ============================ */
  const endCall = () => {
    const targetUserId = selectedUser?._id || incomingCallFrom;
    if (targetUserId) {
      socket.emit("end-call", { targetUserId });
    }
    cleanupCall();
  };

  const handleRemoteEnd = () => {
    console.log("Remote ended call");
    cleanupCall();
  };

  const cleanupCall = () => {
    console.log("Cleaning up call...");

    // Stop all media tracks
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    if (originalCameraRef.current) {
      originalCameraRef.current.getTracks().forEach(track => track.stop());
      originalCameraRef.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Reset states
    setIsScreenSharing(false);
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
    
    // Reset store state
    resetCallState();
  };

  /* ===========================
        SOCKET EVENTS
  ============================ */
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      console.log("Incoming call:", data);
      setIncomingCall(data.from, data.offer, data.callType);
    };

    const handleCallAccepted = async (data) => {
      console.log("Call accepted:", data);
      const pc = peerConnectionRef.current;
      if (pc && data.answer) {
        try {
          await pc.setRemoteDescription(data.answer);
          setCallStatus("Connected");
        } catch (error) {
          console.error("Error setting remote description:", error);
        }
      }
    };

    const handleIceCandidate = async (data) => {
      const pc = peerConnectionRef.current;
      if (pc && data.candidate) {
        try {
          await pc.addIceCandidate(data.candidate);
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      }
    };

    const handleCallEnded = () => {
      console.log("Call ended by remote");
      handleRemoteEnd();
    };

    // Register event listeners
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("webrtc-ice-candidate", handleIceCandidate);
    socket.on("call-ended", handleCallEnded);
    socket.on("call-rejected", () => {
      console.log("Call was rejected");
      resetCallState();
    });

    // Cleanup
    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
      socket.off("call-ended", handleCallEnded);
      socket.off("call-rejected");
    };
  }, [socket, setIncomingCall]);

  // Start outgoing call when isCalling becomes true
  useEffect(() => {
    if (isCalling && !isIncomingCall && !isCallActive) {
      startOutgoingCall();
    }
  }, [isCalling, isIncomingCall, isCallActive]);

  /* ===========================
        SCREEN SHARE
  ============================ */
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

      // Replace video track with screen share
      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = pc.getSenders().find(s => s.track?.kind === "video");
      
      if (sender) {
        await sender.replaceTrack(videoTrack);
      }

      // Update local video display
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      // Handle when user stops screen share
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
    if (!pc || !originalCameraRef.current) return;

    try {
      // Stop screen stream
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }

      // Switch back to camera
      const cameraStream = originalCameraRef.current;
      const videoTrack = cameraStream.getVideoTracks()[0];
      const sender = pc.getSenders().find(s => s.track?.kind === "video");
      
      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }

      // Update local video display
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = cameraStream;
      }

      setIsScreenSharing(false);
    } catch (err) {
      console.error("Error stopping screen share:", err);
    }
  };

  /* ===========================
        TOGGLE MIC / CAM
  ============================ */
  const toggleAudio = () => {
    const nextState = !isAudioEnabled;
    setIsAudioEnabled(nextState);

    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = nextState;
      });
    }
  };

  const toggleVideo = () => {
    if (callType !== "video") return;

    const nextState = !isVideoEnabled;
    setIsVideoEnabled(nextState);

    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = nextState;
      });
    }
  };

  /* ===========================
          RENDER
  ============================ */
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
                  isAudioEnabled ? 'btn-ghost border-white/20' : 'btn-error border-error'
                }`}
                onClick={toggleAudio}
              >
                {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
              </button>

              {callType === "video" && (
                <>
                  <button 
                    className={`btn w-14 h-14 rounded-full border-2 ${
                      isVideoEnabled ? 'btn-ghost border-white/20' : 'btn-error border-error'
                    }`}
                    onClick={toggleVideo}
                  >
                    {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                  </button>

                  <button
                    onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                    className={`btn w-14 h-14 rounded-full border-2 ${
                      isScreenSharing ? 'btn-warning border-warning' : 'btn-ghost border-white/20'
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