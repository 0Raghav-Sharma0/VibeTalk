import React, { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import MusicPlayer from "./MusicPlayer";
import { useMusicStore } from "../store/musicStore";
import { motion } from "framer-motion";

const ChatContainer = () => {
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
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser._id]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="relative flex h-[calc(100vh-4rem)] overflow-hidden bg-base-100 text-base-content transition-all duration-700">
      {/* 🌈 Animated background — outside scroll area */}
      <motion.div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 25% 40%, var(--p, rgba(139,92,246,0.08)), transparent 70%), radial-gradient(circle at 75% 80%, var(--s, rgba(236,72,153,0.08)), transparent 80%)",
        }}
        animate={{
          opacity: [0.4, 0.8, 0.4],
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* 💬 Chat Section */}
      <div
        className={`relative flex flex-col flex-grow h-full border-r border-base-300/40 backdrop-blur-2xl transition-all duration-500 ${
          isMusicPlayerOpen ? "w-[68%]" : "w-full"
        }`}
      >
        <ChatHeader />

        {/* 🧊 Scrollable Message Area */}
        <div
          className="
            flex-1 overflow-y-auto px-6 py-5 space-y-5 
            scrollbar-thin scrollbar-thumb-base-300/50 scrollbar-track-transparent
          "
        >
          {isMessagesLoading ? (
            <div className="flex items-center justify-center h-full text-base-content/60 text-lg">
              Loading your vibes...
            </div>
          ) : messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <h2 className="text-2xl font-semibold text-primary">
                Start a new vibe ✨
              </h2>
              <p className="text-base-content/60">
                Send your first message to begin chatting.
              </p>
            </motion.div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === authUser._id;
              return (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`chat ${isMine ? "chat-end" : "chat-start"}`}
                >
                  {/* Avatar */}
                  <div className="chat-image avatar">
                    <div className="size-9 rounded-full border border-base-300/50 shadow-sm">
                      <img
                        src={
                          isMine
                            ? authUser.profilePic || "/boy.png"
                            : selectedUser.profilePic || "/boy.png"
                        }
                        alt="avatar"
                      />
                    </div>
                  </div>

                  {/* Time */}
                  <div className="chat-header text-xs text-base-content/60 mb-1">
                    {formatMessageTime(msg.createdAt)}
                  </div>

                  {/* Glass Bubble */}
                  <motion.div
                    whileHover={{
                      scale: 1.02,
                      boxShadow:
                        "0 0 12px rgba(255,255,255,0.06), 0 0 5px rgba(0,0,0,0.15)",
                    }}
                    className={`chat-bubble max-w-xs md:max-w-md p-3 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
                      isMine
                        ? "bg-base-300/60 border-base-300/50 text-base-content"
                        : "bg-base-200/60 border-base-300/50 text-base-content"
                    }`}
                  >
                    {msg.text && <span>{msg.text}</span>}

                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="img"
                        className="mt-2 rounded-lg max-w-[200px] border border-base-300/40 cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(msg.image, "_blank")}
                      />
                    )}

                    {msg.video && (
                      <video
                        controls
                        className="mt-2 rounded-lg w-64 border border-base-300/40"
                      >
                        <source src={msg.video} type="video/mp4" />
                      </video>
                    )}
                  </motion.div>
                </motion.div>
              );
            })
          )}
          <div ref={messageEndRef} />
        </div>

        {/* ✍️ Input Area */}
        <div className="border-t border-base-300/40 bg-base-200/40 backdrop-blur-2xl p-3">
          <div className="bg-base-100/40 backdrop-blur-xl rounded-full border border-base-300/50 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(255,255,255,0.08)] transition-all duration-300">
            <MessageInput />
          </div>
        </div>
      </div>

      {/* 🎵 Music Player */}
      {isMusicPlayerOpen && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="w-[32%] border-l border-base-300/40 bg-base-200/40 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,0,0,0.15)]"
        >
          <MusicPlayer />
        </motion.div>
      )}
    </div>
  );
};

export default ChatContainer;
