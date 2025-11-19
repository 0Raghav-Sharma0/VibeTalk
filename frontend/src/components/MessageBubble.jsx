import React from "react";
import { formatMessageTime } from "../lib/utils";

export default function MessageBubble({ msg, isMine, authUser, selectedUser }) {
  const GREY = "#8696a0";

  const getTick = () => {
    return (
      <span
        style={{
          color: GREY,
          fontWeight: 600,
          fontSize: "13px",
          letterSpacing: "-1px",
        }}
      >
        ✓✓
      </span>
    );
  };

  return (
    <div
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

      {/* Bubble */}
      <div
        className={`flex flex-col max-w-[70%] ${
          isMine ? "items-end order-1" : "items-start order-2"
        }`}
      >
        <span className="text-xs text-base-content/60 mb-1">
          {formatMessageTime(msg.createdAt)}
        </span>

        <div
          className={`relative px-4 py-2 rounded-xl border shadow-sm ${
            isMine
              ? "bg-primary text-primary-content border-primary/30"
              : "bg-base-100 border-base-300"
          }`}
        >
          {/* Text */}
          {msg.text && <p>{msg.text}</p>}

          {/* Image */}
          {msg.image && (
            <img
              src={msg.image}
              className="mt-3 rounded-lg max-w-[240px] border border-base-300 cursor-pointer"
              onClick={() => window.open(msg.image, "_blank")}
            />
          )}

          {/* Video */}
          {msg.video && (
            <video
              controls
              className="mt-3 rounded-lg max-w-[260px] border border-base-300"
            >
              <source src={msg.video} />
            </video>
          )}

          {/* Tick */}
          {isMine && (
            <div className="mt-1 text-xs flex justify-end items-center">
              {getTick()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
