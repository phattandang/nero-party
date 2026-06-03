/**
 * DJController — Cinematic DJ controller visualization.
 * Polish pass v3: asymmetric hover timing, scaleY waveform (no layout thrash),
 * ambient jog wheel heartbeat, chassis border/shadow reacts to hover.
 */

import { useState, useCallback, memo } from "react";
import { motion, useMotionValue, useTransform, useSpring, useReducedMotion } from "motion/react";

const ORANGE      = "#FF9700";
const ORANGE_GLOW = "rgba(255,151,0,0.50)";
const ORANGE_SOFT = "rgba(255,151,0,0.10)";
const BORDER_IDLE = "rgba(255,255,255,0.09)";
const BG_IDLE     = "rgba(255,255,255,0.03)";

const SM_BAR_HEIGHTS = [3, 5, 8, 6, 9, 7, 10, 8, 5, 7, 9, 6, 4, 8, 10, 7, 5, 6, 8, 9];

// Smooth symmetric cubic-bezier — breath-like pulse character
const BREATHE: [number, number, number, number] = [0.37, 0, 0.63, 1];

// ─── GlowControl — asymmetric on/off timing ──────────────────────────────────

interface GlowProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  rounded?: string;
  alwaysOn?: boolean;
}

const GlowControl = memo(function GlowControl({
  children,
  className = "",
  style,
  rounded = "rounded-[3px]",
  alwaysOn = false,
}: GlowProps) {
  const [hovered, setHovered] = useState(false);
  const lit = hovered || alwaysOn;

  return (
    <motion.div
      onMouseEnter={useCallback(() => setHovered(true), [])}
      onMouseLeave={useCallback(() => setHovered(false), [])}
      animate={{
        borderColor: lit ? ORANGE : BORDER_IDLE,
        backgroundColor: lit ? ORANGE_SOFT : BG_IDLE,
        boxShadow: lit ? `0 0 14px rgba(255,151,0,0.55)` : "none",
        // Subtle 1.5px lift on hover — tactile micro-interaction
        y: lit ? -1.5 : 0,
      }}
      // ON: 0.11s snappy. OFF: 0.38s luxurious fade. Different easings.
      transition={{
        duration: lit ? 0.11 : 0.38,
        ease: lit ? [0.16, 1, 0.3, 1] : [0.32, 0.72, 0, 1],
      }}
      className={`border cursor-pointer select-none ${rounded} ${className}`}
      style={{ borderColor: BORDER_IDLE, backgroundColor: BG_IDLE, ...style }}
    >
      {children}
    </motion.div>
  );
});

// ─── Waveform bar — scaleY animation (transform-only, no layout thrash) ───────

const WaveformBar = memo(function WaveformBar({
  height,
  isAccent,
  index,
  reduced,
}: {
  height: number;
  isAccent: boolean;
  index: number;
  reduced: boolean | null;
}) {
  // Normalised scaleY targets — no height recalculation, pure transform
  const lo1 = Math.max(2 / height, 0.22 + (index % 5) * 0.07);
  const mid  = 0.65 + (index % 3) * 0.14;
  const lo2  = Math.max(2 / height, 0.30 + (index % 4) * 0.07);
  const scaleTargets = reduced ? 1 : [1, lo1, mid, lo2, 1];
  // Bars dim proportionally when short — reinforces the audio-energy read
  const opTargets    = reduced ? 1 : [0.92, 0.38, 0.72, 0.35, 0.92];

  return (
    <motion.div
      className="flex-1 rounded-full"
      style={{
        background: isAccent ? ORANGE : "rgba(255,151,0,0.35)",
        height,
        transformOrigin: "bottom",
      }}
      animate={{ scaleY: scaleTargets, opacity: opTargets }}
      transition={
        reduced
          ? { duration: 0 }
          : {
              duration: 1.45 + (index % 5) * 0.29,
              delay: (index % 7) * 0.09,
              repeat: Infinity,
              ease: BREATHE,
            }
      }
    />
  );
});

// ─── Jog wheel ───────────────────────────────────────────────────────────────

