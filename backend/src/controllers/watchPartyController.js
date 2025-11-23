// backend/src/controllers/watchPartyController.js
// Path: backend/src/controllers/ -> backend/src/models/
import { WatchPartyRoom } from '../models/WatchPartyRoom.js';

// Store for active watch party rooms (in production, use Redis or a database)
const activeRooms = new Map();

// Generate a unique room ID
const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Get username from socket - FIXED TO USE ACTUAL USER DATA
const getUsernameFromSocket = (socket, userData) => {
  // Priority: 1. User data from frontend, 2. Socket auth, 3. Fallback
  if (userData && userData.username) {
    return userData.username;
  }
  return socket.handshake.auth?.username || socket.username || `User${Math.floor(Math.random() * 1000)}`;
};

// Get user ID from socket - FIXED TO USE ACTUAL USER DATA
const getUserIdFromSocket = (socket, userData) => {
  // Priority: 1. User data from frontend, 2. Socket auth, 3. Fallback
  if (userData && userData.id) {
    return userData.id;
  }
  return socket.userId || socket.id;
};

/**
 * Create a new watch party room
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Object} data - Room creation data
 * @param {string} data.videoUrl - URL of the video to watch
 * @param {string} data.videoType - Type of video ('youtube' or 'local')
 * @param {Object} data.user - User data from frontend
 */
export const createRoom = (socket, { videoUrl, videoType, user }) => {
  try {
    const roomId = generateRoomId();
    const username = getUsernameFromSocket(socket, user);
    const userId = getUserIdFromSocket(socket, user);
    
    const room = new WatchPartyRoom(roomId, socket.id, username, videoUrl, videoType, userId);
    activeRooms.set(roomId, room);
    
    // Join socket room
    socket.join(roomId);
    
    socket.emit('watchparty:room-created', {
      roomId,
      videoUrl,
      videoType
    });
    
    console.log(`🎬 Watch party room created: ${roomId} by ${username} (${userId})`);
  } catch (error) {
    console.error('❌ Error creating room:', error);
    socket.emit('watchparty:error', { message: 'Failed to create room' });
  }
};

/**
 * Join an existing watch party room
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Object} data - Join data
 * @param {string} data.roomId - ID of the room to join
 * @param {Object} data.user - User data from frontend
 */
export const joinRoom = (socket, { roomId, user }) => {
  try {
    const room = activeRooms.get(roomId);
    
    if (!room) {
      socket.emit('watchparty:error', { message: 'Room not found' });
      return;
    }
    
    const username = getUsernameFromSocket(socket, user);
    const userId = getUserIdFromSocket(socket, user);
    
    room.addParticipant(socket.id, username, userId);
    
    // Join socket room
    socket.join(roomId);
    
    // Send room data to the joining user
    socket.emit('watchparty:room-joined', {
      roomId,
      videoUrl: room.videoUrl,
      videoType: room.videoType,
      currentState: room.currentState,
      participants: room.participants,
      chatHistory: room.chatHistory,
      isHost: socket.id === room.hostSocketId
    });
    
    // Notify all participants
    socket.to(roomId).emit('watchparty:participants-updated', {
      participants: room.participants
    });
    
    console.log(`🎬 ${username} (${userId}) joined room: ${roomId}`);
  } catch (error) {
    console.error('❌ Error joining room:', error);
    socket.emit('watchparty:error', { message: 'Failed to join room' });
  }
};

/**
 * Leave a watch party room
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Object} data - Leave data
 * @param {string} data.roomId - ID of the room to leave
 */
export const leaveRoom = (socket, { roomId }) => {
  try {
    const room = activeRooms.get(roomId);
    
    if (!room) return;
    
    const participant = room.participants.find(p => p.socketId === socket.id);
    const username = participant ? participant.username : 'Unknown';
    
    room.removeParticipant(socket.id);
    
    // Leave socket room
    socket.leave(roomId);
    
    // If room is empty, delete it
    if (room.isEmpty()) {
      activeRooms.delete(roomId);
      console.log(`🗑️  Room ${roomId} deleted (empty)`);
    } else {
      // Notify remaining participants
      socket.to(roomId).emit('watchparty:participants-updated', {
        participants: room.participants
      });
    }
    
    console.log(`👋 ${username} left room: ${roomId}`);
  } catch (error) {
    console.error('❌ Error leaving room:', error);
  }
};

