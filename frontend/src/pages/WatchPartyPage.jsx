import { useState, useEffect } from "react";
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

  /* On mobile: scroll to top when entering watch party (after join/create) so video is visible first */
  useEffect(() => {
    if (!roomId) return;
    const isMobile = window.matchMedia("(max-width: 1024px)").matches;
    if (isMobile) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [roomId]);

  if (roomId) {
    return (
      <div className="w-full min-w-full max-w-full h-screen min-h-[100dvh] overflow-hidden flex flex-col">
        <WatchParty />
      </div>
    );
  }

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
    <div className="min-h-screen dark-mode-root text-gray-900 dark:text-white flex items-center justify-center px-4">

      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8">

        {/* ================= CREATE PARTY ================= */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="dark-mode-bg border border-gray-200 dark:border-white/10 rounded-2xl p-7 shadow-xl"
        >
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            🎬 Watch Party
          </h1>

          <p className="text-sm text-gray-700 dark:text-white/70 mb-5">
            Watch videos together in perfect sync.
          </p>

          {(status || error) && (
            <div
              className={`mb-4 px-4 py-3 rounded-xl text-sm border
                ${
                  error
                    ? "bg-red-50 border-red-200 text-red-700 dark:bg-error/10 dark:border-error/30 dark:text-error"
                    : "bg-gray-100 border-transparent text-gray-800 dark:bg-white/10 dark:border-transparent dark:text-white/90"
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
                      ? "bg-[#7D3DCF] dark:bg-[#7D3DCF] text-white"
                      : "bg-gray-100 dark:bg-white/10 border border-transparent hover:bg-gray-200 dark:hover:bg-white/20 text-gray-800 dark:text-white"
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
                         bg-gray-100 dark:bg-white/10
                         border border-transparent
                         text-gray-900 dark:text-white
                         placeholder:text-gray-500 dark:placeholder:text-white/50
                         focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-500/50
                         outline-none"
            />
          ) : (
            <label className="block mb-4">
              <div className="px-4 py-3 rounded-lg border border-dashed border-transparent
                              text-center cursor-pointer
                              text-gray-700 dark:text-white/70
                              hover:bg-gray-100 dark:hover:bg-white/10">
                Choose video file
              </div>
              <input type="file" accept="video/*" hidden onChange={handleFile} />
            </label>
          )}

          {/* CREATE BUTTON */}
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold
                       bg-[#7D3DCF] text-white
                       hover:bg-[#9C66CC] dark:hover:bg-[#9C66CC] transition"
          >
            {loading ? "Creating…" : "Create Watch Party"}
          </button>
        </motion.div>

        {/* ================= JOIN PARTY ================= */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="dark-mode-bg border border-gray-200 dark:border-white/10 rounded-2xl p-7 shadow-xl"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Join Existing Party
          </h2>

          <input
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
            placeholder="Enter Room ID"
            className="w-full px-4 py-2 mb-4 rounded-lg
                       bg-gray-100 dark:bg-white/10
                       border border-transparent
                       text-gray-900 dark:text-white
                       placeholder:text-gray-500 dark:placeholder:text-white/50
                       focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-500/50
                       outline-none"
          />

          <button
            onClick={handleJoinRoom}
            disabled={loading}
            className="w-full py-3 rounded-xl font-medium
                       bg-gray-100 dark:bg-white/10
                       border border-transparent
                       hover:bg-gray-200 dark:hover:bg-white/20
                       flex items-center justify-center gap-2
                       text-gray-900 dark:text-white
                       transition"
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
                           bg-gray-100 dark:bg-white/10
                           border border-transparent
                           text-gray-700 dark:text-white/70"
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
