import React, { useEffect } from "react";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import VideoCall from "./components/VideoCall";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore.js";
import { useVideoCallStore } from "./store/useVideoCallStore";
import { useThemeStore } from "./store/useThemeStore.js";
import { useChatStore } from "./store/useChatStore.js";   // ⭐ MUST IMPORT THIS
import { Toaster } from "react-hot-toast";
import "ldrs/grid";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, socket } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("chat-theme") || "vibetalk";
    setTheme(savedTheme);
  }, [setTheme]);

  // Incoming call listener
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      const { from, offer, callType } = data;
      useVideoCallStore.getState().setIncomingCall(from, offer, callType);
    };

    socket.on("incoming-call", handleIncomingCall);
    return () => socket.off("incoming-call", handleIncomingCall);
  }, [socket]);

  // ⭐⭐⭐ GLOBAL CHAT NOTIFICATION LISTENER — FIXES YOUR PROBLEM ⭐⭐⭐
  useEffect(() => {
    if (!socket) return;

    const chatStore = useChatStore.getState();

    // Attach the "newMessage" listener globally
    chatStore.subscribeToMessages();

    return () => {
      chatStore.unsubscribeFromMessages();
    };
  }, [socket]);

  // Loading screen while checking auth
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-base-100 text-base-content">
        <l-grid size="100" speed="1.5" color="currentColor"></l-grid>
      </div>
    );
  }

  return (
    <div
      data-theme={theme || "vibetalk"}
      className="min-h-screen bg-base-100 text-base-content transition-colors duration-500"
    >
      <Navbar />

      {/* ROUTES */}
      <Routes>
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/home"
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/signup"
          element={!authUser ? <SignUpPage /> : <Navigate to="/" replace />}
        />

        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" replace />}
        />

        <Route
          path="/settings"
          element={authUser ? <SettingsPage /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/profile"
          element={authUser ? <ProfilePage /> : <Navigate to="/login" replace />}
        />
      </Routes>

      {/* Always loaded video call UI */}
      <VideoCall />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--b2)",
            color: "var(--bc)",
          },
        }}
      />
    </div>
  );
};

export default App;
