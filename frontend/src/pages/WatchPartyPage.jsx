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

  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateRoom = async () => {
    setErrorMessage('');
    console.log('📺 Create button clicked on lobby');

    if (!videoUrl.trim()) {
      setErrorMessage('Please enter a video URL first.');
      return;
    }

    try {
      setIsCreating(true);
      setStatusMessage('Creating room…');
      console.log('🎬 Calling createRoom with:', { videoUrl, videoType });
      await createRoom(videoUrl.trim(), videoType);
      setStatusMessage('Room created! Joining…');
    } catch (err) {
      console.error('❌ Error creating room:', err);
      setErrorMessage('Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    setErrorMessage('');
    console.log('👥 Join button clicked on lobby');

    if (!joinRoomId.trim()) {
      setErrorMessage('Please enter a room ID first.');
      return;
    }

    try {
      setIsJoining(true);
      setStatusMessage('Joining room…');
      console.log('🎬 Calling joinRoom with:', { joinRoomId });
      await joinRoom(joinRoomId.trim());
      setStatusMessage('Joined room!');
    } catch (err) {
      console.error('❌ Error joining room:', err);
      setErrorMessage('Failed to join room. Please check the Room ID.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoType('local');
      setErrorMessage('');
      setStatusMessage('Local video selected.');
      console.log('📁 Selected local video file:', file.name);
    } else {
      setErrorMessage('Please select a valid video file.');
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
        <p className="lobby-subtitle">
          Watch videos together in sync with your friends!
        </p>

        {/* Simple debug / feedback for mobile */}
        {(statusMessage || errorMessage) && (
          <div
            className="lobby-status-banner"
            style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              fontSize: '0.9rem',
              fontWeight: 500,
              background: errorMessage
                ? 'rgba(239, 68, 68, 0.1)'
                : 'rgba(59, 130, 246, 0.12)',
              border: `1px solid ${
                errorMessage ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.4)'
              }`,
              color: errorMessage ? '#fca5a5' : '#bfdbfe',
            }}
          >
            {errorMessage || statusMessage}
          </div>
        )}

        <div className="lobby-content">
          {/* Create Room Section */}
          <div className="lobby-section">
            <h2>Create a Watch Party</h2>

            <div className="video-type-selector">
              <button
                type="button"
                className={`type-btn ${videoType === 'youtube' ? 'active' : ''}`}
                onClick={() => setVideoType('youtube')}
              >
                📺 YouTube
              </button>
              <button
                type="button"
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
                {videoUrl && (
                  <span className="file-selected">✓ File selected</span>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleCreateRoom}
              className="primary-btn"
              disabled={isCreating}
            >
              {isCreating ? 'Creating…' : 'Create Room'}
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
            <button
              type="button"
              onClick={handleJoinRoom}
              className="secondary-btn"
              disabled={isJoining}
            >
              {isJoining ? 'Joining…' : 'Join Room'}
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
