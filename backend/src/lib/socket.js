import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "https://chitchat-vvxt.onrender.com"],
        credentials: true,
    }
});

const userSocketMap = {};
const activeCalls = {};

export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

io.on("connection", (socket) => {
    console.log("A user connected", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) {
        userSocketMap[userId] = socket.id;
        console.log(`User ${userId} mapped to socket ${socket.id}`);
    }
    
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    console.log("Online users:", Object.keys(userSocketMap));

    // ==================== VIDEO CALL EVENTS ====================

    socket.on("call-user", (data) => {
        console.log("📞 CALL-USER EVENT:", data);
        const { targetUserId, offer, callType = "video" } = data;
        const targetSocketId = getReceiverSocketId(targetUserId);
        
        console.log(`Looking for target user ${targetUserId}, found socket: ${targetSocketId}`);
        
        if (targetSocketId) {
            // Store call info
            activeCalls[socket.id] = {
                caller: userId,
                callee: targetUserId,
                callType: callType
            };
            
            console.log(`📞 Sending incoming-call to ${targetSocketId}`);
            io.to(targetSocketId).emit("incoming-call", {
                from: userId,
                offer,
                callType
            });
        } else {
            console.log(`❌ Target user ${targetUserId} not found online`);
            socket.emit("call-failed", { reason: "User is offline" });
        }
    });

    socket.on("call-accepted", (data) => {
        console.log("✅ CALL-ACCEPTED EVENT:", data);
        const { callerId, answer } = data;
        const callerSocketId = userSocketMap[callerId];
        
        console.log(`Looking for caller ${callerId}, found socket: ${callerSocketId}`);
        
        if (callerSocketId) {
            io.to(callerSocketId).emit("call-accepted", { answer });
            console.log("✅ Call accepted notification sent to caller");
        } else {
            console.log(`❌ Caller ${callerId} not found`);
        }
    });

    socket.on("call-rejected", (data) => {
        console.log("❌ CALL-REJECTED EVENT:", data);
        const { callerId } = data;
        const callerSocketId = userSocketMap[callerId];
        
        if (callerSocketId) {
            io.to(callerSocketId).emit("call-rejected");
            console.log("❌ Call rejected notification sent to caller");
            
            // Clean up call
            Object.keys(activeCalls).forEach(socketId => {
                if (activeCalls[socketId].caller === callerId) {
                    delete activeCalls[socketId];
                }
            });
        }
    });

    socket.on("end-call", (data) => {
        console.log("📞 END-CALL EVENT:", data);
        const { targetUserId } = data;
        const targetSocketId = getReceiverSocketId(targetUserId);
        
        if (targetSocketId) {
            io.to(targetSocketId).emit("call-ended");
            console.log("📞 Call ended notification sent to target");
        }
        
        // Clean up active calls for this user
        Object.keys(activeCalls).forEach(socketId => {
            if (activeCalls[socketId].caller === userId || activeCalls[socketId].callee === userId) {
                delete activeCalls[socketId];
            }
        });
    });

    // ==================== WEBRTC SIGNALING ====================

    socket.on("webrtc-answer", (data) => {
        console.log("🔊 WEBRTC-ANSWER:", data);
        const { targetUserId, answer } = data;
        const targetSocketId = getReceiverSocketId(targetUserId);
        
        if (targetSocketId) {
            io.to(targetSocketId).emit("webrtc-answer", {
                answer: answer,
                from: userId
            });
            console.log("🔊 WebRTC answer sent to target");
        } else {
            console.log(`❌ Target user ${targetUserId} not found for WebRTC answer`);
        }
    });

    socket.on("webrtc-ice-candidate", (data) => {
        console.log("🧊 WEBRTC-ICE-CANDIDATE:", data);
        const { targetUserId, candidate } = data;
        const targetSocketId = getReceiverSocketId(targetUserId);
        
        if (targetSocketId) {
            io.to(targetSocketId).emit("webrtc-ice-candidate", {
                candidate: candidate,
                from: userId
            });
            console.log("🧊 ICE candidate sent to target");
        } else {
            console.log(`❌ Target user ${targetUserId} not found for ICE candidate`);
        }
    });

    // ==================== EXISTING CHAT EVENTS ====================

    socket.on("sendReaction", ({ messageId, userId, emoji }) => {
        console.log("😊 REACTION EVENT:", { messageId, userId, emoji });
        io.emit("messageReaction", { messageId, userId, emoji });
    });
    
    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);
    });
    
    socket.on("music-sync", ({ roomId, action, songUrl, songName, currentTime }) => {
        console.log(`🎵 Music sync in room ${roomId}:`, { action, songName });
        io.to(roomId).emit("music-sync", { action, songUrl, songName, currentTime });
    });

    // ==================== DISCONNECTION HANDLING ====================

    socket.on("disconnect", () => {
        console.log("❌ User disconnected", socket.id);
        
        // Remove user from socket map
        delete userSocketMap[userId];
        
        // Clean up any active calls when user disconnects
        Object.keys(activeCalls).forEach(socketId => {
            if (activeCalls[socketId].caller === userId || activeCalls[socketId].callee === userId) {
                const targetUserId = activeCalls[socketId].caller === userId ? 
                    activeCalls[socketId].callee : activeCalls[socketId].caller;
                const targetSocketId = getReceiverSocketId(targetUserId);
                
                if (targetSocketId) {
                    io.to(targetSocketId).emit("call-ended");
                    console.log(`📞 Notified ${targetUserId} about call ending due to disconnect`);
                }
                delete activeCalls[socketId];
            }
        });
        
        // Update online users
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
        console.log("Updated online users:", Object.keys(userSocketMap));
    });
});

export { io, app, server };