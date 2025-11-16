import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("theme") || "dark",

  setTheme: (newTheme) => {
    localStorage.setItem("theme", newTheme);

    // Apply theme to HTML tag
    const html = document.documentElement;
    html.setAttribute("data-theme", newTheme);

    set({ theme: newTheme });
  },
}));
