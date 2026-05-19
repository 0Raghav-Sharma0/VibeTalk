// src/store/useThemeStore.js
import { create } from "zustand";

const DARK_THEMES = ["dark", "coffee", "nexaura"];

function readStoredTheme() {
  try {
    const stored = localStorage.getItem("chat-theme") || "light";
    return stored === "vibetalk" ? "nexaura" : stored;
  } catch {
    return "light";
  }
}

export const useThemeStore = create((set) => ({
  theme: readStoredTheme(),

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
