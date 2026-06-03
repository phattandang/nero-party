import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { MotionText } from "./MotionText";

interface Props {
  eyebrow: string;
  headline: string;
  body: string;
  visual: React.ReactNode;
  align?: "left" | "right";
  accent?: string;
  index?: number;
}

/**
 * Cinematic feature scene section.
 * - Text sweeps in from its own side (left-text → from left, right-text → from right).
 * - Visual swoops in from the OPPOSITE side — creating a convergence effect.
 * - Scroll parallax shifts the visual at a different rate for depth.
 */
export function SceneSection({
  eyebrow,
  headline,
  body,
  visual,
  align = "left",
  accent = "#FF9700",
  index = 0,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const textOnRight = align === "right";

  // Text: sweeps in from its own side
  const textY       = useTransform(scrollYProgress, [0, 0.45], [30, 0]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.38], [0, 1]);
  const textX       = useTransform(scrollYProgress, [0, 0.42], [textOnRight ? 55 : -55, 0]);

  // Visual: swoops in from the OPPOSITE side (convergence)
  const visualSwoopX = textOnRight ? -90 : 90;

  // Parallax — visual drifts at a different pace for depth
  const visualParallaxY = useTransform(scrollYProgress, [0, 1], [-44, 44]);

  return (
    <section ref={ref} className="relative min-h-[80dvh] flex items-center overflow-hidden py-24">

      {/* Atmospheric glow — on the visual side */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          [textOnRight ? "left" : "right"]: "-12%",
          top: "5%",
          width: 560,
          height: 560,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}08, transparent 65%)`,
          filter: "blur(80px)",
        }}
      />

      {/* Top hairline */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.04), transparent)" }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-12">
        <div className={`grid lg:grid-cols-2 gap-12 lg:gap-24 items-center ${textOnRight ? "[&>*:first-child]:order-last" : ""}`}>

          {/* ── Text: sweeps in from own side ── */}
          <motion.div style={{ y: textY, x: textX, opacity: textOpacity }}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[11px] font-bold tabular-nums" style={{ color: accent + "55" }}>
                0{index + 1}
              </span>
              <span className="w-8 h-px" style={{ background: accent + "40" }} />
              <span className="text-[10px] uppercase tracking-[0.35em] font-semibold" style={{ color: accent + "70" }}>
                {eyebrow}
              </span>
            </div>

            <MotionText
              as="h2"
              className="text-4xl lg:text-5xl font-extrabold tracking-[-0.02em] leading-[1.07] mb-6"
              stagger={0.055}
            >
              {headline}
            </MotionText>

            <motion.p
              className="text-[0.9rem] text-white/30 leading-[1.8] max-w-[44ch]"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-5%" }}
              transition={{ delay: 0.42, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {body}
            </motion.p>
          </motion.div>

          {/* ── Visual: swoops in from OPPOSITE side + parallax ── */}
          <motion.div style={{ y: visualParallaxY }} className="flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, x: visualSwoopX, scale: 0.92, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
            >
              {visual}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
