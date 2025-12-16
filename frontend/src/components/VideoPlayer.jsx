// src/components/VideoPlayer.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useWatchParty } from '../contexts/WatchPartyContext';
import { useThemeStore } from '../store/useThemeStore';
import './VideoPlayer.css';

const VideoPlayer = () => {
  const { videoState, syncPlayback, isHost, setVideoState, canControlVideo } = useWatchParty();
  const { theme } = useThemeStore();
  const playerRef = useRef(null);
  const youtubePlayerRef = useRef(null);
  const isSyncing = useRef(false);
  const [isYouTubeReady, setIsYouTubeReady] = useState(false);

  // Theme-based styles
  const getThemeStyles = () => {
    return {
      container: theme === 'light' 
        ? 'bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300' 
        : 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700',
      controls: theme === 'light' 
        ? 'text-gray-800' 
        : 'text-white',
      overlay: theme === 'light'
        ? 'rgba(255, 255, 255, 0.95)'
        : 'rgba(0, 0, 0, 0.85)'
    };
  };

  const themeStyles = getThemeStyles();

  // Load YouTube IFrame API
  useEffect(() => {
    if (videoState.type === 'youtube' && !window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setIsYouTubeReady(true);
      };
    } else if (window.YT && window.YT.Player) {
      setIsYouTubeReady(true);
    }
  }, [videoState.type]);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  // Initialize YouTube Player with theme
  useEffect(() => {
    if (videoState.type === 'youtube' && isYouTubeReady && videoState.url) {
      const videoId = getYouTubeVideoId(videoState.url);
      
      if (videoId && !youtubePlayerRef.current) {
        const playerVars = {
          autoplay: 0,
          controls: canControlVideo ? 1 : 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          color: theme === 'light' ? 'white' : 'red',
          iv_load_policy: 3,
          fs: 1,
          disablekb: !canControlVideo ? 1 : 0
        };

        youtubePlayerRef.current = new window.YT.Player('youtube-player', {
          videoId: videoId,
          playerVars: playerVars,
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: (event) => console.error('YouTube Player Error:', event.data)
          }
        });
      }
    }

    return () => {
      if (youtubePlayerRef.current && youtubePlayerRef.current.destroy) {
        youtubePlayerRef.current.destroy();
        youtubePlayerRef.current = null;
      }
    };
  }, [videoState.type, videoState.url, isYouTubeReady, canControlVideo, theme]);

  const onPlayerReady = (event) => {
    // Apply theme to YouTube player
    if (theme === 'light') {
      event.target.setOption('color', 'white');
    } else {
      event.target.setOption('color', 'red');
    }

    // Sync initial state
    if (videoState.currentTime > 0) {
      event.target.seekTo(videoState.currentTime, true);
    }
    if (videoState.playing) {
      event.target.playVideo();
    }
  };

  const onPlayerStateChange = (event) => {
    if (isSyncing.current) return;

    const player = event.target;
    const currentTime = player.getCurrentTime();
    const duration = player.getDuration();

    if (canControlVideo) {
      if (event.data === window.YT.PlayerState.PLAYING) {
        syncPlayback({ playing: true, currentTime, duration });
        setVideoState(prev => ({ ...prev, playing: true, currentTime, duration }));
      } else if (event.data === window.YT.PlayerState.PAUSED) {
        syncPlayback({ playing: false, currentTime, duration });
        setVideoState(prev => ({ ...prev, playing: false, currentTime, duration }));
      } else if (event.data === window.YT.PlayerState.ENDED) {
        syncPlayback({ playing: false, currentTime: duration, duration });
        setVideoState(prev => ({ ...prev, playing: false, currentTime: duration, duration }));
      }
    }
  };

  // Sync YouTube player with received state
  useEffect(() => {
    if (videoState.type === 'youtube' && youtubePlayerRef.current && !isHost) {
      isSyncing.current = true;

      const player = youtubePlayerRef.current;
      const currentTime = player.getCurrentTime ? player.getCurrentTime() : 0;
      const timeDiff = Math.abs(currentTime - videoState.currentTime);

      if (timeDiff > 1.5) {
        player.seekTo(videoState.currentTime, true);
      }

      if (videoState.playing && player.getPlayerState() !== window.YT.PlayerState.PLAYING) {
        player.playVideo();
      } else if (!videoState.playing && player.getPlayerState() === window.YT.PlayerState.PLAYING) {
        player.pauseVideo();
      }

      setTimeout(() => {
        isSyncing.current = false;
      }, 500);
    }
  }, [videoState.playing, videoState.currentTime, isHost, videoState.type]);

  // Handle local video player
  const handleLocalPlay = () => {
    if (canControlVideo) {
      const video = playerRef.current;
      syncPlayback({
        playing: true,
        currentTime: video.currentTime,
        duration: video.duration
      });
    }
  };

  const handleLocalPause = () => {
    if (canControlVideo) {
      const video = playerRef.current;
      syncPlayback({
        playing: false,
        currentTime: video.currentTime,
        duration: video.duration
      });
    }
  };

  const handleLocalSeeked = () => {
    if (canControlVideo) {
      const video = playerRef.current;
      syncPlayback({
        playing: !video.paused,
        currentTime: video.currentTime,
        duration: video.duration
      });
    }
  };

  // Sync local video with received state
  useEffect(() => {
    if (videoState.type === 'local' && playerRef.current && !isHost) {
      isSyncing.current = true;
      const video = playerRef.current;
      const timeDiff = Math.abs(video.currentTime - videoState.currentTime);

      if (timeDiff > 1.5) {
        video.currentTime = videoState.currentTime;
      }

      if (videoState.playing && video.paused) {
        video.play().catch(e => console.log('Play error:', e));
      } else if (!videoState.playing && !video.paused) {
        video.pause();
      }

      setTimeout(() => {
        isSyncing.current = false;
      }, 500);
    }
  }, [videoState.playing, videoState.currentTime, isHost, videoState.type]);

  return (
    <div className={`video-player-container ${themeStyles.container} ${!canControlVideo ? 'viewer-mode' : ''} rounded-3xl overflow-hidden transition-all duration-500`}>
      {videoState.type === 'youtube' ? (
        <div id="youtube-player" className="youtube-player w-full h-full"></div>
      ) : (
        <video
          ref={playerRef}
          src={videoState.url}
          controls={canControlVideo}
          className={`local-video-player w-full h-full object-contain ${themeStyles.controls}`}
          onPlay={handleLocalPlay}
          onPause={handleLocalPause}
          onSeeked={handleLocalSeeked}
          onEnded={() => {
            if (canControlVideo) {
              const video = playerRef.current;
              syncPlayback({
                playing: false,
                currentTime: video.duration,
                duration: video.duration
              });
            }
          }}
          playsInline
          preload="metadata"
        />
      )}
      
      {/* Viewer mode overlay */}
      {!canControlVideo && (
        <div className="absolute inset-0 bg-transparent z-10" title="Only host can control playback"></div>
      )}
    </div>
  );
};

export default VideoPlayer;