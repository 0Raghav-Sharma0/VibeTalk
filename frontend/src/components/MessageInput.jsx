// src/components/MessageInput.jsx
import React, { useRef, useState } from "react";
import { Image, Send, X, FileVideo, Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import axios from "axios";
import messageSentSound from "/sent_message.mp3";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const messageSentAudio =
  typeof Audio !== "undefined" ? new Audio(messageSentSound) : null;

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const { sendMessage, selectedUser } = useChatStore();
  const { authUser, socket } = useAuthStore();

  /* 🔥 TYPING EMITTER */
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

  /* SEND MESSAGE */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !videoPreview) return;

    try {
      let imageUrl = null;
      let videoUrl = null;

      if (imagePreview && fileInputRef.current?.files?.[0]) {
        const form = new FormData();
        form.append("file", fileInputRef.current.files[0]);
        form.append("upload_preset", "my_preset");
        const res = await axios.post(
          "https://api.cloudinary.com/v1_1/dbi3tuuli/image/upload",
          form
        );
        imageUrl = res.data.secure_url;
      }

      if (videoPreview && videoInputRef.current?.files?.[0]) {
        const form = new FormData();
        form.append("file", videoInputRef.current.files[0]);
        form.append("upload_preset", "my_preset");
        const res = await axios.post(
          "https://api.cloudinary.com/v1_1/dbi3tuuli/video/upload",
          form
        );
        videoUrl = res.data.secure_url;
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

      // STOP TYPING
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
      {(imagePreview || videoPreview) && (
        <div className="mb-3 flex items-center gap-3 bg-base-200 p-3 rounded-xl border border-base-300">
          {imagePreview && (
            <img
              src={imagePreview}
              alt="preview"
              className="w-16 h-16 object-cover rounded-lg border border-base-300"
            />
          )}

          {videoPreview && (
            <video
              src={videoPreview}
              controls
              className="w-20 h-16 rounded-lg border border-base-300"
            />
          )}

          <button
            type="button"
            onClick={() => {
              setImagePreview(null);
              setVideoPreview(null);
            }}
            className="w-7 h-7 rounded-full bg-base-300 border border-base-300 flex items-center justify-center"
          >
            <X size={14} className="text-base-content/70" />
          </button>
        </div>
      )}

      {/* EMOJI PICKER */}
      {showEmojiPicker && (
        <div className="absolute bottom-14 left-0 z-30 border border-base-300 rounded-xl bg-base-200 shadow-lg p-2">
          <EmojiPicker onEmojiClick={handleEmojiClick} theme="auto" />
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex items-center w-full gap-2 bg-base-200 border border-base-300 rounded-xl px-3 py-2"
      >
        <button
          type="button"
          onClick={() => setShowEmojiPicker((s) => !s)}
          className="text-base-content/60 shrink-0"
        >
          <Smile size={20} />
        </button>

        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 min-w-0 bg-transparent outline-none text-sm"
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
        />

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => setImagePreview(reader.result);
              reader.readAsDataURL(file);
            }
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-base-content/60 shrink-0"
        >
          <Image size={18} />
        </button>

        <input
          type="file"
          accept="video/*"
          ref={videoInputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => setVideoPreview(reader.result);
              reader.readAsDataURL(file);
            }
          }}
        />
        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          className="text-base-content/60 shrink-0"
        >
          <FileVideo size={18} />
        </button>

        <button
          type="submit"
          disabled={!text.trim() && !imagePreview && !videoPreview}
          className="w-9 h-9 shrink-0 rounded-full bg-primary text-primary-content flex items-center justify-center active:scale-95 disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
