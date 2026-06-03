import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";

const METRICS = [
  { value: 30,  suffix: "s",  label: "Preview per song",     delay: 0    },
  { value: 6,   suffix: "",   label: "Digit party code",      delay: 0.10 },
  { value: 130, suffix: "+",  label: "Confetti particles",    delay: 0.18 },
  { value: 1,   suffix: "",   label: "Song takes the crown",  delay: 0.26 },
];

function useCountUp(target: number, durationSec = 1.8, active = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const t = Math.min((now - start) / (durationSec * 1000), 1);
      // Expo ease-out
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setCount(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, durationSec]);

  return count;
}

function Metric({ value, suffix, label, delay }: { value: number; suffix: string; label: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8%" });
  const count = useCountUp(value, 1.8, inView);

  return (
    <motion.div
      ref={ref}
      className="flex flex-col items-center text-center gap-2"
      initial={{ opacity: 0, y: 36, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{ delay, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <span
        className="text-6xl lg:text-7xl font-extrabold tracking-[-0.03em] tabular-nums"
        style={{
          background: "linear-gradient(135deg, #FF9700, #ffb340 60%, #FF9700)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {count}{suffix}
      </span>
      <span className="text-[11px] text-white/28 font-medium uppercase tracking-[0.22em]">
        {label}
      </span>
    </motion.div>
  );
}

/**
 * Four large animated count-up metrics.
 * Separated by faint dividers; anchored by top/bottom hairlines.
 */
export function MetricsStrip() {
  return (
    <section className="relative py-28 overflow-hidden">
      {/* Border hairlines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)" }}
      />

      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(255,151,0,0.025), transparent 60%)" }}
      />

      <div className="relative max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-0 lg:divide-x divide-white/[0.05]">
          {METRICS.map((m) => (
            <Metric key={m.label} {...m} />
          ))}
        </div>
      </div>
    </section>
  );
}
