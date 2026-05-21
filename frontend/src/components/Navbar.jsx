import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Settings,
  MessageSquare,
  Users,
  Film,
  User,
  MoreVertical,
} from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import { APP_NAME } from "../constants/brand";
import { getPageMeta, ROUTES } from "../constants/routes";
import BackButton from "./BackButton";

const DARK_THEMES = ["dark", "coffee", "nexaura"];

const navLinkClass = (isSpecialPage, isDark) => {
  if (isSpecialPage) {
    return isDark
      ? "text-white bg-white/15 border-white/30 hover:bg-white/20"
      : "text-violet-600 bg-violet-50 border-violet-200 hover:bg-violet-100";
  }
  return "text-violet-600 bg-violet-50 border-violet-200 hover:bg-violet-100 dark-btn";
};

const iconBtnClass = (isSpecialPage, isDark) =>
  isSpecialPage
    ? isDark
      ? "text-white/90 hover:bg-white/10 hover:text-white"
      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
    : "text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark-btn";

const Navbar = ({ onOpenSidebar }) => {
  const { pathname } = useLocation();
  const { theme } = useThemeStore();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  const isHome = pathname === ROUTES.home || pathname === "/home";
  const isSettings = pathname === ROUTES.settings;
  const isSpecialPage = isSettings;
  const isDark = DARK_THEMES.includes(theme);
  const pageMeta = getPageMeta(pathname);
  const isSubPage = Boolean(pageMeta);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const close = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [moreOpen]);

  const headerSurface = isSpecialPage
    ? "border-transparent bg-transparent"
    : "border-b border-transparent bg-white/95 dark:bg-[#0b0b0f]/95 dark:border-white/5 backdrop-blur-md shadow-sm";

  const moreMenuLinks = (
    <>
      {pathname !== ROUTES.watchParty && (
        <Link
          to={ROUTES.watchParty}
          onClick={() => setMoreOpen(false)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-800 hover:bg-gray-100 dark:text-white dark:hover:bg-white/10"
        >
          <Film className="w-4 h-4" />
          Watch Party
        </Link>
      )}
      {pathname !== ROUTES.profile && (
        <Link
          to={ROUTES.profile}
          onClick={() => setMoreOpen(false)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-800 hover:bg-gray-100 dark:text-white dark:hover:bg-white/10"
        >
          <User className="w-4 h-4" />
          Profile
        </Link>
      )}
      {pathname !== ROUTES.settings && (
        <Link
          to={ROUTES.settings}
          onClick={() => setMoreOpen(false)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-800 hover:bg-gray-100 dark:text-white dark:hover:bg-white/10"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      )}
    </>
  );

  return (
    <header
      className={`app-header transition-all ${headerSurface} ${
        isSpecialPage && !isDark ? "[filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.08))] sm:[filter:none]" : ""
      }`}
    >
      <div
        className={`app-header-bar ${
          isSpecialPage ? (isDark ? "text-white" : "text-gray-900") : "text-gray-900 dark:text-[#b29bff]"
        }`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
          {isSubPage ? (
            <>
              <BackButton
                to={pageMeta.backTo}
                label={pageMeta.backLabel}
                variant={isSpecialPage ? "settings" : "default"}
                preferHistory
                className="shrink-0 !min-h-[40px]"
              />
              {!isSettings && (
                <span
                  className={`text-sm sm:text-lg font-semibold truncate min-w-0 ${
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
                className="md:hidden shrink-0 p-2 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-[#b29bff] dark-icon-btn"
                aria-label="Open sidebar"
              >
                <Users className="w-5 h-5" />
              </button>

              <Link
                to={ROUTES.home}
                className="flex items-center gap-2 group select-none min-w-0 overflow-hidden"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors bg-violet-100 text-violet-600 group-hover:bg-violet-200 dark:bg-white/10 dark:text-[#b29bff] dark:group-hover:bg-white/20 shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="hidden min-[380px]:inline text-base sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-[#b29bff] truncate max-w-[6.5rem] sm:max-w-none">
                  {APP_NAME}
                </span>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
          {!isHome && (
            <Link
              to={ROUTES.home}
              className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border min-h-[40px] ${navLinkClass(isSpecialPage, isDark)}`}
              title="Back to chats"
            >
              <MessageSquare className="w-4 h-4" />
              Chats
            </Link>
          )}

          <div className="hidden md:flex items-center gap-1">
            {pathname !== ROUTES.watchParty && (
              <Link
                to={ROUTES.watchParty}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all border min-h-[40px] ${navLinkClass(isSpecialPage, isDark)}`}
                title="Watch Party"
              >
                <Film className="w-4 h-4" />
                <span>Watch Party</span>
              </Link>
            )}
            {pathname !== ROUTES.profile && (
              <Link
                to={ROUTES.profile}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-colors min-h-[40px] ${iconBtnClass(isSpecialPage, isDark)}`}
                title="Profile"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Link>
            )}
            {pathname !== ROUTES.settings && (
              <Link
                to={ROUTES.settings}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-colors min-h-[40px] ${iconBtnClass(isSpecialPage, isDark)}`}
                title="Settings"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>
            )}
          </div>

          {isHome && (
            <div className="relative md:hidden" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((o) => !o)}
                className="p-2 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center text-gray-700 hover:bg-gray-100 dark:text-[#b29bff] dark:hover:bg-white/10"
                aria-label="Open menu"
                aria-expanded={moreOpen}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {moreOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+4px)] z-50 min-w-[11rem] rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-white/15 dark:bg-[#14141c]"
                  role="menu"
                >
                  {moreMenuLinks}
                </div>
              )}
            </div>
          )}

          {!isHome && (
            <div className="flex md:hidden items-center gap-0.5">
              {pathname !== ROUTES.watchParty && (
                <Link
                  to={ROUTES.watchParty}
                  className={`p-2 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center ${iconBtnClass(isSpecialPage, isDark)}`}
                  title="Watch Party"
                >
                  <Film className="w-4 h-4" />
                </Link>
              )}
              {pathname !== ROUTES.profile && (
                <Link
                  to={ROUTES.profile}
                  className={`p-2 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center ${iconBtnClass(isSpecialPage, isDark)}`}
                  title="Profile"
                >
                  <User className="w-4 h-4" />
                </Link>
              )}
              {pathname !== ROUTES.settings && (
                <Link
                  to={ROUTES.settings}
                  className={`p-2 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center ${iconBtnClass(isSpecialPage, isDark)}`}
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
