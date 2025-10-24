import React from "react";
import { useChatStore } from "../store/useChatStore";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useMusicStore } from "../store/musicStore";
import { Phone, Video, Music2, X } from "lucide-react";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { startCall } = useVideoCallStore();
  const { toggleMusicPlayer } = useMusicStore();

  if (!selectedUser) return null;

  return (
    <div className="flex items-center justify-between px-5 py-3 bg-base-200/70 border-b border-base-300 backdrop-blur-xl shadow-sm">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={selectedUser.profilePic || "/boy.png"}
            className="size-10 rounded-full border border-base-300"
          />
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-base-200 ${
              selectedUser.isOnline ? "bg-green-500" : "bg-gray-500"
            }`}
          />
        </div>
        <div>
          <h2 className="font-semibold">{selectedUser.fullName}</h2>
          <p
            className={`text-xs ${
              selectedUser.isOnline ? "text-green-400" : "text-gray-400"
            }`}
          >
            {selectedUser.isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => startCall("audio", selectedUser._id)}
          className="btn btn-circle btn-sm bg-base-300 hover:bg-green-500/20"
          title="Voice Call"
        >
          <Phone size={18} className="text-green-400" />
        </button>
        <button
          onClick={() => startCall("video", selectedUser._id)}
          className="btn btn-circle btn-sm bg-base-300 hover:bg-blue-500/20"
          title="Video Call"
        >
          <Video size={18} className="text-blue-400" />
        </button>
        <button
          onClick={toggleMusicPlayer}
          className="btn btn-circle btn-sm bg-base-300 hover:bg-pink-500/20"
          title="Toggle Music"
        >
          <Music2 size={18} className="text-pink-400" />
        </button>
        <button
          onClick={() => setSelectedUser(null)}
          className="btn btn-circle btn-sm bg-base-300 hover:bg-base-100"
          title="Close Chat"
        >
          <X size={18} className="text-base-content/70" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
