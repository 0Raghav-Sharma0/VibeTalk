import lottie from "lottie-web";
import { defineElement } from "@lordicon/element";
defineElement(lottie.loadAnimation);

const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-100/50">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center gap-4 mb-4">
          <div className="relative">
            <div className = "w-24 h-24">
                <lord-icon trigger="loop" src="/wired-lineal-2803-engagement-alt-hover-pinch.json" style={{ width: "100px", height: "100px" }}></lord-icon>
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-bold">Welcome to ChitChat!</h2>
        <p className="text-base-content/60">
          Select a conversation to start ChitChatting!
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;