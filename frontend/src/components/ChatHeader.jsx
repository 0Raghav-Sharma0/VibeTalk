// src/components/ChatHeader.jsx - CLEAN WITH CALL BUTTONS
import React from "react";
import { Phone, Video, Music2, Pencil, X, } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useAuthStore } from "../store/useAuthStore";
import { useMusicStore } from "../store/musicStore";

const ChatHeader = ({ showWhiteboard, setShowWhiteboard }) => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { startCall } = useVideoCallStore();
  const { socket, authUser } = useAuthStore();
  const { toggleMusicPlayer, isMusicPlayerOpen } = useMusicStore();

  const handleAudioCall = () => {
    if (!selectedUser || !socket || !authUser) return;

    console.log("📞 Initiating audio call to:", selectedUser._id);
    
    socket.emit("call-initiated", {
      from: authUser._id,
      to: selectedUser._id,
      callType: "audio",
      callerName: authUser.fullName,
    });

    startCall("audio", selectedUser._id);
  };

  const handleVideoCall = () => {
    if (!selectedUser || !socket || !authUser) return;

    console.log("📹 Initiating video call to:", selectedUser._id);
    
    socket.emit("call-initiated", {
      from: authUser._id,
      to: selectedUser._id,
      callType: "video",
      callerName: authUser.fullName,
    });

    startCall("video", selectedUser._id);
  };

  if (!selectedUser) return null;

  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-base-300 bg-base-100">
      
      {/* LEFT: User Info */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-primary/30">
            <img
              src={selectedUser.profilePic || '/boy.png'}
              className="w-full h-full object-cover"
              alt={selectedUser.fullName}
            />
          </div>
          
          {/* Online Status */}
          <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-base-100 ${
            selectedUser.isOnline ? "bg-emerald-500" : "bg-gray-400"
          }`} />
        </div>

        {/* User Details */}
        <div>
          <h2 className="font-bold text-base-content text-lg">
            {selectedUser.fullName}
          </h2>
          <p className={`text-sm ${selectedUser.isOnline ? "text-emerald-500" : "text-base-content/60"}`}>
            {selectedUser.isOnline ? "🟢 Online" : "⚫ Offline"}
          </p>
        </div>
      </div>

      {/* RIGHT: Action Buttons */}
      <div className="flex items-center gap-2">
        
        {/* Audio Call Button */}
        <button
          onClick={handleAudioCall}
          title="Audio Call"
          className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
        >
          <Phone size={18} />
        </button>

        {/* Video Call Button */}
        <button
          onClick={handleVideoCall}
          title="Video Call"
          className="p-3 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
        >
          <Video size={18} />
        </button>

        {/* Music Player Button */}
        <button
          onClick={() => {
            if (showWhiteboard) setShowWhiteboard(false);
            toggleMusicPlayer();
          }}
          title="Music Player"
          className={`p-3 rounded-xl transition-colors ${
            isMusicPlayerOpen 
              ? "bg-pink-500 text-white" 
              : "bg-base-200 hover:bg-base-300 text-base-content/70"
          }`}
        >
          <Music2 size={18} />
        </button>

        {/* Whiteboard Button */}
        <button
          onClick={() => {
            if (isMusicPlayerOpen) toggleMusicPlayer();
            setShowWhiteboard(!showWhiteboard);
          }}
          title="Whiteboard"
          className={`p-3 rounded-xl transition-colors ${
            showWhiteboard 
              ? "bg-purple-500 text-white" 
              : "bg-base-200 hover:bg-base-300 text-base-content/70"
          }`}
        >
          <Pencil size={18} />
        </button>

        {/* Close Chat Button */}
        <button
          onClick={() => setSelectedUser(null)}
          title="Close Chat"
          className="p-3 rounded-xl bg-base-200 hover:bg-base-300 text-base-content/70 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;