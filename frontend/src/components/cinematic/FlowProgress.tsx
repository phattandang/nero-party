import { motion } from "motion/react";

interface Props {
  /** Which step is currently active (1=Set Up, 2=Queue, 3=Party) */
  step: 1 | 2 | 3;
}

const STEPS = [
  { n: 1 as const, label: "Set Up" },
  { n: 2 as const, label: "Queue" },
  { n: 3 as const, label: "Party" },
];

/**
 * Compact 3-step flow progress indicator.
 * Shows where the user is in the creation journey.
 * On-brand: OLED dark, orange accent for completed/active steps.
 */
export function FlowProgress({ step }: Props) {
  return (
    <div className="flex items-start gap-0">
      {STEPS.map((s, i) => {
        const done   = s.n < step;
        const active = s.n === step;

        return (
          <div key={s.n} className="flex items-center">
            {/* Step node */}
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-bold"
                animate={{
                  background: done
                    ? "rgba(255,151,0,0.25)"
                    : active
                    ? "rgba(255,151,0,0.12)"
                    : "rgba(255,255,255,0.04)",
                  borderColor: done || active
                    ? "rgba(255,151,0,0.45)"
                    : "rgba(255,255,255,0.10)",
                  color: done || active ? "#FF9700" : "rgba(255,255,255,0.20)",
                  scale: active ? 1.12 : 1,
                }}
                style={{ border: "1px solid" }}
                transition={{ duration: 0.38, ease: [0.32, 0.72, 0, 1] }}
              >
                {done ? (
                  /* Checkmark for completed steps */
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  s.n
                )}
              </motion.div>

              <motion.span
                className="text-[8px] uppercase tracking-[0.18em] font-semibold whitespace-nowrap"
                animate={{
                  color: done || active ? "rgba(255,151,0,0.65)" : "rgba(255,255,255,0.18)",
                }}
                transition={{ duration: 0.38 }}
              >
                {s.label}
              </motion.span>
            </div>

            {/* Connector line between steps */}
            {i < STEPS.length - 1 && (
              <motion.div
                className="mx-3 mb-5 rounded-full"
                style={{ width: 28, height: 1 }}
                animate={{
                  background: done ? "#FF9700" : "rgba(255,255,255,0.08)",
                  opacity: done ? 0.5 : 1,
                }}
                transition={{ duration: 0.38 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
