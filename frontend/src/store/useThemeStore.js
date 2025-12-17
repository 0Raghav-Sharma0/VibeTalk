// src/store/useThemeStore.js
import { create } from "zustand";

const DARK_THEMES = ["dark", "coffee", "vibetalk"];

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("chat-theme") || "light",

  setTheme: (theme) => {
    // DaisyUI
    document.documentElement.setAttribute("data-theme", theme);

    // Tailwind
    document.documentElement.classList.toggle(
      "dark",
      DARK_THEMES.includes(theme)
    );

    localStorage.setItem("chat-theme", theme);
    set({ theme });
  },
}));
