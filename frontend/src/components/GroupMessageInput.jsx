import { useRef, useState } from "react";
import { Image, Send, X, Plus, Smile, Paperclip } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";

const DARK_THEMES = ["dark", "coffee", "vibetalk"];

const GroupMessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const imageInputRef = useRef(null);
  const inputRef = useRef(null);

  const { sendGroupMessage, selectedGroup } = useGroupStore();
  const { authUser } = useAuthStore();
  const { theme } = useThemeStore();

  const handleSendMessage = () => {
    if (!selectedGroup) return;
    if (!text.trim() && !imagePreview) return;

    sendGroupMessage({
      text: text.trim(),
      image: imagePreview,
    });

    setText("");
    setImagePreview(null);
    setShowEmojiPicker(false);
    setIsExpanded(false);
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

  if (!selectedGroup) return null;

  return (
    <div className="relative w-full bg-white dark:bg-base-100 border-t border-gray-200 dark:border-base-300">
      {imagePreview && (
        <div className="mx-3 my-3 bg-gray-100 dark:bg-base-200 border border-gray-300 dark:border-base-300 rounded-xl p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-800 dark:text-base-content">Image preview</span>
            <button type="button" onClick={() => setImagePreview(null)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-base-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg object-cover" />
        </div>
      )}

      <div className="flex items-end gap-2 p-3">
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-base-200 shrink-0"
        >
          <Paperclip className="w-5 h-5 text-gray-600 dark:text-base-content/60" />
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={previewImage}
          className="hidden"
        />

        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Message the group..."
            rows={isExpanded ? 4 : 1}
            className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-base-200 border border-gray-200 dark:border-base-300 text-gray-900 dark:text-base-content placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
          />
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2">
              <EmojiPicker onEmojiClick={(e) => setText((p) => p + e.emoji)} theme={DARK_THEMES.includes(theme) ? "dark" : "light"} />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowEmojiPicker((p) => !p)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-base-200 shrink-0"
        >
          <Smile className="w-5 h-5 text-gray-600 dark:text-base-content/60" />
        </button>

        <button
          type="button"
          onClick={handleSendMessage}
          disabled={!text.trim() && !imagePreview}
          className="p-2.5 rounded-xl bg-primary text-gray-900 disabled:opacity-50 hover:opacity-90 shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default GroupMessageInput;
