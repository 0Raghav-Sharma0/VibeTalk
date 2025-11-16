import React from "react";
import { useThemeStore } from "../store/useThemeStore";

const THEMES = [
  {
    name: "light",
    title: "Light Theme",
    description: "Clean and bright interface.",
    gradient: "bg-gradient-to-br from-white to-gray-200",
    preview: ["#ffffff", "#e5e7eb", "#d1d5db"],
  },
  {
    name: "dark",
    title: "Dark Theme",
    description: "Smooth dark interface for low-light use.",
    gradient: "bg-gradient-to-br from-gray-800 to-gray-900",
    preview: ["#1e1e1e", "#2d2d2d", "#3a3a3a"],
  },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();

  const applyTheme = (name) => {
    setTheme(name);
    localStorage.setItem("theme", name);
    document.documentElement.setAttribute("data-theme", name);
  };

  return (
    <div className="h-screen w-full pt-24 px-6 bg-base-100 text-base-content flex justify-center overflow-y-auto">
      <div className="w-full max-w-3xl space-y-10">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold">Choose Theme</h1>
          <p className="text-base-content/60 text-sm mt-1">
            Select between Light & Dark modes.
          </p>
        </div>

        {/* Themes Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {THEMES.map((t) => (
            <div
              key={t.name}
              onClick={() => applyTheme(t.name)}
              className={`
                cursor-pointer rounded-3xl border p-6 shadow-lg transition transform
                hover:-translate-y-1 hover:shadow-xl
                bg-base-200 backdrop-blur-md bg-opacity-50
                ${theme === t.name ? "ring-4 ring-primary border-primary" : ""}
              `}
            >
              {/* Preview Background */}
              <div className={`h-32 rounded-2xl mb-5 ${t.gradient} shadow-inner`} />

              {/* Color Dots */}
              <div className="flex gap-2 mb-4 justify-center">
                {t.preview.map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border shadow"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Title */}
              <h2 className="text-xl font-semibold text-center capitalize">
                {t.title}
              </h2>
              <p className="text-center text-sm opacity-60">{t.description}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
