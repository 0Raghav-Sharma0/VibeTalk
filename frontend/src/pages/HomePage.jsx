// src/pages/HomePage.jsx
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import GroupChatContainer from "../components/GroupChatContainer";
import NoChatSelected from "../components/NoChatSelected";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import MusicPlayerDrawer from "../components/MusicPlayerDrawer";
import { getMusicRoomId } from "../utils/musicRoom";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useMobileViewportInsets } from "../hooks/useMobileViewportInsets";
import { DURATION, drawerTransition } from "../lib/motionPresets";
import { Users, X } from "lucide-react";

export default function HomePage() {
  const { selectedUser } = useChatStore();
  const { selectedGroup } = useGroupStore();
  const { authUser } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const musicRoomId = getMusicRoomId(authUser, selectedUser, selectedGroup);
  const reducedMotion = useReducedMotion();

  const drawerVariants = drawerTransition(reducedMotion, "left");

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      document.documentElement.classList.add("mobile-chat-active");
      return () => document.documentElement.classList.remove("mobile-chat-active");
    }
  }, []);

  useMobileViewportInsets();

  return (
    <div className="h-screen w-full min-h-[100dvh] bg-gray-50 dark-mode-bg flex flex-col overflow-hidden md:relative mobile-chat-root">

      <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

      <div
        className="flex flex-1 min-h-0"
        style={{ paddingTop: "calc(3.5rem + env(safe-area-inset-top, 0px))" }}
      >
        <div className="hidden md:flex md:w-[320px] md:flex-shrink-0 md:h-full md:min-h-0 md:overflow-hidden sidebar-separator">
          <Sidebar />
        </div>

        <div className="flex-1 min-h-0 h-full flex flex-col bg-white overflow-hidden dark-mode-bg relative">
          {selectedUser ? (
            <ChatContainer key={`dm-${selectedUser._id}`} />
          ) : selectedGroup ? (
            <GroupChatContainer key={`grp-${selectedGroup._id}`} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center select-none">
              <NoChatSelected />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-stretch md:hidden"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : DURATION.fast }}
              onClick={() => setSidebarOpen(false)}
            />

            <motion.div
              className="relative w-[320px] sm:w-[340px] max-w-[90vw] h-full shadow-xl z-50 flex flex-col overflow-hidden sidebar-theme"
              initial={drawerVariants.initial}
              animate={drawerVariants.animate}
              exit={drawerVariants.exit}
              transition={{
                duration: reducedMotion ? 0 : DURATION.normal,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/20 shrink-0">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Contacts</span>
                </div>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/20 text-gray-700 dark:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                <Sidebar onClose={() => setSidebarOpen(false)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MusicPlayerDrawer roomId={musicRoomId} />
    </div>
  );
}
