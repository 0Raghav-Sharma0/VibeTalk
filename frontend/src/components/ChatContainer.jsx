// src/components/ChatContainer.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Video,
  Music2,
  Pencil,
  Search,
  ChevronLeft,
  MoreVertical,
} from "lucide-react";

import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useMusicStore } from "../store/musicStore";

import MessageInput from "./MessageInput";
import MusicPlayer from "./MusicPlayer";
import Whiteboard from "./Whiteboard";
import MessageBubble from "./MessageBubble";

export default function ChatContainer() {
  const {
    messages,
    selectedUser,
    setSelectedUser,
  } = useChatStore();

  const { authUser, socket } = useAuthStore();
  const { startCall } = useVideoCallStore();
  const { isMusicPlayerOpen, toggleMusicPlayer } = useMusicStore();

  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  const endRef = useRef(null);

  // Whiteboard room ID
  const whiteboardRoomId = React.useMemo(() => {
    if (!authUser || !selectedUser) return null;
    return [authUser._id, selectedUser._id].sort().join("_");
  }, [authUser, selectedUser]);

  // Start audio call
  const handleAudioCall = useCallback(() => {
    if (!authUser || !selectedUser || !socket) {
      console.error("Missing user data or socket");
      return;
    }

    console.log("🔊 Starting audio call to:", selectedUser._id);
    startCall("audio", selectedUser._id);
    
    socket.emit("call-initiate", {
      to: selectedUser._id,
      type: "audio",
      callerName: authUser.fullName
    });
  }, [authUser, selectedUser, socket, startCall]);

  // Start video call
  const handleVideoCall = useCallback(() => {
    if (!authUser || !selectedUser || !socket) {
      console.error("Missing user data or socket");
      return;
    }

    console.log("🎥 Starting video call to:", selectedUser._id);
    startCall("video", selectedUser._id);
    
    socket.emit("call-initiate", {
      to: selectedUser._id,
      type: "video",
      callerName: authUser.fullName
    });
  }, [authUser, selectedUser, socket, startCall]);

  // Scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Filter messages for search
  const filteredMessages = React.useMemo(() => {
    if (!searchQuery) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      m =>
        m.text?.toLowerCase().includes(q) ||
        m.file?.name?.toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  // Empty state
  if (!selectedUser) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-base-100 p-4">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-4">
            <div className="text-4xl">👋</div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Welcome to Chat</h3>
          <p className="text-base-content/60">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-base-100">
      {/* Header */}
      <div className="border-b border-base-300 bg-base-100 px-4 py-3 flex items-center justify-between">
        {/* User Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedUser(null)}
            className="md:hidden p-2 rounded-lg hover:bg-base-200"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="relative">
            <img
              src={selectedUser.profilePic || "/boy.png"}
              className="w-12 h-12 rounded-xl object-cover border-2 border-primary/20"
              alt={selectedUser.fullName}
            />
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-base-100 ${
              selectedUser.isOnline ? "bg-green-500" : "bg-gray-400"
            }`} />
          </div>
          
          <div>
            <h2 className="font-bold text-base">{selectedUser.fullName}</h2>
            <p className="text-xs text-base-content/60">
              {selectedUser.isOnline ? "Online" : "Last seen recently"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2.5 rounded-lg hover:bg-base-200 transition-colors"
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          <button
            onClick={handleAudioCall}
            className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
            aria-label="Audio call"
          >
            <Phone size={18} />
          </button>

          <button
            onClick={handleVideoCall}
            className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
            aria-label="Video call"
          >
            <Video size={18} />
          </button>

          <button
            onClick={() => setShowWhiteboard(true)}
            className="p-2.5 rounded-lg hover:bg-base-200 transition-colors"
            aria-label="Whiteboard"
          >
            <Pencil size={18} />
          </button>

          <button
            onClick={() => toggleMusicPlayer(!isMusicPlayerOpen)}
            className="p-2.5 rounded-lg hover:bg-base-200 transition-colors"
            aria-label="Music player"
          >
            <Music2 size={18} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2.5 rounded-lg hover:bg-base-200 transition-colors"
              aria-label="More options"
            >
              <MoreVertical size={18} />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  className="absolute right-0 top-full mt-2 w-48 bg-base-100 border border-base-300 rounded-xl shadow-lg z-10"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="p-2">
                    <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-base-200 text-sm">
                      View Profile
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-base-200 text-sm">
                      Clear Chat
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-base-200 text-sm text-red-500">
                      Block User
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-4 py-3 border-b border-base-300">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-2 bg-base-200 border border-base-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-3">
                <div className="text-2xl">💬</div>
              </div>
              <p className="text-base-content/60">No messages yet</p>
              <p className="text-sm text-base-content/40 mt-1">Say hello to start the conversation!</p>
            </div>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <MessageBubble
              key={msg._id}
              msg={msg}
              isMine={msg.senderId === authUser._id}
              authUser={authUser}
              selectedUser={selectedUser}
            />
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-base-300 bg-base-100">
        <MessageInput />
      </div>

      {/* Whiteboard Sidebar */}
      <AnimatePresence>
        {showWhiteboard && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setShowWhiteboard(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-base-100 border-l border-base-300 z-50"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
            >
              <Whiteboard roomId={whiteboardRoomId} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Music Player Sidebar */}
      <AnimatePresence>
        {isMusicPlayerOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => toggleMusicPlayer(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="fixed right-0 top-0 h-full w-full md:w-[400px] bg-base-100 border-l border-base-300 z-50"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
            >
              <MusicPlayer roomId={whiteboardRoomId}/>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}