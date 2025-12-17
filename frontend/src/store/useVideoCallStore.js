import { create } from "zustand";

export const useVideoCallStore = create((set, get) => ({
  /* ================= STATE ================= */
  isIncomingCall: false,
  isCalling: false,
  isCallActive: false,
  accepted: false,

  callType: "video",
  incomingCallFrom: null,
  callOffer: null,
  peerId: null,

  callStartTime: null,
  callDuration: 0,

  /* ================= INCOMING CALL ================= */
  setIncomingCall: (from, offer, type = "video") => {
    const current = get();

    // Same incoming call → just update offer
    if (current.isIncomingCall && current.incomingCallFrom === from) {
      if (offer && !current.callOffer) {
        console.log("📞 Updating incoming offer");
        set({ callOffer: offer });
      }
      return;
    }

    // Busy → reject silently
    if (current.isCalling || current.isCallActive) {
      console.log("⚠️ Busy, ignoring incoming call");
      return;
    }

    console.log("📞 Incoming call from:", from);

    set({
      isIncomingCall: true,
      isCalling: false,
      isCallActive: false,
      accepted: false,

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

  /* ================= OUTGOING CALL ================= */
  startCall: (type = "video", receiverId) => {
    if (!receiverId) {
      console.error("❌ startCall without receiverId");
      return;
    }

    const current = get();

    if (current.isCalling || current.isCallActive) {
      console.log("⚠️ Already in call");
      return;
    }

    console.log("📞 Starting call to:", receiverId);

    set({
      callType: type,
      isCalling: true,
      isIncomingCall: false,
      isCallActive: false,
      accepted: false,

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

    console.log("📞 isCalling:", value);
    set({ isCalling: value });
  },

  /* ================= CALL ACCEPTED ================= */
  setCallActive: (value) => {
    const current = get();
    if (current.isCallActive === value) return;

    console.log("✅ Call active:", value);

    set({
      isCallActive: value,
      accepted: value,

      isCalling: false,
      isIncomingCall: false,
      incomingCallFrom: null,
      callOffer: null,

      callStartTime: value ? Date.now() : null,
    });
  },

  /* ================= PEER ================= */
  setPeerId: (id) => {
    if (get().peerId === id) return;
    set({ peerId: id });
  },

  clearPeerId: () => set({ peerId: null }),

  /* ================= TIMER ================= */
  updateCallDuration: () => {
    const { callStartTime, isCallActive } = get();
    if (!isCallActive || !callStartTime) return;

    const seconds = Math.floor((Date.now() - callStartTime) / 1000);
    set({ callDuration: seconds });
  },

  /* ================= FULL RESET ================= */
  resetCallState: () => {
    console.log("🔄 Resetting call state");

    set({
      isIncomingCall: false,
      isCalling: false,
      isCallActive: false,
      accepted: false,

      callType: "video",
      incomingCallFrom: null,
      callOffer: null,
      peerId: null,

      callStartTime: null,
      callDuration: 0,
    });
  },
}));
