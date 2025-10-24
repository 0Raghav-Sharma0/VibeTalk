import React, { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, XIcon, FileVideo, Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import axios from "axios";
import messageSentSound from "/sent_message.mp3";

const messageSentAudio = new Audio(messageSentSound);
const playSound = (audio) => {
  audio.currentTime = 0;
  audio.play();
};

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleEmojiClick = (emoji) => setText((t) => t + emoji.emoji);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !videoPreview) return;

    try {
      let imageUrl = null;
      let videoUrl = null;

      if (imagePreview && fileInputRef.current.files[0]) {
        const form = new FormData();
        form.append("file", fileInputRef.current.files[0]);
        form.append("upload_preset", "my_preset");
        const res = await axios.post(
          "https://api.cloudinary.com/v1_1/dbi3tuuli/image/upload",
          form
        );
        imageUrl = res.data.secure_url;
      }

      if (videoPreview && videoInputRef.current.files[0]) {
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

      playSound(messageSentAudio);
      setText("");
      setImagePreview(null);
      setVideoPreview(null);
    } catch (err) {
      console.error("Message failed:", err);
    }
  };

  return (
    <div className="p-3 border-t border-base-300 bg-base-200/70 backdrop-blur-lg">
      {(imagePreview || videoPreview) && (
        <div className="mb-3 flex gap-2 items-center">
          {imagePreview && (
            <img
              src={imagePreview}
              className="w-16 h-16 object-cover rounded-lg border border-base-300"
            />
          )}
          {videoPreview && (
            <video
              src={videoPreview}
              controls
              className="w-16 h-16 rounded-lg border border-base-300"
            />
          )}
          <button
            onClick={() => {
              setImagePreview(null);
              setVideoPreview(null);
            }}
            className="btn btn-circle btn-xs bg-base-300"
          >
            <XIcon size={14} />
          </button>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 bg-base-100/60 border border-base-300 rounded-full px-4 py-2 shadow-inner"
      >
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="text-base-content/70 hover:text-primary"
        >
          <Smile size={20} />
        </button>

        {showEmojiPicker && (
          <div className="absolute bottom-16 left-4 bg-base-200 border border-base-300 rounded-lg shadow-lg p-2 z-20">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}

        <input
          type="text"
          placeholder="Type a message..."
          className="input w-full bg-transparent focus:outline-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files[0];
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
          className="text-base-content/70 hover:text-secondary"
        >
          <Image size={20} />
        </button>

        <input
          type="file"
          accept="video/*"
          className="hidden"
          ref={videoInputRef}
          onChange={(e) => {
            const file = e.target.files[0];
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
          className="text-base-content/70 hover:text-accent"
        >
          <FileVideo size={20} />
        </button>

        <button
          type="submit"
          disabled={!text.trim() && !imagePreview && !videoPreview}
          className="btn btn-primary btn-circle text-primary-content"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
