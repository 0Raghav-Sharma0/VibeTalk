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
  const togglePlayPause = () => {
    if (!currentSong) return;

    const audio = audioRef.current;
    const next = !isPlaying;
    setIsPlaying(next);

    socket.emit("music-sync", {
      roomId,
      action: next ? "play" : "pause",
      songUrl: currentSong,
      songName,
      currentTime: audio.currentTime,
    });
  };

  /* ================= SEEK ================= */
  const seek = (t) => {
    const audio = audioRef.current;
    audio.currentTime = t;
    setCurrentTime(t);

    socket.emit("music-sync", {
      roomId,
      action: "seek",
      songUrl: currentSong,
      songName,
      currentTime: t,
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
    <div className="h-full flex flex-col bg-gradient-to-b from-base-100 via-base-200/60 to-base-300/40 border-l shadow-xl">
      {/* HEADER */}
      <div className="px-6 py-4 flex justify-between items-center border-b">
        <div className="flex items-center gap-4">
          <img src={currentGif} className="w-14 h-14 rounded-xl object-cover" />
          <div>
            <h3 className="font-semibold truncate">
              {songName || "No song selected"}
            </h3>
            <p className="text-xs opacity-60">
              {currentSong ? "🎶 Now Playing" : "Idle"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <motion.div whileHover={{ scale: 1.1 }} className="p-2 rounded-lg border">
              <lord-icon
                src="/wired-flat-1093-add-song-hover-pinch.json"
                trigger="hover"
                style={{ width: 32, height: 32 }}
              />
            </motion.div>
            <input hidden type="file" accept=".mp3" onChange={handleUpload} />
          </label>

          <button onClick={onClose} className="p-2 rounded-lg hover:bg-base-200">
            <X />
          </button>
        </div>
      </div>

      {/* ART */}
      <div className="p-6">
        <img src={currentGif} className="w-full h-56 rounded-2xl object-cover" />
      </div>

      {/* CONTROLS */}
      <div className="px-6">
        <div className="flex justify-center gap-6 items-center">
          <SkipBack onClick={() => seek(currentTime - 10)} />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={togglePlayPause}
            className="w-16 h-16 rounded-full bg-primary text-white"
          >
            {isPlaying ? <Pause /> : <Play />}
          </motion.button>
          <SkipForward onClick={() => seek(currentTime + 10)} />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-xs">{formatTime(duration)}</span>
        </div>

        <div className="mt-4 flex justify-center gap-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ scaleY: showVisualizer ? 0.3 + Math.random() : 0.3 }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="w-1 h-6 bg-primary rounded"
            />
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-auto px-6 py-4 border-t">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
      </div>
    </div>
  );
};

export default MusicPlayer;
