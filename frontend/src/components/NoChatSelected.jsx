import { motion } from "framer-motion";

const NoChatSelected = () => {
  return (
    <div className="h-full w-full flex items-center justify-center px-6 select-none">

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="
          flex flex-col items-center text-center
          border border-gray-200 dark:border-white/20 rounded-xl
          p-8 sm:p-10 max-w-sm w-full bg-gray-50/90 dark:bg-white/5
        "
      >
        {/* Minimal geometric icon */}
        <div className="mb-5">
          <svg
            width="60"
            height="60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary/80 dark:text-primary/70"
          >
            <path d="M21 15v-8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14l4-4h10" />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Select a chat
        </h2>

        <p className="text-gray-600 dark:text-white/70 text-sm leading-relaxed">
          Choose a friend or group from the sidebar to start messaging.
        </p>
      </motion.div>

    </div>
  );
};

export default NoChatSelected;
