import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "motion/react";
import { DJController } from "./DJController";
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

// Lusion-style spring config — organic scroll lag without sloppiness
const SPRING = { stiffness: 55, damping: 20, mass: 0.65 };

/**
 * Sticky showcase — polish pass v3.
 *
 * Scroll timing / easing:
 * - Widget now has both entrance AND exit (opacity/y/blur at scroll tail)
 * - widgetX/Y wrapped in useSpring → organic lag, not mechanical linear
 * - Phase Y values spring-smoothed for cinematic text motion
 * - Body copy staggered 40% behind headline via chained opacity transform
 *
 * Background depth:
 * - Bloom pushed to 0.14 opacity, right-side gradient reduced to let it breathe
 * - Orb1 opacity bumped from 0.055 → 0.075
 *
 * Progress pill:
 * - Gradient fill + box-shadow glow instead of flat color
 *
 * Mobile:
 * - Controller hidden below md (768px) — canvas visualizer + text fills the scene
 * - Scale wrapper at md/lg to fit narrower viewports
 *
 * prefers-reduced-motion:
 * - All scroll transforms replaced with static values
 * - Widget appears at full opacity with no entrance animation
 */
export function StickyShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // ── Orange bloom — rises on entry, peaks mid-section, dims on exit ──────────
  const bloomOpacity = useTransform(
    scrollYProgress,
    [0, 0.10, 0.42, 0.88, 1],
    [0, 0.75, 1, 0.75, 0]
  );
  const bloomScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.72, 1.05, 0.72]);

  // ── Widget: entrance (0→0.25) + exit (0.86→1.0) ─────────────────────────────
  // Raw transforms — springs applied below for organic scroll lag
  const widgetXRaw     = useTransform(scrollYProgress, [0, 0.25], [110, 0]);
  const widgetYRaw     = useTransform(scrollYProgress, [0, 0.25, 0.86, 1.0], [36, 0, 0, -30]);
  const widgetOpacity  = useTransform(scrollYProgress, [0, 0.20, 0.88, 1.0], [0, 1, 1, 0]);
  const widgetBlurRaw  = useTransform(scrollYProgress, [0, 0.20, 0.88, 1.0], [20, 0, 0, 12]);
  const widgetScaleRaw = useTransform(scrollYProgress, [0, 0.25, 0.88, 1.0], [0.80, 1, 1, 0.93]);
  const widgetFilter   = useTransform(widgetBlurRaw, (v) => `blur(${v}px)`);

  // Springs on X/Y — widget lags slightly behind scroll, feels organic
  const widgetX = useSpring(widgetXRaw, SPRING);
  const widgetY = useSpring(widgetYRaw, SPRING);

  // ── Parallax ambient orbs ────────────────────────────────────────────────────
  const orb1Y = useTransform(scrollYProgress, [0, 1], [-36, 36]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], [24, -24]);

  // ── Phase 0: in [0.06–0.20], hold [0.20–0.36], out [0.36–0.46] ─────────────
  const p0Opacity = useTransform(scrollYProgress, [0.06, 0.20, 0.36, 0.46], [0, 1, 1, 0]);
  const p0YRaw    = useTransform(scrollYProgress, [0.06, 0.22], [36, 0]);
  const p0X       = useTransform(scrollYProgress, [0.06, 0.20, 0.36, 0.46], [-32, 0, 0, 28]);
  const p0LS      = useTransform(p0Opacity, [0, 1], ["0.08em", "0.38em"]);
  // Body stagger — reveals after headline is 40% into its entrance
  const p0BodyOp  = useTransform(p0Opacity, [0, 0.45, 1], [0, 0, 1]);
  const p0BodyY   = useTransform(p0BodyOp, [0, 1], [14, 0]);

  // ── Phase 1: in [0.46–0.59], hold [0.59–0.72], out [0.72–0.81] ─────────────
  const p1Opacity = useTransform(scrollYProgress, [0.46, 0.59, 0.72, 0.81], [0, 1, 1, 0]);
  const p1YRaw    = useTransform(scrollYProgress, [0.46, 0.59], [36, 0]);
  const p1X       = useTransform(scrollYProgress, [0.46, 0.59, 0.72, 0.81], [-32, 0, 0, 28]);
  const p1LS      = useTransform(p1Opacity, [0, 1], ["0.08em", "0.38em"]);
  const p1BodyOp  = useTransform(p1Opacity, [0, 0.45, 1], [0, 0, 1]);
  const p1BodyY   = useTransform(p1BodyOp, [0, 1], [14, 0]);

  // ── Phase 2: in [0.81–0.92], hold [0.92–1.0] (no exit) ─────────────────────
  const p2Opacity = useTransform(scrollYProgress, [0.81, 0.92], [0, 1]);
  const p2YRaw    = useTransform(scrollYProgress, [0.81, 0.92], [36, 0]);
  const p2X       = useTransform(scrollYProgress, [0.81, 0.92], [-32, 0]);
  const p2LS      = useTransform(p2Opacity, [0, 1], ["0.08em", "0.38em"]);
  const p2BodyOp  = useTransform(p2Opacity, [0, 0.45, 1], [0, 0, 1]);
  const p2BodyY   = useTransform(p2BodyOp, [0, 1], [14, 0]);

  // Spring-smoothed phase Y — cinematic text flow
  const p0Y = useSpring(p0YRaw, SPRING);
  const p1Y = useSpring(p1YRaw, SPRING);
  const p2Y = useSpring(p2YRaw, SPRING);

  const phases = [
    { opacity: p0Opacity, y: p0Y, x: p0X, ls: p0LS, bodyOp: p0BodyOp, bodyY: p0BodyY },
    { opacity: p1Opacity, y: p1Y, x: p1X, ls: p1LS, bodyOp: p1BodyOp, bodyY: p1BodyY },
    { opacity: p2Opacity, y: p2Y, x: p2X, ls: p2LS, bodyOp: p2BodyOp, bodyY: p2BodyY },
  ];

  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div ref={containerRef} style={{ height: "240dvh" }}>
      <div className="sticky top-0 h-[100dvh] overflow-hidden flex items-center">

        {/* Music equalizer canvas background */}
        <MusicVisualizer className="absolute inset-0 w-full h-full" />

        {/* Scroll-driven orange bloom — right half, grows as section peaks */}
        {!reduced && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              right: "-6%",
              top: "50%",
              translateY: "-50%",
              width: 680,
              height: 680,
              borderRadius: "50%",
              // 0.14 opacity — visible through the reduced right-side gradient below
              background: "radial-gradient(circle, rgba(255,151,0,0.14), transparent 60%)",
              filter: "blur(80px)",
              opacity: bloomOpacity,
              scale: bloomScale,
            }}
          />
        )}

        {/* Floating ambient orbs — subtle depth layers at different parallax rates */}
        {!reduced && (
          <>
            <motion.div
              aria-hidden
              className="pointer-events-none absolute rounded-full"
              style={{
                right: "7%",
                top: "12%",
                width: 150,
                height: 150,
                background: "radial-gradient(circle, #FF9700, transparent 70%)",
                filter: "blur(52px)",
                opacity: 0.075,
                y: orb1Y,
              }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute rounded-full"
              style={{
                right: "22%",
                bottom: "17%",
                width: 90,
                height: 90,
                background: "radial-gradient(circle, #FF9700, transparent 70%)",
                filter: "blur(34px)",
                opacity: 0.042,
                y: orb2Y,
              }}
            />
          </>
        )}

        {/* Gradient overlays — vignette + left readability + top/bottom fade.
            Right gradient stops at 52% (was 60%) to give bloom room to breathe. */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(5,5,5,0.40) 18%, rgba(5,5,5,0.86) 68%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.45) 36%, transparent 52%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(5,5,5,0.55) 0%, transparent 18%, transparent 82%, rgba(5,5,5,0.55) 100%)" }} />
        </div>

        {/* Section hairlines */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent)" }} />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent)" }} />

        {/* Progress pill — gradient fill with orange glow */}
        <div
          aria-hidden
          className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full overflow-hidden"
          style={{ width: 80, height: 2, background: "rgba(255,255,255,0.06)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              width: progressWidth,
              background: "linear-gradient(to right, rgba(255,151,0,0.5), #FF9700)",
              boxShadow: "0 0 6px rgba(255,151,0,0.45)",
            }}
          />
        </div>

        {/* Layout */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: text phases */}
          <div className="relative" style={{ height: 260 }}>
            {PHASES.map((phase, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 flex flex-col justify-center"
                style={{ opacity: phases[i].opacity, y: phases[i].y, x: phases[i].x }}
              >
                {/* Eyebrow — letter-spacing opens as phase fades in */}
                <motion.span
                  className="flex items-center gap-2 mb-5 text-[10px] uppercase font-semibold text-[#FF9700]/55"
                  style={{ letterSpacing: reduced ? "0.38em" : phases[i].ls }}
                >
                  <span className="inline-block w-7 h-px bg-[#FF9700]/35 flex-shrink-0" />
                  {phase.eyebrow}
                </motion.span>

                <h2
                  className="text-4xl lg:text-[3.25rem] font-extrabold tracking-[-0.02em] leading-[1.06] mb-5"
                  style={{ whiteSpace: "pre-line" }}
                >
                  {phase.headline}
                </h2>

                {/* Body copy — staggered 40% behind headline reveal */}
                <motion.p
                  className="text-[0.9rem] text-white/32 leading-[1.75] max-w-[42ch]"
                  style={
                    reduced
                      ? undefined
                      : { opacity: phases[i].bodyOp, y: phases[i].bodyY }
                  }
                >
                  {phase.body}
                </motion.p>
              </motion.div>
            ))}
          </div>

          {/* Right: DJController
              - Hidden below md (controller too wide for narrow mobile)
              - Scale wrapper keeps it within viewport at each breakpoint */}
          <div
            className="hidden md:flex items-center justify-center lg:justify-end"
            style={{ perspective: 1200, overflow: "hidden" }}
          >
            <motion.div
              style={
                reduced
                  ? { opacity: 1 }
                  : {
                      x: widgetX,
                      y: widgetY,
                      opacity: widgetOpacity,
                      filter: widgetFilter,
                      scale: widgetScaleRaw,
                    }
              }
            >
              {/* Responsive scale — avoids horizontal overflow at md/lg breakpoints */}
              <div className="origin-center scale-[0.72] lg:scale-[0.88] xl:scale-100">
                <DJController />
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
