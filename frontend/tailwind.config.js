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
    "mobile-chat-root",
    "dark-card",
    "dark-input",
    "dark-panel",
    "dark-tab-bg",
    "dark-tab-selected",
    "dark-tab-unselected",
    "dark-item",
    "dark-btn",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "system-ui", ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        "2xs": ["0.75rem", { lineHeight: "1.35", letterSpacing: "0.01em" }],
        xs: ["0.8125rem", { lineHeight: "1.4", letterSpacing: "0.01em" }],
        sm: ["0.875rem", { lineHeight: "1.45", letterSpacing: "0.005em" }],
        base: ["1rem", { lineHeight: "1.55", letterSpacing: "0" }],
        lg: ["1.0625rem", { lineHeight: "1.5", letterSpacing: "-0.01em" }],
        xl: ["1.125rem", { lineHeight: "1.4", letterSpacing: "-0.015em" }],
        "2xl": ["1.375rem", { lineHeight: "1.3", letterSpacing: "-0.02em" }],
        "3xl": ["1.625rem", { lineHeight: "1.25", letterSpacing: "-0.025em" }],
      },
      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "600",
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
