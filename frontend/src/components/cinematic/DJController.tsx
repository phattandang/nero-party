/**
 * DJController — Interactive DJ controller visualization.
 *
 * Design reference: Pioneer OPUS-QUAD layout.
 * Interaction reference: GlowingKeyboard pattern — each control is an
 * individual motion.div; hover lights it up with #FF9700 orange glow.
 *
 * On hover the whole controller "wakes up": the orange jog-wheel rings
 * intensify (matching the real Pioneer orange accent ring) and each button
 * illuminates independently. Jog wheels spin continuously.
 */

import { useState, useCallback, memo } from "react";
import { motion } from "motion/react";

const ORANGE       = "#FF9700";
const ORANGE_GLOW  = "rgba(255,151,0,0.45)";
const ORANGE_SOFT  = "rgba(255,151,0,0.10)";
const BORDER_IDLE  = "rgba(255,255,255,0.09)";
const BG_IDLE      = "rgba(255,255,255,0.03)";

// ─── Shared glow control ─────────────────────────────────────────────────────

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
      initial={{ borderColor: BORDER_IDLE, backgroundColor: BG_IDLE }}
      animate={{
        borderColor: lit ? ORANGE : BORDER_IDLE,
        backgroundColor: lit ? ORANGE_SOFT : BG_IDLE,
        boxShadow: lit ? `0 0 10px ${ORANGE_GLOW}` : "none",
      }}
      transition={{ duration: 0.14, delay: lit ? 0 : 0, ease: "easeOut" }}
      className={`border cursor-pointer select-none ${rounded} ${className}`}
      style={style}
    >
      {children}
    </motion.div>
  );
});

// ─── Jog wheel ───────────────────────────────────────────────────────────────

