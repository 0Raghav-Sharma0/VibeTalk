// src/store/useVideoCallStore.js
import { create } from "zustand";

export const useVideoCallStore = create((set, get) => ({
  /* ============================================================
       CORE STATES
  ============================================================ */
  isIncomingCall: false,  // You have an incoming ring
  isCalling: false,       // You started a call
  isCallActive: false,    // Both sides connected
  callType: "video",

  /* ============================================================
       SIGNALING / META
  ============================================================ */
  incomingCallFrom: null, // userId who is calling you
  callOffer: null,         // SDP offer from caller
  peerId: null,            // the other user's ID in this call

  /* ============================================================
       MEDIA STREAMS
  ============================================================ */
  localStream: null,
  remoteStream: null,

  /* ============================================================
       CALL TIMER
  ============================================================ */
  callStartTime: null,
  callDuration: 0,

  /* ============================================================
       INCOMING CALL HANDLER
  ============================================================ */
  setIncomingCall: (from, offer, type = "video") => {
    console.log("📞 Incoming call from:", from);

    set({
      isIncomingCall: true,
      isCalling: false,
      isCallActive: false,

      incomingCallFrom: from,
      callOffer: offer,
      callType: type || "video",

      peerId: from, // always store the other user's ID
      callStartTime: null,
    });
  },

  clearIncomingCall: () =>
    set({
      isIncomingCall: false,
      incomingCallFrom: null,
      callOffer: null,
    }),

  /* ============================================================
       OUTGOING CALL (User Clicks Call Button)
  ============================================================ */
  startCall: (type = "video", receiverId) => {
    if (!receiverId) return;

    console.log("🎬 Starting outgoing call to:", receiverId);

    set({
      callType: type,
      isCalling: true,
      isIncomingCall: false,
      isCallActive: false,

      incomingCallFrom: null,
      callOffer: null,

      peerId: receiverId, // the other user
      callStartTime: null,
      callDuration: 0,
    });
  },

  setCalling: (val) => set({ isCalling: val }),

  /* ============================================================
       CALL BECOMES ACTIVE (after answer is applied)
  ============================================================ */
  setCallActive: (val) => {
    const startTime = val ? Date.now() : null;

    set({
      isCallActive: val,

      // Once connected, no more incoming flags
      isIncomingCall: false,
      incomingCallFrom: null,
      callOffer: null,

      callStartTime: startTime,
    });
  },

  /* ============================================================
       STREAM SETTERS
  ============================================================ */
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),

  /* ============================================================
       PEER ID
  ============================================================ */
  setPeerId: (id) => set({ peerId: id }),
  clearPeerId: () => set({ peerId: null }),

  /* ============================================================
       CALL TIMER UPDATE
  ============================================================ */
  updateCallDuration: () => {
    const { callStartTime, isCallActive } = get();

    if (isCallActive && callStartTime) {
      const seconds = Math.floor((Date.now() - callStartTime) / 1000);
      set({ callDuration: seconds });
    }
  },

  /* ============================================================
       RESET EVERYTHING (AFTER HANGUP OR FAILURE)
  ============================================================ */
  resetCallState: () => {
    console.log("🔄 RESET CALL STATE");

    const s = get();

    // Stop streams safely
    try {
      s.localStream?.getTracks()?.forEach((t) => t.stop());
    } catch {}

    try {
      s.remoteStream?.getTracks()?.forEach((t) => t.stop());
    } catch {}

    set({
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
    });
  },
}));
