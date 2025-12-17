// src/components/MusicPlayer.jsx
import React, { useEffect, useRef, useState } from "react";
import { SkipBack, SkipForward, Play, Pause, X } from "lucide-react";
import { useMusicStore } from "../store/musicStore";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import axios from "axios";
import lottie from "lottie-web";
import { defineElement } from "@lordicon/element";

defineElement(lottie.loadAnimation);

/* ================= SOCKET ================= */
const socket = io(
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : import.meta.env.VITE_BACKEND_URL || "https://blah-blah-3.onrender.com"
);

/* ================= GLOBAL AUDIO (🔥 FIX) ================= */
const globalAudio =
  window.__GLOBAL_MUSIC_AUDIO__ ||
  (window.__GLOBAL_MUSIC_AUDIO__ = new Audio());

/* ================= UTILS ================= */
const formatTime = (s = 0) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? "0" : ""}${sec}`;
};

const truncateText = (t, m = 30) =>
  typeof t === "string" && t.length > m ? t.slice(0, m) + "..." : t;

/* ================= COMPONENT ================= */
const MusicPlayer = ({ roomId, onClose }) => {
  const {
    currentSong,
    songName,
    isPlaying,
    setCurrentSong,
    setIsPlaying,
  } = useMusicStore();

  const audioRef = useRef(globalAudio);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(audioRef.current.volume || 1);
  const [currentGif, setCurrentGif] = useState("/select_a_song.gif");
  const [showVisualizer, setShowVisualizer] = useState(false);

  /* ================= GIF ================= */
  useEffect(() => {
    setCurrentGif(isPlaying ? "/aesthetic.gif" : "/select_a_song.gif");
  }, [isPlaying]);

  /* ================= JOIN ROOM ================= */
  useEffect(() => {
    if (roomId) socket.emit("join-room", roomId);
  }, [roomId]);

  /* ================= SOCKET SYNC ================= */
  useEffect(() => {
    const handler = ({ action, songUrl, songName, currentTime }) => {
      const audio = audioRef.current;

      if (action === "play") {
        if (audio.src !== songUrl) audio.src = songUrl;
        setCurrentSong(songUrl, songName);
        setIsPlaying(true);
        audio.currentTime = currentTime || 0;
        audio.play().catch(() => {});
      }

      if (action === "pause") {
        setIsPlaying(false);
        audio.pause();
      }

      if (action === "seek") {
        audio.currentTime = currentTime;
        setCurrentTime(currentTime);
      }
    };

    socket.on("music-sync", handler);
    return () => socket.off("music-sync", handler);
  }, [setCurrentSong, setIsPlaying]);

  /* ================= AUDIO EVENTS ================= */
  useEffect(() => {
    const audio = audioRef.current;

    const sync = () => {
      setCurrentTime(audio.currentTime || 0);
      setDuration(audio.duration || 0);
    };

    audio.addEventListener("timeupdate", sync);
    audio.addEventListener("loadedmetadata", sync);

    // 🔥 restore state on reopen
    sync();

    return () => {
      audio.removeEventListener("timeupdate", sync);
      audio.removeEventListener("loadedmetadata", sync);
    };
  }, []);

  /* ================= VOLUME ================= */
  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  /* ================= PLAY / PAUSE ================= */
  const togglePlayPause = async () => {
    if (!currentSong) return;

    const audio = audioRef.current;
    const next = !isPlaying;
    
    try {
      if (next) {
        if (!audio.src || audio.src !== currentSong) {
          audio.src = currentSong;
        }
        await audio.play();
      } else {
        audio.pause();
      }
      
      setIsPlaying(next);
      
      socket.emit("music-sync", {
        roomId,
        action: next ? "play" : "pause",
        songUrl: currentSong,
        songName,
        currentTime: audio.currentTime,
      });
    } catch (error) {
      console.error("Playback error:", error);
      setIsPlaying(false);
    }
  };

  /* ================= SEEK ================= */
  const seek = (t) => {
    const audio = audioRef.current;
    const newTime = Math.max(0, Math.min(t, duration || 0));
    audio.currentTime = newTime;
    setCurrentTime(newTime);

    socket.emit("music-sync", {
      roomId,
      action: "seek",
      songUrl: currentSong,
      songName,
      currentTime: newTime,
    });
  };

  /* ================= MP3 UPLOAD ================= */
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("audio")) {
      alert("Only MP3 allowed");
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", "my_preset");

    const res = await axios.post(
      "https://api.cloudinary.com/v1_1/dbi3tuuli/upload",
      form
    );

    const name = truncateText(file.name.replace(/\.[^/.]+$/, ""), 40);
    const audio = audioRef.current;

    audio.src = res.data.secure_url;
    audio.currentTime = 0;
    audio.play().catch(() => {});

    setCurrentSong(res.data.secure_url, name);
    setIsPlaying(true);

    socket.emit("music-sync", {
      roomId,
      action: "play",
      songUrl: res.data.secure_url,
      songName: name,
      currentTime: 0,
    });
  };

  /* ================= VISUALIZER ================= */
  useEffect(() => {
    if (!isPlaying) return setShowVisualizer(false);
    const t = setTimeout(() => setShowVisualizer(true), 300);
    return () => clearTimeout(t);
  }, [isPlaying]);

  /* ================= UI ================= */
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-emerald-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-l border-emerald-200 dark:border-gray-700 shadow-xl">
      {/* HEADER */}
      <div className="px-6 py-4 flex justify-between items-center border-b border-emerald-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <img 
            src={currentGif} 
            className="w-14 h-14 rounded-xl object-cover ring-2 ring-emerald-500/20 dark:ring-emerald-500/30" 
            alt="Album cover"
          />
          <div>
            <h3 className="font-semibold truncate text-emerald-900 dark:text-emerald-100">
              {songName || "No song selected"}
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              {currentSong ? (isPlaying ? "🎶 Now Playing" : "⏸️ Paused") : "Idle"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <motion.div 
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg border border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
            >
              <lord-icon
                src="/wired-flat-1093-add-song-hover-pinch.json"
                trigger="hover"
                style={{ width: 32, height: 32 }}
                colors="primary:#10b981,secondary:#059669"
              />
            </motion.div>
            <input hidden type="file" accept=".mp3" onChange={handleUpload} />
          </label>

          <button 
            onClick={onClose} 
            className="p-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ART */}
      <div className="p-6">
        <img 
          src={currentGif} 
          className="w-full h-56 rounded-2xl object-cover shadow-lg ring-2 ring-emerald-500/10 dark:ring-emerald-500/20" 
          alt="Album art"
        />
      </div>

      {/* CONTROLS */}
      <div className="px-6">
        <div className="flex justify-center gap-6 items-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => seek(currentTime - 10)}
            className="p-2 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={!currentSong}
          >
            <SkipBack size={24} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={togglePlayPause}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
              currentSong 
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 text-white hover:from-emerald-600 hover:to-teal-600 dark:hover:from-emerald-500 dark:hover:to-teal-500" 
                : "bg-emerald-200 dark:bg-emerald-900/50 text-emerald-400 dark:text-emerald-500 cursor-not-allowed"
            } transition-all`}
            disabled={!currentSong}
          >
            {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => seek(currentTime + 10)}
            className="p-2 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={!currentSong}
          >
            <SkipForward size={24} />
          </motion.button>
        </div>

        {/* PROGRESS BAR */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-emerald-700 dark:text-emerald-300 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            className="flex-1 h-2 bg-emerald-200 dark:bg-emerald-900/50 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-emerald-500 [&::-webkit-slider-thumb]:to-teal-500 dark:[&::-webkit-slider-thumb]:from-emerald-500 dark:[&::-webkit-slider-thumb]:to-teal-500"
            disabled={!currentSong}
          />
          <span className="text-xs text-emerald-700 dark:text-emerald-300 w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* VISUALIZER */}
        <div className="mt-4 flex justify-center gap-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                scaleY: showVisualizer ? 0.3 + Math.random() : 0.3,
                backgroundColor: showVisualizer 
                  ? `hsl(${140 + Math.random() * 40}, 70%, 50%)` 
                  : "#d1fae5"
              }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="w-1 h-6 rounded bg-gradient-to-t from-emerald-400 to-emerald-500 dark:from-emerald-500 dark:to-teal-500"
            />
          ))}
        </div>
      </div>

      {/* FOOTER - VOLUME */}
      <div className="mt-auto px-6 py-4 border-t border-emerald-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-sm text-emerald-700 dark:text-emerald-300">🔈</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="flex-1 h-2 bg-emerald-200 dark:bg-emerald-900/50 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-emerald-500 [&::-webkit-slider-thumb]:to-teal-500 dark:[&::-webkit-slider-thumb]:from-emerald-500 dark:[&::-webkit-slider-thumb]:to-teal-500"
          />
          <span className="text-sm text-emerald-700 dark:text-emerald-300 w-12">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;