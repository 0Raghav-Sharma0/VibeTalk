// src/components/MessageInput.jsx
import React, { useRef, useState } from "react";
import { Image, Send, X, FileVideo, Smile, Paperclip } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { axiosInstance } from "../lib/axios";       // 🔥 AUTHENTICATED AXIOS
import messageSentSound from "/sent_message.mp3";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const messageSentAudio =
  typeof Audio !== "undefined" ? new Audio(messageSentSound) : null;

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const { sendMessage, selectedUser } = useChatStore();
  const { authUser, socket } = useAuthStore();

  /* 🔥 TYPING EVENT */
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

  /* 📎 FILE UPLOAD HANDLER (FIXED WITH TOKEN) */
  const handleFileUpload = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setFilePreview(file.name);

      const form = new FormData();
      form.append("file", file);

      // 🔥 TOKEN SAFE UPLOAD USING axiosInstance
      const res = await axiosInstance.post(
        "/messages/upload-file",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // Send message with file included
      await sendMessage({
        text: "",
        file: res.data, // { url, name, size, type }
      });

      setFilePreview(null);
    } catch (err) {
      console.error("File upload error:", err);
    }
  };

  /* SEND MESSAGE */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!text.trim() && !imagePreview && !videoPreview) return;

    try {
      let imageUrl = null;
      let videoUrl = null;

      // IMAGE UPLOAD
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

      // VIDEO UPLOAD
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

      // SEND MESSAGE
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
            className="w-7 h-7 rounded-full bg-base-300 border flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* EMOJI PICKER */}
      {showEmojiPicker && (
        <div className="absolute bottom-14 left-0 z-30 border rounded-xl bg-base-200 shadow-lg p-2">
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
          className="flex-1 bg-transparent outline-none text-sm"
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
        />

        {/* IMAGE */}
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
        <button onClick={() => imageInputRef.current?.click()} type="button" className="text-base-content/60">
          <Image size={18} />
        </button>

        {/* VIDEO */}
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
        <button onClick={() => videoInputRef.current?.click()} type="button" className="text-base-content/60">
          <FileVideo size={18} />
        </button>

        {/* FILE */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileUpload}
        />
        <button onClick={() => fileInputRef.current?.click()} type="button" className="text-base-content/60">
          <Paperclip size={18} />
        </button>

        <button
          type="submit"
          disabled={!text.trim() && !imagePreview && !videoPreview}
          className="w-9 h-9 rounded-full bg-primary text-primary-content flex items-center justify-center disabled:opacity-50 active:scale-95"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
