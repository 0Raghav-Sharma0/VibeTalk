// tailwind.config.js
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        display: ["Poppins", "Inter", ...defaultTheme.fontFamily.sans],
      },
      // small helpers for shadow/gradients that use CSS variables below
      boxShadow: {
        "theme-glow": "0 10px 30px rgba(0,0,0,0.55), 0 6px 12px var(--theme-glow, rgba(0,0,0,0))",
      },
      backgroundImage: {
        "theme-gradient": "linear-gradient(135deg, var(--grad-1), var(--grad-2))",
      },
    },
  },
  plugins: [],
};
