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
  const { selectedUser, setSelectedUser, users } = useChatStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const ringtoneRef = useRef(null);
  const callTimerRef = useRef(null);

  const originalCameraRef = useRef(null);
  const screenStreamRef = useRef(null);

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState("Connecting...");
  const [callDuration, setCallDuration] = useState(0);
  const [incomingCaller, setIncomingCaller] = useState(null);

  /* ===========================
        RINGTONE & NOTIFICATION
  ============================ */
  useEffect(() => {
    // Initialize ringtone audio - same for both audio and video calls
    ringtoneRef.current = new Audio('/songs/ringtone.mp3');
    ringtoneRef.current.loop = true;

    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }
    };
  }, []);

  // Play ringtone for incoming call (both audio and video)
  useEffect(() => {
    if (isIncomingCall && ringtoneRef.current) {
      ringtoneRef.current.play().catch(e => console.log("Ringtone play failed:", e));
      
      // Browser notification for incoming call
      if (Notification.permission === 'granted') {
        const callTypeText = callType === 'video' ? 'Video Call' : 'Audio Call';
        new Notification('Incoming Call', {
          body: `${incomingCaller?.fullName || 'Someone'} is calling you (${callTypeText})`,
          icon: incomingCaller?.profilePic || '/boy.png',
          requireInteraction: true,
          tag: 'incoming-call'
        });
      }
    } else {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    }
  }, [isIncomingCall, incomingCaller, callType]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Find caller info for incoming call
  useEffect(() => {
    if (isIncomingCall && incomingCallFrom && users) {
      const caller = users.find(user => user._id === incomingCallFrom);
      setIncomingCaller(caller);
      
      // Auto-open chat for the caller if not already selected
      if (caller && selectedUser?._id !== caller._id) {
        setSelectedUser(caller);
      }
    }
  }, [isIncomingCall, incomingCallFrom, users, selectedUser, setSelectedUser]);

  /* ===========================
        CALL DURATION TIMER
  ============================ */
  useEffect(() => {
    if (isCallActive) {
      const startTime = Date.now();
      callTimerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      setCallDuration(0);
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [isCallActive]);

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

    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    pc.ontrack = (event) => {
      console.log("Received remote stream");
      const rStream = event.streams[0];
      setRemoteStream(rStream);

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = rStream;
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
        from: authUser?._id,
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

    // Stop ringtone
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
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
    // Stop ringtone
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }

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

    // Stop ringtone if playing
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }

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
    setIncomingCaller(null);
    
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
      
      // Ensure chat is opened for the caller
      const caller = users?.find(user => user._id === data.from);
      if (caller) {
        setSelectedUser(caller);
      }
      
      setIncomingCall?.(data.from, data.offer, data.callType);
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
          console.warn("addIceCandidate failed:", error);
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
  }, [socket, setIncomingCall, authUser, users, setSelectedUser]);

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

      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = pc.getSenders().find(s => s.track?.kind === "video");
      
      if (sender) {
        await sender.replaceTrack(videoTrack);
      } else {
        pc.addTrack(videoTrack, screenStream);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

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
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }

      const cameraStream = originalCameraRef.current;
      if (cameraStream) {
        const videoTrack = cameraStream.getVideoTracks()[0];
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = cameraStream;
        }
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

  /* =================================================
     Ensure video elements always get srcObject on update
  ==================================================*/
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      try {
        if (localVideoRef.current.srcObject !== localStream) {
          localVideoRef.current.srcObject = localStream;
        }
      } catch (e) {
        console.warn("Could not attach local stream to video element", e);
      }
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      try {
        if (remoteVideoRef.current.srcObject !== remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      } catch (e) {
        console.warn("Could not attach remote stream to video element", e);
      }
    }
  }, [remoteStream]);

  /* ===========================
        FORMAT CALL DURATION
  ============================ */
  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
                      {selectedUser?.fullName || incomingCaller?.fullName || "Connecting..."}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Phone size={60} className="mx-auto mb-4 opacity-60" />
                    <p className="text-xl">{callStatus}</p>
                    <p className="text-sm opacity-70 mt-2">
                      {selectedUser?.fullName || incomingCaller?.fullName || "Connecting..."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* LOCAL VIDEO — PiP (Only for video calls) */}
          {localStream && callType === "video" && (
            <div className="absolute top-6 right-6 w-52 h-36 bg-black/80 border-2 border-white/20 rounded-xl overflow-hidden shadow-2xl">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
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

        {/* CALL STATUS & DURATION */}
        <div className="absolute top-6 left-6 text-white bg-black/50 px-4 py-2 rounded-full flex items-center gap-4">
          <div className="flex items-center gap-2">
            {callType === 'video' ? <Video size={16} /> : <Phone size={16} />}
            <span>{callStatus}</span>
          </div>
          {isCallActive && callDuration > 0 && (
            <div className="border-l border-white/30 pl-4">
              {formatCallDuration(callDuration)}
            </div>
          )}
        </div>

        {/* INCOMING CALL INFO */}
        {isIncomingCall && incomingCaller && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 text-white text-center bg-black/50 px-6 py-4 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <img
                src={incomingCaller.profilePic || '/boy.png'}
                className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
              />
              <div className="text-left">
                <p className="text-xl font-semibold">{incomingCaller.fullName}</p>
                <p className="text-sm opacity-70 flex items-center gap-1 mt-1">
                  {callType === 'video' ? (
                    <>
                      <Video size={14} />
                      Incoming Video Call
                    </>
                  ) : (
                    <>
                      <Phone size={14} />
                      Incoming Audio Call
                    </>
                  )}
                </p>
                <p className="text-xs opacity-50 mt-2">🔔 Ringing...</p>
              </div>
            </div>
          </div>
        )}

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