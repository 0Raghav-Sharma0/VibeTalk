// src/components/ChatContainer.jsx
import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useMusicStore } from "../store/musicStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MusicPlayer from "./MusicPlayer";
import Whiteboard from "./Whiteboard";
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
  const { isMusicPlayerOpen } = useMusicStore();

  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const endRef = useRef(null);

  const sharedRoomId =
    selectedUser?._id && authUser?._id
      ? [authUser._id, selectedUser._id].sort().join("_")
      : null;

  useEffect(() => {
    if (!selectedUser?._id) return;

    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser?._id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="relative flex h-[100dvh] bg-base-200 text-base-content overflow-hidden">
      {/* LEFT CHAT SECTION */}
      <div
        className={`flex flex-col flex-grow h-full border-r border-base-300 ${
          isMusicPlayerOpen || showWhiteboard ? "w-[68%]" : "w-full"
        }`}
      >
        <ChatHeader
          showWhiteboard={showWhiteboard}
          setShowWhiteboard={setShowWhiteboard}
        />

        {/* MESSAGES */}
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
                  className={`flex items-start gap-3 ${
                    isMine ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-full overflow-hidden border border-base-300 ${
                      isMine ? "order-2" : "order-1"
                    }`}
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

                  {/* Text / Media */}
                  <div
                    className={`flex flex-col max-w-[70%] ${
                      isMine ? "items-end order-1" : "items-start order-2"
                    }`}
                  >
                    <span className="text-xs text-base-content/60 mb-1">
                      {formatMessageTime(msg.createdAt)}
                    </span>

                    <div
                      className={`px-4 py-2 rounded-xl border border-base-300 shadow-sm ${
                        isMine ? "bg-primary text-primary-content" : "bg-base-100"
                      }`}
                    >
                      {msg.text && <p>{msg.text}</p>}

                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="sent"
                          onClick={() => window.open(msg.image, "_blank")}
                          className="mt-3 rounded-lg max-w-[240px] cursor-pointer border border-base-300"
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

        {/* ⭐ FIXED RESPONSIVE INPUT BAR */}
        <div className="border-t border-base-300 bg-base-100 px-3 py-2">
          <MessageInput />
        </div>
      </div>

      {/* RIGHT MUSIC SIDEBAR */}
      {isMusicPlayerOpen && !showWhiteboard && (
        <div className="w-[32%] border-l border-base-300 bg-base-100">
          <MusicPlayer roomId={sharedRoomId} />
        </div>
      )}

      {/* RIGHT WHITEBOARD SIDEBAR */}
      {showWhiteboard && (
        <div className="w-[32%] border-l border-base-300 bg-base-100">
          <Whiteboard roomId={sharedRoomId} />
        </div>
      )}
    </div>
  );
}
