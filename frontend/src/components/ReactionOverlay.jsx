import React from "react";
import { useWatchParty } from "../contexts/WatchPartyContext";
import "./ReactionOverlay.css";

const ReactionOverlay = () => {
  const { reactions, sendReaction } = useWatchParty();

  const reactionEmojis = ["❤️", "😂", "👍", "🔥", "😮", "👏", "🎉", "😢"];

  return (
    <>
      {/* FLOATING REACTIONS — NEVER BLOCK VIDEO */}
      <div className="reactions-display">
        {reactions.map((reaction) => (
          <div
            key={reaction.id}
            className="floating-reaction"
            style={{
              left: `${Math.random() * 70 + 15}%`,
              animationDuration: `${2 + Math.random()}s`,
            }}
          >
            {reaction.emoji}
          </div>
        ))}
      </div>

      {/* BUTTONS — MOVED BELOW VIDEO ON MOBILE */}
      <div className="reaction-buttons-wrapper">
        <div className="reaction-buttons">
          {reactionEmojis.map((emoji) => (
            <button
              key={emoji}
              className="reaction-btn"
              onClick={() => sendReaction(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default ReactionOverlay;
