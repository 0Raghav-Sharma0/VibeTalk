import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./components/transitions/PageTransition";

import Navbar from "./components/Navbar";
import VideoCall from "./components/VideoCall";
import CallListener from "./components/CallListener";

const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const WatchPartyPage = lazy(() => import("./pages/WatchPartyPage"));

import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useChatStore } from "./store/useChatStore";

import { SocketProvider } from "./contexts/SocketContext";
import { WatchPartyProvider, useWatchParty } from "./contexts/WatchPartyContext";

import { Toaster } from "react-hot-toast";
import { isAuthRoute, ROUTES } from "./constants/routes";
import { useMobileViewportInsets } from "./hooks/useMobileViewportInsets";
import "ldrs/grid";

function AppShell() {
  const location = useLocation();
  const { pathname } = location;
  const { authUser, isCheckingAuth, socket } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { roomId } = useWatchParty();
  const isHome = pathname === "/" || pathname === "/home";
  const showNavbar =
    authUser &&
    !isHome &&
    !(pathname === ROUTES.watchParty && roomId);

  useMobileViewportInsets();

  useEffect(() => {
    setTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const meta = document.getElementById("theme-color-meta");
    if (meta) {
      const isDark = ["dark", "coffee", "nexaura"].includes(theme);
      meta.setAttribute("content", isDark ? "#0e1512" : "#f5faf7");
    }
  }, [theme]);

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

  const onAuthScreen = isAuthRoute(pathname);

  if (isCheckingAuth && !onAuthScreen) {
    return (
      <div className="flex items-center justify-center h-screen w-screen dark-mode-root text-gray-900 dark:text-white">
        <l-grid size="100" speed="1.5" color="currentColor"></l-grid>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-[100vw] min-h-screen dark-mode-root text-gray-900 dark:text-white overflow-x-hidden">
      {showNavbar && <Navbar />}

      <CallListener />

      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <l-grid size="80" speed="1.5" color="currentColor"></l-grid>
          </div>
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                authUser ? (
                  <PageTransition className="h-screen">
                    <HomePage />
                  </PageTransition>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/home"
              element={
                authUser ? (
                  <PageTransition className="h-screen">
                    <HomePage />
                  </PageTransition>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/watch-party"
              element={
                authUser ? (
                  <PageTransition className="min-h-screen">
                    <WatchPartyPage />
                  </PageTransition>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/login/*"
              element={
                !authUser ? (
                  <PageTransition className="min-h-screen overflow-x-hidden">
                    <LoginPage />
                  </PageTransition>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/signup/*"
              element={
                !authUser ? (
                  <PageTransition className="min-h-screen overflow-x-hidden">
                    <SignupPage />
                  </PageTransition>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/settings"
              element={
                authUser ? (
                  <PageTransition className="h-[100dvh] min-h-0 max-h-[100dvh] overflow-hidden max-md:h-[var(--chat-viewport-height,100dvh)] max-md:max-h-[var(--chat-viewport-height,100dvh)]">
                    <SettingsPage />
                  </PageTransition>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/profile"
              element={
                authUser ? (
                  <PageTransition className="min-h-screen">
                    <ProfilePage />
                  </PageTransition>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="*"
              element={<Navigate to={authUser ? "/" : "/login"} replace />}
            />
          </Routes>
        </AnimatePresence>
      </Suspense>

      <VideoCall />

      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={12}
        containerStyle={{
          top: "calc(var(--app-header-height) + 8px)",
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
            boxShadow:
              "0 10px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
            padding: "14px 18px",
            fontSize: "0.875rem",
            fontWeight: 500,
            maxWidth: "min(400px, calc(100vw - 32px))",
          },
        }}
      />
    </div>
  );
}

const App = () => (
  <SocketProvider>
    <WatchPartyProvider>
      <AppShell />
    </WatchPartyProvider>
  </SocketProvider>
);

export default App;
