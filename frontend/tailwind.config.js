import defaultTheme from "tailwindcss/defaultTheme";
import daisyui from "daisyui";

export default {
  darkMode: "class", // ✅ THIS WAS MISSING
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "gg sans", "Noto Sans", ...defaultTheme.fontFamily.sans],
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
