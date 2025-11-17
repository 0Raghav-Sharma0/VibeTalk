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
  const endRef = useRef(null);

  const sharedRoomId =
    selectedUser?._id && authUser?._id
      ? [authUser._id, selectedUser._id].sort().join("_")
      : null;

  // Load messages on user select
  useEffect(() => {
    if (!selectedUser?._id) return;
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser?._id]);

  // Auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {isMessagesLoading ? (
            <div className="flex items-center justify-center h-full">
              Loading messages…
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg._id}
                msg={msg}
                isMine={msg.senderId === authUser._id}
                selectedUser={selectedUser}
                authUser={authUser}
              />
            ))
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-base-300 bg-base-100 px-3 py-2">
          <MessageInput />
        </div>
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
          className="absolute top-3 right-3 bg-base-300 p-2 rounded-full"
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
          className="absolute top-3 right-3 bg-base-300 p-2 rounded-full"
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
