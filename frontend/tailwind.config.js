import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        accentPink: "#ec4899",
        accentViolet: "#8b5cf6",
        accentIndigo: "#6366f1",
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      "light",
      "dark",
      "cupcake",
      "synthwave",
      "forest",
      "aqua",
      "dim",
      "night",
      "dracula",
      "business",
      "sunset",
      // 👇 Your custom VibeTalk theme
      {
        vibetalk: {
          primary: "#a855f7", // violet
          secondary: "#ec4899", // pink
          accent: "#6366f1", // indigo
          neutral: "#1b1b24",
          "base-100": "#0f0f17", // main background
          "base-200": "#141421", // panels
          "base-300": "#1a1a26", // slightly darker border areas
          info: "#3b82f6",
          success: "#22c55e",
          warning: "#facc15",
          error: "#ef4444",
        },
      },
    ],
  },
};
