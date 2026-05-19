import { useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import { useAuthSocket } from "../hooks/useAuthSocket.js";
import { useChatStore } from "../store/useChatStore.js";

export default function AuthSocketProvider({ children }) {
  const authUser = useAuthStore((s) => s.authUser);
  const setOnlineUsers = useAuthStore((s) => s.setOnlineUsers);
  const setSocket = useAuthStore((s) => s.setSocket);

  const onReconnect = useCallback(() => {
    useChatStore.getState().refetchOpenChat?.();
  }, []);

  useAuthSocket(authUser, {
    onOnlineUsers: setOnlineUsers,
    onSocketChange: setSocket,
    onReconnect,
  });

  return children;
}
