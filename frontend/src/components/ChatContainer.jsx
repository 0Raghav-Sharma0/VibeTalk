import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Video,
  Music2,
  Pencil,
  Search,
  ChevronLeft,
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
  const { messages, selectedUser, setSelectedUser } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const { startCall } = useVideoCallStore();
  const { isMusicPlayerOpen, toggleMusicPlayer } = useMusicStore();

  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const endRef = useRef(null);

  /* ================= ROOM ID ================= */
  const roomId = React.useMemo(() => {
    if (!authUser || !selectedUser) return null;
    return [authUser._id, selectedUser._id].sort().join("_");
  }, [authUser, selectedUser]);

  /* ================= CALLS ================= */
  const handleAudioCall = useCallback(() => {
    if (!authUser || !selectedUser || !socket) return;
    startCall("audio", selectedUser._id);
    socket.emit("call-initiate", {
      to: selectedUser._id,
      type: "audio",
      callerName: authUser.fullName,
    });
  }, [authUser, selectedUser, socket, startCall]);

  const handleVideoCall = useCallback(() => {
    if (!authUser || !selectedUser || !socket) return;
    startCall("video", selectedUser._id);
    socket.emit("call-initiate", {
      to: selectedUser._id,
      type: "video",
      callerName: authUser.fullName,
    });
  }, [authUser, selectedUser, socket, startCall]);

  /* ================= AUTOSCROLL ================= */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  /* ================= SEARCH ================= */
  const filteredMessages = React.useMemo(() => {
    if (!searchQuery) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.text?.toLowerCase().includes(q) ||
        m.file?.name?.toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  /* ================= EMPTY ================= */
  if (!selectedUser) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-base-100">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-base-200 flex items-center justify-center mx-auto mb-4 text-3xl">
            💬
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-base-content">
            Welcome to Chat
          </h3>
          <p className="text-gray-600 dark:text-base-content/60">
            Select a conversation to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-base-100">

      {/* ================= HEADER ================= */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-base-300 flex items-center justify-between bg-white dark:bg-base-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedUser(null)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-base-200"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="relative">
            <img
              src={selectedUser.profilePic || "/boy.png"}
              className="w-11 h-11 rounded-xl object-cover border border-gray-300 dark:border-primary/20"
            />
            <div
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-base-100 ${
                selectedUser.isOnline ? "bg-emerald-500" : "bg-gray-400"
              }`}
            />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 dark:text-base-content">
              {selectedUser.fullName}
            </h2>
            <p className="text-xs text-gray-600 dark:text-base-content/60">
              {selectedUser.isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-base-200"
          >
            <Search size={18} />
          </button>

          <button
            onClick={handleAudioCall}
            className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25"
          >
            <Phone size={18} />
          </button>

          <button
            onClick={handleVideoCall}
            className="p-2.5 rounded-lg bg-blue-500/15 text-blue-600 hover:bg-blue-500/25"
          >
            <Video size={18} />
          </button>

          <button
            onClick={() => setShowWhiteboard(true)}
            className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-base-200"
          >
            <Pencil size={18} />
          </button>

          <button
            onClick={() => toggleMusicPlayer(true)}
            className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-base-200"
          >
            <Music2 size={18} />
          </button>
        </div>
      </div>

      {/* ================= SEARCH ================= */}
      {showSearch && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-base-300 bg-white dark:bg-base-100">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full px-4 py-2 bg-gray-50 dark:bg-base-200 border border-gray-300 dark:border-base-300 rounded-lg focus:outline-none"
            autoFocus
          />
        </div>
      )}

      {/* ================= MESSAGES ================= */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-white dark:bg-base-100">
        {filteredMessages.map((msg) => (
          <MessageBubble
            key={msg._id}
            msg={msg}
            isMine={msg.senderId === authUser._id}
            authUser={authUser}
            selectedUser={selectedUser}
          />
        ))}
        <div ref={endRef} />
      </div>

      {/* ================= INPUT ================= */}
      <div className="border-t border-gray-200 dark:border-base-300 bg-white dark:bg-base-100">
        <MessageInput />
      </div>

      {/* ================= WHITEBOARD ================= */}
      <AnimatePresence>
        {showWhiteboard && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowWhiteboard(false)}
            />
            <motion.div
              className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-white dark:bg-base-100 border-l z-50"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
            >
              <Whiteboard roomId={roomId} onClose={() => setShowWhiteboard(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ================= MUSIC ================= */}
      <AnimatePresence>
        {isMusicPlayerOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => toggleMusicPlayer(false)}
            />
            <motion.div
              className="fixed right-0 top-0 h-full w-full md:w-[400px] bg-white dark:bg-base-100 border-l z-50"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
            >
              <MusicPlayer roomId={roomId} onClose={() => toggleMusicPlayer(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
