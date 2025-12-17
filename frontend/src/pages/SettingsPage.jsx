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

  return (
    <div className="min-h-screen w-full pt-24 px-6 bg-base-100 flex justify-center">
      <div className="w-full max-w-3xl space-y-10">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Choose Theme
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
            Select between Light & Dark modes.
          </p>
        </div>

        {/* Themes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {THEMES.map((t) => (
            <div
              key={t.name}
              onClick={() => setTheme(t.name)}
              className={`
                cursor-pointer rounded-3xl border p-6 transition
                bg-white dark:bg-base-200
                border-gray-200 dark:border-base-300
                hover:-translate-y-1 hover:shadow-lg
                ${
                  theme === t.name
                    ? "ring-4 ring-primary border-primary"
                    : ""
                }
              `}
            >
              {/* Preview */}
              <div
                className={`h-32 rounded-2xl mb-5 ${t.gradient} shadow-inner`}
              />

              {/* Color dots */}
              <div className="flex gap-2 mb-4 justify-center">
                {t.preview.map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Title */}
              <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white">
                {t.title}
              </h2>

              {/* Description */}
              <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
                {t.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
