// src/components/ChatContainer.jsx
import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useMusicStore } from "../store/musicStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MusicPlayer from "./MusicPlayer";
import Whiteboard from "./Whiteboard";
import MessageBubble from "./MessageBubble";
import { X } from "lucide-react";

export default function ChatContainer() {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const { isMusicPlayerOpen, toggleMusicPlayer } = useMusicStore();

  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [hasError, setHasError] = useState(false);
  const endRef = useRef(null);

  const sharedRoomId =
    selectedUser?._id && authUser?._id
      ? [authUser._id, selectedUser._id].sort().join("_")
      : null;

  // Load messages when user changes
  useEffect(() => {
    console.log(
      "🎯 ChatContainer useEffect - selectedUser:",
      selectedUser?._id
    );

    if (!selectedUser?._id) {
      console.log("⏸️ No user selected, skipping message load");
      return;
    }

    // 🟢 FIX: use fullName instead of name
    console.log("🚀 Loading messages for:", selectedUser.fullName);

    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => {
      console.log("🧹 Cleaning up chat container");
      unsubscribeFromMessages();
    };
  }, [selectedUser?._id]);

  // Auto-scroll
  useEffect(() => {
    if (messages.length > 0) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Reset error on user change
  useEffect(() => {
    setHasError(false);
  }, [selectedUser?._id]);

  return (
    <div className="relative h-full bg-base-200 text-base-content overflow-hidden">
      {/* ===================== MAIN CHAT AREA ===================== */}
      <div className="flex flex-col h-full">
        <ChatHeader
          showWhiteboard={showWhiteboard}
          setShowWhiteboard={setShowWhiteboard}
          openMusic={() => {
            setShowWhiteboard(false);
            toggleMusicPlayer(true);
          }}
        />

        {/* MESSAGES AREA */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {!selectedUser ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <div className="text-lg mb-2">Select a conversation</div>
                <div className="text-sm">Choose a user to start chatting</div>
              </div>
            </div>
          ) : isMessagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                <div className="text-gray-600">Loading messages...</div>

                {/* 🟢 FIX: use fullName instead of name */}
                <div className="text-xs text-gray-400 mt-1">
                  with {selectedUser.fullName}
                </div>
              </div>
            </div>
          ) : hasError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-500">
                <div className="text-lg mb-2">Failed to load messages</div>
                <button
                  onClick={() => getMessages(selectedUser._id)}
                  className="btn btn-sm btn-outline mt-2"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <div className="text-lg mb-2">No messages yet</div>
                <div className="text-sm">
                  Say hello to start the conversation!
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg._id}
                  msg={msg}
                  isMine={msg.senderId === authUser._id}
                  selectedUser={selectedUser}
                  authUser={authUser}
                />
              ))}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {/* MESSAGE INPUT */}
        {selectedUser && (
          <div className="border-t border-base-300 bg-base-100 px-3 py-2">
            <MessageInput />
          </div>
        )}
      </div>

      {/* ===================== WHITEBOARD SLIDE ===================== */}
      <div
        className={`
          fixed top-0 right-0 h-full w-[85%] max-w-sm bg-base-100
          border-l border-base-300 z-50
          transform transition-transform duration-300
          ${showWhiteboard ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <button
          className="absolute top-3 right-3 bg-base-300 p-2 rounded-full z-10"
          onClick={() => setShowWhiteboard(false)}
        >
          <X size={18} />
        </button>

        <div className="h-full overflow-hidden">
          <Whiteboard roomId={sharedRoomId} />
        </div>
      </div>

      {showWhiteboard && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setShowWhiteboard(false)}
        />
      )}

      {/* ===================== MUSIC PLAYER SLIDE ===================== */}
      <div
        className={`
          fixed top-0 right-0 h-full w-[85%] max-w-sm bg-base-100
          border-l border-base-300 z-50
          transform transition-transform duration-300
          ${isMusicPlayerOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <button
          className="absolute top-3 right-3 bg-base-300 p-2 rounded-full z-10"
          onClick={() => toggleMusicPlayer(false)}
        >
          <X size={18} />
        </button>

        <div className="h-full overflow-hidden">
          <MusicPlayer roomId={sharedRoomId} />
        </div>
      </div>

      {isMusicPlayerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => toggleMusicPlayer(false)}
        />
      )}
    </div>
  );
}
