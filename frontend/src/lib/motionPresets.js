/** Fast, GPU-friendly transitions — opacity + transform only */

export const EASE_OUT = [0.22, 1, 0.36, 1];
export const EASE_IN_OUT = [0.4, 0, 0.2, 1];

export const DURATION = {
  fast: 0.14,
  normal: 0.18,
  page: 0.22,
};

export const pageTransition = (reduced) =>
  reduced
    ? { initial: false, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
      };

export const crossfadeTransition = (reduced, direction = "horizontal") => {
  if (reduced) {
    return { initial: false, animate: {}, exit: {} };
  }
  if (direction === "fade") {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  const x = direction === "horizontal" ? 10 : 0;
  const y = direction === "vertical" ? 6 : 0;
  return {
    initial: { opacity: 0, x, y },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, x: -x * 0.6, y: -y * 0.5 },
  };
};

export const drawerTransition = (reduced, side = "left") =>
  reduced
    ? { initial: false, animate: {}, exit: {} }
    : {
        initial: { x: side === "left" ? "-100%" : "100%" },
        animate: { x: 0 },
        exit: { x: side === "left" ? "-100%" : "100%" },
      };
