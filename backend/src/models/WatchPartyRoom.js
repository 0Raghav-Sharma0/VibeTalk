// backend/src/models/WatchPartyRoom.js
export class WatchPartyRoom {
  constructor(roomId, hostSocketId, hostUsername, videoUrl, videoType, hostUserId, hostProfilePic = null) {
    this.roomId = roomId;
    this.hostSocketId = hostSocketId;
    this.hostUserId = hostUserId;
    this.videoUrl = videoUrl;
    this.videoType = videoType;
    this.participants = [{
      socketId: hostSocketId,
      username: hostUsername,
      userId: hostUserId,
      profilePic: hostProfilePic,
      isHost: true,
      connected: true
    }];
    this.currentState = {
      playing: false,
      currentTime: 0,
      duration: 0
    };
    this.chatHistory = [];
    this.createdAt = new Date();
  }

  addParticipant(socketId, username, userId, profilePic = null) {
    // Remove if already exists (reconnection)
    this.removeParticipant(socketId);
    
    this.participants.push({
      socketId,
      username,
      userId,
      profilePic,
      isHost: false,
      connected: true
    });
  }

  removeParticipant(socketId) {
    this.participants = this.participants.filter(p => p.socketId !== socketId);
  }

  updateParticipantConnection(socketId, connected) {
    const participant = this.participants.find(p => p.socketId === socketId);
    if (participant) {
      participant.connected = connected;
    }
  }

  updateState(newState) {
    this.currentState = { ...this.currentState, ...newState };
  }

  addChatMessage(socketId, username, message) {
    const participant = this.participants.find(p => p.socketId === socketId);
    if (!participant) return null;

    const chatMessage = {
      id: Date.now() + Math.random(),
      socketId,
      username: participant.username,
      profilePic: participant.profilePic || null,
      message,
      timestamp: new Date()
    };

    this.chatHistory.push(chatMessage);
    
    // Keep only last 100 messages
    if (this.chatHistory.length > 100) {
      this.chatHistory = this.chatHistory.slice(-100);
    }

    return chatMessage;
  }

  isEmpty() {
    return this.participants.length === 0;
  }

  getRoomData() {
    return {
      roomId: this.roomId,
      hostSocketId: this.hostSocketId,
      hostUserId: this.hostUserId,
      videoUrl: this.videoUrl,
      videoType: this.videoType,
      participants: this.participants,
      participantCount: this.participants.length,
      currentState: this.currentState,
      chatHistoryCount: this.chatHistory.length,
      createdAt: this.createdAt
    };
  }
}