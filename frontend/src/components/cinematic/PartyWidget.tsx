import { motion } from "motion/react";
import { MusicNote, Fire, Users, Crown } from "@phosphor-icons/react";

// Deterministic orbital positions — 6 "participants" around a center
const NODES = [
  { angle: -90, color: "#7c3aed", letter: "J" },
  { angle: -30, color: "#db2777", letter: "K" },
  { angle:  30, color: "#ea580c", letter: "M" },
  { angle:  90, color: "#16a34a", letter: "S" },
  { angle: 150, color: "#0284c7", letter: "P" },
  { angle: 210, color: "#9333ea", letter: "T" },
];

function orbit(angleDeg: number, radius: number) {
  const r = (angleDeg * Math.PI) / 180;
  return { x: Math.round(Math.cos(r) * radius), y: Math.round(Math.sin(r) * radius) };
}

// Mini waveform bar heights (deterministic)
const BAR_HEIGHTS = [3, 5, 4, 7, 3, 6, 4];

/**
 * Animated live-party visualization card.
 * Shows orbital participant nodes, a central "Now Playing" visual, waveform, and fire-vote count.
 * Used as the hero visual in StickyShowcase.
 */
export function PartyWidget({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative w-[320px] select-none ${className}`}
      style={{
        filter: "drop-shadow(0 40px 80px rgba(0,0,0,0.7)) drop-shadow(0 0 60px rgba(255,151,0,0.07))",
      }}
    >
      {/* Wide ambient glow behind the card */}
      <div
        aria-hidden
        className="absolute -inset-8 rounded-[3.5rem] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(255,151,0,0.06), transparent 70%)" }}
      />

      {/* Card shell */}
      <div
        className="relative rounded-[2rem] border border-white/[0.08] overflow-hidden"
        style={{ background: "rgba(5, 5, 9, 0.98)" }}
      >
        {/* Top gradient wash */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-44 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(255,151,0,0.10), transparent 65%)" }}
        />

        <div className="relative p-5 flex flex-col gap-4">
          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-[#FF9700]"
                animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="text-[10px] uppercase tracking-[0.28em] text-white/30 font-medium">
                Nero Party — Live
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/22 font-medium">
              <Users size={10} />
              <span>6 listening</span>
            </div>
          </div>

          {/* ── Orbital section ── */}
          <div className="relative flex items-center justify-center" style={{ height: 196 }}>
            {/* Orbit rings */}
            <div
              aria-hidden
              className="absolute rounded-full border border-white/[0.04]"
              style={{ width: 160, height: 160 }}
            />
            <div
              aria-hidden
              className="absolute rounded-full border border-[#FF9700]/[0.06]"
              style={{ width: 108, height: 108 }}
            />

            {/* Participant nodes */}
            {NODES.map((node, i) => {
              const pos = orbit(node.angle, 80);
              return (
                <motion.div
                  key={i}
                  className="absolute w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white/90"
                  style={{
                    background: node.color + "CC",
                    border: `1.5px solid ${node.color}50`,
                    left: `calc(50% + ${pos.x}px - 16px)`,
                    top:  `calc(50% + ${pos.y}px - 16px)`,
                    boxShadow: `0 0 14px ${node.color}40`,
                  }}
                  animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
                  transition={{ duration: 2.6 + i * 0.2, delay: i * 0.38, repeat: Infinity, ease: "easeInOut" }}
                >
                  {node.letter}
                </motion.div>
              );
            })}

            {/* SVG connecting lines */}
            <svg
              aria-hidden
              className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
              viewBox="0 0 196 196"
            >
              {NODES.map((node, i) => {
                const pos = orbit(node.angle, 80);
                return (
                  <motion.line
                    key={i}
                    x1="98" y1="98"
                    x2={98 + pos.x} y2={98 + pos.y}
                    stroke="rgba(255,151,0,0.12)"
                    strokeWidth="0.8"
                    animate={{ opacity: [0.2, 0.6, 0.2] }}
                    transition={{ duration: 2.4, delay: i * 0.32, repeat: Infinity, ease: "easeInOut" }}
                  />
                );
              })}
            </svg>

            {/* Central pulsing node */}
            <motion.div
              className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #c96500, #FF9700)",
                boxShadow: "0 0 32px rgba(255,151,0,0.55), 0 0 64px rgba(255,151,0,0.18)",
              }}
              animate={{ scale: [1, 1.09, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <MusicNote size={24} weight="fill" className="text-white" />
            </motion.div>
          </div>

          {/* ── Now playing row ── */}
          <div
            className="rounded-xl border border-white/[0.07] p-3 flex items-center gap-3"
            style={{ background: "rgba(255,255,255,0.025)" }}
          >
            {/* Album art placeholder */}
            <div
              className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #1a1230, #0e0a1a)" }}
            >
              <MusicNote size={13} weight="fill" className="text-[#FF9700]/60" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/75 truncate">Friday Night Vibes</p>
              {/* Mini waveform */}
              <div className="flex items-end gap-[2px] mt-1" style={{ height: 12 }}>
                {BAR_HEIGHTS.map((h, i) => (
                  <div
                    key={i}
                    className="wave-bar rounded-full bg-[#ffb340]"
                    style={{ width: 2, height: h * 1.5, animationDelay: `${i * 0.1}s`, animationDuration: `${0.7 + i * 0.05}s` }}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
              <div className="flex items-center gap-1">
                <Fire size={11} weight="fill" className="text-orange-400" />
                <span className="text-xs font-bold text-orange-400">12</span>
              </div>
              <span className="text-[9px] text-white/20 font-mono">0:22 / 0:30</span>
            </div>
          </div>

          {/* ── Progress bar ── */}
          <div className="px-0.5">
            <div
              className="relative h-[3px] w-full rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{ background: "linear-gradient(to right, #c96500, #FF9700)" }}
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 30, ease: "linear", repeat: Infinity }}
              />
            </div>
          </div>

          {/* ── Footer ── */}
          <div
            className="flex items-center justify-between pt-2 border-t border-white/[0.05]"
          >
            <span className="text-[10px] text-white/22 font-medium">
              3 songs in queue
            </span>
            <div className="flex items-center gap-1 text-[10px] text-[#FF9700]/45 font-medium">
              <Crown size={9} weight="fill" />
              <span>Winner TBD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
