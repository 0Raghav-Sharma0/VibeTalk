// src/pages/HomePage.jsx
import { useState } from "react";
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

  return (
    <div className="h-screen w-full min-h-[100dvh] bg-base-200 text-base-content flex flex-col overflow-hidden">

      {/* ==================== NAVBAR (WITH MOBILE SIDEBAR BUTTON) ==================== */}
      <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

      {/* ==================== MAIN AREA: Two-column layout, aligned top to bottom ==================== */}
      <div className="flex flex-1 min-h-0" style={{ paddingTop: "calc(3.5rem + env(safe-area-inset-top, 0px))" }}>

        {/* DESKTOP SIDEBAR - fixed width 320px, full height, overflow scroll */}
        <div className="hidden md:flex md:w-[320px] md:flex-shrink-0 md:h-full md:min-h-0 md:overflow-hidden">
          <Sidebar />
        </div>

        {/* MAIN CHAT PANEL - flex: 1, same height as sidebar */}
        <div className="flex-1 min-h-0 h-full flex flex-col bg-base-200 overflow-hidden">
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
          <div className="relative w-[320px] sm:w-[340px] max-w-[90vw] h-full bg-base-100 dark:bg-base-200 shadow-xl z-50 flex flex-col">

            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-transparent dark:border-base-300/30 bg-base-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-medium">Contacts</span>
              </div>

              <button
                className="btn btn-ghost btn-square btn-sm"
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
