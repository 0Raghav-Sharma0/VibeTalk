import { AnimatePresence, motion } from "framer-motion";
import { useMusicStore } from "../store/musicStore";
import MusicPlayer from "./MusicPlayer";

export default function MusicPlayerDrawer({ roomId }) {
  const { isMusicPlayerOpen, toggleMusicPlayer } = useMusicStore();

  return (
    <AnimatePresence>
      {isMusicPlayerOpen && roomId ? (
        <>
          <motion.div
            className="fixed inset-0 z-[55] bg-black/45 md:bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => toggleMusicPlayer(false)}
            aria-hidden
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[60] flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-[#0b0b0f] md:max-w-[400px] md:border-l md:border-gray-200 dark:md:border-white/10"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            aria-label="Music player"
          >
            <MusicPlayer roomId={roomId} onClose={() => toggleMusicPlayer(false)} />
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
