import { create } from "zustand";

export const useVideoCallStore = create((set, get) => ({

  // --- STATE FLAGS ---
  isIncomingCall: false,
  isCalling: false,
  isCallActive: false,
  callType: "video",

  // --- SIGNALING ---
  incomingCallFrom: null,
  callOffer: null,
  peerId: null, // always the other user's ID for entire call

  // --- STREAMS ---
  localStream: null,
  remoteStream: null,

  // --- METADATA ---
  callStartTime: null,
  callDuration: 0,

  // -------------------------------------------------------------
  // Incoming call received
  // -------------------------------------------------------------
  setIncomingCall: (from, offer, type) => {
    console.log("📞 INCOMING CALL", { from, type });

    set({
      isIncomingCall: true,
      incomingCallFrom: from,
      callOffer: offer,
      callType: type || "video",
      isCalling: false,
      isCallActive: false,
      peerId: from, // set NOW
    });
  },

  clearIncomingCall: () =>
    set({
      isIncomingCall: false,
      incomingCallFrom: null,
      callOffer: null,
    }),

  // -------------------------------------------------------------
  // Outgoing call
  // -------------------------------------------------------------
  startCall: (type = "video", receiverId = null) => {
    console.log("🎬 startCall", { type, receiverId });

    if (!receiverId) return;

    set({
      callType: type,
      isCalling: true,
      isIncomingCall: false,
      isCallActive: false,
      incomingCallFrom: null,
      callOffer: null,
      peerId: receiverId, // set once here
      callStartTime: null,
      callDuration: 0,
    });
  },

  setCalling: (val) => set({ isCalling: val }),

  // -------------------------------------------------------------
  // Call becomes active
  // -------------------------------------------------------------
  setCallActive: (val) => {
    const start = val ? Date.now() : null;

    set({
      isCallActive: val,
      isIncomingCall: false, // IMPORTANT FIX
      incomingCallFrom: null,
      callOffer: null,
      callStartTime: start,
    });
  },

  // -------------------------------------------------------------
  // Streams
  // -------------------------------------------------------------
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),

  setPeerId: (id) => set({ peerId: id }),
  clearPeerId: () => set({ peerId: null }),

  // -------------------------------------------------------------
  // Duration
  // -------------------------------------------------------------
  updateCallDuration: () => {
    const { callStartTime, isCallActive } = get();
    if (isCallActive && callStartTime) {
      set({
        callDuration: Math.floor((Date.now() - callStartTime) / 1000),
      });
    }
  },

  // -------------------------------------------------------------
  // HARD RESET — no double values, stops EVERYTHING
  // -------------------------------------------------------------
  resetCallState: () => {
    console.log("📞 RESET CALL");

    const s = get();

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
