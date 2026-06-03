import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

export default function Cursor() {
  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);
  const ringSize = useMotionValue(32);

  const ringX = useSpring(mouseX, { stiffness: 90, damping: 16, mass: 0.4 });
  const ringY = useSpring(mouseY, { stiffness: 90, damping: 16, mass: 0.4 });
  const ringSizeSpring = useSpring(ringSize, { stiffness: 220, damping: 24 });

  useEffect(() => {
    // Only activate on fine pointer (mouse, not touch)
    if (!window.matchMedia("(pointer: fine)").matches) return;

    document.body.style.cursor = "none";

    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as Element;
      if (t.closest("button, a, input, select, label, [role='button']")) {
        ringSize.set(56);
      }
    };

    const onOut = (e: MouseEvent) => {
      const t = e.relatedTarget as Element | null;
      if (!t?.closest("button, a, input, select, label, [role='button']")) {
        ringSize.set(32);
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mouseout", onOut);

    return () => {
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mouseout", onOut);
    };
  }, [mouseX, mouseY, ringSize]);

  return (
    <>
      {/* Dot — snaps instantly to cursor */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[99999] rounded-full bg-[#FF9700]"
        style={{
          width: 5,
          height: 5,
          x: mouseX,
          y: mouseY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
      {/* Ring — follows with spring lag, expands on interactive elements */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[99998] rounded-full border border-white/30"
        style={{
          width: ringSizeSpring,
          height: ringSizeSpring,
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
    </>
  );
}
