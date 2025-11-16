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
import { Toaster } from "react-hot-toast";
import "ldrs/grid";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, socket } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  // Check authentication on first load
  useEffect(() => {
    checkAuth();
  }, []);

  // Load saved theme on first load
  useEffect(() => {
    const saved = localStorage.getItem("theme") || "vibetalk";
    setTheme(saved);
  }, [setTheme]);

  // Apply theme automatically when changed
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Handle incoming call
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      const { from, offer, callType } = data;
      useVideoCallStore.getState().setIncomingCall(from, offer, callType);
    };

    socket.on("incoming-call", handleIncomingCall);
    return () => socket.off("incoming-call", handleIncomingCall);
  }, [socket]);

  // Loading screen
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-base-100 text-base-content">
        <l-grid size="100" speed="1.5" color="currentColor"></l-grid>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content transition-colors duration-500">
      <Navbar />

      <Routes>
        {/* MAIN */}
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/home"
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
        />

        {/* AUTH */}
        <Route
          path="/signup"
          element={!authUser ? <SignUpPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" replace />}
        />

        {/* SETTINGS */}
        <Route
          path="/settings"
          element={authUser ? <SettingsPage /> : <Navigate to="/login" replace />}
        />

        {/* PROFILE */}
        <Route
          path="/profile"
          element={authUser ? <ProfilePage /> : <Navigate to="/login" replace />}
        />
      </Routes>

      {/* VIDEO CALL UI */}
      <VideoCall />

      {/* TOASTS */}
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
