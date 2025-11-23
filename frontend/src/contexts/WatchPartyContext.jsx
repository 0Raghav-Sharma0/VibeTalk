// src/contexts/WatchPartyContext.jsx
// This is the CORRECTED version with proper logging

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuthStore } from '../store/useAuthStore';

const WatchPartyContext = createContext();

export const useWatchParty = () => {
  const context = useContext(WatchPartyContext);
  if (!context) {
    throw new Error('useWatchParty must be used within WatchPartyProvider');
  }
  return context;
};

export const WatchPartyProvider = ({ children }) => {
  const socket = useSocket();
  const { authUser } = useAuthStore();
  const [roomId, setRoomId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [videoState, setVideoState] = useState({
    url: '',
    type: 'youtube',
    playing: false,
    currentTime: 0,
    duration: 0
  });
  const [reactions, setReactions] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);

  const canControlVideo = isHost;

  // Create room - SEND USER DATA
  const createRoom = useCallback((videoUrl, videoType = 'youtube') => {
    if (socket && authUser) {
      const userData = {
        id: authUser._id,
        username: authUser.fullName || authUser.username || authUser.email,
        email: authUser.email
      };
      
      console.log('🎬 Creating room with user data:', userData);
      
      socket.emit('watchparty:create', { 
        videoUrl, 
        videoType,
        user: userData
      });
    } else {
      console.error('❌ Cannot create room - missing socket or authUser');
    }
  }, [socket, authUser]);

  // Join room - SEND USER DATA
  const joinRoom = useCallback((roomId) => {
    if (socket && authUser) {
      const userData = {
        id: authUser._id,
        username: authUser.fullName || authUser.username || authUser.email,
        email: authUser.email
      };
      
      console.log('🎬 Joining room with user data:', userData);
      
      socket.emit('watchparty:join', { 
        roomId,
        user: userData
      });
    } else {
      console.error('❌ Cannot join room - missing socket or authUser');
    }
  }, [socket, authUser]);

  const leaveRoom = useCallback(() => {
    if (socket && roomId) {
      socket.emit('watchparty:leave', { roomId });
      setRoomId(null);
      setIsHost(false);
      setParticipants([]);
      setChatMessages([]);
    }
  }, [socket, roomId]);

  const syncPlayback = useCallback((state) => {
    if (socket && roomId && isHost) {
      socket.emit('watchparty:sync', { roomId, state });
    }
  }, [socket, roomId, isHost]);

  const sendReaction = useCallback((emoji) => {
    if (socket && roomId) {
      socket.emit('watchparty:reaction', { roomId, emoji });
    }
  }, [socket, roomId]);

  const sendChatMessage = useCallback((message) => {
    if (socket && roomId) {
      socket.emit('watchparty:chat', { roomId, message });
    }
  }, [socket, roomId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Room created
    socket.on('watchparty:room-created', (data) => {
      console.log('✅ Room created:', data);
      setRoomId(data.roomId);
      setIsHost(true);
      setVideoState(prev => ({
        ...prev,
        url: data.videoUrl,
        type: data.videoType
      }));
    });

    // Room joined
    socket.on('watchparty:room-joined', (data) => {
      console.log('✅ Room joined:', data);
      console.log('👥 Participants received:', data.participants);
      
      setRoomId(data.roomId);
      setIsHost(data.isHost);
      setParticipants(data.participants); // This should have username fields
      setVideoState(prev => ({
        ...prev,
        url: data.videoUrl,
        type: data.videoType,
        playing: data.currentState.playing,
        currentTime: data.currentState.currentTime
      }));
      setChatMessages(data.chatHistory || []);
    });

    // Participants updated
    socket.on('watchparty:participants-updated', (data) => {
      console.log('👥 Participants updated:', data.participants);
      setParticipants(data.participants);
    });

    // Playback state synced
    socket.on('watchparty:state-synced', (data) => {
      setVideoState(prev => ({
        ...prev,
        ...data.state
      }));
    });

    // Reaction received
    socket.on('watchparty:reaction-received', (data) => {
      const reactionId = Date.now() + Math.random();
      setReactions(prev => [...prev, { ...data, id: reactionId }]);
      
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== reactionId));
      }, 3000);
    });

    // Chat message received
    socket.on('watchparty:chat-received', (data) => {
      setChatMessages(prev => [...prev, data]);
    });

    // Error handling
    socket.on('watchparty:error', (error) => {
      console.error('❌ Watch party error:', error);
      alert(error.message);
    });

    return () => {
      socket.off('watchparty:room-created');
      socket.off('watchparty:room-joined');
      socket.off('watchparty:participants-updated');
      socket.off('watchparty:state-synced');
      socket.off('watchparty:reaction-received');
      socket.off('watchparty:chat-received');
      socket.off('watchparty:error');
    };
  }, [socket]);

  const value = {
    roomId,
    isHost,
    participants,
    videoState,
    reactions,
    chatMessages,
    createRoom,
    joinRoom,
    leaveRoom,
    syncPlayback,
    sendReaction,
    sendChatMessage,
    setVideoState,
    canControlVideo,
  };

  return (
    <WatchPartyContext.Provider value={value}>
      {children}
    </WatchPartyContext.Provider>
  );
};