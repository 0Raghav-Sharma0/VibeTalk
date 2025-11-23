// src/components/WatchPartyChatPanel.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useWatchParty } from '../contexts/WatchPartyContext';
import './WatchPartyChatPanel.css';

const WatchPartyChatPanel = () => {
  const { chatMessages, sendChatMessage } = useWatchParty();
  const [message, setMessage] = useState('');
  const chatEndRef = useRef(null);

  // Auto-scroll when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendChatMessage(message.trim());
    setMessage('');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const messageLabel =
    chatMessages.length === 0
      ? 'Be the first to send a message'
      : `${chatMessages.length} message${chatMessages.length > 1 ? 's' : ''}`;

  return (
    <div className="chat-panel yt-chat">
      {/* HEADER */}
      <div className="chat-header">
        <div className="chat-header-main">
          <h3>Live Chat</h3>

          <span className="chat-live-pill">
            <span className="live-dot" />
            Live
          </span>
        </div>

        <span className="chat-subtitle">{messageLabel}</span>
      </div>

      {/* MESSAGES */}
      <div className="chat-messages">
        {chatMessages.length === 0 ? (
          <div className="chat-empty">
            <div className="empty-icon">💬</div>
            <p>No messages yet</p>
            <span>Say hi and start the conversation!</span>
          </div>
        ) : (
          chatMessages.map((msg, index) => (
            <div key={index} className="chat-message">
              <div className="message-meta">
                <span className="message-username">{msg.username}</span>
                <span className="message-time">{formatTime(msg.timestamp)}</span>
              </div>

              <div className="message-bubble">
                <div className="message-content">{msg.message}</div>
              </div>
            </div>
          ))
        )}

        <div ref={chatEndRef} />
      </div>

      {/* INPUT */}
      <form className="chat-input-form big-input" onSubmit={handleSendMessage}>
        <div className="chat-input-wrapper">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Say something…"
            className="chat-input"
            maxLength={500}
          />
        </div>

        <button
          type="submit"
          className="chat-send-btn big-send"
          disabled={!message.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default WatchPartyChatPanel;
