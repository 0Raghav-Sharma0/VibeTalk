import React, { useRef, useEffect, useState } from "react";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { X, Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from "lucide-react";

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
    } catch (error) {
      alert("Unable to access camera or microphone.");
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
      } else if (callType === "audio") {
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
    } catch (err) {
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
    } catch (err) {
      resetCallState();
    }
  };

  const rejectCall = () => {
    socket.emit("call-rejected", { callerId: incomingCallFrom });
    resetCallState();
  };

  const endCall = () => {
    const targetUserId = selectedUser?._id || incomingCallFrom;
    if (targetUserId) socket.emit("end-call", { targetUserId });
    cleanupCall();
  };

  const handleRemoteEnd = () => {
    alert("Call ended by the other user.");
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

  const toggleAudio = () => {
    const track = localStream?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsAudioEnabled(track.enabled);
    }
  };

  const toggleVideo = () => {
    const track = localStream?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoEnabled(track.enabled);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) =>
      useVideoCallStore.getState().setIncomingCall(
        data.from,
        data.offer,
        data.callType
      );

    const handleCallAccepted = async (data) => {
      const pc = peerConnectionRef.current;
      if (pc) await pc.setRemoteDescription(data.answer);
      setCallStatus("Connected");
    };

    const handleIceCandidate = async (data) => {
      const pc = peerConnectionRef.current;
      if (pc && data.candidate) await pc.addIceCandidate(data.candidate);
    };

    const handleCallEnded = () => handleRemoteEnd();

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("webrtc-ice-candidate", handleIceCandidate);
    socket.on("call-ended", handleCallEnded);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
      socket.off("call-ended", handleCallEnded);
    };
  }, [socket]);

  useEffect(() => {
    if (isCalling && !isIncomingCall && !isCallActive) startOutgoingCall();
  }, [isCalling, isIncomingCall, isCallActive]);

  useEffect(() => () => cleanupCall(), []);

  if (!isIncomingCall && !isCallActive && !isCalling) return null;

  return (
    <div className="fixed inset-0 bg-base-300 text-base-content z-50 flex items-center justify-center transition-colors duration-500">
      <div className="relative w-full h-full flex">
        <div className="flex-1 bg-base-200 flex items-center justify-center">
          {remoteStream ? (
            callType === "video" ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-xl font-semibold">🎧 Audio Call Connected</div>
            )
          ) : (
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                {callType === "video" ? <Video size={48} /> : <Phone size={48} />}
              </div>
              <p className="text-lg font-medium">{callStatus}</p>
            </div>
          )}
        </div>

        {localStream && callType === "video" && (
          <div className="absolute top-4 right-4 w-48 h-36 bg-base-100 border-2 border-base-300 rounded-lg overflow-hidden shadow-lg">
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

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
        {isIncomingCall ? (
          <>
            <button
              onClick={rejectCall}
              className="btn btn-error btn-circle text-error-content"
            >
              <PhoneOff size={24} />
            </button>
            <button
              onClick={acceptCall}
              className="btn btn-success btn-circle text-success-content"
            >
              <Phone size={24} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={toggleAudio}
              className={`btn btn-circle ${
                isAudioEnabled ? "btn-neutral" : "btn-error"
              }`}
            >
              {isAudioEnabled ? <Mic /> : <MicOff />}
            </button>
            {callType === "video" && (
              <button
                onClick={toggleVideo}
                className={`btn btn-circle ${
                  isVideoEnabled ? "btn-neutral" : "btn-error"
                }`}
              >
                {isVideoEnabled ? <Video /> : <VideoOff />}
              </button>
            )}
            <button
              onClick={endCall}
              className="btn btn-error btn-circle text-error-content"
            >
              <PhoneOff size={24} />
            </button>
          </>
        )}
      </div>

      <button
        onClick={endCall}
        className="absolute top-4 right-4 text-base-content hover:opacity-80"
      >
        <X size={24} />
      </button>
    </div>
  );
};

export default VideoCall;
