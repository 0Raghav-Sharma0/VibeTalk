// src/components/ChatHeader.jsx
import React from "react";
import { Phone, Video, Music2, Pencil, X } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useAuthStore } from "../store/useAuthStore"; // ⭐ ADD THIS
import { useMusicStore } from "../store/musicStore";

/* Shared Icon Button */
const IconBtn = ({ onClick, children, title }) => (
  <button
    onClick={onClick}
    title={title}
    className="
      w-9 h-9 flex items-center justify-center 
      rounded-md bg-base-200 border border-base-300 
      text-base-content/70 hover:bg-base-300 hover:text-base-content
      active:scale-95 transition
    "
  >
    {children}
  </button>
);

const ChatHeader = ({ showWhiteboard, setShowWhiteboard }) => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { startCall } = useVideoCallStore();
  const { socket, authUser } = useAuthStore(); // ⭐ ADD THIS
  const { toggleMusicPlayer, isMusicPlayerOpen } = useMusicStore();

  // ⭐ ADD THESE HANDLERS
  const handleAudioCall = () => {
    if (!selectedUser || !socket || !authUser) {
      console.error("❌ Cannot start audio call - missing data");
      return;
    }

    console.log("📞 Initiating audio call to:", selectedUser._id);
    
    // Notify the other user
    socket.emit("call-initiated", {
      from: authUser._id,
      to: selectedUser._id,
      callType: "audio",
      callerName: authUser.fullName,
    });

    // Start local call
    startCall("audio", selectedUser._id);
  };

  const handleVideoCall = () => {
    if (!selectedUser || !socket || !authUser) {
      console.error("❌ Cannot start video call - missing data");
      return;
    }

    console.log("📹 Initiating video call to:", selectedUser._id);
    
    // Notify the other user
    socket.emit("call-initiated", {
      from: authUser._id,
      to: selectedUser._id,
      callType: "video",
      callerName: authUser.fullName,
    });

    // Start local call
    startCall("video", selectedUser._id);
  };

  if (!selectedUser) return null;

  return (
    <header
      className="
        h-14 px-5 flex items-center justify-between 
        border-b border-base-300 bg-base-100
      "
    >
      {/* LEFT: Avatar + Name */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={selectedUser.profilePic || '/boy.png'}
            className="w-10 h-10 rounded-full object-cover border border-base-300"
            alt={selectedUser.fullName}
          />

          {/* ONLINE DOT */}
          <span
            className={`
              absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-base-100
              ${selectedUser.isOnline ? "bg-success" : "bg-neutral"}
            `}
          />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-base-content truncate">
            {selectedUser.fullName}
          </p>
          <p className="text-xs text-base-content/50">
            {selectedUser.isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex items-center gap-2">

        {/* Voice Call - ⭐ UPDATED */}
        <IconBtn
          title="Voice Call"
          onClick={handleAudioCall}
        >
          <Phone size={16} className="text-success" />
        </IconBtn>

        {/* Video Call - ⭐ UPDATED */}
        <IconBtn
          title="Video Call"
          onClick={handleVideoCall}
        >
          <Video size={16} className="text-info" />
        </IconBtn>

        {/* Music Player */}
        <IconBtn
          title="Music Player"
          onClick={() => {
            if (showWhiteboard) setShowWhiteboard(false);
            toggleMusicPlayer();
          }}
        >
          <Music2 size={16} className="text-secondary" />
        </IconBtn>

        {/* Whiteboard */}
        <IconBtn
          title="Whiteboard"
          onClick={() => {
            if (isMusicPlayerOpen) toggleMusicPlayer();
            setShowWhiteboard(!showWhiteboard);
          }}
        >
          <Pencil
            size={16}
            className={showWhiteboard ? "text-primary" : "text-base-content/70"}
          />
        </IconBtn>

        {/* Close Chat */}
        <IconBtn
          title="Close Chat"
          onClick={() => setSelectedUser(null)}
        >
          <X size={17} className="text-base-content/70" />
        </IconBtn>

      </div>
    </header>
  );
};

export default ChatHeader;