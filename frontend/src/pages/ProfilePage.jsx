import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";
import ProfilePanel from "../components/ProfilePanel";

const DARK_THEMES = ["dark", "coffee", "nexaura"];

export default function ProfilePage() {
  const { theme, setTheme } = useThemeStore();
  const { authUser } = useAuthStore();
  const isDark = DARK_THEMES.includes(theme);

  if (!authUser) return null;

  return (
    <div className="min-h-screen dark-mode-root bg-gray-50 dark-mode-bg text-gray-900 dark:text-white">
      <div
        className="max-w-lg mx-auto px-4 pb-8"
        style={{ paddingTop: "calc(3.5rem + env(safe-area-inset-top, 0px) + 1rem)" }}
      >
        <p className="text-sm text-gray-600 dark:text-white/70 mb-5 font-medium">
          Update how others see you in chats and calls.
        </p>

        <ProfilePanel />

        <section className="mt-5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark-item shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Appearance</h2>
          <p className="text-xs text-gray-600 dark:text-white/65 mb-4">
            Switch light or dark mode — synced across the whole app.
          </p>
          <div className="flex gap-2 p-1 rounded-xl bg-gray-100 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                !isDark
                  ? "bg-white dark:bg-violet-500/30 text-violet-700 dark:text-violet-200 shadow-sm"
                  : "text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Sun className="w-4 h-4" />
              Light
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isDark
                  ? "bg-white dark:bg-violet-500/30 text-violet-700 dark:text-violet-200 shadow-sm"
                  : "text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Moon className="w-4 h-4" />
              Dark
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
