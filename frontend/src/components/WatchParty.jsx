// src/components/WatchParty.jsx
import React, { useState, useEffect } from 'react';
import { useWatchParty } from '../contexts/WatchPartyContext';
import { useThemeStore } from '../store/useThemeStore';
import VideoPlayer from './VideoPlayer';
import ReactionOverlay from './ReactionOverlay';
import WatchPartyChatPanel from './WatchPartyChatPanel';
import ParticipantsList from './ParticipantsList';
import './WatchParty.css';

const WatchParty = () => {
  const { roomId, leaveRoom, isHost } = useWatchParty();
  const { theme } = useThemeStore();
  const [activeSidebarTab, setActiveSidebarTab] = useState('participants');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCopyRoomId = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied to clipboard!');
  };

  // Theme-based classes
  const getThemeClasses = () => {
    const baseClasses = {
      light: {
        background: 'bg-gradient-to-br from-white to-gray-50',
        header: 'bg-white/95 border-gray-200',
        sidebar: 'bg-white/90 border-gray-200',
        text: 'text-gray-900',
        subtleText: 'text-gray-600',
        border: 'border-gray-200',
        shadow: 'shadow-lg',
        tabInactive: 'bg-transparent text-gray-500 border-gray-300',
        tabActive: 'bg-gradient-to-r from-blue-500 to-purple-500 text-white',
        roomIdBg: 'bg-gray-100/80',
        leaveBtn: 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
      },
      dark: {
        background: 'bg-gradient-to-br from-gray-900 to-black',
        header: 'bg-gray-900/95 border-gray-800',
        sidebar: 'bg-gray-900/90 border-gray-800',
        text: 'text-white',
        subtleText: 'text-gray-400',
        border: 'border-gray-800',
        shadow: 'shadow-2xl',
        tabInactive: 'bg-transparent text-gray-400 border-gray-700',
        tabActive: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
        roomIdBg: 'bg-gray-800/50',
        leaveBtn: 'bg-gradient-to-r from-red-600 to-orange-500 text-white'
      }
    };
    
    return baseClasses[theme] || baseClasses.dark;
  };

  const themeClasses = getThemeClasses();

  return (
    <div className={`watchparty theme-${theme} ${themeClasses.background} min-h-screen transition-colors duration-300`}>
      {/* Header */}
      <header className={`watchparty-header ${themeClasses.header} ${themeClasses.border} backdrop-blur-xl sticky top-0 z-50 transition-colors duration-300`}>
        <div className="header-content">
          <div className="header-main">
            <div className="logo-section">
              <div className="logo animate-float">🎬</div>
              <h1 className={`text-2xl font-bold ${themeClasses.text}`}>Watch Party</h1>
            </div>

            <div className="room-info">
              {roomId && (
                <div className={`room-id ${themeClasses.roomIdBg} ${themeClasses.border} rounded-2xl p-3`}>
                  <span className={`room-label ${themeClasses.subtleText} font-medium`}>Room ID:</span>
                  <span className={`room-code font-mono font-bold ${themeClasses.text}`}>{roomId}</span>
                  <button
                    onClick={handleCopyRoomId}
                    className="copy-btn hover:scale-105 transition-transform"
                    title="Copy Room ID"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={themeClasses.subtleText}>
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                    </svg>
                  </button>
                </div>
              )}

              <div className={`user-role ${isHost ? 'host' : 'viewer'} rounded-2xl px-4 py-2 font-semibold border transition-all duration-300 ${isHost ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-gray-500/10 border-gray-500/30 text-gray-400'}`}>
                <div className={`role-dot w-3 h-3 rounded-full ${isHost ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
                <span>{isHost ? 'Host' : 'Viewer'}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={leaveRoom} 
            className={`leave-btn ${themeClasses.leaveBtn} rounded-2xl px-6 py-3 font-bold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 ${themeClasses.shadow}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
            Leave Room
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`watchparty-main ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 to-black' : 'bg-gradient-to-br from-gray-50 to-white'}`}>
        {/* Video Area */}
        <section className="video-section p-4 md:p-6 lg:p-8">
          <div className="video-container w-full h-full rounded-3xl overflow-hidden shadow-2xl">
            <VideoPlayer />
            <ReactionOverlay />
          </div>
        </section>

        {/* Sidebar with tabs */}
        <aside className={`watchparty-sidebar ${themeClasses.sidebar} ${themeClasses.border} backdrop-blur-xl rounded-l-3xl transition-colors duration-300`}>
          <div className="sidebar-tabs p-4 border-b">
            <button
              className={`sidebar-tab rounded-2xl px-4 py-3 font-semibold transition-all duration-300 ${activeSidebarTab === 'participants' ? themeClasses.tabActive + ' shadow-lg scale-105' : themeClasses.tabInactive}`}
              onClick={() => setActiveSidebarTab('participants')}
            >
              👥 Participants
            </button>
            <button
              className={`sidebar-tab rounded-2xl px-4 py-3 font-semibold transition-all duration-300 ${activeSidebarTab === 'chat' ? themeClasses.tabActive + ' shadow-lg scale-105' : themeClasses.tabInactive}`}
              onClick={() => setActiveSidebarTab('chat')}
            >
              💬 Chat
            </button>
          </div>

          <div className="sidebar-body p-4">
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