import { useRef, useCallback } from "react";

/**
 * Magnetic pull effect for buttons.
 * The element subtly follows the cursor while hovered, then snaps back.
 *
 * Usage:
 *   const { ref, onMouseMove, onMouseLeave } = useMagnetic();
 *   <button ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
 */
export function useMagnetic<T extends HTMLElement = HTMLButtonElement>(strength = 0.3) {
  const ref = useRef<T>(null);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<T>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) * strength;
      const dy = (e.clientY - (rect.top + rect.height / 2)) * strength;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.transition = "transform 0.08s linear";
    },
    [strength]
  );

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate(0px, 0px)";
    el.style.transition = "transform 0.55s cubic-bezier(0.32, 0.72, 0, 1)";
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}
