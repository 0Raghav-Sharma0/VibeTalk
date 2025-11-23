// src/components/ReactionOverlay.jsx
import React from 'react';
import { useWatchParty } from '../contexts/WatchPartyContext';
import './ReactionOverlay.css';

const ReactionOverlay = () => {
  const { reactions, sendReaction } = useWatchParty();

  const reactionEmojis = ['❤️', '😂', '👍', '🔥', '😮', '👏', '🎉', '😢'];

  return (
    <div className="reaction-overlay-container">
      {/* Floating reactions */}
      <div className="reactions-display">
        {reactions.map((reaction) => (
          <div
            key={reaction.id}
            className="floating-reaction"
            style={{
              left: `${Math.random() * 80 + 10}%`,
              animationDuration: `${2 + Math.random()}s`
            }}
          >
            <span className="reaction-emoji">{reaction.emoji}</span>
            <span className="reaction-user">{reaction.username}</span>
          </div>
        ))}
      </div>

      {/* Reaction buttons */}
      <div className="reaction-buttons">
        {reactionEmojis.map((emoji) => (
          <button
            key={emoji}
            className="reaction-btn"
            onClick={() => sendReaction(emoji)}
            title={`Send ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReactionOverlay;