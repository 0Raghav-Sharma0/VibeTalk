/**
 * WebRTC signaling state — in-memory call locks (Redis-ready in Phase 6).
 * Socket.IO relays ICE/SDP only; media stays peer-to-peer.
 */
export class CallSignalingService {
  constructor() {
    /** @type {Map<string, true>} */
    this.activeCalls = new Map();
  }

  callKey(from, to) {
    return `${from}:${to}`;
  }

  isInProgress(from, to) {
    const k1 = this.callKey(from, to);
    const k2 = this.callKey(to, from);
    return this.activeCalls.has(k1) || this.activeCalls.has(k2);
  }

  tryAcquire(from, to) {
    if (this.isInProgress(from, to)) return false;
    this.activeCalls.set(this.callKey(from, to), true);
    return true;
  }

  release(from, to) {
    this.activeCalls.delete(this.callKey(from, to));
    this.activeCalls.delete(this.callKey(to, from));
  }

  releaseAllForUser(userId) {
    const uid = String(userId);
    for (const key of [...this.activeCalls.keys()]) {
      const [callerId, calleeId] = key.split(":");
      if (callerId === uid || calleeId === uid) {
        this.activeCalls.delete(key);
      }
    }
  }
}

export const callSignalingService = new CallSignalingService();
