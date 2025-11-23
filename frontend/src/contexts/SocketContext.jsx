// src/contexts/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context.socket;
};

export const useSocketStatus = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketStatus must be used within SocketProvider');
  }
  return context.isConnected;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    // Prefer explicit socket envs, otherwise derive from backend
    const backend = import.meta.env.VITE_BACKEND_URL;
    const envSocket =
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_SOCKET_URI ||
      backend;

    let socketUrl = envSocket;

    // Strip /api if you passed the full API URL
    if (socketUrl && socketUrl.endsWith('/api')) {
      socketUrl = socketUrl.slice(0, -4);
    }

    // Fallback for dev only
    if (!socketUrl && import.meta.env.DEV) {
      socketUrl = 'http://localhost:5000';
    }

    if (!socketUrl) {
      console.error('❌ No socket URL configured');
      return;
    }

    console.log('🔌 Initializing socket connection to:', socketUrl);

    const newSocket = io(socketUrl, {
      auth: {
        token: token,
        userId: user._id || null,
        username:
          user.username || `Guest_${Math.random().toString(36).substr(2, 5)}`,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      setIsConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt:', attemptNumber);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error.message);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ All reconnection attempts failed');
    });

    newSocket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        console.log('🧹 Cleaning up socket connection');
        newSocket.removeAllListeners();
        newSocket.close();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
