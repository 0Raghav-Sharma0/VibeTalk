import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from './store/useAuthStore.js';
import 'ldrs/grid';
import { Toaster } from 'react-hot-toast';
import { useThemeStore } from './store/useThemeStore.js';

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers} = useAuthStore();
  const {theme} = useThemeStore();

  console.log(onlineUsers);

  useEffect(() => {
    checkAuth();
  }, []);

  console.log({ authUser });

  if (isCheckingAuth) return (
    <div className="flex items-center justify-center h-screen w-screen">
      <l-grid size="100" speed="1.5" color="white"></l-grid>
    </div>
  );

  return (
    <div data-theme={theme}>
      <Navbar />
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" replace />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" replace />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route path="/settings" element={authUser ? <SettingsPage /> : <Navigate to="/login" replace />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" replace />} />
      </Routes>
      <Toaster/>
    </div>
  );
};

export default App;
