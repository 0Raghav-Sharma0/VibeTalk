// src/pages/WatchPartyPage.jsx
import React, { useState } from 'react';
import { useWatchParty } from '../contexts/WatchPartyContext';
import WatchParty from '../components/WatchParty';
import './WatchPartyPage.css';

const WatchPartyPage = () => {
  const { roomId, createRoom, joinRoom } = useWatchParty();
  const [videoUrl, setVideoUrl] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [videoType, setVideoType] = useState('youtube');

  const handleCreateRoom = () => {
    if (!videoUrl.trim()) {
      alert('Please enter a video URL');
      return;
    }
    createRoom(videoUrl, videoType);
  };

  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) {
      alert('Please enter a room ID');
      return;
    }
    joinRoom(joinRoomId);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoType('local');
    } else {
      alert('Please select a valid video file');
    }
  };

  // If already in a room, show the watch party
  if (roomId) {
    return <WatchParty />;
  }

  // Otherwise, show the lobby
  return (
    <div className="watchparty-lobby">
      <div className="lobby-container">
        <h1 className="lobby-title">🎬 Watch Party</h1>
        <p className="lobby-subtitle">Watch videos together in sync with your friends!</p>

        <div className="lobby-content">
          {/* Create Room Section */}
          <div className="lobby-section">
            <h2>Create a Watch Party</h2>
            
            <div className="video-type-selector">
              <button
                className={`type-btn ${videoType === 'youtube' ? 'active' : ''}`}
                onClick={() => setVideoType('youtube')}
              >
                📺 YouTube
              </button>
              <button
                className={`type-btn ${videoType === 'local' ? 'active' : ''}`}
                onClick={() => setVideoType('local')}
              >
                📁 Local File
              </button>
            </div>

            {videoType === 'youtube' ? (
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Paste YouTube URL here..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="lobby-input"
                />
              </div>
            ) : (
              <div className="input-group">
                <label className="file-upload-btn">
                  Choose Video File
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </label>
                {videoUrl && <span className="file-selected">✓ File selected</span>}
              </div>
            )}

            <button onClick={handleCreateRoom} className="primary-btn">
              Create Room
            </button>
          </div>

          <div className="lobby-divider">
            <span>OR</span>
          </div>

          {/* Join Room Section */}
          <div className="lobby-section">
            <h2>Join a Watch Party</h2>
            <div className="input-group">
              <input
                type="text"
                placeholder="Enter Room ID..."
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                className="lobby-input"
              />
            </div>
            <button onClick={handleJoinRoom} className="secondary-btn">
              Join Room
            </button>
          </div>
        </div>

        {/* Features List */}
        <div className="features-list">
          <h3>Features:</h3>
          <ul>
            <li>🎥 Synchronized playback across all devices</li>
            <li>💬 Real-time chat with participants</li>
            <li>❤️ Send reactions during the video</li>
            <li>👥 See who's watching with you</li>
            <li>🎯 Host controls for play/pause/seek</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WatchPartyPage;