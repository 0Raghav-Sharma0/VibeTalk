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
    <header className="h-16 px-6 flex items-center justify-between border-b border-transparent bg-white dark:bg-black dark:border-white/10">
      
      {/* LEFT */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-transparent dark:border-white/20">
            <img
              src={selectedUser.profilePic || "/boy.png"}
              alt={selectedUser.fullName}
              className="w-full h-full object-cover"
            />
          </div>

          <span
            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
              selectedUser.isOnline ? "bg-emerald-500" : "bg-gray-400"
            }`}
          />
        </div>

        {/* User Info */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-violet-400">
            {selectedUser.fullName}
          </h2>
          <p
            className={`text-sm ${
              selectedUser.isOnline
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-gray-500 dark:text-white/70"
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
          className="p-3 rounded-xl border border-violet-500/30 text-violet-600 hover:bg-violet-500/10 dark:border-[#b29bff]/50 dark:text-[#b29bff] dark:hover:bg-white/10 transition"
        >
          <Phone size={18} />
        </button>

        {/* Video */}
        <button
          onClick={handleVideoCall}
          title="Video Call"
          className="p-3 rounded-xl border border-violet-500/30 text-violet-600 hover:bg-violet-500/10 dark:border-[#b29bff]/50 dark:text-[#b29bff] dark:hover:bg-white/10 transition"
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
              : "bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-[#b29bff]"
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
              : "bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-[#b29bff]"
          }`}
        >
          <Pencil size={18} />
        </button>

        {/* Close */}
        <button
          onClick={() => setSelectedUser(null)}
          title="Close Chat"
          className="p-3 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-[#b29bff] transition"
        >
          <X size={18} />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
