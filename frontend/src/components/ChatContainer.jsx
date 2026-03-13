import React, { useState, useCallback } from "react";
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
import ChatMessagesList from "./ChatMessagesList";

export default function ChatContainer() {
  const {
    messages,
    selectedUser,
    setSelectedUser,
    loadOlderMessages,
    isLoadingOlder,
    hasMoreMessages,
    messagesNextCursor,
    isMessagesLoading,
  } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const { startCall } = useVideoCallStore();
  const { isMusicPlayerOpen, toggleMusicPlayer } = useMusicStore();

  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadOlder = useCallback(() => {
    if (selectedUser && messagesNextCursor && hasMoreMessages && !isLoadingOlder) {
      loadOlderMessages(selectedUser._id);
    }
  }, [selectedUser, messagesNextCursor, hasMoreMessages, isLoadingOlder, loadOlderMessages]);

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

  /* ================= EMPTY ================= */
  if (!selectedUser) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark-mode-bg">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-base-200 flex items-center justify-center mx-auto mb-4 text-3xl">
            💬
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Welcome to Chat
          </h3>
          <p className="text-gray-600 dark:text-white/70">
            Select a conversation to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-white dark-mode-bg">

      {/* ================= HEADER - sticky on mobile so call buttons stay visible ================= */}
      <div className="flex-shrink-0 sticky top-0 z-10 px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-transparent flex items-center justify-between bg-white dark-mode-bg dark:border-white/8">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={() => setSelectedUser(null)}
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-base-200 shrink-0"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="relative shrink-0">
            <img
              src={selectedUser.profilePic || "/boy.png"}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl object-cover border border-transparent"
            />
            <div
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-transparent ${
                selectedUser.isOnline ? "bg-violet-500" : "bg-gray-400"
              }`}
            />
          </div>

          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base">
              {selectedUser.fullName}
            </h2>
            <p className="text-xs text-gray-600 dark:text-white/70">
              {selectedUser.isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 sm:p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
          >
            <Search size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>

          <button
            onClick={handleAudioCall}
            className="p-2 sm:p-2.5 rounded-lg bg-violet-500/15 text-violet-600 hover:bg-violet-500/25 dark:bg-white/10 dark:text-[#b29bff] dark:hover:bg-white/20 transition-all"
          >
            <Phone size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>

          <button
            onClick={handleVideoCall}
            className="p-2 sm:p-2.5 rounded-lg bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 dark:bg-white/10 dark:text-[#b29bff] dark:hover:bg-white/20 transition-all"
          >
            <Video size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>

          <button
            onClick={() => setShowWhiteboard(true)}
            className="p-2 sm:p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
          >
            <Pencil size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>

          <button
            onClick={() => toggleMusicPlayer(true)}
            className="p-2 sm:p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
          >
            <Music2 size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
      </div>

      {/* ================= SEARCH ================= */}
      {showSearch && (
        <div className="flex-shrink-0 px-3 sm:px-5 py-3.5 border-b border-transparent bg-white dark-mode-bg dark:border-white/8">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full px-4 py-2 bg-gray-50 dark:bg-white/10 dark:text-white dark:placeholder-white/50 border border-transparent rounded-lg focus:outline-none"
            autoFocus
          />
        </div>
      )}

      {/* ================= MESSAGES - virtualized, infinite scroll, WhatsApp-style ================= */}
        <div className="flex-1 min-h-0 flex flex-col bg-white dark-mode-bg">
          {messages.length === 0 && !searchQuery ? (
            <div className="flex-1 flex items-center justify-center">
              {isMessagesLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-500 dark:text-white/50">Loading messages...</span>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-white/50">No messages yet</p>
              )}
            </div>
          ) : (
            <ChatMessagesList
              messages={messages}
              authUser={authUser}
              selectedUser={selectedUser}
              onLoadOlder={loadOlder}
              isLoadingOlder={isLoadingOlder}
              hasMore={!!(hasMoreMessages && messagesNextCursor)}
              searchQuery={searchQuery}
            />
          )}
        </div>

      {/* ================= INPUT - fixed at bottom, stays visible on mobile when keyboard opens ================= */}
      <div className="flex-shrink-0 w-full chat-input-wrapper">
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
              className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-white dark:bg-black border-l border-transparent z-50 overflow-hidden flex flex-col"
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
              className="fixed right-0 top-0 h-full w-full md:w-[400px] bg-white dark:bg-black border-l border-transparent z-50"
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
