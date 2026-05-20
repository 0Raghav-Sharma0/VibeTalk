import { useRef, useState, useEffect, useCallback } from "react";
import { Image, Send, X, Plus, Smile, Paperclip } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";

const DARK_THEMES = ["dark", "coffee", "nexaura"];
const TYPING_DEBOUNCE_MS = 1200;

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const imageInputRef = useRef(null);
  const inputRef = useRef(null);
  const typingStopTimer = useRef(null);

  const { sendMessage, selectedUser, emitTyping } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const { theme } = useThemeStore();

  const stopTyping = useCallback(() => {
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    emitTyping(false);
  }, [emitTyping]);

  const startTyping = useCallback(() => {
    emitTyping(true);
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    typingStopTimer.current = setTimeout(stopTyping, TYPING_DEBOUNCE_MS);
  }, [emitTyping, stopTyping]);

  useEffect(() => () => stopTyping(), [stopTyping]);

  const handleSendMessage = () => {
    if (!selectedUser) return;
    if (!text.trim() && !imagePreview) return;

    stopTyping();
    sendMessage({ text: text.trim(), image: imagePreview });

    setText("");
    setImagePreview(null);
    setShowEmojiPicker(false);
    setIsExpanded(false);
  };

  const handleTyping = (v) => {
    setText(v);
    if (!selectedUser || !socket || !authUser) return;
    if (v.length > 0) startTyping();
    else stopTyping();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
    <div className="relative w-full bg-white dark-mode-bg border-t border-transparent dark:border-white/8 pb-[env(safe-area-inset-bottom)]">
      {imagePreview && (
        <div className="mx-3 my-3 bg-gray-100 dark:bg-base-200 rounded-xl p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <Paperclip size={14} /> Image attached
            </span>
            <button type="button" onClick={() => setImagePreview(null)}>
              <X size={16} />
            </button>
          </div>
          <img src={imagePreview} alt="preview" className="w-24 h-24 rounded-lg object-cover" />
        </div>
      )}

      {isExpanded && (
        <div className="mx-3 mb-3 bg-gray-100 dark:bg-base-200 rounded-xl p-3">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="w-full flex flex-col items-center gap-2 p-3"
          >
            <Image size={20} />
            <span className="text-xs">Photo</span>
          </button>
        </div>
      )}

      {showEmojiPicker && (
        <div className="absolute bottom-20 left-2 right-2 sm:right-4 sm:w-[340px] z-50">
          <div className="bg-white dark:bg-base-100 rounded-xl shadow-xl p-2">
            <button type="button" onClick={() => setShowEmojiPicker(false)}>
              <X size={16} />
            </button>
            <EmojiPicker
              onEmojiClick={(e) => setText((p) => p + e.emoji)}
              theme={DARK_THEMES.includes(theme) ? "dark" : "light"}
              width="100%"
              height={280}
            />
          </div>
        </div>
      )}

      <div className="px-4 py-2">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
          <button type="button" onClick={() => setIsExpanded(!isExpanded)}>
            <Plus size={18} />
          </button>
          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <Smile size={18} />
          </button>
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-transparent outline-none text-sm md:text-base"
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!text.trim() && !imagePreview}
            className="p-2.5 rounded-lg bg-violet-600 text-white disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      <input type="file" accept="image/*" ref={imageInputRef} className="hidden" onChange={previewImage} />
    </div>
  );
};

export default MessageInput;
