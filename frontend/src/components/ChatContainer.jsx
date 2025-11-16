// src/components/ChatContainer.jsx
import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useMusicStore } from "../store/musicStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MusicPlayer from "./MusicPlayer";
import Whiteboard from "./Whiteboard";
import { X } from "lucide-react";
import { formatMessageTime } from "../lib/utils";

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

  // Load messages
  useEffect(() => {
    if (!selectedUser?._id) return;
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser?._id]);

  // Autoscroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="relative flex h-full bg-base-200 text-base-content overflow-hidden">

      {/* LEFT CHAT SECTION */}
      <div
        className={`flex flex-col flex-grow h-full border-r border-base-300
          ${(showWhiteboard || isMusicPlayerOpen) ? "md:w-[68%]" : "w-full"}
        `}
      >
        <ChatHeader
          showWhiteboard={showWhiteboard}
          setShowWhiteboard={setShowWhiteboard}
          openMusic={() => toggleMusicPlayer(true)}
        />

        {/* MESSAGE LIST */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-base-300">
          {isMessagesLoading ? (
            <div className="flex items-center justify-center h-full text-base-content/50 text-lg">
              Loading messages…
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center select-none">
              <h2 className="text-lg font-semibold text-base-content/80">
                Start the conversation
              </h2>
              <p className="text-base-content/50 mt-1">Say something to begin.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === authUser._id;

              return (
                <div
                  key={msg._id}
                  className={`flex items-start gap-3 ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`w-9 h-9 rounded-full overflow-hidden border border-base-300
                      ${isMine ? "order-2" : "order-1"}`}
                  >
                    <img
                      src={
                        isMine
                          ? authUser.profilePic || "/boy.png"
                          : selectedUser?.profilePic || "/boy.png"
                      }
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Bubble */}
                  <div
                    className={`flex flex-col max-w-[70%]
                      ${isMine ? "items-end order-1" : "items-start order-2"}`}
                  >
                    <span className="text-xs text-base-content/60 mb-1">
                      {formatMessageTime(msg.createdAt)}
                    </span>

                    <div
                      className={`px-4 py-2 rounded-xl border border-base-300 shadow-sm
                        ${isMine ? "bg-primary text-primary-content" : "bg-base-100"}`}
                    >
                      {msg.text && <p>{msg.text}</p>}
                      {msg.image && (
                        <img
                          src={msg.image}
                          className="mt-3 rounded-lg max-w-[240px] border border-base-300 cursor-pointer"
                          onClick={() => window.open(msg.image, "_blank")}
                        />
                      )}
                      {msg.video && (
                        <video
                          controls
                          className="mt-3 rounded-lg max-w-[260px] border border-base-300"
                        >
                          <source src={msg.video} />
                        </video>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        {/* INPUT BAR */}
        <div className="border-t border-base-300 bg-base-100 px-3 py-2">
          <MessageInput />
        </div>
      </div>

      {/* ===================================== */}
      {/* WHITEBOARD SLIDER PANEL              */}
      {/* ===================================== */}
      <div
        className={`
          fixed inset-y-0 right-0 w-[85%] max-w-sm bg-base-100 border-l border-base-300 z-40
          transform transition-transform duration-300 ease-in-out
          ${showWhiteboard ? "translate-x-0" : "translate-x-full"}
          md:static md:translate-x-0 md:w-[32%]
        `}
      >
        <button
          className="absolute top-3 right-3 bg-base-300 p-2 rounded-full border border-base-400"
          onClick={() => setShowWhiteboard(false)}
        >
          <X size={18} />
        </button>

        <Whiteboard roomId={sharedRoomId} />
      </div>

      {/* MOBILE OVERLAY FOR WHITEBOARD */}
      {showWhiteboard && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setShowWhiteboard(false)}
        />
      )}

      {/* ===================================== */}
      {/* MUSICPLAYER SLIDER PANEL             */}
      {/* ===================================== */}
      <div
        className={`
          fixed inset-y-0 right-0 w-[85%] max-w-sm bg-base-100 border-l border-base-300 z-40
          transform transition-transform duration-300 ease-in-out
          ${isMusicPlayerOpen ? "translate-x-0" : "translate-x-full"}
          md:static md:translate-x-0 md:w-[32%]
        `}
      >
        <button
          className="absolute top-3 right-3 bg-base-300 p-2 rounded-full border border-base-400"
          onClick={() => toggleMusicPlayer(false)}
        >
          <X size={18} />
        </button>

        <MusicPlayer roomId={sharedRoomId} />
      </div>

      {/* MOBILE OVERLAY FOR MUSIC */}
      {isMusicPlayerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => toggleMusicPlayer(false)}
        />
      )}
    </div>
  );
}
