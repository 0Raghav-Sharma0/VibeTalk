// src/pages/HomePage.jsx
import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import NoChatSelected from "../components/NoChatSelected";
import { useChatStore } from "../store/useChatStore";
import { Users, X } from "lucide-react";

export default function HomePage() {
  const { selectedUser } = useChatStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-full bg-base-200 text-base-content flex flex-col overflow-hidden">

      {/* ==================== NAVBAR (WITH MOBILE SIDEBAR BUTTON) ==================== */}
      <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

      {/* ==================== MAIN AREA ==================== */}
      <div className="flex flex-1 overflow-hidden pt-14">

        {/* DESKTOP SIDEBAR */}
        <div className="hidden md:block md:w-72">
          <Sidebar />
        </div>

        {/* MAIN CHAT PANEL */}
        <div className="flex-1 bg-base-200 overflow-hidden">
          {selectedUser ? (
            <ChatContainer />
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

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-full h-full bg-base-200 shadow-xl z-50 flex flex-col">

            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 bg-base-100">
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
