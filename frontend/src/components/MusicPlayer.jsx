import React, { useEffect, useRef, useState } from "react";
import { SkipBack, SkipForward, Play, Pause } from "lucide-react";
import { useMusicStore } from "../store/musicStore";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import axios from "axios";
import lottie from "lottie-web";
import { defineElement } from "@lordicon/element";

defineElement(lottie.loadAnimation);

// SOCKET
const socket = io(
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : import.meta.env.VITE_BACKEND_URL || "https://blah-blah-3.onrender.com"
);

// UTILS
const formatTime = (seconds) => {
  if (!seconds && seconds !== 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
};

const truncateText = (text, maxLength = 30) =>
  typeof text === "string" && text.length > maxLength
    ? text.slice(0, maxLength) + "..."
    : text;

// COMPONENT
const MusicPlayer = ({ roomId }) => {
  const {
    setCurrentSong,
    setIsPlaying,
    currentSong,
    songName,
    isPlaying
  } = useMusicStore();

  const [uploadedSong, setUploadedSong] = useState(null);
  const [uploadedSongName, setUploadedSongName] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentGif, setCurrentGif] = useState("/select_a_song.gif");
  const [volume, setVolume] = useState(1);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const audioRef = useRef(null);

  // GIF AUTO CHANGE
  useEffect(() => {
    setCurrentGif(isPlaying ? "/aesthetic.gif" : "/select_a_song.gif");
  }, [isPlaying]);

  // JOIN ROOM
  useEffect(() => {
    if (roomId) socket.emit("join-room", roomId);
  }, [roomId]);

  // ================================
  // 🔥 HANDLE SYNC EVENT FROM SERVER
  // ================================
  useEffect(() => {
    const handler = async ({ action, songUrl, songName: sName, currentTime: syncTime }) => {
      if (!songUrl && action !== "pause") return;

      const audio = audioRef.current;
      if (!audio) return;

      if (action === "play") {
        setCurrentSong(songUrl, sName);
        setIsPlaying(true);

        audio.src = songUrl;
        audio.onloadedmetadata = () => {
          setDuration(audio.duration || 0);
          if (syncTime) audio.currentTime = syncTime;
          audio.play().catch(() => {});
        };
      }

      if (action === "pause") {
        setIsPlaying(false);
        audio.pause();
        if (typeof syncTime === "number") audio.currentTime = syncTime;
      }

      if (action === "seek") {
        audio.currentTime = syncTime;
        setCurrentTime(syncTime);
      }
    };

    socket.on("music-sync", handler);
    return () => socket.off("music-sync", handler);
  }, []);

  // LOCAL PLAY/PAUSE LISTENER
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [isPlaying]);

  // TIME + DURATION TRACKING
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration || 0);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
    };
  }, []);

  // VOLUME UPDATE
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // ================================
  // 🔥 PLAY NEW SONG (LOCAL + SYNC)
  // ================================
  const playSong = (songUrl, name) => {
    const truncated = truncateText(name, 40);

    setCurrentSong(songUrl, truncated);
    setIsPlaying(true);

    const audio = audioRef.current;
    if (audio) {
      audio.src = songUrl;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }

    socket.emit("music-sync", {
      roomId,
      action: "play",
      songUrl,
      songName: truncated,
      currentTime: 0
    });
  };

  // ================================
  // 🔥 PLAY / PAUSE SYNC
  // ================================
  const togglePlayPause = () => {
    const newState = !isPlaying;
    const audio = audioRef.current;

    setIsPlaying(newState);

    if (audio) {
      if (newState) audio.play().catch(() => {});
      else audio.pause();
    }

    socket.emit("music-sync", {
      roomId,
      action: newState ? "play" : "pause",
      songUrl: currentSong,
      songName,
      currentTime: audio?.currentTime || 0
    });
  };

  // ================================
  // 🔥 SEEK SYNC
  // ================================
  const seek = (time) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = time;
    setCurrentTime(time);

    socket.emit("music-sync", {
      roomId,
      action: "seek",
      songUrl: currentSong,
      songName,
      currentTime: time
    });
  };

  // ================================
  // 🔥 SKIP SYNC
  // ================================
  const skip = (delta) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Math.max(0, Math.min(audio.duration, audio.currentTime + delta));
    audio.currentTime = newTime;
    setCurrentTime(newTime);

    socket.emit("music-sync", {
      roomId,
      action: "seek",
      songUrl: currentSong,
      songName,
      currentTime: newTime
    });
  };

  // ================================
  // 🔥 FILE UPLOAD
  // ================================
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", "my_preset");

    const res = await axios.post("https://api.cloudinary.com/v1_1/dbi3tuuli/upload", form);
    const url = res.data.secure_url;
    const name = file.name.replace(/\.[^/.]+$/, "");

    setUploadedSong(url);
    setUploadedSongName(name);
    playSong(url, name);
  };

  // VISUALIZER
  useEffect(() => {
    if (!isPlaying) {
      setShowVisualizer(false);
      return;
    }
    const t = setTimeout(() => setShowVisualizer(true), 300);
    return () => clearTimeout(t);
  }, [isPlaying]);

  // ==========================================
  // UI RENDERING
  // ==========================================
  return (
    <div className="h-full flex flex-col bg-base-100 border-l border-base-300">
      {/* HEADER */}
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border bg-base-200">
            <img src={currentGif} className="w-full h-full object-cover" />
          </div>

          <div className="min-w-0">
            <h3 className="text-lg font-semibold truncate">{songName || "No song selected"}</h3>
            <p className="text-xs opacity-60 truncate">{currentSong ? "Now playing" : "Idle"}</p>
          </div>
        </div>

        {/* UPLOAD + PLAY */}
        <div className="flex items-center gap-3">
          <label htmlFor="upload" className="cursor-pointer">
            <motion.div whileHover={{ scale: 1.1 }} className="p-2 rounded-md bg-base-200 border">
              <lord-icon src="/wired-flat-1093-add-song-hover-pinch.json" trigger="hover" style={{ width: 32, height: 32 }} />
            </motion.div>
          </label>

          <input id="upload" type="file" className="hidden" accept="audio/*" onChange={handleUpload} />

          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => uploadedSong && playSong(uploadedSong, uploadedSongName)}
            className="p-2 rounded-md bg-base-200 border"
          >
            <lord-icon src="/wired-flat-43-music-note-hover-bounce (1).json" trigger="hover" style={{ width: 32, height: 32 }} />
          </motion.button>
        </div>
      </div>

      {/* ARTWORK */}
      <div className="px-6 pb-4">
        <div className="w-full h-56 rounded-2xl overflow-hidden border bg-base-200">
          <img src={currentGif} className="w-full h-full object-cover" />
        </div>
      </div>

      {/* CONTROLS */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-center gap-6">
          <SkipBack size={28} onClick={() => skip(-10)} className="cursor-pointer opacity-80 hover:text-primary" />

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={togglePlayPause}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-xl"
          >
            {isPlaying ? <Pause size={26} className="text-primary-content" /> : <Play size={26} className="text-primary-content" />}
          </motion.button>

          <SkipForward size={28} onClick={() => skip(10)} className="cursor-pointer opacity-80 hover:text-primary" />
        </div>

        {/* Seek */}
        <div className="mt-4">
          <div className="flex items-center gap-3">
            <span className="text-xs w-10 opacity-60">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="text-xs w-10 opacity-60">{formatTime(duration)}</span>
          </div>

          {/* Visualizer */}
          <div className="mt-3 flex justify-center gap-1">
            {Array.from({ length: 16 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scaleY: showVisualizer ? (0.4 + Math.abs(Math.sin((i + currentTime) * 0.5))) : 0.4,
                }}
                transition={{ duration: 0.45, repeat: Infinity }}
                className="w-1 rounded bg-gradient-to-b from-primary to-secondary"
                style={{ height: `${10 + (i % 6)}px` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* VOLUME + STOP */}
      <div className="mt-auto px-6 py-4 border-t bg-base-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm opacity-70">Volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-40 accent-primary"
            />
          </div>

          <button
            onClick={() => {
              const audio = audioRef.current;
              setIsPlaying(false);
              setCurrentSong("", "");
              if (audio) {
                audio.pause();
                audio.src = "";
                setCurrentTime(0);
              }
              socket.emit("music-sync", {
                roomId,
                action: "pause",
                songUrl: "",
                songName: "",
                currentTime: 0
              });
            }}
            className="px-3 py-1 rounded-md bg-error/10 border border-error/30 text-error text-sm"
          >
            Stop
          </button>
        </div>
      </div>

      <audio ref={audioRef} />
    </div>
  );
};

export default MusicPlayer;