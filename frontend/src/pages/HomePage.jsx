// src/pages/HomePage.jsx
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import GroupChatContainer from "../components/GroupChatContainer";
import NoChatSelected from "../components/NoChatSelected";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { Users, X } from "lucide-react";

export default function HomePage() {
  const { selectedUser } = useChatStore();
  const { selectedGroup } = useGroupStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* Mobile: lock body scroll to prevent page-level scroll (fixes rubber-banding) */
  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      document.documentElement.classList.add("mobile-chat-active");
      return () => document.documentElement.classList.remove("mobile-chat-active");
    }
  }, []);

  return (
    <div className="h-screen w-full min-h-[100dvh] bg-gray-50 dark-mode-bg flex flex-col overflow-hidden md:relative mobile-chat-root">

      {/* ==================== NAVBAR (WITH MOBILE SIDEBAR BUTTON) ==================== */}
      <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

      {/* ==================== MAIN AREA: Two-column layout, aligned top to bottom ==================== */}
      <div className="flex flex-1 min-h-0" style={{ paddingTop: "calc(3.5rem + env(safe-area-inset-top, 0px))" }}>

        {/* DESKTOP SIDEBAR - fixed width 320px, full height, overflow scroll */}
        <div className="hidden md:flex md:w-[320px] md:flex-shrink-0 md:h-full md:min-h-0 md:overflow-hidden sidebar-separator">
          <Sidebar />
        </div>

        {/* MAIN CHAT PANEL - flex: 1, same height as sidebar */}
        <div className="flex-1 min-h-0 h-full flex flex-col bg-white overflow-hidden dark-mode-bg">
            {selectedUser ? (
              <ChatContainer />
            ) : selectedGroup ? (
              <GroupChatContainer />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center select-none">
                <NoChatSelected />
              </div>
            )}
          </div>
      </div>

      {/* ==================== MOBILE DRAWER SIDEBAR ==================== */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex items-stretch" role="dialog" aria-modal="true">

          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer Panel - responsive width */}
          <div className="relative w-[320px] sm:w-[340px] max-w-[90vw] h-full shadow-xl z-50 flex flex-col overflow-hidden sidebar-theme">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/20 shrink-0">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Users className="w-5 h-5" />
                <span className="font-medium">Contacts</span>
              </div>

              <button
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/20 text-gray-700 dark:text-white transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Sidebar Content */}
            <div className="flex-1 overflow-y-auto">
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
