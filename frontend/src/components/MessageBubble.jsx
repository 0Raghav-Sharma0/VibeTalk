import React, { useState } from "react";
import {
  File,
  Download,
  Copy,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  FileText,
  Archive,
  Check,
  CheckCheck,
} from "lucide-react";
import { formatMessageTime } from "../lib/utils";

export default function MessageBubble({ msg, isMine, authUser, selectedUser, showSenderName }) {
  const [copied, setCopied] = useState(false);

  // Safe defaults for props
  const safeMsg = msg || {};
  const safeAuthUser = authUser || {};
  const safeSelectedUser = selectedUser || {};
  const avatarUrl = !isMine ? (safeMsg.senderAvatar || safeSelectedUser.profilePic || "/boy.png") : (safeAuthUser.profilePic || "/boy.png");

  const copyText = () => {
    if (!safeMsg.text) return;
    navigator.clipboard.writeText(safeMsg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  const getFileIcon = (name) => {
    if (!name) return <File size={20} />;
    const ext = name.split(".").pop()?.toLowerCase();
    if (!ext) return <File size={20} />;
    
    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) 
      return <ImageIcon size={20} />;
    if (["mp4", "mov", "avi", "webm", "mkv", "flv"].includes(ext)) 
      return <VideoIcon size={20} />;
    if (["mp3", "wav", "ogg", "flac", "m4a"].includes(ext)) 
      return <Music size={20} />;
    if (["pdf", "doc", "docx", "txt", "rtf", "md"].includes(ext)) 
      return <FileText size={20} />;
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) 
      return <Archive size={20} />;
    return <File size={20} />;
  };

  const isEmojiOnly =
    safeMsg.text &&
    safeMsg.text.length <= 6 &&
    /^[\p{Emoji}\s]+$/u.test(safeMsg.text);

  const getMessageStatus = () => {
    if (!isMine) return null;
    
    if (safeMsg.read) {
      return (
        <span className="flex items-center gap-1 text-xs text-violet-500 dark:text-[#b29bff]">
          <CheckCheck size={12} />
          Read
        </span>
      );
    } else if (safeMsg.delivered) {
      return (
        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-white/70">
          <CheckCheck size={12} />
          Delivered
        </span>
      );
    } else if (safeMsg.sent) {
      return (
        <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-white/50">
          <Check size={12} />
          Sent
        </span>
      );
    }
    return null;
  };

  const handleImageClick = (imageUrl) => {
    if (!imageUrl) return;
    
    // Create a modal for better image viewing
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center';
    modal.onclick = () => document.body.removeChild(modal);
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.className = 'max-w-[90vw] max-h-[90vh] object-contain rounded-lg';
    img.onclick = (e) => e.stopPropagation();
    
    modal.appendChild(img);
    document.body.appendChild(modal);
  };

  const formatFileSize = (size) => {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`flex gap-2 mb-4 ${isMine ? "justify-end" : "justify-start"}`}>
      {/* Sender avatar (left side) */}
      {!isMine && (
        <img
          src={avatarUrl}
          className="w-8 h-8 rounded-full mt-5 flex-shrink-0"
          alt={safeMsg.senderName || safeSelectedUser.fullName || "User"}
          onError={(e) => {
            e.target.src = "/boy.png";
          }}
        />
      )}

      <div className={`flex flex-col max-w-[75%] ${isMine ? "items-end" : "items-start"}`}>
        {/* Message metadata */}
        <div className={`flex items-center gap-2 mb-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
          {showSenderName && safeMsg.senderName && (
            <span className="text-xs font-medium text-violet-600 dark:text-[#b29bff]">{safeMsg.senderName}</span>
          )}
          <span className="text-xs text-gray-500 dark:text-white/60">
            {formatMessageTime(safeMsg.createdAt || safeMsg.timestamp)}
          </span>
          
          {/* Message status (for my messages only) */}
          {isMine && getMessageStatus()}
        </div>

        {/* Message content container */}
        <div className="relative group">
          {/* Copy button for text messages */}
          {safeMsg.text && !isEmojiOnly && (
            <button
              onClick={copyText}
              className={`absolute -top-1 ${
                isMine ? "-left-8" : "-right-8"
              } opacity-0 group-hover:opacity-100 transition-all duration-200`}
              aria-label="Copy message"
              title="Copy message"
            >
              <div className="p-1.5 rounded-full bg-base-200 hover:bg-base-300 shadow-sm">
                <Copy size={12} className="text-base-content/60" />
              </div>
            </button>
          )}

          {/* Copied feedback */}
          {copied && (
            <div
              className={`absolute -top-8 ${
                isMine ? "left-0" : "right-0"
              } text-xs bg-base-300 text-base-content px-2 py-1 rounded shadow z-10`}
            >
              Copied!
            </div>
          )}

          {/* Message content */}
          <div
            className={`px-4 py-3 rounded-2xl shadow-sm min-w-[60px] ${
              isEmojiOnly
                ? "bg-transparent p-0 shadow-none"
                : isMine
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white" 
                : "bg-gray-100 dark:bg-white/10 border border-transparent"
            }`}
          >
            {/* Text content */}
            {safeMsg.text && (
              <p
                className={`whitespace-pre-wrap break-words ${
                  isEmojiOnly
                    ? "text-4xl leading-none"
                    : isMine
                    ? "text-sm leading-relaxed text-white"
                    : "text-sm leading-relaxed text-gray-900 dark:text-white"
                }`}
              >
                {safeMsg.text}
              </p>
            )}

            {/* Image content */}
            {safeMsg.image && (
              <div className="mt-2">
                <img
                  src={safeMsg.image}
                  onClick={() => handleImageClick(safeMsg.image)}
                  className="
                    rounded-xl max-w-[240px] max-h-[240px]
                    cursor-pointer hover:opacity-95 transition-opacity
                    shadow-sm object-cover
                  "
                  alt="Shared image"
                  onError={(e) => {
                    console.error("Failed to load image:", safeMsg.image);
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Video content */}
            {safeMsg.video && (
              <div className="mt-2">
                <video 
                  controls 
                  className="rounded-xl max-w-[260px]"
                  onError={(e) => {
                    console.error("Failed to load video:", safeMsg.video);
                    e.target.innerHTML = '<div class="p-4 bg-base-200 rounded-xl text-sm text-base-content/60">Failed to load video</div>';
                  }}
                >
                  <source src={safeMsg.video} type="video/mp4" />
                  <source src={safeMsg.video} type="video/webm" />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {/* File attachment */}
            {safeMsg.file?.url && (
              <a
                href={safeMsg.file.url}
                target="_blank"
                rel="noreferrer noopener"
                download={safeMsg.file.name || "download"}
                className="
                  mt-2 flex items-center gap-3 p-3 rounded-xl
                  bg-base-100 hover:bg-base-200 transition-all duration-200
                  border border-transparent hover:border-transparent
                  no-underline text-inherit
                "
                onClick={(e) => {
                  // Track download if needed
                  console.log("Downloading file:", safeMsg.file.name);
                }}
              >
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-white/10 text-violet-600 dark:text-[#b29bff]">
                  {getFileIcon(safeMsg.file.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-gray-900 dark:text-white">
                    {safeMsg.file.name || "Download"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-white/70">
                    {formatFileSize(safeMsg.file.size)}
                  </p>
                </div>
                <Download size={16} className="text-base-content/60" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* My avatar (right side) */}
      {isMine && (
        <img
          src={safeAuthUser.profilePic || "/boy.png"}
          className="w-8 h-8 rounded-full mt-5 flex-shrink-0"
          alt={safeAuthUser.fullName || "You"}
          onError={(e) => {
            e.target.src = "/boy.png";
          }}
        />
      )}
    </div>
  );
}