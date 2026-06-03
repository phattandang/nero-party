import { useEffect } from "react";
import { useMotionValue, useSpring } from "motion/react";

/**
 * Returns spring-smoothed x/y motion values driven by mouse position,
 * normalized to ±1 relative to the viewport center.
 * Multiply by your desired pixel offset at the call site.
 */
export function useMouseParallax() {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const x = useSpring(rawX, { stiffness: 22, damping: 14, mass: 0.6 });
  const y = useSpring(rawY, { stiffness: 22, damping: 14, mass: 0.6 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [rawX, rawY]);

  return { x, y };
}
