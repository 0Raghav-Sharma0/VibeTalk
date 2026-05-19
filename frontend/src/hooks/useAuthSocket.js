import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { env } from "../config/env.js";
import { getClerkToken } from "../lib/tokenBridge.js";
import { showSystemNotification } from "../utils/notifications.js";

/**
 * Manages Socket.IO lifecycle for chat, calls, and presence.
 */
export function useAuthSocket(authUser, { onOnlineUsers, onSocketChange, onReconnect }) {
  const socketRef = useRef(null);
  const onReconnectRef = useRef(onReconnect);
  const onOnlineUsersRef = useRef(onOnlineUsers);
  const onSocketChangeRef = useRef(onSocketChange);
  onReconnectRef.current = onReconnect;
  onOnlineUsersRef.current = onOnlineUsers;
  onSocketChangeRef.current = onSocketChange;

  useEffect(() => {
    if (!authUser?._id) {
      onSocketChangeRef.current?.(null);
      onOnlineUsersRef.current?.([]);
      return;
    }

    let cancelled = false;

    const connect = async () => {
      const token = await getClerkToken();
      if (!token || cancelled) return;

      if (socketRef.current?.connected) return;

      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const socket = io(env.socketUrl, {
        auth: {
          token,
          userId: String(authUser._id),
          username: authUser.fullName || "User",
        },
        // Dev: stay on polling — avoids Firefox WebSocket upgrade errors on nodemon restarts
        transports: env.isDev ? ["polling"] : ["polling", "websocket"],
        upgrade: !env.isDev,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 25,
        timeout: 20000,
      });

      socket.io.on("reconnect_attempt", async () => {
        const fresh = await getClerkToken();
        if (fresh) socket.auth = { ...socket.auth, token: fresh };
      });

      socket.on("connect_error", (err) =>
        console.warn("Socket connect_error:", err?.message)
      );

      socket.io.on("reconnect", () => {
        onReconnectRef.current?.();
      });
      // Do NOT clear onlineUsers on disconnect — that marked everyone "Offline" during
      // brief reconnects and made chat look broken while the socket was recovering.
      socket.on("getOnlineUsers", (ids) => {
        const list = Array.isArray(ids) ? ids : Object.keys(ids || {});
        onOnlineUsersRef.current?.(list);
      });

      registerFriendEvents(socket);
      registerCallEvents(socket);

      socketRef.current = socket;
      onSocketChangeRef.current?.(socket);
    };

    connect();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      onSocketChangeRef.current?.(null);
    };
  }, [authUser?._id]);

  return socketRef;
}

function registerFriendEvents(socket) {
  const run = (fn) =>
    import("../store/useFriendStore").then(({ useFriendStore }) =>
      fn(useFriendStore.getState())
    );
  socket.on("friend-request-received", () => run((s) => s.fetchPendingRequests()));
  socket.on("friend-request-rejected", () => run((s) => s.fetchPendingRequests()));
  socket.on("friend-request-accepted", () => run((s) => s.onFriendRequestAccepted()));
  socket.on("friend-removed", () => run((s) => s.onFriendRemoved()));
}

function registerCallEvents(socket) {
  socket.on("incoming-call", ({ from, callType, callerName, offer }) => {
    import("../store/useVideoCallStore").then(({ useVideoCallStore }) => {
      useVideoCallStore.getState().setIncomingCall(from, offer, callType);
      showSystemNotification({
        title: `Incoming ${callType} call`,
        body: `${callerName || "Someone"} is calling you`,
        onClick: () => window.focus(),
      });
    });
  });
  socket.on("call-failed", ({ reason }) => {
    import("../store/useVideoCallStore").then(({ useVideoCallStore }) => {
      useVideoCallStore.getState().resetCallState();
      toast.error(reason || "Call failed");
    });
  });
  socket.on("call-rejected", () => {
    import("../store/useVideoCallStore").then(({ useVideoCallStore }) => {
      const { isCallActive, isCalling } = useVideoCallStore.getState();
      if (!isCallActive && !isCalling) return;
      useVideoCallStore.getState().resetCallState();
      toast.error("Call was rejected");
    });
  });
  socket.on("call-ended", () => {
    import("../store/useVideoCallStore").then(({ useVideoCallStore }) => {
      if (!useVideoCallStore.getState().isCallActive) return;
      useVideoCallStore.getState().resetCallState();
    });
  });
}
