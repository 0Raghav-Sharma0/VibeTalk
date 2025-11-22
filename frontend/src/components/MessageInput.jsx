// src/components/MessageInput.jsx
import React, { useRef, useState, useEffect } from "react";
import { Image, Send, X, FileVideo, Smile, Paperclip, Mic } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { axiosInstance } from "../lib/axios";
import messageSentSound from "/sent_message.mp3";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const messageSentAudio = typeof Audio !== "undefined" ? new Audio(messageSentSound) : null;

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const { sendMessage, selectedUser } = useChatStore();
  const { authUser, socket } = useAuthStore();

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTyping = (value) => {
    setText(value);
    if (!selectedUser) return;

    socket.emit("typing", {
      senderId: authUser._id,
      receiverId: selectedUser._id,
      isTyping: value.length > 0,
    });
  };

  const handleEmojiClick = (emoji) => handleTyping(text + emoji.emoji);

  const handleFileUpload = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setFilePreview(file.name);

      const form = new FormData();
      form.append("file", file);

      const res = await axiosInstance.post(
        "/messages/upload-file",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      await sendMessage({
        text: "",
        file: res.data,
      });

      setFilePreview(null);
    } catch (err) {
      console.error("File upload error:", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!text.trim() && !imagePreview && !videoPreview) return;

    try {
      let imageUrl = null;
      let videoUrl = null;

      if (imagePreview && imageInputRef.current?.files?.[0]) {
        const form = new FormData();
        form.append("file", imageInputRef.current.files[0]);
        form.append("upload_preset", "my_preset");

        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dbi3tuuli/image/upload",
          { method: "POST", body: form }
        ).then((r) => r.json());

        imageUrl = res.secure_url;
      }

      if (videoPreview && videoInputRef.current?.files?.[0]) {
        const form = new FormData();
        form.append("file", videoInputRef.current.files[0]);
        form.append("upload_preset", "my_preset");

        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dbi3tuuli/video/upload",
          { method: "POST", body: form }
        ).then((r) => r.json());

        videoUrl = res.secure_url;
      }

      await sendMessage({
        text: text.trim(),
        image: imageUrl,
        video: videoUrl,
      });

      if (messageSentAudio) {
        messageSentAudio.currentTime = 0;
        messageSentAudio.play();
      }

      socket.emit("typing", {
        senderId: authUser._id,
        receiverId: selectedUser._id,
        isTyping: false,
      });

      setText("");
      setImagePreview(null);
      setVideoPreview(null);
      setShowEmojiPicker(false);
    } catch (err) {
      console.error("Message send error:", err);
    }
  };

  return (
    <div className="relative w-full">
      {/* PREVIEW BOX */}
      {(imagePreview || videoPreview || filePreview) && (
        <div className="mb-3 flex items-center gap-3 bg-base-200 p-3 rounded-xl border border-base-300">
          {imagePreview && (
            <img src={imagePreview} className="w-16 h-16 object-cover rounded-lg border" />
          )}

          {videoPreview && (
            <video src={videoPreview} controls className="w-24 h-16 rounded-lg border" />
          )}

          {filePreview && (
            <div className="text-sm bg-base-300 px-3 py-1 rounded-lg border">
              📎 {filePreview}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setImagePreview(null);
              setVideoPreview(null);
              setFilePreview(null);
            }}
            className="w-7 h-7 rounded-full bg-base-300 border flex items-center justify-center hover:bg-base-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* EMOJI PICKER */}
      {showEmojiPicker && (
        <div className={`absolute bottom-14 left-0 z-30 border rounded-xl bg-base-200 shadow-lg p-2 ${
          isMobile ? 'w-full' : ''
        }`}>
          <EmojiPicker 
            onEmojiClick={handleEmojiClick} 
            theme="auto" 
            width={isMobile ? '100%' : '350px'}
            height={isMobile ? '400px' : '400px'}
          />
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex items-center w-full gap-2 bg-base-200 border border-base-300 rounded-xl px-3 py-2"
      >
        {/* Emoji Button - Hidden on mobile when keyboard is active */}
        {!isMobile && (
          <button
            type="button"
            onClick={() => setShowEmojiPicker((s) => !s)}
            className="text-base-content/60 shrink-0 hover:text-base-content transition-colors"
          >
            <Smile size={20} />
          </button>
        )}

        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 bg-transparent outline-none text-sm min-w-0"
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
        />

        {/* Action Buttons - Conditional rendering for mobile */}
        <div className="flex items-center gap-1">
          {/* Show emoji button on mobile in a different position */}
          {isMobile && (
            <button 
              type="button"
              onClick={() => setShowEmojiPicker((s) => !s)}
              className="text-base-content/60 p-2 hover:text-base-content transition-colors"
            >
              <Smile size={18} />
            </button>
          )}

          {/* Image Upload */}
          <input
            type="file"
            accept="image/*"
            ref={imageInputRef}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onloadend = () => setImagePreview(reader.result);
              reader.readAsDataURL(file);
            }}
          />
          <button 
            onClick={() => imageInputRef.current?.click()} 
            type="button" 
            className="text-base-content/60 p-2 hover:text-base-content transition-colors"
          >
            <Image size={18} />
          </button>

          {/* Video Upload - Hidden on mobile to save space */}
          {!isMobile && (
            <>
              <input
                type="file"
                accept="video/*"
                ref={videoInputRef}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onloadend = () => setVideoPreview(reader.result);
                  reader.readAsDataURL(file);
                }}
              />
              <button 
                onClick={() => videoInputRef.current?.click()} 
                type="button" 
                className="text-base-content/60 p-2 hover:text-base-content transition-colors"
              >
                <FileVideo size={18} />
              </button>
            </>
          )}

          {/* File Upload */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            type="button" 
            className="text-base-content/60 p-2 hover:text-base-content transition-colors"
          >
            <Paperclip size={18} />
          </button>
        </div>

        <button
          type="submit"
          disabled={!text.trim() && !imagePreview && !videoPreview}
          className="w-9 h-9 rounded-full bg-primary text-primary-content flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform hover:bg-primary/90"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;