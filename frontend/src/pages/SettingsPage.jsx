import React from "react";
import { useThemeStore } from "../store/useThemeStore";
import { THEMES } from "../constants";

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="h-screen w-full pt-24 px-6 bg-base-100 text-base-content flex justify-center overflow-y-auto">
      <div className="w-full max-w-4xl space-y-10">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold">Choose Theme</h1>
          <p className="text-base-content/60 text-sm">
            Preview themes and switch instantly.
          </p>
        </div>

        {/* THEME GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {THEMES.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTheme(t);
                localStorage.setItem("theme", t);
              }}
              className={`
                rounded-xl border p-3 transition relative
                bg-base-200 border-base-300 hover:bg-base-300
                ${theme === t ? "ring-2 ring-primary border-primary" : ""}
              `}
            >
              {/* THEME PREVIEW CONTAINER */}
              <div
                data-theme={t}
                className="w-full h-8 rounded-lg bg-base-100 flex gap-1 p-1 mb-2"
              >
                <div className="flex-1 h-full rounded bg-primary"></div>
                <div className="flex-1 h-full rounded bg-secondary"></div>
                <div className="flex-1 h-full rounded bg-accent"></div>
                <div className="flex-1 h-full rounded bg-neutral"></div>
              </div>

              {/* THEME NAME */}
              <p className="text-center text-xs font-medium truncate capitalize">
                {t}
              </p>
            </button>
          ))}
        </div>

        {/* LIVE PREVIEW */}
        <div className="space-y-4 pb-10">
          <h2 className="text-lg font-semibold">Live Preview</h2>

          <div className="rounded-xl border border-base-300 bg-base-200 p-6 shadow-sm">
            <div className="max-w-md mx-auto rounded-xl border border-base-300 bg-base-100 p-5 space-y-5 shadow-sm">

              {/* Chat bubbles */}
              <div className="chat chat-start">
                <div className="chat-bubble chat-bubble-neutral">
                  Hey! How’s it going?
                </div>
              </div>

              <div className="chat chat-end">
                <div className="chat-bubble chat-bubble-primary text-primary-content">
                  I'm doing great! Preview looks awesome.
                </div>
              </div>

              {/* Input preview */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  className="input input-bordered flex-1"
                  readOnly
                  value="This is a preview..."
                />
                <button className="btn btn-primary">Send</button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
