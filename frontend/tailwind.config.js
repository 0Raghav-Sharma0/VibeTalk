import defaultTheme from "tailwindcss/defaultTheme";
import daisyui from "daisyui";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    "msg-bubble-sent",
    "msg-bubble-received",
    "sidebar-friend-selected",
    "online-indicator-glow",
    "msg-input-glass",
    "dark-mode-bg",
    "dark-mode-root",
    "call-overlay-bg",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "Plus Jakarta Sans", "system-ui", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        text: "var(--text)",
        muted: "var(--muted)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        accent: "var(--accent)",
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(135deg, var(--grad-1), var(--grad-2))",
      },
      boxShadow: {
        heroic:
          "0 30px 80px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.08)",
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    darkTheme: "dark",
    themes: ["light", "dark"],
  },
};
