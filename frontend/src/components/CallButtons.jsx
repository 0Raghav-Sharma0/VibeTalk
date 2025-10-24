import React from "react";
import { Phone, Video } from "lucide-react";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useChatStore } from "../store/useChatStore";

const CallButtons = () => {
    const { initiateCall } = useVideoCallStore();
    const { selectedUser } = useChatStore();

    const handleCall = (type) => {
        if (!selectedUser) return;
        console.log(`📞 Starting ${type} call with ${selectedUser.fullName}`);
        initiateCall(type);
    };

    if (!selectedUser) return null;

    return (
        <div className="flex gap-2">
            <button
                onClick={() => handleCall("audio")}
                className="btn btn-sm btn-circle text-green-600 hover:bg-green-600 hover:text-white transition-colors"
                title="Audio Call"
            >
                <Phone size={18} />
            </button>
            
            <button
                onClick={() => handleCall("video")}
                className="btn btn-sm btn-circle text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                title="Video Call"
            >
                <Video size={18} />
            </button>
        </div>
    );
};

export default CallButtons;