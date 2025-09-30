import { useMusicStore } from "../store/musicStore";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { SkipBack, SkipForward, Play, Pause } from "lucide-react";
import lottie from "lottie-web";
import { defineElement } from "@lordicon/element";

defineElement(lottie.loadAnimation);

const socket = io(
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : import.meta.env.REACT_APP_BACKEND_URL || "https://chitchat-vvxt.onrender.com"
);

const formatTime = (seconds) => {
  if (!seconds) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
};

const MusicPlayer = ({ roomId }) => {
  const { currentSong, songName, isPlaying, showGif, showDiscoLight, setCurrentSong, setIsPlaying } = useMusicStore();
  const [uploadedSong, setUploadedSong] = useState(null);
  const [uploadedSongName, setUploadedSongName] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const [currentGif, setCurrentGif] = useState("/select_a_song.gif");

  useEffect(() => {
    if (isPlaying) {
      setCurrentGif("/aesthetic.gif");
    } else {
      setCurrentGif("/select_a_song.gif");
    }
  }, [isPlaying]);
  

  useEffect(() => {
    if (roomId) {
      socket.emit("join-room", roomId);
    }
  }, [roomId]);

  useEffect(() => {
    socket.on("music-sync", async ({ action, songUrl, songName, currentTime }) => {
      console.log("Received from socket:", { songUrl, songName, currentTime });
      if (!songUrl) return;

      if (action === "play") {
        setCurrentSong(songUrl, songName);
        console.log("Updated song name in state:", songName);
        setIsPlaying(true);
        if (audioRef.current) {
          audioRef.current.src = songUrl;
          audioRef.current.onloadedmetadata = () => {
            setDuration(audioRef.current.duration);
            if (currentTime) {
              audioRef.current.currentTime = currentTime;
            }
            audioRef.current.play();
          };
        }
      } else if (action === "pause") {
        setIsPlaying(false);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = currentTime;
        }
      }
    });

    return () => {
      socket.off("music-sync");
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateCurrentTime = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener("timeupdate", updateCurrentTime);

    return () => {
      audio.removeEventListener("timeupdate", updateCurrentTime);
    };
  }, []);

  
  const truncateText = (text, maxLength) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  const playSong = (songUrl, name) => {
    if (!songUrl) return;
    const truncatedName = truncateText(name,30);
    console.log("Truncated song name in playSong portion:",truncatedName);

    setCurrentSong(songUrl, truncatedName);
    setIsPlaying(true);

    if (audioRef.current) {
      audioRef.current.src = songUrl;
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }

    socket.emit("music-sync", {
      roomId,
      action: "play",
      songUrl: songUrl,
      songName: truncatedName,
      currentTime: 0,
    });
  };

  const togglePlayPause = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);

    if (audioRef.current) {
      if (newState) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }

    socket.emit("music-sync", {
      roomId,
      action: newState ? "play" : "pause",
      songUrl: currentSong,
      songName: songName,
      currentTime: audioRef.current ? audioRef.current.currentTime : 0,
    });
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "my_preset");
  
    try {
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dbi3tuuli/upload",
        formData
      );
  
      const uploadedUrl = response.data.secure_url;
      console.log("Cloudinary Song Link:",uploadedUrl)
      const name = file.name.replace(/\.[^/.]+$/, "");
      console.log("Extracted song name:", name);
  
      setUploadedSong(uploadedUrl);
      setCurrentGif("/select_a_song.gif")
      setUploadedSongName(name);
      playSong(uploadedUrl, name);  
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-black shadow-lg text-center w-full h-full">
        <div className="flex flex-col items-center relative top-[30px] -right-[35px] 
  w-[300px] h-[300px] bg-gray-500 shadow-lg rounded-2xl border border-gray-700 overflow-hidden">
  <img src={currentGif} alt="GIF animation" className="w-full h-full object-cover" />
  
