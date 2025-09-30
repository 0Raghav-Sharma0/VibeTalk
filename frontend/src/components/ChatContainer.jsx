import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { io } from "socket.io-client";
import MusicPlayer from "./MusicPlayer";
import { useMusicStore } from "../store/musicStore.js";
import newChatSound from "/message_from_new_chat.mp3";
import messageReceivedSound from "/received_message.mp3";

const newChatAudio = new Audio(newChatSound);
const messageReceivedAudio = new Audio(messageReceivedSound);
const playSound = (audio) => {
  audio.currentTime = 0;
  audio.play();
}
const socket = io(
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : import.meta.env.REACT_APP_BACKEND_URL || "https://chitchat-vvxt.onrender.com"
);

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
  const messageEndRef = useRef(null);
  const [reactions, setReactions] = useState({});
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const { setCurrentSong, isMusicPlayerOpen } = useMusicStore();

  const roomId = [authUser._id, selectedUser._id].sort().join("-");

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    socket.on("messageReaction", ({ messageId, userId, emoji }) => {
      setReactions((prev) => {
        const existingReactions = prev[messageId] || [];
        const filteredReactions = existingReactions.filter(
          (reaction) => reaction.userId !== userId
        );
        return {
          ...prev,
          [messageId]: emoji ? [...filteredReactions, { userId, emoji }] : filteredReactions,
        };
      });
    });

    return () => {
      socket.off("messageReaction");
    };
  }, []);

  useEffect(() => {
    socket.on("newMessage", (newMessage) => {
      if (newMessage.senderId === authUser._id) {
        playSound(newChatAudio);
      } else {
        playSound(messageReceivedAudio);
      }
    });
  
    return () => {
      socket.off("newMessage");
    };
  }, []);
  
  

  const sendReaction = (messageId, emoji) => {
    const existingReaction = reactions[messageId]?.find(
      (reaction) => reaction.userId === authUser._id
    );
    if (existingReaction?.emoji === emoji) {
      socket.emit("sendReaction", { messageId, userId: authUser._id, emoji: null });
    } else {
      socket.emit("sendReaction", { messageId, userId: authUser._id, emoji });
    }
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex h-full transition-all duration-300">
      <div
        className={`flex flex-col flex-grow overflow-auto transition-all duration-300 ${
          isMusicPlayerOpen ? "w-[700px]" : "w-[1150px]"
        }`}
      >
        <ChatHeader />

        <div className="flex-1 overflow-y-auto p-4 space-y-4 w-full">
          {messages.map((message) => {
            const isSentByMe = message.senderId === authUser._id;
            return (
              <div
                key={message._id}
                className={`chat relative ${isSentByMe ? "chat-end" : "chat-start"} group`}
                ref={messageEndRef}
                onMouseEnter={() => setHoveredMessage(message._id)}
                onMouseLeave={() => setHoveredMessage(null)}
              >
                <div className="chat-image avatar">
                  <div className="size-10 rounded-full border">
                    <img
                      src={isSentByMe ? authUser.profilePic || "/boy.png" : selectedUser.profilePic || "/boy.png"}
                      alt="profile pic"
                    />
                  </div>
                </div>
                <div className="chat-header mb-1">
                  <time className="text-xs opacity-50 ml-1">{formatMessageTime(message.createdAt)}</time>
                </div>
                <div className="chat-bubble relative flex flex-col">
                  {message.text && <span className="ml-2">{message.text}</span>}
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Sent Image"
                      className="max-w-xs max-h-60 rounded-lg mt-2 cursor-pointer"
                      onClick={() => window.open(message.image, "_blank")}
                    />
                  )}
                  {message.video && (
                    <video controls className="rounded-lg w-60 mt-2" key={message._id}>
                      <source src={message.video} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}

                  {reactions[message._id]?.length > 0 && (
                    <div className="absolute -bottom-3 px-2 py-1 rounded-md bg-black/50 text-white text-xs flex space-x-1">
                      {Array.from(new Set(reactions[message._id].map((r) => r.emoji))).map((emoji, index) => (
                        <span key={index} className="text-sm">{emoji}</span>
                      ))}
                    </div>
                  )}
                </div>
                {hoveredMessage === message._id && (
                  <div
                    className={`absolute px-2 py-1 rounded-md bg-gray-800 text-white flex space-x-2 
                      ${isSentByMe ? "-top-2 right-14" : "-top-2 left-14"}`}
                  >
                    {["❤️", "😂", "👍", "🔥"].map((emoji) => (
                      <button key={emoji} onClick={() => sendReaction(message._id, emoji)} className="text-sm">
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

              </div>
            );
          })}
        </div>

        <MessageInput />
      </div>
      {isMusicPlayerOpen && (
        <div className="w-[425px] h-full bg-base-100 border-l border-gray-300 p-2.5">
          <MusicPlayer roomId={roomId} />
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
