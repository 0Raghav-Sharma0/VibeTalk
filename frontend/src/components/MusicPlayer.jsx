import React, { useEffect, useRef, useState } from "react";
import { SkipBack, SkipForward, Play, Pause } from "lucide-react";
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

/* ================= UTILS ================= */
const formatTime = (seconds = 0) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

const truncateText = (text, max = 30) =>
  typeof text === "string" && text.length > max
    ? text.slice(0, max) + "..."
    : text;

/* ================= COMPONENT ================= */
const MusicPlayer = ({ roomId }) => {
  const {
    setCurrentSong,
    setIsPlaying,
    currentSong,
    songName,
    isPlaying,
  } = useMusicStore();

  const audioRef = useRef(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
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
      if (!audio) return;

      if (action === "play") {
        setCurrentSong(songUrl, songName);
        setIsPlaying(true);
        audio.src = songUrl;
        audio.onloadedmetadata = () => {
          setDuration(audio.duration || 0);
          audio.currentTime = currentTime || 0;
          audio.play().catch(() => {});
        };
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

  /* ================= VOLUME ================= */
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  /* ================= PLAY / PAUSE ================= */
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    setIsPlaying(!isPlaying);

    socket.emit("music-sync", {
      roomId,
      action: isPlaying ? "pause" : "play",
      songUrl: currentSong,
      songName,
      currentTime: audio.currentTime,
    });
  };

  /* ================= SEEK ================= */
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
      currentTime: time,
    });
  };

  /* ================= MP3 UPLOAD (FIXED) ================= */
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ MP3 ONLY
    const isMp3 =
      file.type === "audio/mpeg" ||
      file.name.toLowerCase().endsWith(".mp3");

    if (!isMp3) {
      alert("❌ Only MP3 files are allowed");
      e.target.value = "";
      return;
    }

    // ✅ SIZE LIMIT (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("❌ File too large (max 10MB)");
      e.target.value = "";
      return;
    }

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", "my_preset");

      const res = await axios.post(
        "https://api.cloudinary.com/v1_1/dbi3tuuli/upload",
        form
      );

      const name = truncateText(
        file.name.replace(/\.[^/.]+$/, ""),
        40
      );

      setCurrentSong(res.data.secure_url, name);
      setIsPlaying(true);

      const audio = audioRef.current;
      audio.src = res.data.secure_url;
      audio.currentTime = 0;
      audio.play().catch(() => {});

      socket.emit("music-sync", {
        roomId,
        action: "play",
        songUrl: res.data.secure_url,
        songName: name,
        currentTime: 0,
      });
    } catch (err) {
      console.error("Upload failed:", err);
      alert("❌ Upload failed");
    }
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
          <img
            src={currentGif}
            className="w-14 h-14 rounded-xl object-cover"
          />
          <div>
            <h3 className="font-semibold truncate">
              {songName || "No song selected"}
            </h3>
            <p className="text-xs opacity-60">
              {currentSong ? "🎶 Now Playing" : "Idle"}
            </p>
          </div>
        </div>

        <label className="cursor-pointer">
          <motion.div whileHover={{ scale: 1.1 }} className="p-2 rounded-lg border">
            <lord-icon
              src="/wired-flat-1093-add-song-hover-pinch.json"
              trigger="hover"
              style={{ width: 32, height: 32 }}
            />
          </motion.div>
          <input
            type="file"
            hidden
            accept=".mp3,audio/mpeg"
            onChange={handleUpload}
          />
        </label>
      </div>

      {/* ART */}
      <div className="p-6">
        <img
          src={currentGif}
          className="w-full h-56 rounded-2xl object-cover"
        />
      </div>

      {/* CONTROLS */}
      <div className="px-6">
        <div className="flex justify-center gap-6 items-center">
          <SkipBack onClick={() => seek(currentTime - 10)} />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={togglePlayPause}
            className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center"
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

        {/* VISUALIZER */}
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
      <div className="mt-auto px-6 py-4 border-t flex justify-between items-center">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
      </div>

      <audio ref={audioRef} />
    </div>
  );
};

export default MusicPlayer;
