import { motion } from "framer-motion";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { pageTransition, DURATION, EASE_OUT } from "../../lib/motionPresets";

export default function PageTransition({ children, className = "" }) {
  const reduced = useReducedMotion();
  const variants = pageTransition(reduced);

  return (
    <motion.div
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={{
        duration: reduced ? 0 : DURATION.page,
        ease: EASE_OUT,
      }}
      className={`w-full ${className}`}
      style={{ willChange: reduced ? "auto" : "opacity, transform" }}
    >
      {children}
    </motion.div>
  );
}