/**
 * Sync playback state across all participants
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Object} data - Sync data
 * @param {string} data.roomId - ID of the room
 * @param {Object} data.state - Playback state (playing, currentTime, duration)
 */
export const syncPlayback = (socket, { roomId, state }) => {
  try {
    const room = activeRooms.get(roomId);
    
    if (!room) {
      socket.emit('watchparty:error', { message: 'Room not found' });
      return;
    }
    
    // Only host can sync
    if (socket.id !== room.hostSocketId) {
      socket.emit('watchparty:error', { message: 'Only host can control playback' });
      return;
    }
    
    room.updateState(state);
    
    // Broadcast to all participants except sender
    socket.to(roomId).emit('watchparty:state-synced', { state });
    
    console.log(`🔄 Playback synced in room ${roomId}:`, state);
  } catch (error) {
    console.error('❌ Error syncing playback:', error);
  }
};

/**
 * Send a reaction emoji
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Object} data - Reaction data
 * @param {string} data.roomId - ID of the room
 * @param {string} data.emoji - Emoji to send
 */
export const sendReaction = (socket, { roomId, emoji }) => {
  try {
    const room = activeRooms.get(roomId);
    
    if (!room) {
      socket.emit('watchparty:error', { message: 'Room not found' });
      return;
    }
    
    const participant = room.participants.find(p => p.socketId === socket.id);
    const username = participant ? participant.username : 'Unknown';
    
    const reactionData = {
      emoji,
      username,
      socketId: socket.id
    };
    
    // Broadcast reaction to all participants including sender
    socket.to(roomId).emit('watchparty:reaction-received', reactionData);
    socket.emit('watchparty:reaction-received', reactionData);
    
    console.log(`😊 Reaction sent in room ${roomId}: ${emoji} by ${username}`);
  } catch (error) {
    console.error('❌ Error sending reaction:', error);
  }
};

/**
 * Send a chat message
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Object} data - Chat data
 * @param {string} data.roomId - ID of the room
 * @param {string} data.message - Message text
 */
export const sendChatMessage = (socket, { roomId, message }) => {
  try {
    const room = activeRooms.get(roomId);
    
    if (!room) {
      socket.emit('watchparty:error', { message: 'Room not found' });
      return;
    }
    
    const participant = room.participants.find(p => p.socketId === socket.id);
    const username = participant ? participant.username : 'Unknown';
    
    const chatMessage = room.addChatMessage(socket.id, username, message);
    
    if (chatMessage) {
      // Broadcast to all participants including sender
      socket.to(roomId).emit('watchparty:chat-received', chatMessage);
      socket.emit('watchparty:chat-received', chatMessage);
      
      console.log(`💬 Chat message in room ${roomId}: ${message} by ${username}`);
    }
  } catch (error) {
    console.error('❌ Error sending chat message:', error);
  }
};

/**
 * Handle socket disconnect - cleanup watch party rooms
 * @param {Socket} socket - Socket.IO socket instance
 */
export const handleDisconnect = (socket) => {
  // Find all rooms this socket is in
  activeRooms.forEach((room, roomId) => {
    const participant = room.participants.find(p => p.socketId === socket.id);
    
    if (participant) {
      const username = participant.username;
      room.removeParticipant(socket.id);
      
      if (room.isEmpty()) {
        activeRooms.delete(roomId);
        console.log(`🗑️  Room ${roomId} deleted (empty after disconnect)`);
      } else {
        // Notify remaining participants
        socket.to(roomId).emit('watchparty:participants-updated', {
          participants: room.participants
        });
      }
      
      console.log(`👋 ${username} disconnected from room: ${roomId}`);
    }
  });
};

/**
 * Get active rooms count (useful for monitoring)
 * @returns {number} Number of active rooms
 */
export const getActiveRoomsCount = () => {
  return activeRooms.size;
};

/**
 * Get room details (useful for admin/debugging)
 * @param {string} roomId - ID of the room
 * @returns {Object|null} Room data or null if not found
 */
export const getRoomDetails = (roomId) => {
  const room = activeRooms.get(roomId);
  return room ? room.getRoomData() : null;
};

/**
 * Get all active rooms (useful for monitoring)
 * @returns {Array} Array of room data
 */
export const getAllRooms = () => {
  const rooms = [];
  activeRooms.forEach((room) => {
    rooms.push({
      roomId: room.roomId,
      participantCount: room.participants.length,
      videoType: room.videoType,
      isActive: room.currentState.playing,
      createdAt: room.createdAt
    });
  });
  return rooms;
};