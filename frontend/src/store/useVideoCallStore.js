// src/store/useVideoCallStore.js
import { create } from "zustand";

export const useVideoCallStore = create((set, get) => ({
  // Core states
  isIncomingCall: false,
  isCalling: false,
  isCallActive: false,
  callType: "video",
  
  // Signaling
  incomingCallFrom: null,
  callOffer: null,
  peerId: null,
  
  // Media streams
  localStream: null,
  remoteStream: null,
  
  // Call timer
  callStartTime: null,
  callDuration: 0,

  // Actions
  setIncomingCall: (from, offer, type = "video") => {
    // Prevent unnecessary updates
    const current = get();
    if (current.isIncomingCall && current.incomingCallFrom === from) return;
    
    set({
      isIncomingCall: true,
      isCalling: false,
      isCallActive: false,
      incomingCallFrom: from,
      callOffer: offer,
      callType: type,
      peerId: from,
      callStartTime: null,
    });
  },

  clearIncomingCall: () => set({
    isIncomingCall: false,
    incomingCallFrom: null,
    callOffer: null,
  }),

  startCall: (type = "video", receiverId) => {
    if (!receiverId) {
      console.error("❌ No receiverId provided to startCall");
      return;
    }

    // Prevent duplicate calls
    const current = get();
    if (current.isCalling && current.peerId === receiverId) return;

    set({
      callType: type,
      isCalling: true,
      isIncomingCall: false,
      isCallActive: false,
      incomingCallFrom: null,
      callOffer: null,
      peerId: receiverId,
      callStartTime: null,
      callDuration: 0,
    });
  },

  setCalling: (value) => {
    const current = get();
    if (current.isCalling === value) return;
    set({ isCalling: value });
  },

  setCallActive: (value) => {
    const current = get();
    if (current.isCallActive === value) return;
    
    const start = value ? Date.now() : null;
    set({
      isCallActive: value,
      isIncomingCall: false,
      incomingCallFrom: null,
      callOffer: null,
      callStartTime: start,
    });
  },

  setLocalStream: (stream) => {
    const current = get();
    if (current.localStream === stream) return;
    set({ localStream: stream });
  },

  setRemoteStream: (stream) => {
    const current = get();
    if (current.remoteStream === stream) return;
    set({ remoteStream: stream });
  },

  setPeerId: (id) => {
    const current = get();
    if (current.peerId === id) return;
    set({ peerId: id });
  },

  clearPeerId: () => set({ peerId: null }),

  updateCallDuration: () => {
    const { callStartTime, isCallActive } = get();
    if (isCallActive && callStartTime) {
      const seconds = Math.floor((Date.now() - callStartTime) / 1000);
      set({ callDuration: seconds });
    }
  },

  resetCallState: () => set({
    isIncomingCall: false,
    isCalling: false,
    isCallActive: false,
    callType: "video",
    incomingCallFrom: null,
    callOffer: null,
    peerId: null,
    localStream: null,
    remoteStream: null,
    callStartTime: null,
    callDuration: 0,
  }),
}));