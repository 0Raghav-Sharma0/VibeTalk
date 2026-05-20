import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { crossfadeTransition, DURATION, EASE_OUT } from "../../lib/motionPresets";

/**
 * Crossfade between keyed views.
 * Use mode="wait" + direction="fade" for sidebar tabs (avoids double-layer flicker).
 */
export default function Crossfade({
  contentKey,
  children,
  className = "",
  innerClassName = "",
  direction = "horizontal",
  mode = "sync",
}) {
  const reduced = useReducedMotion();
  const variants = crossfadeTransition(reduced, direction);
  const wait = mode === "wait";

  return (
    <div className={`relative min-h-0 ${className}`}>
      <AnimatePresence initial={false} mode={wait ? "wait" : undefined}>
        <motion.div
          key={String(contentKey)}
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={{
            duration: reduced ? 0 : DURATION.fast,
            ease: EASE_OUT,
          }}
          className={
            wait
              ? `h-full w-full ${innerClassName}`
              : `absolute inset-0 ${innerClassName}`
          }
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

