// src/components/ParticipantsList.jsx
import React from 'react';
import { useWatchParty } from '../contexts/WatchPartyContext';
import { useAuthStore } from '../store/useAuthStore';
import './ParticipantsList.css';

const ParticipantsList = () => {
  const { participants, isHost } = useWatchParty();
  const { authUser } = useAuthStore();

  console.log('🎭 Current participants:', participants);
  console.log('👤 Current user:', authUser);

  // Filter only online/connected participants
  const onlineParticipants = participants.filter(p => p.connected !== false);

  return (
    <div className="participants-list">
      <div className="participants-header">
        <h4>Online ({onlineParticipants.length})</h4>
      </div>
      <div className="participants-items">
        {onlineParticipants.length === 0 ? (
          <div className="no-participants">
            <p>No one online</p>
          </div>
        ) : (
          onlineParticipants.map((participant) => {
            // FIXED: Use the actual username from participant data
            const displayName = participant.username || 
                              participant.name || 
                              `User_${participant.socketId?.substring(0, 6)}`;
            
            const isMe = participant.userId === authUser?._id || 
                        participant.socketId === authUser?.socketId;
            
            return (
              <div key={participant.socketId} className="participant-item">
                <div className="participant-avatar">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="participant-info">
                  <span className="participant-name">
                    {displayName}
                    {isMe && <span className="you-badge"> (You)</span>}
                  </span>
                  {participant.isHost && <span className="host-badge">HOST</span>}
                </div>
                <div className="status-indicator online" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ParticipantsList;