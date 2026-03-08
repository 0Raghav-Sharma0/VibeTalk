// src/components/WatchPartyChatPanel.jsx
import { useState, useRef, useEffect } from 'react';
import { Smile, Send } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useWatchParty } from '../contexts/WatchPartyContext';
import { useThemeStore } from '../store/useThemeStore';
import './WatchPartyChatPanel.css';

const DARK_THEMES = ['dark', 'coffee', 'vibetalk'];

const WatchPartyChatPanel = () => {
  const { chatMessages, sendChatMessage } = useWatchParty();
  const { theme } = useThemeStore();
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendChatMessage(message.trim());
    setMessage('');
    setShowEmoji(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const formatTime = (ts) => {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const emojiTheme = DARK_THEMES.includes(theme) ? 'dark' : 'light';

  return (
    <div className="wp-chat-panel">
      {/* Messages */}
      <div className="wp-chat-messages">
        {chatMessages.length === 0 ? (
          <div className="wp-chat-empty">
            <div className="wp-chat-empty-icon">💬</div>
            <p>No messages yet — Be the first to say something!</p>
          </div>
        ) : (
          chatMessages.map((msg, i) => (
            <div key={i} className="wp-chat-msg">
              <div className="wp-chat-msg-avatar">
                {msg.profilePic ? (
                  <img src={msg.profilePic} alt={msg.username || ''} className="wp-chat-msg-avatar-img" />
                ) : (
                  <span>{ (msg.username || 'U').charAt(0).toUpperCase() }</span>
                )}
              </div>
              <div className="wp-chat-msg-body">
                <div className="wp-chat-msg-meta">
                  <span className="wp-chat-msg-user">{msg.username || 'Anonymous'}</span>
                  <span className="wp-chat-msg-time">{formatTime(msg.timestamp)}</span>
                </div>
                <div className="wp-chat-msg-bubble">
                  {msg.message}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Emoji picker (above input) */}
      {showEmoji && (
        <div className="wp-emoji-picker-wrap">
          <EmojiPicker
            onEmojiClick={(e) => setMessage((p) => p + e.emoji)}
            theme={emojiTheme}
            width="100%"
            height={240}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}

      {/* Input - fixed at bottom */}
      <form className="wp-chat-input-wrap" onSubmit={handleSend}>
        <button
          type="button"
          onClick={() => setShowEmoji((p) => !p)}
          className="wp-chat-emoji-btn"
          aria-label="Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          className="wp-chat-input"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="wp-chat-send-btn"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default WatchPartyChatPanel;
