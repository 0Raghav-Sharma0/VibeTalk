import React, { useState } from "react";
import { useWatchParty } from "../contexts/WatchPartyContext";
import WatchParty from "../components/WatchParty";
import { Youtube, Upload, Users, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const WatchPartyPage = () => {
  const { roomId, createRoom, joinRoom } = useWatchParty();

  const [videoUrl, setVideoUrl] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [videoType, setVideoType] = useState("youtube");

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (roomId) return <WatchParty />;

  const handleCreateRoom = async () => {
    setError("");
    if (!videoUrl.trim()) {
      setError("Please provide a video source.");
      return;
    }
    try {
      setLoading(true);
      setStatus("Creating room…");
      await createRoom(videoUrl.trim(), videoType);
    } catch {
      setError("Failed to create room.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    setError("");
    if (!joinRoomId.trim()) {
      setError("Enter a valid Room ID.");
      return;
    }
    try {
      setLoading(true);
      setStatus("Joining room…");
      await joinRoom(joinRoomId.trim());
    } catch {
      setError("Invalid Room ID.");
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("video/")) {
      setError("Please select a valid video file.");
      return;
    }
    setVideoUrl(URL.createObjectURL(file));
    setVideoType("local");
    setStatus(`Selected: ${file.name}`);
  };

  return (
    <div className="relative min-h-screen bg-base-200 text-base-content flex items-center justify-center px-4 overflow-hidden">

      {/* 🌿 Ambient green background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-[420px] h-[420px] bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-vignette" />
      </div>

      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8">

        {/* ================= CREATE PARTY ================= */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-base-100 border border-base-300 rounded-2xl p-7 shadow-xl"
        >
          <h1 className="text-2xl font-semibold mb-1">
            🎬 Watch Party
          </h1>
          <p className="text-sm text-base-content/60 mb-5">
            Watch videos together in perfect sync.
          </p>

          {(status || error) && (
            <div
              className={`mb-4 px-4 py-3 rounded-xl text-sm border
                ${
                  error
                    ? "bg-error/10 border-error/30 text-error"
                    : "bg-primary/10 border-primary/30 text-primary"
                }`}
            >
              {error || status}
            </div>
          )}

          {/* SOURCE TOGGLE */}
          <div className="flex gap-2 mb-4">
            {[
              { id: "youtube", icon: Youtube, label: "YouTube" },
              { id: "local", icon: Upload, label: "Local File" },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setVideoType(id)}
                className={`flex-1 py-2 rounded-lg font-medium transition
                  ${
                    videoType === id
                      ? "bg-primary text-primary-content shadow"
                      : "bg-base-200 border border-base-300 hover:bg-base-300"
                  }`}
              >
                <Icon size={16} className="inline mr-2" />
                {label}
              </button>
            ))}
          </div>

          {videoType === "youtube" ? (
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Paste YouTube link…"
              className="w-full px-4 py-2 mb-4 rounded-lg
                         bg-base-200 border border-base-300
                         focus:ring-2 focus:ring-primary/40 outline-none"
            />
          ) : (
            <label className="block mb-4">
              <div className="px-4 py-3 rounded-lg border border-dashed border-base-300
                              text-center cursor-pointer text-base-content/70
                              hover:bg-base-200">
                Choose video file
              </div>
              <input type="file" accept="video/*" hidden onChange={handleFile} />
            </label>
          )}

          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full py-3 rounded-xl font-medium
                       bg-primary text-primary-content
                       hover:opacity-90 transition"
          >
            {loading ? "Creating…" : "Create Watch Party"}
          </button>
        </motion.div>

        {/* ================= JOIN PARTY ================= */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-base-100 border border-base-300 rounded-2xl p-7 shadow-xl"
        >
          <h2 className="text-lg font-semibold mb-4">
            Join Existing Party
          </h2>

          <input
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
            placeholder="Enter Room ID"
            className="w-full px-4 py-2 mb-4 rounded-lg
                       bg-base-200 border border-base-300
                       focus:ring-2 focus:ring-primary/40 outline-none"
          />

          <button
            onClick={handleJoinRoom}
            disabled={loading}
            className="w-full py-3 rounded-xl font-medium
                       bg-base-200 border border-base-300
                       hover:border-primary hover:bg-base-300
                       flex items-center justify-center gap-2 transition"
          >
            <Users size={18} />
            Join Party
            <ArrowRight size={16} />
          </button>

          {/* FEATURES */}
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            {[
              "🎥 Synced playback",
              "💬 Live chat",
              "❤️ Reactions",
              "👑 Host controls",
              "📱 Mobile friendly",
            ].map((f) => (
              <span
                key={f}
                className="px-3 py-1 rounded-full
                           bg-base-200 border border-base-300
                           text-base-content/70"
              >
                {f}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WatchPartyPage;
