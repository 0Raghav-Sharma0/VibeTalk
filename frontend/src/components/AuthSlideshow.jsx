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
            transition-opacity duration-1000
            ${i === index ? "opacity-100" : "opacity-0"}
          `}
        >
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${img})` }}
          />
        </div>
      ))}
    </div>
  );
}
