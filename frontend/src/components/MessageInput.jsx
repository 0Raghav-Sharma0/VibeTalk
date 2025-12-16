import React, { useRef, useState } from "react";
import { Image, Send, X, Plus, Smile, Paperclip } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const imageInputRef = useRef(null);
  const inputRef = useRef(null);

  const { sendMessage, selectedUser } = useChatStore();
  const { authUser, socket } = useAuthStore();

  /* ================= SEND MESSAGE ================= */
  const handleSendMessage = async () => {
    if (!selectedUser) return;
    if (!text.trim() && !imagePreview) return;

    await sendMessage({
      text: text.trim(),
      image: imagePreview,
    });

    socket.emit("typing", {
      senderId: authUser._id,
      receiverId: selectedUser._id,
      isTyping: false,
    });

    setText("");
    setImagePreview(null);
    setShowEmojiPicker(false);
    setIsExpanded(false);
  };

  const handleTyping = (v) => {
    setText(v);
    if (selectedUser) {
      socket.emit("typing", {
        senderId: authUser._id,
        receiverId: selectedUser._id,
        isTyping: v.length > 0,
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Image preview helper
  const previewImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be under 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    setIsExpanded(false);
  };

  return (
    <div className="relative w-full bg-base-100">

      {/* ===== IMAGE PREVIEW ===== */}
      {imagePreview && (
        <div className="mb-3 mx-3 bg-base-200 border border-base-300 rounded-xl p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-base-content flex items-center gap-2">
              <Paperclip size={14} /> Image attached
            </span>
            <button
              onClick={() => setImagePreview(null)}
              className="p-1.5 rounded-lg hover:bg-base-300"
            >
              <X size={16} />
            </button>
          </div>

          <img
            src={imagePreview}
            alt="preview"
            className="w-20 h-20 md:w-28 md:h-28 rounded-lg object-cover border"
          />
        </div>
      )}

      {/* ===== IMAGE PICKER (EXPANDED) ===== */}
      {isExpanded && (
        <div className="mb-3 mx-3 bg-base-200 border border-base-300 rounded-xl p-3">
          <div className="flex gap-3">
            <button
              onClick={() => imageInputRef.current.click()}
              className="
                flex-1 flex flex-col items-center gap-2 p-3 rounded-lg
                hover:bg-base-300 transition
              "
            >
              <div className="p-2 rounded-lg bg-base-100 border border-base-300">
                <Image size={20} />
              </div>
              <span className="text-xs text-base-content/60">Photo</span>
            </button>
          </div>
        </div>
      )}

      {/* ===== EMOJI PICKER ===== */}
      {showEmojiPicker && (
        <div className="
          absolute bottom-20 left-2 right-2 sm:left-auto sm:right-4
          sm:w-[340px] z-50
        ">
          <div className="bg-base-100 border border-base-300 rounded-xl shadow-xl">
            <div className="p-2 border-b border-base-300 flex justify-between items-center">
              <span className="text-sm font-medium">Emoji</span>
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="p-1 hover:bg-base-300 rounded"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[280px] overflow-y-auto">
              <EmojiPicker
                onEmojiClick={(e) => {
                  setText((p) => p + e.emoji);
                  inputRef.current?.focus();
                }}
                theme="auto"
                width="100%"
                height={280}
                previewConfig={{ showPreview: false }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ===== MAIN INPUT BAR ===== */}
      <div className="px-3 py-2">
        <div className="
          flex items-center gap-1 md:gap-2
          bg-base-200 border border-base-300
          rounded-xl px-2 md:px-3 py-2
          focus-within:ring-2 focus-within:ring-primary
          transition
        ">
          {/* PLUS (IMAGE) */}
          <button
            onClick={() => {
              setIsExpanded(!isExpanded);
              setShowEmojiPicker(false);
            }}
            className="p-1.5 md:p-2 rounded-lg hover:bg-base-300 transition"
            aria-label="Attach image"
          >
            <Plus size={18} className="md:w-5 md:h-5" />
          </button>

          {/* EMOJI */}
          <button
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setIsExpanded(false);
            }}
            className="p-1.5 md:p-2 rounded-lg hover:bg-base-300 transition"
            aria-label="Add emoji"
          >
            <Smile size={18} className="md:w-5 md:h-5" />
          </button>

          {/* INPUT */}
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="
              flex-1 bg-transparent outline-none
              text-sm md:text-base text-base-content
              placeholder:text-base-content/50
              py-1
            "
          />

          {/* SEND */}
          <button
            onClick={handleSendMessage}
            disabled={!text.trim() && !imagePreview}
            className={`
              p-1.5 md:p-2.5 rounded-lg transition
              ${
                text.trim() || imagePreview
                  ? "bg-primary text-primary-content hover:opacity-90"
                  : "text-base-content/40 cursor-not-allowed"
              }
            `}
            aria-label="Send message"
          >
            <Send size={18} className="md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      {/* ===== HIDDEN IMAGE INPUT ===== */}
      <input
        type="file"
        accept="image/*"
        ref={imageInputRef}
        className="hidden"
        onChange={previewImage}
      />
    </div>
  );
};

export default MessageInput;