const JogWheel = memo(function JogWheel({
  controllerHovered,
  ambientDelay = 0,
}: {
  controllerHovered: boolean;
  ambientDelay?: number;
}) {
  const [hovered, setHovered] = useState(false);
  const reduced = useReducedMotion();
  const lit = hovered || controllerHovered;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 128, height: 128 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Outer chassis */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: "rgba(255,255,255,0.03)", border: "2px solid rgba(255,255,255,0.08)" }}
      />

      {/* Ambient heartbeat — always breathing even at idle */}
      {!reduced && (
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{
            boxShadow: [
              "0 0 0px rgba(255,151,0,0)",
              "0 0 12px rgba(255,151,0,0.18)",
              "0 0 0px rgba(255,151,0,0)",
            ],
          }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: ambientDelay }}
        />
      )}

      {/* Orange signature ring — brightens on hover */}
      <motion.div
        className="absolute rounded-full"
        style={{ inset: 6 }}
        animate={{
          borderColor: lit ? ORANGE : "rgba(255,151,0,0.28)",
          boxShadow: lit
            ? `0 0 22px ${ORANGE_GLOW}, inset 0 0 10px rgba(255,151,0,0.12)`
            : "0 0 4px rgba(255,151,0,0.06)",
        }}
        transition={{ duration: lit ? 0.22 : 0.55, ease: lit ? [0.16, 1, 0.3, 1] : "easeOut" }}
      >
        <div className="w-full h-full rounded-full border-[3px]" style={{ borderColor: "inherit" }} />
      </motion.div>

      {/* Spinning vinyl platter */}
      <motion.div
        className="absolute rounded-full overflow-hidden"
        style={{ inset: 16, background: "#0c0c10" }}
        animate={reduced ? {} : { rotate: 360 }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
      >
        {[0, 8, 16, 24, 30].map((inset) => (
          <div
            key={inset}
            className="absolute rounded-full border border-white/[0.05]"
            style={{ inset }}
          />
        ))}
        <div
          className="absolute rounded-full"
          style={{
            inset: "36%",
            background: "linear-gradient(135deg, #1a1a20, #12121a)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
      </motion.div>

      {/* Center spindle — ambient pulse when idle, snaps orange on hover */}
      <div className="relative z-10">
        <motion.div
          className="w-5 h-5 rounded-full"
          animate={
            lit
              ? { backgroundColor: ORANGE, boxShadow: `0 0 10px ${ORANGE_GLOW}` }
              : reduced
              ? { backgroundColor: "rgba(255,255,255,0.20)", boxShadow: "none" }
              : {
                  backgroundColor: [
                    "rgba(255,255,255,0.18)",
                    "rgba(255,151,0,0.45)",
                    "rgba(255,255,255,0.18)",
                  ],
                  boxShadow: [
                    "none",
                    "0 0 8px rgba(255,151,0,0.35)",
                    "none",
                  ],
                }
          }
          transition={
            lit
              ? { duration: 0.18 }
              : { duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: ambientDelay * 0.5 }
          }
        />
      </div>
    </div>
  );
});

// ─── Hot cue grid ─────────────────────────────────────────────────────────────

const HOT_CUE_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

const HotCueGrid = memo(function HotCueGrid({ rows = 1 }: { rows?: 1 | 2 }) {
  const arr = rows === 2 ? HOT_CUE_LABELS : HOT_CUE_LABELS.slice(0, 4);
  return (
    <div className="flex gap-[3px] flex-wrap" style={{ maxWidth: rows === 2 ? 120 : 68 }}>
      {arr.map((label) => (
        <GlowControl key={label} className="flex items-center justify-center" style={{ width: 27, height: 18 }}>
          <span className="text-[6px] font-bold" style={{ color: "rgba(255,255,255,0.25)" }}>{label}</span>
        </GlowControl>
      ))}
    </div>
  );
});

// ─── Button cluster ───────────────────────────────────────────────────────────

function ButtonCluster({ labels }: { labels: string[] }) {
  return (
    <div className="flex flex-col gap-[3px]">
      {labels.map((l) => (
        <GlowControl key={l} className="flex items-center justify-center px-1" style={{ height: 14, minWidth: 32 }}>
          <span className="text-[6px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.22)" }}>{l}</span>
        </GlowControl>
      ))}
    </div>
  );
}

// ─── Transport ────────────────────────────────────────────────────────────────

