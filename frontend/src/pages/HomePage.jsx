import React from "react";
import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import NoChatSelected from "../components/NoChatSelected";
import { Search } from "lucide-react";

export default function HomePage() {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-screen w-full bg-base-200 text-base-content flex flex-col overflow-hidden">

      {/* Top Bar */}
      <div className="h-14 border-b border-base-300 flex items-center justify-between px-6 bg-base-100">
        <h1 className="text-lg font-semibold tracking-tight select-none text-base-content">
          VibeTalk
        </h1>

        {/* SEARCH BAR (Desktop) */}
        <div className="relative hidden md:block">
          <input
            placeholder="Search"
            className="
              w-56 pl-9 pr-3 py-2 text-sm rounded-lg outline-none
              bg-base-200 border border-base-300
              placeholder:text-base-content/40
              focus:border-primary
              transition
            "
          />
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-base-content/40" />
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <Sidebar />

        {/* Main Chat Area */}
        <div className="flex-1 bg-base-200 overflow-hidden">
          {selectedUser ? (
            <ChatContainer />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-center select-none">
              <NoChatSelected />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
