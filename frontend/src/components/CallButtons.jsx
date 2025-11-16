import React, { useCallback } from "react";
import { Phone, Video } from "lucide-react";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useChatStore } from "../store/useChatStore";

/* DaisyUI theme-aware base button */
const btnBase =
  "w-10 h-10 rounded-full flex items-center justify-center \
   border border-base-300 bg-base-200 text-base-content \
   transition hover:bg-base-300 active:scale-95";

const CallButtons = () => {
  const { initiateCall } = useVideoCallStore();
  const { selectedUser } = useChatStore();

  const handleCall = useCallback(
    (type) => {
      if (!selectedUser) return;
      initiateCall(type);
    },
    [initiateCall, selectedUser]
  );

  if (!selectedUser) return null;

  return (
    <div className="flex items-center gap-3">

      {/* Audio Call */}
      <button
        onClick={() => handleCall("audio")}
        aria-label="Audio Call"
        title="Audio Call"
        className={`${btnBase} hover:border-success/50`}
      >
        <Phone size={16} className="text-success" />
      </button>

      {/* Video Call */}
      <button
        onClick={() => handleCall("video")}
        aria-label="Video Call"
        title="Video Call"
        className={`${btnBase} hover:border-info/50`}
      >
        <Video size={16} className="text-info" />
      </button>

    </div>
  );
};

export default CallButtons;
