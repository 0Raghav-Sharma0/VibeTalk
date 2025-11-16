import React, { useEffect, useState } from "react";

export default function AuthSlideshow({ images }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(id);
  }, [images.length]);

  return (
    <div className="hidden md:block relative w-full h-full overflow-hidden">
      {images.map((img, i) => (
        <div
          key={i}
          className={`
            absolute inset-0 w-full h-full 
            transition-opacity duration-[1200ms] ease-out
            ${i === index ? "opacity-100" : "opacity-0"}
          `}
        >
          <img
            src={img}
            alt=""
            className="
              w-full h-full 
              object-cover 
              object-top     /* ⭐ FACE ON TOP — crop bottom */
            "
          />

          {/* Optional soft overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-base-300/40 to-transparent pointer-events-none" />
        </div>
      ))}
    </div>
  );
}

