import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { PartyWidget } from "./PartyWidget";
import { MusicVisualizer } from "./MusicVisualizer";

const PHASES = [
  {
    eyebrow: "Drop the queue",
    headline: "Everyone hears\nthe same song.",
    body: "One shared queue. Real-time sync across every device. No matter where your friends are, you all hear the same beat at the exact same moment.",
  },
  {
    eyebrow: "Cast your fire",
    headline: "The crowd votes\nwhat wins.",
    body: "Every listener gets one fire vote per song. No dashboards, no playlists — just the raw opinion of the room, tallied live as the music plays.",
  },
  {
    eyebrow: "The verdict",
    headline: "One song takes\nthe crown.",
    body: "Ranked by fire votes, then replays, then how long each track held the room. The party ends. The winner is crowned. The crowd spoke.",
  },
];

/**
 * Lusion-style sticky showcase.
 * 240dvh total = 100dvh sticky panel + 140dvh scroll travel.
 * Widget cinematic slide-in from right. Three text phases sweep in/out horizontally.
 */
export function StickyShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // ── Widget entrance: slides in from right, first 25% of scroll ──────────
  const widgetX       = useTransform(scrollYProgress, [0, 0.25], [140, 0]);
  const widgetOpacity = useTransform(scrollYProgress, [0, 0.22], [0, 1]);
  const widgetBlurRaw = useTransform(scrollYProgress, [0, 0.22], [18, 0]);
  const widgetFilter  = useTransform(widgetBlurRaw, (v) => `blur(${v}px)`);
  const widgetScale   = useTransform(scrollYProgress, [0, 0.25], [0.90, 1]);

  // ── Phase 0: [0.05–0.20] in, [0.20–0.36] hold, [0.36–0.44] out ─────────
  const p0Opacity = useTransform(scrollYProgress, [0.05, 0.20, 0.36, 0.44], [0, 1, 1, 0]);
  const p0Y       = useTransform(scrollYProgress, [0.05, 0.20], [32, 0]);
  const p0X       = useTransform(scrollYProgress, [0.05, 0.20, 0.36, 0.44], [-28, 0, 0, 24]);

  // ── Phase 1: [0.44–0.57] in, [0.57–0.70] hold, [0.70–0.78] out ─────────
  const p1Opacity = useTransform(scrollYProgress, [0.44, 0.57, 0.70, 0.78], [0, 1, 1, 0]);
  const p1Y       = useTransform(scrollYProgress, [0.44, 0.57], [32, 0]);
  const p1X       = useTransform(scrollYProgress, [0.44, 0.57, 0.70, 0.78], [-28, 0, 0, 24]);

  // ── Phase 2: [0.78–0.90] in, [0.90–1.0] hold (no exit) ─────────────────
  const p2Opacity = useTransform(scrollYProgress, [0.78, 0.90], [0, 1]);
  const p2Y       = useTransform(scrollYProgress, [0.78, 0.90], [32, 0]);
  const p2X       = useTransform(scrollYProgress, [0.78, 0.90], [-28, 0]);

  const phases = [
    { opacity: p0Opacity, y: p0Y, x: p0X },
    { opacity: p1Opacity, y: p1Y, x: p1X },
    { opacity: p2Opacity, y: p2Y, x: p2X },
  ];

  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    // 240dvh: 100dvh sticky panel + 140dvh of scroll travel (was 350dvh — too long)
    <div ref={containerRef} style={{ height: "240dvh" }}>
      <div className="sticky top-0 h-[100dvh] overflow-hidden flex items-center">

        {/* Music equalizer background — fills the otherwise-blank sticky scroll */}
        <MusicVisualizer className="absolute inset-0 w-full h-full" />

        {/* Gradient overlays — keep visualizer subtle, don't overwhelm text/widget */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {/* Strong vignette — visualizer is ambient, content must win */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(5,5,5,0.45) 20%, rgba(5,5,5,0.88) 70%)" }} />
          {/* Left text area fully readable */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.5) 40%, transparent 60%)" }} />
          {/* Top/bottom fade */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(5,5,5,0.6) 0%, transparent 20%, transparent 80%, rgba(5,5,5,0.6) 100%)" }} />
        </div>

        {/* Section hairlines */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent)" }} />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent)" }} />

        {/* Progress pill */}
        <div
          aria-hidden
          className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full overflow-hidden"
          style={{ width: 80, height: 2, background: "rgba(255,255,255,0.06)" }}
        >
          <motion.div className="h-full rounded-full bg-[#FF9700]/55" style={{ width: progressWidth }} />
        </div>

        {/* Layout */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: text phases — sweep horizontally */}
          <div className="relative" style={{ height: 260 }}>
            {PHASES.map((phase, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 flex flex-col justify-center"
                style={{ opacity: phases[i].opacity, y: phases[i].y, x: phases[i].x }}
              >
                <span className="flex items-center gap-2 mb-5 text-[10px] uppercase tracking-[0.38em] font-semibold text-[#FF9700]/55">
                  <span className="inline-block w-7 h-px bg-[#FF9700]/35" />
                  {phase.eyebrow}
                </span>
                <h2
                  className="text-4xl lg:text-[3.25rem] font-extrabold tracking-[-0.02em] leading-[1.06] mb-5"
                  style={{ whiteSpace: "pre-line" }}
                >
                  {phase.headline}
                </h2>
                <p className="text-[0.9rem] text-white/32 leading-[1.75] max-w-[42ch]">
                  {phase.body}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Right: widget — cinematic slide-in */}
          <div className="flex items-center justify-center lg:justify-end">
            <motion.div style={{ x: widgetX, opacity: widgetOpacity, filter: widgetFilter, scale: widgetScale }}>
              <PartyWidget />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
