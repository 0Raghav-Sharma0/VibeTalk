import React from "react";
import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="flex flex-col h-screen bg-base-100 text-base-content transition-colors duration-700 overflow-hidden">
      {/* Offset for fixed Navbar (h-16 = 64px height) */}
      <div className="h-16 shrink-0"></div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Chat / Main Area */}
        <div className="flex-1 overflow-hidden">
          {selectedUser ? (
            <ChatContainer />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-400 to-pink-500 bg-clip-text text-transparent">
                Welcome to VibeTalk 🎧
              </h1>
              <p className="text-base-content/70">
                Select a contact from the sidebar to start vibing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
