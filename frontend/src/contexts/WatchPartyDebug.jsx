// src/components/WatchPartyDebug.jsx
// OPTIONAL: Add this temporarily to debug participant data
// You can remove this after verifying everything works

import React from 'react';
import { useWatchParty } from '../contexts/WatchPartyContext';
import { useAuthStore } from '../store/useAuthStore';

const WatchPartyDebug = () => {
  const { participants, roomId, isHost } = useWatchParty();
  const { authUser } = useAuthStore();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: '#1a1a1a',
      border: '2px solid #333',
      borderRadius: '8px',
      padding: '12px',
      maxWidth: '400px',
      maxHeight: '300px',
      overflow: 'auto',
      fontSize: '11px',
      color: '#fff',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#8b5cf6' }}>
        🐛 Debug Info
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Room ID:</strong> {roomId || 'None'}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Is Host:</strong> {isHost ? 'Yes' : 'No'}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Current User:</strong>
        <pre style={{ margin: '4px 0', padding: '4px', background: '#252525', borderRadius: '4px' }}>
          {JSON.stringify({
            id: authUser?._id,
            username: authUser?.username,
            fullName: authUser?.fullName,
            email: authUser?.email
          }, null, 2)}
        </pre>
      </div>
      
      <div>
        <strong>Participants ({participants.length}):</strong>
        <pre style={{ margin: '4px 0', padding: '4px', background: '#252525', borderRadius: '4px', maxHeight: '100px', overflow: 'auto' }}>
          {JSON.stringify(participants.map(p => ({
            socketId: p.socketId?.substring(0, 8),
            username: p.username,
            userId: p.userId,
            isHost: p.isHost,
            connected: p.connected
          })), null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default WatchPartyDebug;
