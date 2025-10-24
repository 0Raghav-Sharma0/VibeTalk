import { create } from "zustand";

export const useVideoCallStore = create((set, get) => ({
  // 📞 Call state
  isIncomingCall: false,
  isCallActive: false,
  isCalling: false,
  callType: "video",
  incomingCallFrom: null,
  callOffer: null,

  // 🎥 Media streams
  localStream: null,
  remoteStream: null,

  // 🧩 Actions
  setIncomingCall: (from, offer, callType) => {
    console.log("📞 INCOMING CALL:", { from, callType });
    set({
      isIncomingCall: true,
      incomingCallFrom: from,
      callOffer: offer,
      callType,
    });
  },

  clearIncomingCall: () =>
    set({
      isIncomingCall: false,
      incomingCallFrom: null,
      callOffer: null,
    }),

  setCallActive: (isActive) => {
    console.log("📞 Call active:", isActive);
    set({ isCallActive: isActive });
  },

  setCalling: (isCalling) => {
    console.log("📞 Calling:", isCalling);
    set({ isCalling });
  },

  setCallType: (callType) => set({ callType }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),

  // ✅ Reset entire state safely
  resetCallState: () => {
    console.log("📞 Resetting call state");
    const state = get();

    if (state.localStream) {
      state.localStream.getTracks().forEach((track) => track.stop());
    }

    set({
      isIncomingCall: false,
      isCallActive: false,
      isCalling: false,
      callType: "video",
      incomingCallFrom: null,
      callOffer: null,
      localStream: null,
      remoteStream: null,
    });
  },

  // ✅ Fixed name: used by ChatHeader
  startCall: (callType = "video", receiverId = null) => {
    console.log(`🎬 Starting ${callType.toUpperCase()} call ${receiverId ? "with " + receiverId : ""}`);
    set({
      callType,
      isCalling: true,
      isCallActive: false,
    });
  },
}));
