import { LogOut } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { useThemeStore } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";
import { usePinnedStore } from "../store/usePinnedStore";
import BackButton from "../components/BackButton";
import { ROUTES } from "../constants/routes";
import "./SettingsPage.css";

const DARK_THEMES = ["dark", "coffee", "nexaura"];

/** Window grids per building: lit | dim (night); day mode renders all as blue */
const BUILDING_WINDOWS = {
  left: ["lit", "lit", "lit", "lit", "dim", "lit"],
  center: [
    "lit", "lit", "lit",
    "lit", "dim", "lit",
    "lit", "lit", "lit",
  ],
  right: ["lit", "lit", "lit", "dim"],
};

function BuildingWindows() {
  const renderBlock = (blockClass, types) => (
    <div className={`settings-win-block ${blockClass}`}>
      {types.map((type, i) => (
        <div key={i} className={`settings-window settings-window--${type}`} />
      ))}
    </div>
  );

  return (
    <div className="settings-building-windows" aria-hidden="true">
      {renderBlock("settings-win-block--left", BUILDING_WINDOWS.left)}
      {renderBlock("settings-win-block--center", BUILDING_WINDOWS.center)}
      {renderBlock("settings-win-block--right", BUILDING_WINDOWS.right)}
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const { signOut } = useClerk();
  const { authUser, clearAuth, disconnectSocket } = useAuthStore();

  const handleLogout = async () => {
    disconnectSocket();
    usePinnedStore.getState().clear();
    clearAuth();
    await signOut({ redirectUrl: "/login" });
  };

  const isDark = DARK_THEMES.includes(theme);
  const lampOn = isDark; // Lamp ON = night (dark mode), Lamp OFF = day (light mode)
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  if (!authUser) return null;

  return (
    <div className="settings-page h-screen w-full overflow-hidden flex flex-col relative pt-14">
      {/* Street lamp background */}
      <div className={`settings-lamp-bg ${lampOn ? "lamp-on" : ""}`}>
        <div className="settings-sky" aria-hidden="true">
          <div className="settings-sun" />
          <div className="settings-clouds">
            <span className="settings-cloud settings-cloud--1" />
            <span className="settings-cloud settings-cloud--2" />
            <span className="settings-cloud settings-cloud--3" />
            <span className="settings-cloud settings-cloud--4" />
          </div>
          <div className="settings-stars" />
        </div>
        <div className="settings-lamp-content">
          <div className="settings-lamp-buildings">
            <BuildingWindows />
            <div className="settings-building-door" aria-hidden="true" />
          </div>
          <div className="settings-lamp-ground">
            <div className="settings-lamp-sewer" />
          </div>
          <div className="settings-lamp-streetlamp">
            <div className="settings-lamp-base" />
            <div className="settings-lamp-basetop" />
            <div className="settings-lamp-pole" />
            <div className="settings-lamp-poletop" />
            <div className="settings-lamp-head">
              <button
                type="button"
                onClick={toggleTheme}
                className="settings-lamp-label"
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              />
              <div className="settings-lamp-top" />
              <div className="settings-lamp-glass" />
              <div className="settings-lamp-bot" />
            </div>
            <div className="settings-lamp-light" />
            <div className="settings-lamp-ground-light" />
          </div>
        </div>
      </div>

      {/* Settings content overlay - pointer-events-none so lamp receives clicks */}
      <div className="flex-1 flex flex-col relative z-10 min-h-0 overflow-hidden pointer-events-none justify-end">
        <div className="absolute top-2 left-2 sm:top-3 sm:left-4 pointer-events-auto md:hidden z-20">
          <BackButton
            to={ROUTES.home}
            label="Chats"
            variant="settings"
            preferHistory
          />
        </div>

        <div
          className={`settings-footer shrink-0 p-4 flex flex-col items-center gap-2 pointer-events-auto ${
            isDark ? "settings-footer--night" : "settings-footer--day"
          }`}
        >
          <p className="settings-footer-hint">
            Click the street lamp to switch theme
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="settings-footer-logout"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
