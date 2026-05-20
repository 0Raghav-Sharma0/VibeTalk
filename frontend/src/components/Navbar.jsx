import { Link, useLocation } from "react-router-dom";
import {
  Settings,
  MessageSquare,
  Users,
  Film,
  User,
} from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import { APP_NAME } from "../constants/brand";
import { getPageMeta, ROUTES } from "../constants/routes";
import BackButton from "./BackButton";

const DARK_THEMES = ["dark", "coffee", "nexaura"];

const Navbar = ({ onOpenSidebar }) => {
  const { pathname } = useLocation();
  const { theme } = useThemeStore();
  const isHome = pathname === ROUTES.home || pathname === "/home";
  const isSettings = pathname === ROUTES.settings;
  const isSpecialPage = isSettings; // transparent header only on lamp settings
  const isDark = DARK_THEMES.includes(theme);
  const pageMeta = getPageMeta(pathname);
  const isSubPage = Boolean(pageMeta);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 h-14 min-h-[56px] pt-[env(safe-area-inset-top)] transition-all ${
        isSpecialPage
          ? "border-transparent bg-transparent"
          : "border-b border-transparent bg-white/95 dark:bg-[#0b0b0f]/95 dark:border-white/5 backdrop-blur-md shadow-sm"
      } ${isSpecialPage && !isDark ? "[filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.08))] sm:[filter:none]" : ""}`}
    >
      <div
        className={`flex h-full items-center justify-between px-4 sm:px-6 gap-2 ${
          isSpecialPage ? (isDark ? "text-white" : "text-gray-900") : "text-gray-900 dark:text-[#b29bff]"
        }`}
      >
        {/* LEFT */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {isSubPage ? (
            <>
              <BackButton
                to={pageMeta.backTo}
                label={pageMeta.backLabel}
                variant={isSpecialPage ? "settings" : "default"}
                preferHistory
              />
              {!isSettings && (
                <span
                  className={`text-base sm:text-lg font-semibold truncate ${
                    isSpecialPage
                      ? isDark
                        ? "text-white"
                        : "text-gray-900"
                      : "text-gray-900 dark:text-[#b29bff]"
                  }`}
                >
                  {pageMeta.title}
                </span>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenSidebar?.()}
                className="md:hidden p-3 -m-1 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-[#b29bff] dark-icon-btn shrink-0"
                aria-label="Open sidebar"
              >
                <Users className="w-5 h-5" />
              </button>

              <Link
                to={ROUTES.home}
                className="flex items-center gap-2.5 group select-none min-w-0"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors bg-violet-100 text-violet-600 group-hover:bg-violet-200 dark:bg-white/10 dark:text-[#b29bff] dark:group-hover:bg-white/20 shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="text-xl font-semibold tracking-tight text-gray-900 dark:text-[#b29bff] truncate sm:inline">
                  {APP_NAME}
                </span>
              </Link>
            </>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {!isHome && (
            <Link
              to={ROUTES.home}
              className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                isSpecialPage
                  ? isDark
                    ? "text-white bg-white/15 border-white/30 hover:bg-white/20"
                    : "text-violet-600 bg-violet-50 border-violet-200 hover:bg-violet-100"
                  : "text-violet-600 bg-violet-50 border-violet-200 hover:bg-violet-100 dark-btn"
              }`}
              title="Back to chats"
            >
              <MessageSquare className="w-4 h-4" />
              Chats
            </Link>
          )}

          {pathname !== ROUTES.watchParty && (
            <Link
              to={ROUTES.watchParty}
              className={`flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                isSpecialPage
                  ? isDark
                    ? "text-white bg-white/15 border-white/30 hover:bg-white/20"
                    : "text-violet-600 bg-violet-50 border-violet-200 hover:bg-violet-100"
                  : "text-violet-600 bg-violet-50 border-violet-200 hover:bg-violet-100 dark-btn"
              }`}
            >
              <Film className="w-4 h-4" />
              <span className="hidden sm:inline">Watch Party</span>
            </Link>
          )}

          {pathname !== ROUTES.profile && (
            <Link
              to={ROUTES.profile}
              className={`flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isSpecialPage
                  ? isDark
                    ? "text-white/90 hover:bg-white/10 hover:text-white"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark-btn"
              }`}
              title="Profile"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
          )}

          {pathname !== ROUTES.settings && (
            <Link
              to={ROUTES.settings}
              className={`flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isSpecialPage
                  ? isDark
                    ? "text-white/90 hover:bg-white/10 hover:text-white"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark-btn"
              }`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
