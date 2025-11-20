// src/store/useVideoCallStore.js
import { create } from "zustand";

/**
 * Centralized call state for the app.
 * Exposes helpers used by VideoCall UI + ChatHeader to start/accept/reject calls.
 *
 * This store intentionally keeps simple flags and media streams. The WebRTC logic
 * lives in VideoCall.jsx (so the component can own peer connections and refs).
 */

export const useVideoCallStore = create((set, get) => ({
  // State
  isIncomingCall: false,
  isCalling: false,
  isCallActive: false,
  callType: "video", // "audio" or "video"
  incomingCallFrom: null, // userId of caller
  callOffer: null, // RTCSessionDescription from caller

  // Media streams
  localStream: null,
  remoteStream: null,

  // Derived: whether we are in a call flow that will create outgoing offer
  // Actions

  // Called by backend socket 'incoming-call' handler
  setIncomingCall: (from, offer, callType) => {
    console.log("📞 INCOMING CALL", { from, callType });
    set({
      isIncomingCall: true,
      incomingCallFrom: from,
      callOffer: offer,
      callType: callType || "video",
      isCalling: false,
      isCallActive: false,
    });
  },

  clearIncomingCall: () =>
    set({
      isIncomingCall: false,
      incomingCallFrom: null,
      callOffer: null,
    }),

  // Called by UI when user clicks "call"
  startCall: (type = "video", receiverId = null) => {
    // mark that we want to call — VideoCall.jsx will observe isCalling and kick off outgoing process
    console.log("🎬 startCall", { type, receiverId });
    set({
      callType: type,
      isCalling: true,
      isCallActive: false,
      incomingCallFrom: null,
      callOffer: null,
    });
  },

  // Called by VideoCall.jsx to indicate outgoing attempt has begun (prevents double-start)
  setCalling: (val) => {
    console.log("📞 setCalling:", val);
    set({ isCalling: val });
  },

  // Called when call actually connected
  setCallActive: (val) => {
    console.log("📞 setCallActive:", val);
    set({ isCallActive: val });
  },

  // Streams
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),

  // Resets everything and stops streams
  resetCallState: () => {
    console.log("📞 resetCallState");
    const state = get();
    try {
      if (state.localStream) state.localStream.getTracks().forEach((t) => t.stop());
    } catch (e) {
      // ignore
    }
    try {
      if (state.remoteStream) state.remoteStream.getTracks().forEach((t) => t.stop());
    } catch (e) {
      // ignore
    }

    set({
      isIncomingCall: false,
      isCalling: false,
      isCallActive: false,
      callType: "video",
      incomingCallFrom: null,
      callOffer: null,
      localStream: null,
      remoteStream: null,
    });
  },
}));
