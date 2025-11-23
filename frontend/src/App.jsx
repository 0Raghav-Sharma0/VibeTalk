// src/App.jsx
import React, { useEffect } from "react";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import WatchPartyPage from "./pages/WatchPartyPage";
import VideoCall from "./components/VideoCall";
import CallListener from "./components/CallListener";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore.js";
import { useVideoCallStore } from "./store/useVideoCallStore";
import { useThemeStore } from "./store/useThemeStore.js";
import { useChatStore } from "./store/useChatStore.js";
import { SocketProvider } from "./contexts/SocketContext"; // ADD THIS IMPORT
import { WatchPartyProvider } from "./contexts/WatchPartyContext";
import { Toaster } from "react-hot-toast";
import "ldrs/grid";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, socket } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Load theme from localStorage on initial load
  useEffect(() => {
    const savedTheme = localStorage.getItem("chat-theme") || "vibetalk";
    setTheme(savedTheme);
  }, [setTheme]);

  // Global chat notification listener
  useEffect(() => {
    if (!socket) return;

    const chatStore = useChatStore.getState();
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
    <SocketProvider> {/* SOCKET PROVIDER MUST WRAP EVERYTHING */}
      <WatchPartyProvider> {/* THEN WATCH PARTY PROVIDER */}
        <div
          data-theme={theme || "vibetalk"}
          className="min-h-screen bg-base-100 text-base-content transition-colors duration-500"
        >
          {/* Only show Navbar when user is authenticated */}
          {authUser && <Navbar />}

          {/* Global call listener */}
          <CallListener />

          {/* Routes */}
          <Routes>
            {/* Redirect root to home or login */}
            <Route
              path="/"
              element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
            />

            {/* Home route */}
            <Route
              path="/home"
              element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
            />

            {/* Watch Party route */}
            <Route
              path="/watch-party"
              element={authUser ? <WatchPartyPage /> : <Navigate to="/login" replace />}
            />

            {/* Auth routes - only accessible when NOT logged in */}
            <Route
              path="/signup"
              element={!authUser ? <SignUpPage /> : <Navigate to="/" replace />}
            />

            <Route
              path="/login"
              element={!authUser ? <LoginPage /> : <Navigate to="/" replace />}
            />

            {/* Protected routes - only accessible when logged in */}
            <Route
              path="/settings"
              element={authUser ? <SettingsPage /> : <Navigate to="/login" replace />}
            />

            <Route
              path="/profile"
              element={authUser ? <ProfilePage /> : <Navigate to="/login" replace />}
            />

            {/* 404 fallback */}
            <Route
              path="*"
              element={<Navigate to={authUser ? "/" : "/login"} replace />}
            />
          </Routes>

          {/* Video call UI - always loaded but might be hidden */}
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
      </WatchPartyProvider>
    </SocketProvider> //{/* CLOSE SOCKET PROVIDER */}
  );
};

export default App;