import React from "react";
import { Phone, Video, Music2, Pencil, X } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useAuthStore } from "../store/useAuthStore";
import { useMusicStore } from "../store/musicStore";

const ChatHeader = ({ showWhiteboard, setShowWhiteboard }) => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { startCall } = useVideoCallStore();
  const { socket, authUser } = useAuthStore();
  const { toggleMusicPlayer, isMusicPlayerOpen } = useMusicStore();

  if (!selectedUser) return null;

  const handleAudioCall = () => {
    if (!socket || !authUser) return;
    socket.emit("call-initiated", {
      from: authUser._id,
      to: selectedUser._id,
      callType: "audio",
      callerName: authUser.fullName,
    });
    startCall("audio", selectedUser._id);
  };

  const handleVideoCall = () => {
    if (!socket || !authUser) return;
    socket.emit("call-initiated", {
      from: authUser._id,
      to: selectedUser._id,
      callType: "video",
      callerName: authUser.fullName,
    });
    startCall("video", selectedUser._id);
  };

  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-transparent bg-base-100">
      
      {/* LEFT */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-transparent">
            <img
              src={selectedUser.profilePic || "/boy.png"}
              alt={selectedUser.fullName}
              className="w-full h-full object-cover"
            />
          </div>

          <span
            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-transparent ${
              selectedUser.isOnline ? "bg-success" : "bg-gray-400"
            }`}
          />
        </div>

        {/* User Info */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-base-content">
            {selectedUser.fullName}
          </h2>
          <p
            className={`text-sm ${
              selectedUser.isOnline
                ? "text-success"
                : "text-gray-500 dark:text-base-content/60"
            }`}
          >
            {selectedUser.isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">

        {/* Audio */}
        <button
          onClick={handleAudioCall}
          title="Audio Call"
          className="p-3 rounded-xl border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 transition"
        >
          <Phone size={18} />
        </button>

        {/* Video */}
        <button
          onClick={handleVideoCall}
          title="Video Call"
          className="p-3 rounded-xl border border-blue-500/30 text-blue-600 hover:bg-blue-500/10 transition"
        >
          <Video size={18} />
        </button>

        {/* Music */}
        <button
          onClick={() => {
            if (showWhiteboard) setShowWhiteboard(false);
            toggleMusicPlayer();
          }}
          title="Music Player"
          className={`p-3 rounded-xl transition ${
            isMusicPlayerOpen
              ? "bg-pink-500 text-white"
              : "bg-gray-100 dark:bg-base-200 hover:bg-gray-200 dark:hover:bg-base-300 text-gray-700 dark:text-base-content"
          }`}
        >
          <Music2 size={18} />
        </button>

        {/* Whiteboard */}
        <button
          onClick={() => {
            if (isMusicPlayerOpen) toggleMusicPlayer();
            setShowWhiteboard(!showWhiteboard);
          }}
          title="Whiteboard"
          className={`p-3 rounded-xl transition ${
            showWhiteboard
              ? "bg-purple-500 text-white"
              : "bg-gray-100 dark:bg-base-200 hover:bg-gray-200 dark:hover:bg-base-300 text-gray-700 dark:text-base-content"
          }`}
        >
          <Pencil size={18} />
        </button>

        {/* Close */}
        <button
          onClick={() => setSelectedUser(null)}
          title="Close Chat"
          className="p-3 rounded-xl bg-gray-100 dark:bg-base-200 hover:bg-gray-200 dark:hover:bg-base-300 text-gray-700 dark:text-base-content transition"
        >
          <X size={18} />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
