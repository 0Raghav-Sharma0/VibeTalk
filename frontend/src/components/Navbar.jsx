import { Link, useLocation } from "react-router-dom";
import {
  Settings,
  MessageSquare,
  Users,
  Film,
} from "lucide-react";

const Navbar = ({ onOpenSidebar }) => {
  const { pathname } = useLocation();
  const isSettings = pathname === "/settings";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 h-14 transition-all ${
        isSettings
          ? "border-transparent bg-transparent"
          : "border-b border-base-300/50 bg-base-100/95 backdrop-blur-md shadow-sm"
      }`}
    >
      <div className={`flex h-full items-center justify-between px-4 sm:px-6 ${isSettings ? "text-white" : ""}`}>

        {/* LEFT */}
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenSidebar}
            className={`md:hidden p-2 rounded-xl transition-colors ${
              isSettings
                ? "text-white/90 hover:bg-white/10 hover:text-white"
                : "text-gray-600 dark:text-base-content/70 hover:bg-base-200 hover:text-gray-900 dark:hover:text-base-content"
            }`}
            aria-label="Open sidebar"
          >
            <Users className="w-5 h-5" />
          </button>

          <Link
            to="/"
            className="flex items-center gap-2.5 group select-none"
          >
            <div className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors ${
              isSettings ? "bg-white/20 text-white group-hover:bg-white/30" : "bg-primary/20 text-primary group-hover:bg-primary/30"
            }`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className={`text-lg font-bold tracking-tight ${
              isSettings ? "text-white" : "text-gray-900 dark:text-base-content"
            }`}>
              VibeTalk
            </span>
          </Link>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          <Link
            to="/watch-party"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              isSettings
                ? "text-white bg-white/15 border border-white/30 hover:bg-white/25 hover:border-white/50"
                : "text-primary bg-primary/15 border border-primary/25 hover:bg-primary/25 hover:border-primary/40"
            }`}
          >
            <Film className="w-4 h-4" />
            <span className="hidden sm:inline">Watch Party</span>
          </Link>

          <Link
            to="/settings"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              isSettings
                ? "text-white/90 hover:bg-white/10 hover:text-white"
                : "text-gray-700 dark:text-base-content/80 hover:text-gray-900 dark:hover:text-base-content hover:bg-base-200"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
