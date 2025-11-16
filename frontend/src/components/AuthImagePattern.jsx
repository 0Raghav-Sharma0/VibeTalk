import React, { useState } from "react";
import { motion } from "framer-motion";

const Tile = ({ src, index }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: "easeOut" }}
      whileHover={{ scale: 1.08, rotate: 1 }}
      className="
        overflow-hidden rounded-2xl relative cursor-pointer
        border border-base-300 bg-base-200 shadow-xl
        hover:shadow-2xl transition
        backdrop-blur-md
      "
      style={{ aspectRatio: "1 / 1" }}
      onClick={() => window.open(src, "_blank")}
    >
      {!loaded && (
        <div className="absolute inset-0 bg-base-300 animate-pulse rounded-2xl" />
      )}

      <img
        src={src}
        alt={`auth-img-${index}`}
        onLoad={() => setLoaded(true)}
        className={`
          w-full h-full object-cover transition-all duration-500
          ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-105"}
        `}
      />

      {/* Theme-aware subtle overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral/40 to-transparent pointer-events-none" />
    </motion.div>
  );
};

const AuthImagePattern = ({ title, subtitle, images = [] }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="hidden lg:flex flex-1 items-center justify-center p-12"
    >
      <div
        className="
          w-full max-w-lg p-8 text-center rounded-3xl
          bg-base-200 border border-base-300 shadow-2xl
          backdrop-blur-xl
        "
      >
        {/* Mosaic */}
        <div className="grid grid-cols-3 gap-4 mb-8 select-none">
          {images.length > 0 ? (
            images.slice(0, 9).map((src, i) => <Tile key={i} src={src} index={i} />)
          ) : (
            [...Array(9)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-base-300 animate-pulse"
                style={{ aspectRatio: "1 / 1" }}
              />
            ))
          )}
        </div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="
            text-3xl font-extrabold mb-1
            text-transparent bg-gradient-to-r from-primary to-secondary bg-clip-text
          "
        >
          {title}
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="text-base-content/60 mt-2 text-sm"
        >
          {subtitle}
        </motion.p>
      </div>
    </motion.div>
  );
};

export default AuthImagePattern;
