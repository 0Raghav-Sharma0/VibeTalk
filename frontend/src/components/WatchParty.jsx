// src/components/WatchParty.jsx
import toast from 'react-hot-toast';
import { useWatchParty } from '../contexts/WatchPartyContext';
import { Film, LogOut, Copy } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import ReactionOverlay from './ReactionOverlay';
import WatchPartyChatPanel from './WatchPartyChatPanel';
import './WatchParty.css';

const WatchParty = () => {
  const { roomId, leaveRoom, isHost } = useWatchParty();

  const handleCopyRoomId = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    toast.success('Room ID copied');
  };

  return (
    <div className="watchparty w-full min-w-0 h-full min-h-0 flex-1 overflow-hidden dark-mode-root text-gray-900 dark:text-white pt-14 flex flex-col">
      {/* Top Controls - single row */}
      <header className="watchparty-header shrink-0">
        <div className="header-controls">
          <div className="header-left">
            <div className="header-logo">
              <Film className="w-4 h-4 text-[#7D3DCF] dark:text-[#b29bff]" />
              <span>Watch Party</span>
            </div>
            {roomId && (
              <div className="room-id-pill">
                <span className="room-id-label">Room ID</span>
                <span className="room-id-code">{roomId}</span>
                <button
                  type="button"
                  onClick={handleCopyRoomId}
                  className="room-id-copy"
                  title="Copy"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className={`host-badge ${isHost ? 'is-host' : ''}`}>
              <span className="host-dot" />
              {isHost ? 'Host' : 'Viewer'}
            </div>
          </div>
          <button
            type="button"
            onClick={leaveRoom}
            className="leave-btn"
          >
            <LogOut className="w-4 h-4" />
            Leave
          </button>
        </div>
      </header>

      {/* Main: 70% Video | 30% Chat + Users */}
      <main className="watchparty-main">
        <section className="video-section">
          <div className="video-container">
            <VideoPlayer />
            <ReactionOverlay />
          </div>
        </section>

        <aside className="right-panel">
          <div className="chat-section">
            <WatchPartyChatPanel />
          </div>
        </aside>
      </main>
    </div>
  );
};

export default WatchParty;
