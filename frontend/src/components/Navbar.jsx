import { Link, useLocation } from "react-router-dom";
import {
  Settings,
  MessageSquare,
  Users,
  Film,
} from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import { useSidebar } from "../contexts/SidebarContext";

const DARK_THEMES = ["dark", "coffee", "vibetalk"];

const Navbar = () => {
  const { setSidebarOpen } = useSidebar();
  const { pathname } = useLocation();
  const isHome = pathname === "/" || pathname === "/home";
  const { theme } = useThemeStore();
  const isSettings = pathname === "/settings";
  const isDark = DARK_THEMES.includes(theme);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 h-14 min-h-[56px] pt-[env(safe-area-inset-top)] transition-all ${
        isSettings
          ? "border-transparent bg-transparent"
          : "border-b border-transparent bg-white/95 dark:bg-[#0b0b0f]/95 dark:border-white/5 backdrop-blur-md shadow-sm"
      } ${isSettings && !isDark ? "[filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.08))] sm:[filter:none]" : ""}`}
    >
      <div className={`flex h-full items-center justify-between px-4 sm:px-6 ${
        isSettings ? (isDark ? "text-white" : "text-gray-900") : "text-gray-900 dark:text-[#b29bff]"
      }`}>

        {/* LEFT */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className={`${!isHome ? "hidden" : ""} md:hidden p-2 rounded-xl transition-colors ${
              isSettings
                ? isDark
                  ? "text-white/90 hover:bg-white/10 hover:text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-[#b29bff] dark:hover:bg-white/10 dark:hover:text-white"
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
              isSettings
                ? isDark
                  ? "bg-white/20 text-white group-hover:bg-white/30"
                  : "bg-violet-100 text-violet-600 group-hover:bg-violet-200"
                : "bg-violet-100 text-violet-600 group-hover:bg-violet-200 dark:bg-white/10 dark:text-[#b29bff] dark:group-hover:bg-white/20"
            }`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className={`text-lg font-bold tracking-tight ${
              isSettings
                ? (isDark ? "text-white" : "text-gray-900")
                : "text-gray-900 dark:text-[#b29bff]"
            }`}>
              VibeTalk
            </span>
          </Link>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          <Link
            to="/watch-party"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
              isSettings
                ? isDark
                  ? "text-white bg-white/15 border-white/30 hover:bg-white/20"
                  : "text-violet-600 bg-violet-50 border-violet-200 hover:bg-violet-100"
                : "text-violet-600 bg-violet-50 border-violet-200 hover:bg-violet-100 dark:text-[#b29bff] dark:bg-transparent dark:border-white/20 dark:hover:bg-white/10"
            }`}
          >
            <Film className="w-4 h-4" />
            <span className="hidden sm:inline">Watch Party</span>
          </Link>

          <Link
            to="/settings"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              isSettings
                ? isDark
                  ? "text-white/90 hover:bg-white/10 hover:text-white"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                : "text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-[#b29bff] dark:hover:bg-white/10 dark:hover:text-white"
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
