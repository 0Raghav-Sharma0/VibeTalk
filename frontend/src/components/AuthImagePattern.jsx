import React, { useState } from "react";
import { motion } from "framer-motion";

const Tile = ({ src }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className="
        overflow-hidden rounded-2xl relative cursor-pointer
        border border-base-300 bg-base-200 shadow-xl
        hover:shadow-2xl transition
      "
      style={{ aspectRatio: "1 / 1" }}
      onClick={() => window.open(src, "_blank")}
    >
      {!loaded && (
        <div className="absolute inset-0 bg-base-300 rounded-2xl" />
      )}

      <img
        src={src}
        alt="auth-img"
        onLoad={() => setLoaded(true)}
        className={`
          w-full h-full object-cover transition-opacity duration-500
          ${loaded ? "opacity-100" : "opacity-0"}
        `}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-neutral/40 to-transparent pointer-events-none" />
    </div>
  );
};

const AuthImagePattern = ({ title, subtitle, images = [] }) => {
  return (
    <div className="hidden lg:flex flex-1 items-center justify-center p-12">
      <div
        className="
          w-full max-w-lg p-8 text-center rounded-3xl
          bg-base-200 border border-base-300 shadow-2xl
        "
      >
        <div className="grid grid-cols-3 gap-4 mb-8 select-none">
          {images.length > 0 ?
            images.slice(0, 9).map((src, i) => <Tile key={i} src={src} />)
          :
            [...Array(9)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-base-300"
                style={{ aspectRatio: "1 / 1" }}
              />
            ))
          }
        </div>

        <h2 className="text-3xl font-extrabold mb-1 text-primary">
          {title}
        </h2>

        <p className="text-base-content/60 mt-2 text-sm">{subtitle}</p>
      </div>
    </div>
  );
};

export default AuthImagePattern;
