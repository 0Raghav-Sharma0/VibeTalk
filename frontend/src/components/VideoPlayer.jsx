// src/components/VideoPlayer.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useWatchParty } from '../contexts/WatchPartyContext';
import './VideoPlayer.css';

const VideoPlayer = () => {
  const { videoState, syncPlayback, isHost, setVideoState, canControlVideo } = useWatchParty();
  const playerRef = useRef(null);
  const youtubePlayerRef = useRef(null);
  const isSyncing = useRef(false);
  const [isYouTubeReady, setIsYouTubeReady] = useState(false);

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

  // Initialize YouTube Player
  useEffect(() => {
    if (videoState.type === 'youtube' && isYouTubeReady && videoState.url) {
      const videoId = getYouTubeVideoId(videoState.url);
      
      if (videoId && !youtubePlayerRef.current) {
        youtubePlayerRef.current = new window.YT.Player('youtube-player', {
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: canControlVideo ? 1 : 0, // Only show controls for host
            modestbranding: 1,
            rel: 0,
            playsinline: 1
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange
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
  }, [videoState.type, videoState.url, isYouTubeReady, canControlVideo]);

  const onPlayerReady = (event) => {
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

    // ONLY HOST can sync playback
    if (canControlVideo) {
      if (event.data === window.YT.PlayerState.PLAYING) {
        syncPlayback({ playing: true, currentTime, duration });
        setVideoState(prev => ({ ...prev, playing: true, currentTime, duration }));
      } else if (event.data === window.YT.PlayerState.PAUSED) {
        syncPlayback({ playing: false, currentTime, duration });
        setVideoState(prev => ({ ...prev, playing: false, currentTime, duration }));
      }
    }
  };

  // Sync YouTube player with received state (for participants)
  useEffect(() => {
    if (videoState.type === 'youtube' && youtubePlayerRef.current && !isHost) {
      isSyncing.current = true;

      const player = youtubePlayerRef.current;
      const currentTime = player.getCurrentTime ? player.getCurrentTime() : 0;
      const timeDiff = Math.abs(currentTime - videoState.currentTime);

      if (timeDiff > 1) {
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

  // Handle local video player - ONLY FOR HOST
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

  // Sync local video with received state (for participants)
  useEffect(() => {
    if (videoState.type === 'local' && playerRef.current && !isHost) {
      isSyncing.current = true;
      const video = playerRef.current;
      const timeDiff = Math.abs(video.currentTime - videoState.currentTime);

      if (timeDiff > 1) {
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
    <div className={`video-player-container ${!canControlVideo ? 'viewer-mode' : ''}`}>
      {videoState.type === 'youtube' ? (
        <div id="youtube-player" className="youtube-player"></div>
      ) : (
        <video
          ref={playerRef}
          src={videoState.url}
          controls={canControlVideo} // Only show controls for host
          className="local-video-player"
          onPlay={handleLocalPlay}
          onPause={handleLocalPause}
          onSeeked={handleLocalSeeked}
        />
      )}
    </div>
  );
};

export default VideoPlayer;