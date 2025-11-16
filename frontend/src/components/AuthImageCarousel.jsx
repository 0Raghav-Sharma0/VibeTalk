import React from "react";
import { motion } from "framer-motion";

const AuthImageCarousel = ({ images }) => {
  return (
    <div className="hidden lg:flex items-center justify-center bg-base-300 border-l border-base-300 overflow-hidden relative">
      
      {/* Animated background aura */}
      <motion.div
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 20% 30%, var(--p) 20%, transparent 60%), radial-gradient(circle at 80% 70%, var(--s) 20%, transparent 60%)",
          filter: "blur(45px)",
        }}
      />

      {/* CAROUSEL */}
      <div className="relative w-full h-full overflow-hidden flex items-center justify-center p-10 z-10">
        <motion.div
          className="flex gap-6"
          animate={{ x: ["0%", "-100%"] }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {/* Duplicate list for seamless loop */}
          {[...images, ...images].map((img, i) => (
            <img
              key={i}
              src={img}
              className="
                w-64 h-80 
                object-cover 
                rounded-2xl 
                border border-base-300 
                shadow-xl
                opacity-90
              "
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthImageCarousel;
