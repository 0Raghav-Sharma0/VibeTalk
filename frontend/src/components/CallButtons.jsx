import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { Phone, Video } from "lucide-react";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const CallButtons = () => {
  const { startCall } = useVideoCallStore();
  const { selectedUser } = useChatStore();
  const { socket, authUser } = useAuthStore();

  const handleCall = useCallback(
    (type) => {
      if (!selectedUser?._id || !socket || !authUser) return;

      console.log(`📞 Initiating ${type} call to:`, selectedUser._id);
      
      
      socket.emit("call-initiated", {
        from: authUser._id,
        to: selectedUser._id,
        callType: type,
        callerName: authUser.fullName,
      });

      
      startCall(type, selectedUser._id);
    },
    [selectedUser, startCall, socket, authUser]
  );

  if (!selectedUser) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Audio Call Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleCall("audio")}
        aria-label="Audio Call"
        title="Audio Call"
        className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 text-emerald-600 hover:from-emerald-500/20 hover:to-emerald-600/20 border border-emerald-500/20 transition-all shadow-sm"
      >
        <Phone size={18} />
      </motion.button>

      {/* Video Call Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleCall("video")}
        aria-label="Video Call"
        title="Video Call"
        className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-600 hover:from-blue-500/20 hover:to-blue-600/20 border border-blue-500/20 transition-all shadow-sm"
      >
        <Video size={18} />
      </motion.button>
    </div>
  );
};


export default CallButtons;
