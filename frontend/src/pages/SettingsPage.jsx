import { LogOut } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";
import "./SettingsPage.css";

const DARK_THEMES = ["dark", "coffee", "vibetalk"];

export default function SettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const { authUser, logout } = useAuthStore();

  const isDark = DARK_THEMES.includes(theme);
  const lampOn = !isDark; // Lamp OFF = dark mode, Lamp ON = light mode
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  if (!authUser) return null;

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col relative pt-14">
      {/* Street lamp background */}
      <div className={`settings-lamp-bg ${lampOn ? "lamp-on" : ""}`}>
        <div className="settings-lamp-content">
          <div className="settings-lamp-buildings">
            <div className="settings-lamp-window" />
            <div className="settings-lamp-window" />
            <div className="settings-lamp-window" />
            <div className="settings-lamp-window" />
            <div className="settings-lamp-window" />
            <div className="settings-lamp-window" />
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
      <div className="flex-1 flex flex-col relative z-10 min-h-0 overflow-hidden justify-end pointer-events-none">
        {/* Logout - fixed at bottom, synced with background */}
        <div className="shrink-0 p-4 flex flex-col items-center gap-2 pointer-events-auto">
          <p className="text-[11px] text-white/80">Click the street lamp to switch theme</p>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-red-300 font-medium hover:bg-red-500/20 hover:text-red-200 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