</div>
      

      <div className="flex flex-col items-center relative top-[18px]">
        {isPlaying ? 
      <lord-icon 
      src="/Animation - 1741370233569 (1).json"
      trigger="loop"
      style={{ width: "180px", height: "90px", cursor: "pointer" }}
    ></lord-icon>
      :
      <lord-icon 
        src="/Main Scene (1).json"
        style={{ width: "180px", height: "90px", cursor: "pointer" }}
      ></lord-icon>
      }
      </div>

      {songName && (
        <div className="text-center mt-2 text-white font-semibold relative -top-[10px]">
          {songName}
        </div>
      )}

      <div className="flex items-center w-full mt-2 relative -top-[10px]">
        
        <span className="text-sm text-white">{formatTime(currentTime)}</span>
        <input
          type="range"
          className="flex-grow mx-2 accent-green-500"
          min="0"
          max={duration}
          value={currentTime}
          onChange={(e) => {
            const newTime = e.target.value;
            setCurrentTime(newTime);
            audioRef.current.currentTime = newTime;
          }}
        />
        <span className="text-sm text-white">{formatTime(duration)}</span>
      </div>

      <div className="flex items-center justify-between mt-3">
  {/* Left Side - Upload Button */}
  <div className="flex items-center space-x-4 relative top-[60px]">
  {/* Upload Song Button */}
  <div className="relative group">
    <lord-icon 
      src="/wired-flat-1093-add-song-hover-pinch.json" 
      trigger="loop" 
      style={{ width: "60px", height: "60px", cursor: "pointer" }}
      onClick={() => document.getElementById("music-upload").click()}
    ></lord-icon>
    {/* Tooltip for Upload */}
    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      Upload Song
    </span>
  </div>

  {/* Play Uploaded Song Button */}
  <div className="relative group">
    <lord-icon 
      src="/wired-flat-43-music-note-hover-bounce (1).json" 
      trigger="loop" 
      style={{ width: "40px", height: "40px", cursor: "pointer" }}
      onClick={() => playSong(uploadedSong, uploadedSongName)}
    ></lord-icon>
    {/* Tooltip for Play */}
    <span className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      Play Uploaded Song
    </span>
  </div>
</div>

  {/* Center Controls */}
  <div className="flex items-center space-x-4 ml-16 relative left-[-65px] -top-[20px] z-[0]">
    
    <SkipBack size={30} className=" text-white cursor-pointer" onClick={() => (audioRef.current.currentTime -= 10)} />
    <button className=" bg-gray-800 text-white p-2 rounded-full" onClick={togglePlayPause}>
      {isPlaying ? <Pause size={30} /> : <Play size={30}/>}
    </button>
    <SkipForward size={30} className="text-white cursor-pointer" onClick={() => (audioRef.current.currentTime += 10)} />
    
    {showDiscoLight && (
        <div className="flex flex-col items-center absolute top-[25px] right-[34px] z-[-1]">
      <lord-icon 
      src="/wired-flat-1062-disco-ball-hover-pinch.json"
      trigger={isPlaying ? "loop" : "hover"}
      style={{ width: "70px", height: "70px", cursor: "pointer" }}
    ></lord-icon>
      </div>
      )}
  </div>

  {/* Right Side - Volume Control */}
  <div className="flex items-center space-x-2 relative right-[10px] top-[60px] group">
    <lord-icon 
      src="/wired-lineal-1054-amazon-echo-speaker-hover-pinch.json" 
      trigger="loop" 
      style={{ width: "60px", height: "60px", cursor: "pointer" }}
    ></lord-icon>
    <input 
    type="range" 
    className="absolute -top-[125px] left-[85px] w-24 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rotate-[-90deg] origin-bottom-left accent-green-500"
    min="0" 
    max="1" 
    step="0.01" 
    value={audioRef.current?.volume || 1} 
    onChange={(e) => { audioRef.current.volume = e.target.value; }} 
  />
  </div>
</div>

      <input type="file" accept="audio/mp3" onChange={handleUpload} className="hidden" id="music-upload" />
      <audio ref={audioRef} />
    </div>
  );
};

export default MusicPlayer;
