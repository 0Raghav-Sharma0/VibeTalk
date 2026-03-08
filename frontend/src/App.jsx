// src/App.jsx
import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import VideoCall from "./components/VideoCall";
import CallListener from "./components/CallListener";

const HomePage = lazy(() => import("./pages/HomePage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const WatchPartyPage = lazy(() => import("./pages/WatchPartyPage"));

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

    import("./store/useGroupStore").then(({ useGroupStore }) => {
      useGroupStore.getState().subscribeToGroupMessages();
    });

    return () => {
      chatStore.unsubscribeFromMessages();
      import("./store/useGroupStore").then(({ useGroupStore }) => {
        useGroupStore.getState().unsubscribeFromGroupMessages();
      });
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

          {/* Routes - lazy loaded for faster initial load */}
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[60vh]">
                <l-grid size="80" speed="1.5" color="currentColor"></l-grid>
              </div>
            }
          >
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
              element={<Navigate to="/settings" replace />}
            />

            {/* Fallback */}
            <Route
              path="*"
              element={<Navigate to={authUser ? "/" : "/login"} replace />}
            />
          </Routes>
          </Suspense>

          {/* Video call UI */}
          <VideoCall />

          {/* Toasts - positioned below navbar, theme-aware, polished UI */}
          <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={12}
            containerStyle={{
              top: 72,
              left: 16,
              right: 16,
            }}
            toastOptions={{
              duration: 4000,
              className: "toast-notification",
              style: {
                background: "var(--b2)",
                color: "var(--bc)",
                border: "1px solid var(--b3)",
                borderRadius: "14px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
                padding: "14px 18px",
                fontSize: "0.9375rem",
                fontWeight: 500,
                maxWidth: "min(400px, calc(100vw - 32px))",
              },
              success: {
                iconTheme: {
                  primary: "var(--success, #10b981)",
                  secondary: "var(--b2)",
                },
              },
              error: {
                iconTheme: {
                  primary: "var(--error, #ef4444)",
                  secondary: "var(--b2)",
                },
              },
              loading: {
                iconTheme: {
                  primary: "var(--p)",
                  secondary: "var(--b2)",
                },
              },
            }}
          />
        </div>
      </WatchPartyProvider>
    </SocketProvider>
  );
};

export default App;
