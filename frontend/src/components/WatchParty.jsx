// src/components/WatchParty.jsx
import React, { useState } from 'react';
import { useWatchParty } from '../contexts/WatchPartyContext';
import VideoPlayer from './VideoPlayer';
import ReactionOverlay from './ReactionOverlay';
import WatchPartyChatPanel from './WatchPartyChatPanel';
import ParticipantsList from './ParticipantsList';
import './WatchParty.css';

const WatchParty = () => {
  const { roomId, leaveRoom, isHost } = useWatchParty();
  // ❌ no TS generic here – plain JS
  const [activeSidebarTab, setActiveSidebarTab] = useState('participants'); // 'participants' | 'chat'

  const handleCopyRoomId = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied to clipboard!');
  };

  return (
    <div className="watchparty">
      {/* Header */}
      <header className="watchparty-header">
        <div className="header-content">
          <div className="header-main">
            <div className="logo-section">
              <div className="logo">🎬</div>
              <h1>Watch Party</h1>
            </div>

            <div className="room-info">
              {roomId && (
                <div className="room-id">
                  <span className="room-label">Room ID:</span>
                  <span className="room-code">{roomId}</span>
                  <button
                    onClick={handleCopyRoomId}
                    className="copy-btn"
                    title="Copy Room ID"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                    </svg>
                  </button>
                </div>
              )}

              <div className={`user-role ${isHost ? 'host' : 'viewer'}`}>
                <div className={`role-dot ${isHost ? '' : 'viewer'}`} />
                <span>{isHost ? 'Host' : 'Viewer'}</span>
              </div>
            </div>
          </div>

          <button onClick={leaveRoom} className="leave-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
            Leave
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="watchparty-main">
        {/* Video Area */}
        <section className="video-section">
          <div className="video-container">
            <VideoPlayer />
            <ReactionOverlay />
          </div>
        </section>

        {/* Sidebar with tabs */}
        <aside className="watchparty-sidebar">
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${activeSidebarTab === 'participants' ? 'active' : ''}`}
              onClick={() => setActiveSidebarTab('participants')}
            >
              👥 Participants
            </button>
            <button
              className={`sidebar-tab ${activeSidebarTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveSidebarTab('chat')}
            >
              💬 Chat
            </button>
          </div>

          <div className="sidebar-body">
            {activeSidebarTab === 'participants' ? (
              <div className="sidebar-panel participants-panel">
                <ParticipantsList />
              </div>
            ) : (
              <div className="sidebar-panel chat-panel-wrapper">
                <WatchPartyChatPanel />
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default WatchParty;
