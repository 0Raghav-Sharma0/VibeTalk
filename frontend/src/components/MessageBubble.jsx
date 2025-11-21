import React from "react";
import { formatMessageTime } from "../lib/utils";
import { File, Download } from "lucide-react";

export default function MessageBubble({ msg, isMine, authUser, selectedUser }) {
  const getTick = () => (
    <span className="text-[12px] font-semibold opacity-70">✓✓</span>
  );

  return (
    <div
      className={`flex items-end gap-2 mb-4 ${
        isMine ? "justify-end" : "justify-start"
      }`}
    >
      {/* Avatar (left) */}
      {!isMine && (
        <img
          src={selectedUser?.profilePic || "/boy.png"}
          className="w-7 h-7 rounded-full object-cover"
        />
      )}

      {/* Bubble wrapper */}
      <div className={`max-w-[70%] flex flex-col ${isMine && "items-end"}`}>
        {/* Time */}
        <span className="text-[11px] opacity-50 mb-1 px-1">
          {formatMessageTime(msg.createdAt)}
        </span>

        {/* Bubble */}
        <div
          className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${
            isMine
              ? "bg-primary text-primary-content rounded-br-none"
              : "bg-base-200 text-base-content rounded-bl-none"
          }`}
        >
          {/* TEXT */}
          {msg.text && <p className="leading-relaxed">{msg.text}</p>}

          {/* IMAGE */}
          {msg.image && (
            <img
              src={msg.image}
              className="mt-2 rounded-xl max-w-[240px] shadow-sm cursor-pointer"
              onClick={() => window.open(msg.image, "_blank")}
            />
          )}

          {/* VIDEO */}
          {msg.video && (
            <video
              controls
              className="mt-2 rounded-xl max-w-[260px] shadow-sm"
            >
              <source src={msg.video} />
            </video>
          )}

          {/* FILE BUBBLE (pdf, mp3, zip, pptx, docx, rar, etc.) */}
          {msg.file?.url && (
            <div
              className="mt-2 flex items-center gap-3 p-2 rounded-xl 
                         bg-black/5 dark:bg-white/10 shadow-sm cursor-pointer"
            >
              <File size={20} className="opacity-80" />

              <div className="flex flex-col min-w-0">
                <span className="font-medium text-[13px] truncate max-w-[160px]">
                  {msg.file.name}
                </span>
                <span className="text-[11px] opacity-60">
                  {(msg.file.size / 1024).toFixed(1)} KB
                </span>
              </div>

              <a
                href={msg.file.url}
                download={msg.file.name}
                target="_blank"
                rel="noreferrer"
                className="ml-auto"
              >
                <Download size={18} className="opacity-80 hover:opacity-100" />
              </a>
            </div>
          )}

          {/* TICKS */}
          {isMine && <div className="mt-1 text-[11px]">{getTick()}</div>}
        </div>
      </div>

      {/* Avatar (right) */}
      {isMine && (
        <img
          src={authUser.profilePic || "/boy.png"}
          className="w-7 h-7 rounded-full object-cover"
        />
      )}
    </div>
  );
}
