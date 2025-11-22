import { create } from "zustand";

export const useVideoCallStore = create((set, get) => ({
  isIncomingCall: false,
  isCalling: false,
  isCallActive: false,
  callType: "video",
  incomingCallFrom: null,
  callOffer: null,
  peerId: null,
  callStartTime: null,
  callDuration: 0,

  setIncomingCall: (from, offer, type = "video") => {
    const current = get();
    
    if (current.isIncomingCall && current.incomingCallFrom === from) {
      if (offer && !current.callOffer) {
        console.log("📞 Updating call with offer data");
        set({ callOffer: offer });
        return;
      }
      console.log("⏭️ Same incoming call, already have offer");
      return;
    }

    if (current.isCallActive || current.isCalling) {
      console.log("⚠️ Already in a call, cannot accept new call");
      return;
    }
    
    console.log("📞 Setting incoming call from:", from, "hasOffer:", !!offer);
    set({
      isIncomingCall: true,
      isCalling: false,
      isCallActive: false,
      incomingCallFrom: from,
      callOffer: offer || null,
      callType: type,
      peerId: from,
      callStartTime: null,
      callDuration: 0,
    });
  },

  clearIncomingCall: () => {
    console.log("🧹 Clearing incoming call");
    set({
      isIncomingCall: false,
      incomingCallFrom: null,
      callOffer: null,
    });
  },

  startCall: (type = "video", receiverId) => {
    if (!receiverId) {
      console.error("❌ No receiverId provided to startCall");
      return;
    }

    const current = get();
    
    if (current.isCalling && current.peerId === receiverId) {
      console.log("⏭️ Already calling this user");
      return;
    }

    if (current.isCallActive) {
      console.log("⚠️ Already in an active call");
      return;
    }

    console.log("📞 Starting call to:", receiverId);
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
    console.log("📞 Setting isCalling:", value);
    set({ isCalling: value });
  },

  setCallActive: (value) => {
    const current = get();
    if (current.isCallActive === value) return;
    console.log("✅ Setting call active:", value);
    const startTime = value ? Date.now() : null;
    set({
      isCallActive: value,
      isCalling: false,
      isIncomingCall: false,
      incomingCallFrom: null,
      callOffer: null,
      callStartTime: startTime,
    });
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

  resetCallState: () => {
    console.log("🔄 Resetting call state");
    set({
      isIncomingCall: false,
      isCalling: false,
      isCallActive: false,
      callType: "video",
      incomingCallFrom: null,
      callOffer: null,
      peerId: null,
      callStartTime: null,
      callDuration: 0,
    });
  },
}));