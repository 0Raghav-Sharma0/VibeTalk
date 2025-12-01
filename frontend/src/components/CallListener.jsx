// src/components/CallListener.jsx
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useVideoCallStore } from "../store/useVideoCallStore";

const CallListener = () => {
  const { socket, authUser } = useAuthStore();
  const { setIncomingCall } = useVideoCallStore();

  useEffect(() => {
    if (!socket || !authUser) return;

    console.log("🎧 Setting up global call listener");

    const handleIncomingCall = (data) => {
      console.log("📞 INCOMING CALL EVENT RECEIVED:", data);
      
      const { from, callType, callerName, offer } = data; // ⭐ Get offer data
      
      if (!from || !callType) {
        console.error("❌ Invalid incoming call data");
        return;
      }

      // ⭐ KEY FIX: Pass the offer data to the store
      setIncomingCall(from, offer, callType);

      // Show browser notification
      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          const notification = new Notification(`Incoming ${callType} call`, {
            body: `${callerName || "Someone"} is calling you...`,
            icon: "/call-icon.png",
            tag: "incoming-call",
            requireInteraction: true,
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission();
        }
      }
    };

    socket.on("incoming-call", handleIncomingCall);

    return () => {
      console.log("🎧 Removing global call listener");
      socket.off("incoming-call", handleIncomingCall);
    };
  }, [socket, authUser, setIncomingCall]);

  return null;
};

export default CallListener;