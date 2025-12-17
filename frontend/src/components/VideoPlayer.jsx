// src/components/VideoPlayer.jsx
import React, { useEffect, useRef, useState } from "react";
import { useWatchParty } from "../contexts/WatchPartyContext";
import { useThemeStore } from "../store/useThemeStore";
import "./VideoPlayer.css";

const VideoPlayer = () => {
  const {
    videoState,
    syncPlayback,
    isHost,
    setVideoState,
    canControlVideo,
  } = useWatchParty();

  const { theme } = useThemeStore();

  const playerRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const isSyncing = useRef(false);
  const [ytReady, setYtReady] = useState(false);

  /* ================= THEME ================= */
  const containerClass =
    theme === "light"
      ? "bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300"
      : "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700";

  /* ================= LOAD YOUTUBE API ONCE ================= */
  useEffect(() => {
    if (!window.YT) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
      window.onYouTubeIframeAPIReady = () => setYtReady(true);
    } else {
      setYtReady(true);
    }
  }, []);

  const getVideoId = (url) => {
    const match = url.match(
      /^.*((youtu.be\/)|(v\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
    );
    return match && match[6]?.length === 11 ? match[6] : null;
  };

  /* ================= INIT YOUTUBE PLAYER ================= */
  useEffect(() => {
    if (
      videoState.type !== "youtube" ||
      !ytReady ||
      !videoState.url ||
      ytPlayerRef.current
    )
      return;

    const videoId = getVideoId(videoState.url);
    if (!videoId) return;

    ytPlayerRef.current = new window.YT.Player("youtube-player", {
      videoId,
      playerVars: {
        controls: 1,        // ✅ REQUIRED for fullscreen
        fs: 1,              // ✅ fullscreen enabled
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        disablekb: canControlVideo ? 0 : 1,
      },
      events: {
        onReady: (e) => {
          if (videoState.currentTime > 0)
            e.target.seekTo(videoState.currentTime, true);
          if (videoState.playing) e.target.playVideo();
        },
        onStateChange: (e) => {
          if (!canControlVideo || isSyncing.current) return;

          const currentTime = e.target.getCurrentTime();
          const duration = e.target.getDuration();

          if (e.data === window.YT.PlayerState.PLAYING) {
            syncPlayback({ playing: true, currentTime, duration });
            setVideoState((p) => ({ ...p, playing: true }));
          }

          if (e.data === window.YT.PlayerState.PAUSED) {
            syncPlayback({ playing: false, currentTime, duration });
            setVideoState((p) => ({ ...p, playing: false }));
          }
        },
      },
    });

    return () => {
      ytPlayerRef.current?.destroy();
      ytPlayerRef.current = null;
    };
  }, [videoState.type, ytReady, canControlVideo]);

  /* ================= VIEWER SYNC ================= */
  useEffect(() => {
    if (!ytPlayerRef.current || isHost || videoState.type !== "youtube") return;

    isSyncing.current = true;
    const player = ytPlayerRef.current;

    const diff = Math.abs(player.getCurrentTime() - videoState.currentTime);
    if (diff > 1.5) player.seekTo(videoState.currentTime, true);

    videoState.playing ? player.playVideo() : player.pauseVideo();

    setTimeout(() => (isSyncing.current = false), 400);
  }, [videoState.playing, videoState.currentTime, isHost]);

  /* ================= LOCAL VIDEO ================= */
  useEffect(() => {
    if (
      videoState.type !== "local" ||
      !playerRef.current ||
      isHost
    )
      return;

    isSyncing.current = true;
    const v = playerRef.current;

    if (Math.abs(v.currentTime - videoState.currentTime) > 1.5) {
      v.currentTime = videoState.currentTime;
    }

    videoState.playing ? v.play() : v.pause();
    setTimeout(() => (isSyncing.current = false), 400);
  }, [videoState, isHost]);

  return (
    <div
      className={`relative w-full h-full rounded-3xl overflow-hidden ${containerClass}`}
    >
      {videoState.type === "youtube" ? (
        <div id="youtube-player" className="w-full h-full" />
      ) : (
        <video
          ref={playerRef}
          src={videoState.url}
          controls
          playsInline
          className="w-full h-full object-contain"
          onPlay={() =>
            canControlVideo &&
            syncPlayback({
              playing: true,
              currentTime: playerRef.current.currentTime,
              duration: playerRef.current.duration,
            })
          }
          onPause={() =>
            canControlVideo &&
            syncPlayback({
              playing: false,
              currentTime: playerRef.current.currentTime,
              duration: playerRef.current.duration,
            })
          }
        />
      )}
    </div>
  );
};

export default VideoPlayer;