function TransportButtons() {
  return (
    <div className="flex items-center gap-2">
      <GlowControl rounded="rounded-full" className="flex items-center justify-center" style={{ width: 36, height: 36 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 2.5L11 7L3 11.5V2.5Z" fill="rgba(255,255,255,0.40)" />
        </svg>
      </GlowControl>
      <GlowControl rounded="rounded-full" className="flex items-center justify-center" style={{ width: 32, height: 32 }}>
        <span className="text-[7px] font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>CUE</span>
      </GlowControl>
    </div>
  );
}

// ─── Fader channel ────────────────────────────────────────────────────────────

function FaderChannel({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5" style={{ width: 26 }}>
      {["HI", "MD", "LO"].map((eq) => (
        <GlowControl key={eq} rounded="rounded-full" className="flex items-center justify-center" style={{ width: 18, height: 18 }}>
          <div className="w-0.5 h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
        </GlowControl>
      ))}
      <div className="relative rounded-full flex-1 w-1" style={{ minHeight: 48, background: "rgba(255,255,255,0.06)" }}>
        <GlowControl className="absolute" style={{ width: 16, height: 7, left: -7.5, top: "38%", borderRadius: 3 }} />
      </div>
      <span className="text-[6px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>{label}</span>
    </div>
  );
}

// ─── LCD display ─────────────────────────────────────────────────────────────

function Display({ size }: { size: "sm" | "lg" }) {
  const reduced = useReducedMotion();

  if (size === "sm") {
    return (
      <div
        className="rounded-[4px] overflow-hidden flex flex-col gap-0.5 p-1.5"
        style={{ width: 88, height: 48, background: "#06080e", border: "1px solid rgba(255,255,255,0.10)" }}
      >
        <div className="flex items-end gap-[1.5px] h-4">
          {SM_BAR_HEIGHTS.map((h, i) => (
            <WaveformBar key={i} height={h} isAccent={i % 3 === 0} index={i} reduced={reduced} />
          ))}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[7px] font-mono font-bold" style={{ color: ORANGE }}>124.0</span>
          <span className="text-[6px] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>DECK 1</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-[5px] overflow-hidden flex flex-col gap-1 p-2"
      style={{ flex: 1, height: 56, background: "#04060c", border: "1px solid rgba(255,255,255,0.12)" }}
    >
      {[0, 1].map((track) => (
        <div key={track} className="flex items-end gap-[1px] h-5">
          {Array.from({ length: 44 }, (_, i) => {
            const h = 4 + Math.abs(Math.sin(i * 0.7 + track * 1.3) * 10);
            return (
              <WaveformBar
                key={i}
                height={h}
                isAccent={track === 0}
                index={i + track * 44}
                reduced={reduced}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Full DJ Controller ───────────────────────────────────────────────────────

export const DJController = memo(function DJController() {
  const [controllerHovered, setControllerHovered] = useState(false);
  const reduced = useReducedMotion();

  // 3D cursor tilt — mouse position → rotateX/Y via physics spring
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateY = useSpring(useTransform(mouseX, [-1, 1], [-7, 7]), { stiffness: 55, damping: 18, mass: 0.6 });
  const rotateX = useSpring(useTransform(mouseY, [-1, 1], [5, -5]), { stiffness: 55, damping: 18, mass: 0.6 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width * 2 - 1);
      mouseY.set((e.clientY - rect.top) / rect.height * 2 - 1);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setControllerHovered(false);
  }, [mouseX, mouseY]);

  return (
    <div
      className="relative select-none"
      style={{ perspective: 900 }}
      onMouseMove={reduced ? undefined : handleMouseMove}
      onMouseEnter={() => setControllerHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          scale: 0.92,
          rotateX: reduced ? 0 : rotateX,
          rotateY: reduced ? 0 : rotateY,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Wide ambient halo — spreads beyond chassis edges */}
        <motion.div
          className="absolute pointer-events-none"
          style={{ inset: -32, borderRadius: "2.5rem" }}
          animate={{
            opacity: controllerHovered ? 1 : 0,
            background: controllerHovered
              ? "radial-gradient(ellipse at 50% 60%, rgba(255,151,0,0.10), transparent 65%)"
              : "transparent",
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />

        {/* Chassis — border and shadow animate on hover */}
        <motion.div
          className="relative overflow-hidden"
          animate={{
            borderColor: controllerHovered
              ? "rgba(255,255,255,0.17)"
              : "rgba(255,255,255,0.10)",
            boxShadow: controllerHovered
              ? "0 40px 80px rgba(0,0,0,0.80), inset 0 1px 0 rgba(255,255,255,0.10)"
              : "0 32px 64px rgba(0,0,0,0.70), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          style={{
            width: 560,
            borderRadius: 16,
            background: "linear-gradient(160deg, #16161e, #0e0e14)",
            border: "1px solid",
            padding: "12px 12px 14px",
          }}
        >
          {/* Surface sheen — ambient light pulse across chassis */}
          {!reduced && (
            <motion.div
              aria-hidden
              className="absolute inset-y-0 pointer-events-none"
              style={{
                width: 196,
                background: "linear-gradient(to right, transparent, rgba(255,255,255,0.025), transparent)",
              }}
              animate={{ x: [-196, 560] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear", repeatDelay: 6 }}
            />
          )}

          {/* Branding strip */}
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[8px] uppercase tracking-[0.35em] font-semibold" style={{ color: "rgba(255,255,255,0.20)" }}>
              Nero DJ
            </span>
            <span className="text-[7px] font-mono" style={{ color: ORANGE + "80" }}>OPUS · LIVE</span>
          </div>

          {/* Display row */}
          <div className="flex items-stretch gap-2 mb-3">
            <Display size="sm" />
            <Display size="lg" />
            <Display size="sm" />
          </div>

          {/* Main panel */}
          <div className="flex gap-2 items-end">

            {/* LEFT DECK */}
            <div className="flex flex-col gap-2" style={{ width: 156 }}>
              <HotCueGrid rows={2} />
              <div className="flex gap-1.5 items-start">
                <div className="flex flex-col gap-1">
                  <GlowControl rounded="rounded-full" className="flex items-center justify-center" style={{ width: 26, height: 26 }}>
                    <div className="w-3 h-3 rounded-full" style={{ border: "2px solid rgba(255,151,0,0.5)" }} />
                  </GlowControl>
                  <div className="flex gap-1">
                    <GlowControl className="flex items-center justify-center" style={{ width: 14, height: 14 }}>
                      <span className="text-[6px]" style={{ color: "rgba(255,255,255,0.3)" }}>◀</span>
                    </GlowControl>
                    <GlowControl className="flex items-center justify-center" style={{ width: 14, height: 14 }}>
                      <span className="text-[6px]" style={{ color: "rgba(255,255,255,0.3)" }}>▶</span>
                    </GlowControl>
                  </div>
                </div>
                <ButtonCluster labels={["IN", "OUT", "ON"]} />
              </div>
              <div className="flex justify-center py-1">
                <JogWheel controllerHovered={controllerHovered} ambientDelay={0} />
              </div>
              <TransportButtons />
            </div>

            {/* CENTER MIXER */}
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex gap-1 justify-center">
                {["FX1", "FX2", "FX3", "SEND"].map((l) => (
                  <GlowControl key={l} className="flex items-center justify-center px-1" style={{ height: 14 }}>
                    <span className="text-[6px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.20)" }}>{l}</span>
                  </GlowControl>
                ))}
              </div>
              <div className="flex justify-around items-end flex-1 px-1" style={{ minHeight: 130 }}>
                {["1", "2", "3", "4"].map((ch) => (
                  <FaderChannel key={ch} label={ch} />
                ))}
              </div>
              <div className="flex flex-col gap-1 px-2">
                <div className="relative h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <GlowControl className="absolute" style={{ width: 22, height: 10, top: -4.5, left: "42%", borderRadius: 4 }} />
                </div>
                <div className="flex justify-between">
                  <span className="text-[6px] font-mono" style={{ color: "rgba(255,255,255,0.20)" }}>A</span>
                  <span className="text-[6px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.18)" }}>XFADER</span>
                  <span className="text-[6px] font-mono" style={{ color: "rgba(255,255,255,0.20)" }}>B</span>
                </div>
              </div>
            </div>

            {/* RIGHT DECK */}
            <div className="flex flex-col gap-2" style={{ width: 156 }}>
              <HotCueGrid rows={2} />
              <div className="flex gap-1.5 items-start justify-end">
                <ButtonCluster labels={["IN", "OUT", "ON"]} />
                <div className="flex flex-col gap-1">
                  <GlowControl rounded="rounded-full" className="flex items-center justify-center" style={{ width: 26, height: 26 }}>
                    <div className="w-3 h-3 rounded-full" style={{ border: "2px solid rgba(255,151,0,0.5)" }} />
                  </GlowControl>
                  <div className="flex gap-1">
                    <GlowControl className="flex items-center justify-center" style={{ width: 14, height: 14 }}>
                      <span className="text-[6px]" style={{ color: "rgba(255,255,255,0.3)" }}>◀</span>
                    </GlowControl>
                    <GlowControl className="flex items-center justify-center" style={{ width: 14, height: 14 }}>
                      <span className="text-[6px]" style={{ color: "rgba(255,255,255,0.3)" }}>▶</span>
                    </GlowControl>
                  </div>
                </div>
              </div>
              <div className="flex justify-center py-1">
                {/* Right wheel pulses 1.8s offset from left — stereo breathing feel */}
                <JogWheel controllerHovered={controllerHovered} ambientDelay={1.8} />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <GlowControl rounded="rounded-full" className="flex items-center justify-center" style={{ width: 32, height: 32 }}>
                  <span className="text-[7px] font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>CUE</span>
                </GlowControl>
                <GlowControl rounded="rounded-full" className="flex items-center justify-center" style={{ width: 36, height: 36 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 2.5L11 7L3 11.5V2.5Z" fill="rgba(255,255,255,0.40)" />
                  </svg>
                </GlowControl>
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </div>
  );
});
