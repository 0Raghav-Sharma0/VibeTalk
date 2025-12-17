// src/App.jsx
import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import WatchPartyPage from "./pages/WatchPartyPage";
import VideoCall from "./components/VideoCall";
import CallListener from "./components/CallListener";

import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useChatStore } from "./store/useChatStore";

import { SocketProvider } from "./contexts/SocketContext";
import { WatchPartyProvider } from "./contexts/WatchPartyContext";

import { Toaster } from "react-hot-toast";
import "ldrs/grid";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, socket } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  /* ================= AUTH CHECK ================= */
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /* ================= APPLY THEME ONCE =================
     Theme logic MUST live in store only.
     This just initializes it on app load.
  */
  useEffect(() => {
    setTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= CHAT SOCKET LISTENER ================= */
  useEffect(() => {
    if (!socket) return;

    const chatStore = useChatStore.getState();
    chatStore.subscribeToMessages();

    return () => {
      chatStore.unsubscribeFromMessages();
    };
  }, [socket]);

  /* ================= LOADING STATE ================= */
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-base-100 text-base-content">
        <l-grid size="100" speed="1.5" color="currentColor"></l-grid>
      </div>
    );
  }

  return (
    <SocketProvider>
      <WatchPartyProvider>
        {/* DO NOT set data-theme here */}
        <div className="min-h-screen bg-base-100 text-base-content">
          {/* Navbar only when logged in */}
          {authUser && <Navbar />}

          {/* Global listeners */}
          <CallListener />

          {/* Routes */}
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
              path="/watch-party"
              element={
                authUser ? <WatchPartyPage /> : <Navigate to="/login" replace />
              }
            />

            {/* Auth routes */}
            <Route
              path="/signup"
              element={!authUser ? <SignUpPage /> : <Navigate to="/" replace />}
            />

            <Route
              path="/login"
              element={!authUser ? <LoginPage /> : <Navigate to="/" replace />}
            />

            {/* Protected routes */}
            <Route
              path="/settings"
              element={
                authUser ? <SettingsPage /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="/profile"
              element={
                authUser ? <ProfilePage /> : <Navigate to="/login" replace />
              }
            />

            {/* Fallback */}
            <Route
              path="*"
              element={<Navigate to={authUser ? "/" : "/login"} replace />}
            />
          </Routes>

          {/* Video call UI */}
          <VideoCall />

          {/* Toasts */}
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
    </SocketProvider>
  );
};

export default App;