const JogWheel = memo(function JogWheel({ controllerHovered }: { controllerHovered: boolean }) {
  const [hovered, setHovered] = useState(false);
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

      {/* Signature orange ring (matches Pioneer OPUS-QUAD orange ring) */}
      <motion.div
        className="absolute rounded-full"
        style={{ inset: 6 }}
        animate={{
          borderColor: lit ? ORANGE : "rgba(255,151,0,0.30)",
          boxShadow: lit ? `0 0 18px ${ORANGE_GLOW}, inset 0 0 8px rgba(255,151,0,0.10)` : "none",
        }}
        transition={{ duration: 0.25 }}
      >
        <div className="w-full h-full rounded-full border-[3px]" style={{ borderColor: "inherit" }} />
      </motion.div>

      {/* Spinning vinyl platter */}
      <motion.div
        className="absolute rounded-full overflow-hidden"
        style={{ inset: 16, background: "#0c0c10" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
      >
        {/* Vinyl grooves */}
        {[0, 8, 16, 24, 30].map((inset) => (
          <div
            key={inset}
            className="absolute rounded-full border border-white/[0.05]"
            style={{ inset }}
          />
        ))}
        {/* Label area */}
        <div
          className="absolute rounded-full"
          style={{
            inset: "36%",
            background: "linear-gradient(135deg, #1a1a20, #12121a)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
      </motion.div>

      {/* Center spindle */}
      <div className="relative z-10">
        <motion.div
          className="w-5 h-5 rounded-full"
          animate={{ backgroundColor: lit ? ORANGE : "rgba(255,255,255,0.20)" }}
          transition={{ duration: 0.2 }}
          style={{ boxShadow: lit ? `0 0 8px ${ORANGE_GLOW}` : "none" }}
        />
      </div>
    </div>
  );
});

// ─── Hot cue button grid ──────────────────────────────────────────────────────

const HOT_CUE_LABELS = ["A","B","C","D","E","F","G","H"];

const HotCueGrid = memo(function HotCueGrid({ rows = 1 }: { rows?: 1 | 2 }) {
  const arr = rows === 2 ? HOT_CUE_LABELS : HOT_CUE_LABELS.slice(0, 4);
  return (
    <div className="flex gap-[3px] flex-wrap" style={{ maxWidth: rows === 2 ? 120 : 68 }}>
      {arr.map((label) => (
        <GlowControl
          key={label}
          className="flex items-center justify-center"
          style={{ width: 27, height: 18 }}
        >
          <span className="text-[6px] font-bold" style={{ color: "rgba(255,255,255,0.25)" }}>
            {label}
          </span>
        </GlowControl>
      ))}
    </div>
  );
});

// ─── Small button cluster (beat loop, beat jump, etc.) ───────────────────────

function ButtonCluster({ labels }: { labels: string[] }) {
  return (
    <div className="flex flex-col gap-[3px]">
      {labels.map((l) => (
        <GlowControl key={l} className="flex items-center justify-center px-1" style={{ height: 14, minWidth: 32 }}>
          <span className="text-[6px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.22)" }}>
            {l}
          </span>
        </GlowControl>
      ))}
    </div>
  );
}

// ─── Transport buttons (Play / Cue) ──────────────────────────────────────────

function TransportButtons() {
  return (
    <div className="flex items-center gap-2">
      <GlowControl
        rounded="rounded-full"
        className="flex items-center justify-center"
        style={{ width: 36, height: 36 }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 2.5L11 7L3 11.5V2.5Z" fill="rgba(255,255,255,0.40)" />
        </svg>
      </GlowControl>
      <GlowControl
        rounded="rounded-full"
        className="flex items-center justify-center"
        style={{ width: 32, height: 32 }}
      >
        <span className="text-[7px] font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>CUE</span>
      </GlowControl>
    </div>
  );
}

// ─── Mixer fader channel ──────────────────────────────────────────────────────

function FaderChannel({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5" style={{ width: 26 }}>
      {/* 3 EQ knobs */}
      {["HI", "MD", "LO"].map((eq) => (
        <GlowControl
          key={eq}
          rounded="rounded-full"
          className="flex items-center justify-center"
          style={{ width: 18, height: 18 }}
        >
          <div className="w-0.5 h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
        </GlowControl>
      ))}

      {/* Fader track */}
      <div
        className="relative rounded-full flex-1 w-1"
        style={{ minHeight: 48, background: "rgba(255,255,255,0.06)" }}
      >
        <GlowControl
          className="absolute"
          style={{ width: 16, height: 7, left: -7.5, top: "38%", borderRadius: 3 }}
        />
      </div>

      {/* Channel label */}
      <span className="text-[6px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>{label}</span>
    </div>
  );
}

// ─── LCD display ─────────────────────────────────────────────────────────────

function Display({ size }: { size: "sm" | "lg" }) {
  if (size === "sm") {
    return (
      <div
        className="rounded-[4px] overflow-hidden flex flex-col gap-0.5 p-1.5"
        style={{ width: 88, height: 48, background: "#06080e", border: "1px solid rgba(255,255,255,0.10)" }}
      >
        {/* Fake waveform */}
        <div className="flex items-end gap-[1.5px] h-4">
          {[3,5,8,6,9,7,10,8,5,7,9,6,4,8,10,7,5,6,8,9].map((h, i) => (
            <div key={i} className="flex-1 rounded-full" style={{ height: h, background: i % 3 === 0 ? ORANGE : "rgba(255,151,0,0.35)" }} />
          ))}
        </div>
        {/* BPM */}
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
      {/* Two waveform tracks */}
      {[0, 1].map((track) => (
        <div key={track} className="flex items-end gap-[1px] h-5">
          {Array.from({ length: 44 }, (_, i) => {
            const h = 4 + Math.abs(Math.sin(i * 0.7 + track * 1.3) * 10);
            return (
              <div
                key={i}
                className="flex-1 rounded-full"
                style={{ height: h, background: track === 0 ? ORANGE : "rgba(255,151,0,0.40)" }}
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

  return (
    <div
      className="relative select-none"
      onMouseEnter={() => setControllerHovered(true)}
      onMouseLeave={() => setControllerHovered(false)}
      style={{
        // Scale down to fit into scene section on smaller viewports
        transform: "scale(0.92)",
        transformOrigin: "center center",
      }}
    >
      {/* Outer glow when hovered */}
      <motion.div
        className="absolute -inset-4 rounded-[2rem] pointer-events-none"
        animate={{
          opacity: controllerHovered ? 1 : 0,
          background: controllerHovered
            ? "radial-gradient(ellipse at 50% 50%, rgba(255,151,0,0.06), transparent 70%)"
            : "transparent",
        }}
        transition={{ duration: 0.4 }}
      />

      {/* Controller body */}
      <div
        className="relative overflow-hidden"
        style={{
          width: 560,
          borderRadius: 16,
          background: "linear-gradient(160deg, #16161e, #0e0e14)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
          padding: "12px 12px 14px",
        }}
      >
        {/* Branding strip */}
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[8px] uppercase tracking-[0.35em] font-semibold" style={{ color: "rgba(255,255,255,0.20)" }}>
            Nero DJ
          </span>
          <span className="text-[7px] font-mono" style={{ color: ORANGE + "80" }}>
            OPUS · LIVE
          </span>
        </div>

        {/* ── Display row ── */}
        <div className="flex items-stretch gap-2 mb-3">
          <Display size="sm" />
          <Display size="lg" />
          <Display size="sm" />
        </div>

        {/* ── Main panel ── */}
        <div className="flex gap-2 items-end">

          {/* ══ LEFT DECK ══ */}
          <div className="flex flex-col gap-2" style={{ width: 156 }}>
            {/* Hot cues */}
            <HotCueGrid rows={2} />

            {/* Beat loop controls */}
            <div className="flex gap-1.5 items-start">
              {/* Beat loop section */}
              <div className="flex flex-col gap-1">
                <GlowControl
                  rounded="rounded-full"
                  className="flex items-center justify-center"
                  style={{ width: 26, height: 26 }}
                >
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

              {/* Beat jump buttons */}
              <ButtonCluster labels={["IN","OUT","ON"]} />
            </div>

            {/* Jog wheel */}
            <div className="flex justify-center py-1">
              <JogWheel controllerHovered={controllerHovered} />
            </div>

            {/* Transport */}
            <TransportButtons />
          </div>

          {/* ══ CENTER MIXER ══ */}
          <div className="flex flex-col gap-2 flex-1">
            {/* Effects / send buttons */}
            <div className="flex gap-1 justify-center">
              {["FX1","FX2","FX3","SEND"].map((l) => (
                <GlowControl key={l} className="flex items-center justify-center px-1" style={{ height: 14 }}>
                  <span className="text-[6px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.20)" }}>{l}</span>
                </GlowControl>
              ))}
            </div>

            {/* 4 channel faders */}
            <div className="flex justify-around items-end flex-1 px-1" style={{ minHeight: 130 }}>
              {["1","2","3","4"].map((ch) => (
                <FaderChannel key={ch} label={ch} />
              ))}
            </div>

            {/* Crossfader */}
            <div className="flex flex-col gap-1 px-2">
              <div
                className="relative h-1.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <GlowControl
                  className="absolute"
                  style={{ width: 22, height: 10, top: -4.5, left: "42%", borderRadius: 4 }}
                />
              </div>
              <div className="flex justify-between">
                <span className="text-[6px] font-mono" style={{ color: "rgba(255,255,255,0.20)" }}>A</span>
                <span className="text-[6px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.18)" }}>XFADER</span>
                <span className="text-[6px] font-mono" style={{ color: "rgba(255,255,255,0.20)" }}>B</span>
              </div>
            </div>
          </div>

          {/* ══ RIGHT DECK ══ */}
          <div className="flex flex-col gap-2" style={{ width: 156 }}>
            {/* Hot cues */}
            <HotCueGrid rows={2} />

            {/* Beat loop + controls */}
            <div className="flex gap-1.5 items-start justify-end">
              <ButtonCluster labels={["IN","OUT","ON"]} />
              <div className="flex flex-col gap-1">
                <GlowControl
                  rounded="rounded-full"
                  className="flex items-center justify-center"
                  style={{ width: 26, height: 26 }}
                >
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

            {/* Jog wheel */}
            <div className="flex justify-center py-1">
              <JogWheel controllerHovered={controllerHovered} />
            </div>

            {/* Transport */}
            <div className="flex items-center gap-2 justify-end">
              <GlowControl
                rounded="rounded-full"
                className="flex items-center justify-center"
                style={{ width: 32, height: 32 }}
              >
                <span className="text-[7px] font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>CUE</span>
              </GlowControl>
              <GlowControl
                rounded="rounded-full"
                className="flex items-center justify-center"
                style={{ width: 36, height: 36 }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 2.5L11 7L3 11.5V2.5Z" fill="rgba(255,255,255,0.40)" />
                </svg>
              </GlowControl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
