// Slideshow.jsx
import React, { useState, useEffect } from "react";

export default function Slideshow({ images }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="absolute inset-0">
      <img
        src={images[index]}
        className="w-full h-full object-cover animate-kenburns"
      />

      {/* Soft overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-base-300/40 to-transparent" />
    </div>
  );
}
