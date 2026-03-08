import React from "react";

const AuthImageCarousel = ({ images }) => {
  return (
    <div className="hidden lg:flex items-center justify-center bg-base-300 border-l border-transparent overflow-hidden relative">

      <div className="relative w-full h-full overflow-hidden flex items-center justify-center p-10">
        <div className="flex gap-6 flex-wrap justify-center">
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              className="
                w-64 h-80 
                object-cover 
                rounded-2xl 
                border border-transparent 
                shadow-xl
                opacity-90
              "
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthImageCarousel;
