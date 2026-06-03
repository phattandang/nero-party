import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, MotionValue, AnimatePresence } from "motion/react";
import {
  MusicNote, Users, Timer, ArrowRight, Sparkle, Queue, Fire, Trophy, Star,
} from "@phosphor-icons/react";
import { createParty } from "../lib/api";
import { useMouseParallax } from "../hooks/useMouseParallax";

import { DJController } from "../components/cinematic/DJController";
import { SceneSection } from "../components/cinematic/SceneSection";
import { MetricsStrip } from "../components/cinematic/MetricsStrip";
import { FinalCTA } from "../components/cinematic/FinalCTA";
import { MotionText } from "../components/cinematic/MotionText";
import { PremiumButton } from "../components/cinematic/PremiumButton";
import { FlowProgress } from "../components/cinematic/FlowProgress";

// ─── Step-transition variants — directional x-slide (forward=right, back=left) ──

const STEP_VARIANTS = {
  enter: (dir: "forward" | "backward") => ({
    opacity: 0,
    x: dir === "forward" ? 60 : -60,
    filter: "blur(10px)",
  }),
  center: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
  exit: (dir: "forward" | "backward") => ({
    opacity: 0,
    x: dir === "forward" ? -60 : 60,
    filter: "blur(10px)",
    transition: { duration: 0.38, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] },
  }),
};

// ─── Deterministic waveform bar data ─────────────────────────────────────────

const WAVEFORM_BARS = Array.from({ length: 52 }, (_, i) => ({
  id: i,
  heightPct: 12 + ((i * 17 + i * i * 3) % 58),
  opacity: 0.025 + ((i * 7) % 9) * 0.007,
  duration: 0.55 + ((i * 13) % 9) * 0.085,
  delay: ((i * 11) % 11) * 0.08,
}));

// Lower-opacity version that persists throughout all scroll sections
const GLOBAL_WAVEFORM_BARS = Array.from({ length: 48 }, (_, i) => ({
  id: i + 200,
  heightPct: 10 + ((i * 19 + i * i * 5) % 50),
  opacity: 0.008 + ((i * 5) % 7) * 0.003, // 0.8–2.9% — very subtle
  duration: 0.65 + ((i * 11) % 8) * 0.09,
  delay: ((i * 13) % 10) * 0.09,
}));

// ─── Scene visuals (module-level to avoid re-creation on render) ──────────────

// SyncOrb removed — DJController is used for Scene 1

/** Scene 2 visual — fire voting stack */
function VoteStack() {
  const items = [
    { votes: 12, label: "Thunderstruck",   w: "100%" },
    { votes: 7,  label: "Blinding Lights", w: "58%"  },
    { votes: 3,  label: "Levitating",      w: "25%"  },
  ];
  return (
    <div className="flex flex-col gap-3 w-72">
      {items.map((item, i) => (
        <motion.div
          key={i}
          className="rounded-2xl border border-white/8 overflow-hidden"
          style={{ background: "rgba(255,255,255,0.025)" }}
          initial={{ opacity: 0, x: -32, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.14, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-semibold text-white/60 truncate">{item.label}</span>
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
              <Fire size={12} weight="fill" className="text-orange-400" />
              <span className="text-xs font-bold text-orange-400">{item.votes}</span>
            </div>
          </div>
          <div className="px-4 pb-3">
            <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(to right, #c96500, #FF9700)" }}
                initial={{ width: 0 }}
                whileInView={{ width: item.w }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.14 + 0.3, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/** Scene 3 visual — winner crown reveal */
function WinnerOrb() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
      {/* Gold glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(245,158,11,0.14), transparent 65%)", filter: "blur(20px)" }}
      />
      {/* Ring */}
      <motion.div
        className="absolute w-48 h-48 rounded-full"
        style={{ border: "1px solid rgba(245,158,11,0.18)" }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.3, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Card */}
      <motion.div
        className="relative z-10 w-28 h-28 rounded-[2rem] flex flex-col items-center justify-center gap-1"
        style={{
          background: "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.06))",
          border: "1px solid rgba(245,158,11,0.25)",
          boxShadow: "0 0 48px rgba(245,158,11,0.15)",
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Trophy size={40} weight="fill" className="text-yellow-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
        <span className="text-[10px] uppercase tracking-widest text-yellow-400/60 font-semibold">Winner</span>
      </motion.div>
      {/* Sparkles */}
      {[{x: -70, y: -50, s: 14}, {x: 65, y: -55, s: 10}, {x: 80, y: 40, s: 12}, {x: -75, y: 45, s: 9}].map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `calc(50% + ${p.x}px)`, top: `calc(50% + ${p.y}px)` }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ duration: 2, delay: i * 0.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Star size={p.s} weight="fill" className="text-yellow-400/60" />
        </motion.div>
      ))}
    </div>
  );
}

// ─── Intro sub-components (module-level) ──────────────────────────────────────

const NOTE_POSITIONS = [
  { left: "7%",  top: "30%", size: 18, delay: 0,    floatDur: 3.6, opacity: 0.12 },
  { left: "20%", top: "60%", size: 12, delay: 0.35, floatDur: 4.1, opacity: 0.08 },
  { left: "38%", top: "20%", size: 22, delay: 0.15, floatDur: 3.2, opacity: 0.10 },
  { left: "55%", top: "70%", size: 10, delay: 0.5,  floatDur: 4.8, opacity: 0.07 },
  { left: "68%", top: "25%", size: 16, delay: 0.25, floatDur: 3.9, opacity: 0.11 },
  { left: "82%", top: "55%", size: 14, delay: 0.4,  floatDur: 4.3, opacity: 0.09 },
  { left: "93%", top: "35%", size: 20, delay: 0.1,  floatDur: 3.5, opacity: 0.10 },
];

const FEATURE_PILLS = [
  { icon: Queue,        label: "Live Queue",    delay: 0.10 },
  { icon: Fire,         label: "Blind Voting",  delay: 0.18 },
  { icon: Trophy,       label: "Winner Reveal", delay: 0.26 },
];

function TransitionZone() {
  return (
    <div className="relative overflow-hidden" style={{ minHeight: "38dvh", paddingTop: "5dvh", paddingBottom: "5dvh" }}>
      {NOTE_POSITIONS.map((n, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{ left: n.left, top: n.top }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: n.opacity, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: n.delay, duration: 0.9, ease: [0.32, 0.72, 0, 1] }}
        >
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: n.floatDur, repeat: Infinity, ease: "easeInOut" }}
          >
            <MusicNote size={n.size} weight="fill" className="text-[#FF9700]" />
          </motion.div>
        </motion.div>
      ))}

      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-8 px-4">
        <motion.div
          className="flex items-center gap-4 w-full max-w-lg"
          initial={{ opacity: 0, scaleX: 0.4 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,151,0,0.2))" }} />
          <span className="text-[10px] uppercase tracking-[0.4em] text-white/18 font-medium whitespace-nowrap flex items-center gap-2">
            <MusicNote size={8} weight="fill" className="text-[#FF9700]/40" />
            Where every listen counts
            <MusicNote size={8} weight="fill" className="text-[#FF9700]/40" />
          </span>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(255,151,0,0.2))" }} />
        </motion.div>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          {FEATURE_PILLS.map(({ icon: Icon, label, delay }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              className="flex items-center gap-2 rounded-full border border-white/8 bg-white/3 px-4 py-2"
            >
              <Icon size={12} weight="fill" className="text-[#FF9700]/60" />
              <span className="text-[11px] text-white/30 font-medium tracking-wide">{label}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="flex flex-col items-center gap-1.5"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <span className="text-[9px] uppercase tracking-[0.45em] text-white/15 font-medium">Start your session</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="text-white/15"
          >
            <ArrowRight size={14} style={{ transform: "rotate(90deg)" }} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function ConcentricRings() {
  const sizes = [280, 420, 580, 740];
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {sizes.map((size, i) => (
        <div
          key={size}
          className="absolute rounded-full border border-white/[0.05] sonar"
          style={{ width: size, height: size, animationDelay: `${i * 1.1}s`, animationDuration: `${4.5 + i * 0.6}s` }}
        />
      ))}
    </div>
  );
}

function LargeWaveform() {
  return (
    <div className="absolute inset-x-0 bottom-0 flex items-end gap-[2px] px-0 h-[55%] pointer-events-none">
      {WAVEFORM_BARS.map((bar) => (
        <div
          key={bar.id}
          className="wave-bar flex-1 rounded-t-sm"
          style={{ height: `${bar.heightPct}%`, background: `rgba(255, 151, 0, ${bar.opacity})`, animationDuration: `${bar.duration}s`, animationDelay: `${bar.delay}s` }}
        />
      ))}
    </div>
  );
}

function ScrollIndicator({ opacity }: { opacity: MotionValue<number> }) {
  return (
    <motion.div
      style={{ opacity }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10"
    >
      <div
        className="relative overflow-hidden rounded-full"
        style={{ width: 1, height: 56, background: "rgba(255,255,255,0.08)" }}
      >
        <motion.div
          className="absolute inset-x-0 rounded-full"
          style={{ height: 28, background: "linear-gradient(to bottom, transparent, #FF9700 50%, transparent)" }}
          animate={{ y: ["-100%", "250%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear", repeatDelay: 0.1 }}
        />
      </div>
      <span className="text-[9px] uppercase tracking-[0.45em] text-white/20 font-medium">Scroll</span>
    </motion.div>
  );
}

function MarqueeStrip() {
  const items = ["LISTEN", "VOTE", "REAL-TIME SYNC", "PARTY", "WIN THE NIGHT", "30s PREVIEWS", "LIVE QUEUE"];
  const repeated = [...items, ...items];
  return (
    <div
      className="absolute left-0 right-0 overflow-hidden border-y border-white/[0.06]"
      style={{ bottom: "13%" }}
    >
      <div className="marquee-h flex items-center whitespace-nowrap" style={{ width: "max-content" }}>
        {repeated.map((item, i) => (
          <span key={i} className="inline-flex items-center">
            <span className="px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.3em] text-white/20">{item}</span>
            <span className="text-[#FF9700]/30 text-[10px]">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Hero entry section (Create / Join quick access) ─────────────────────────

function HeroEntry({
  onCreateClick,
  onJoinClick,
}: {
  onCreateClick: () => void;
  onJoinClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center max-w-2xl w-full">
      {/* Logo mark */}
      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        className="mb-10"
      >
        <div className="relative inline-flex">
          <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 p-1.5 float">
            <div
              className="w-full h-full rounded-[calc(2rem-0.375rem)] flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #c9650022, #FF970011)", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15)" }}
            >
              <MusicNote weight="fill" className="text-accent" size={36} />
            </div>
          </div>
          <div className="absolute -inset-3 rounded-[2.5rem] bg-[#e07600]/10 blur-xl" />
        </div>
      </motion.div>

      {/* Eyebrow */}
      <motion.div
        initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true }}
        transition={{ delay: 0.1, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="mb-6"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] font-medium text-white/50">
          <Sparkle weight="fill" size={10} className="text-accent flicker" />
          Real-time listening parties
        </span>
      </motion.div>

      {/* Headline */}
      <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
        <MotionText stagger={0.08} delay={0.2}>Music is better</MotionText>
        {" "}
        <motion.span
          className="italic inline-block text-shimmer"
          style={{ background: "linear-gradient(90deg, #FF9700, #ffb340, #c96500, #FF9700)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + 3 * 0.08, duration: 0.65, ease: [0.32, 0.72, 0, 1] }}
        >
          together
        </motion.span>
      </h1>

      <motion.p
        className="text-lg text-white/40 max-w-[52ch] leading-relaxed mb-12"
        initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true }}
        transition={{ delay: 0.45, duration: 0.65, ease: [0.32, 0.72, 0, 1] }}
      >
        Create a party, invite your crew, add songs to the queue, and let the crowd pick the winner.
      </motion.p>

      <motion.div
        className="flex flex-col sm:flex-row gap-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.55, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      >
        <PremiumButton onClick={onCreateClick}>
          Create a Party
        </PremiumButton>
        <PremiumButton variant="ghost" onClick={onJoinClick}>
          <Users size={14} />
          Join a Party
        </PremiumButton>
      </motion.div>

      {/* Feature pills */}
      <motion.div
        className="flex flex-wrap justify-center gap-2 mt-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        {["Real-time sync", "Blind voting", "30s previews", "Live queue", "Winner reveal"].map((f, i) => (
          <motion.span
            key={f}
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 + i * 0.07, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="rounded-full border border-white/8 bg-white/3 px-3 py-1 text-[11px] text-white/30 font-medium"
          >
            {f}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Create form ──────────────────────────────────────────────────────────────

function CreateForm({
  form, setForm, onBack, onSubmit, loading, error, direction,
}: {
  form: { partyName: string; hostName: string; maxSongs: number; maxDuration: number };
  setForm: (f: typeof form) => void;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  error: string;
  direction: "forward" | "backward";
}) {
  return (
    <motion.div
      key="create"
      custom={direction}
      variants={STEP_VARIANTS}
      initial="enter"
      animate="center"
      exit="exit"
      className="w-full max-w-md"
    >
      {/* Flow progress — Step 1 of 3 */}
      <div className="flex justify-center mb-8">
        <FlowProgress step={1} />
      </div>

      <div className="rounded-[2rem] border border-white/10 p-1.5" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div className="rounded-[calc(2rem-0.375rem)] p-8" style={{ background: "rgba(10,10,15,0.9)", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)" }}>
          <button
            onClick={onBack}
            className="text-white/30 hover:text-white/60 text-xs font-medium mb-6 flex items-center gap-1.5 transition-colors duration-200"
          >
            ← Back
          </button>
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] font-medium text-white/40 mb-3">New Party</span>
            <h2 className="text-3xl font-bold tracking-tight">Set the stage</h2>
            <p className="text-white/40 text-sm mt-1.5">Your friends will be able to join with a code</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 block">Party Name</label>
              <input
                type="text"
                placeholder="Friday Night Vibes"
                value={form.partyName}
                onChange={(e) => setForm({ ...form, partyName: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#e07600]/50 transition-all duration-200"
                style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 block">Your Name</label>
              <input
                type="text"
                placeholder="DJ Nero"
                value={form.hostName}
                onChange={(e) => setForm({ ...form, hostName: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#e07600]/50 transition-all duration-200"
                style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)" }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><MusicNote size={11} /> Max Songs</label>
                <select value={form.maxSongs} onChange={(e) => setForm({ ...form, maxSongs: Number(e.target.value) })} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#e07600]/50 transition-all duration-200">
                  {[10, 20, 30, 50].map((n) => <option key={n} value={n} className="bg-neutral-900">{n} songs</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Timer size={11} /> Duration</label>
                <select value={form.maxDuration} onChange={(e) => setForm({ ...form, maxDuration: Number(e.target.value) })} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#e07600]/50 transition-all duration-200">
                  {[30, 60, 90, 120].map((n) => <option key={n} value={n} className="bg-neutral-900">{n} min</option>)}
                </select>
              </div>
            </div>
            {error && (
              <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="text-red-400/80 text-xs text-center">
                {error}
              </motion.p>
            )}
            <PremiumButton
              type="submit"
              onClick={onSubmit}
              disabled={loading}
              className="w-full justify-center mt-2"
            >
              {loading ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : "Launch Party"}
            </PremiumButton>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  // Tracks whether the user has left the hero step (so we animate on return)
  const heroHasLeft = useRef(false);
  const [step, setStep] = useState<"hero" | "create">("hero");
  // Tracks which direction we're moving through the flow — drives STEP_VARIANTS
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ partyName: "", hostName: "", maxSongs: 20, maxDuration: 60 });

  // ── Scroll-driven intro exit ──────────────────────────────────────────────
  const { scrollY } = useScroll();
  const smoothY = useSpring(scrollY, { stiffness: 120, damping: 28, mass: 0.6 });

  const introOpacity = useTransform(smoothY, [0, 520], [1, 0]);
  const introY       = useTransform(smoothY, [0, 520], [0, -60]);
  const introBlurRaw = useTransform(smoothY, [0, 440], [0, 18]);
  const introFilter  = useTransform(introBlurRaw, (v) => `blur(${v}px)`);
  const negroX       = useTransform(smoothY, [60, 480], [0, -100]);
  const partyX       = useTransform(smoothY, [60, 480], [0, 100]);
  const scrollCueOp  = useTransform(smoothY, [0, 180], [1, 0]);
  const heroOpacity  = useTransform(smoothY, [340, 700], [0, 1]);
  const heroY        = useTransform(smoothY, [340, 700], [64, 0]);
  const heroFilter   = useTransform(smoothY, [340, 650], ["blur(14px)", "blur(0px)"]);

  // ── Mouse parallax for ambient orbs ──────────────────────────────────────
  const { x: parallaxX, y: parallaxY } = useMouseParallax();
  const orb1X = useTransform(parallaxX, (v) => v * 35);
  const orb1Y = useTransform(parallaxY, (v) => v * 35);
  const orb2X = useTransform(parallaxX, (v) => v * -25);
  const orb2Y = useTransform(parallaxY, (v) => v * -25);
  const orb3X = useTransform(parallaxX, (v) => v * 15);
  const orb3Y = useTransform(parallaxY, (v) => v * 15);

  async function handleCreate() {
    if (!form.partyName.trim() || !form.hostName.trim()) { setError("Fill in all fields"); return; }
    setLoading(true); setError("");
    try {
      const { party, participant } = await createParty({ name: form.partyName, hostName: form.hostName, maxSongs: form.maxSongs, maxDuration: form.maxDuration });
      localStorage.setItem("participantId", participant.id);
      localStorage.setItem("partyCode", party.code);
      navigate(`/party/${party.code}`);
    } catch { setError("Something went wrong. Try again."); }
    finally { setLoading(false); }
  }

  function handleCreateClick() {
    setDirection("forward");
    heroHasLeft.current = true;
    setStep("create");
    requestAnimationFrame(() => {
      if (heroRef.current) {
        const y = heroRef.current.getBoundingClientRect().top + window.scrollY - 24;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    });
  }

  function handleBackFromCreate() {
    setDirection("backward");
    setStep("hero");
  }

  function handleJoinClick() {
    navigate("/join");
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.35 } }}
      exit={{ opacity: 0, y: -20, filter: "blur(8px)", transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] } }}
      className="relative"
    >
      {/* ── Global ambient waveform — persists throughout all scroll sections ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 overflow-hidden"
        style={{ height: "48dvh", zIndex: 1 }}
      >
        <div className="relative h-full flex items-end gap-[2px]">
          {GLOBAL_WAVEFORM_BARS.map((bar) => (
            <div
              key={bar.id}
              className="wave-bar flex-1 rounded-t-sm"
              style={{
                height: `${bar.heightPct}%`,
                background: `rgba(255, 151, 0, ${bar.opacity})`,
                animationDuration: `${bar.duration}s`,
                animationDelay: `${bar.delay}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Fixed ambient orbs ───────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="glow-pulse absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#FF9700]/10 blur-[120px]"
          style={{ x: orb1X, y: orb1Y }}
        />
        <div className="absolute -bottom-40 -right-40">
          <motion.div
            className="glow-pulse w-[500px] h-[500px] rounded-full bg-[#e07600]/8 blur-[100px]"
            style={{ x: orb2X, y: orb2Y }}
          />
        </div>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-orange-900/5 blur-[160px]"
          style={{ x: orb3X, y: orb3Y }}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SCENE 1 — Cinematic intro  (NERO / PARTY)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="h-[100dvh] overflow-hidden intro-fade-bottom relative">
        <motion.div
          style={{ opacity: introOpacity, y: introY, filter: introFilter }}
          className="relative h-full flex flex-col"
        >
          {/* Top bar */}
          <div className="absolute top-0 inset-x-0 flex items-center justify-between px-6 sm:px-10 h-14 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,151,0,0.15)", border: "1px solid rgba(255,151,0,0.2)" }}>
                <MusicNote weight="fill" size={13} className="text-[#FF9700]" />
              </div>
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/50">Nero Party</span>
            </div>
            <div className="flex items-center gap-5 text-[10px] uppercase tracking-[0.2em] text-white/20 font-medium">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#FF9700] flicker" />Live</span>
              <span className="hidden sm:block">Real-time sync</span>
              <span>2026</span>
            </div>
          </div>

          {/* Side labels */}
          <div className="absolute left-5 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] uppercase tracking-[0.45em] text-white/10 font-medium whitespace-nowrap hidden md:block">[ Music Party ]</div>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-[9px] uppercase tracking-[0.45em] text-white/10 font-medium whitespace-nowrap hidden md:block">Sync — Vote — Win</div>

          <ConcentricRings />
          <LargeWaveform />

          {/* Center headline */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.6, ease: [0.32, 0.72, 0, 1] } }}
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-white/25 font-medium mb-6"
            >
              <span className="w-4 h-px" style={{ background: "rgba(255,151,0,0.4)" }} />
              Est. 2026
              <span className="w-4 h-px" style={{ background: "rgba(255,151,0,0.4)" }} />
            </motion.span>

            <div className="overflow-hidden">
              <motion.div
                style={{ x: negroX }}
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1, transition: { delay: 0.05, duration: 0.9, ease: [0.32, 0.72, 0, 1] } }}
              >
                <span className="text-outline block font-extrabold leading-[0.88] tracking-tighter select-none" style={{ fontSize: "clamp(72px, 18vw, 260px)" }}>NERO</span>
              </motion.div>
            </div>
            <div className="overflow-hidden">
              <motion.div
                style={{ x: partyX }}
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1, transition: { delay: 0.18, duration: 0.9, ease: [0.32, 0.72, 0, 1] } }}
              >
                <span className="block font-extrabold leading-[0.88] tracking-tighter text-white select-none" style={{ fontSize: "clamp(72px, 18vw, 260px)" }}>PARTY</span>
              </motion.div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.55, duration: 0.8 } }}
              className="text-white/18 text-xs sm:text-sm font-medium tracking-[0.15em] uppercase mt-6"
            >
              Music is better together
            </motion.p>
          </div>

          <MarqueeStrip />
          <ScrollIndicator opacity={scrollCueOp} />
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TRANSITION ZONE — floating notes + feature pills
      ══════════════════════════════════════════════════════════════════ */}
      <TransitionZone />

      {/* ══════════════════════════════════════════════════════════════════
          SCENE 2 — Hero action (Create / Join quick access)
      ══════════════════════════════════════════════════════════════════ */}
      <motion.div
        ref={heroRef}
        style={{ opacity: heroOpacity, y: heroY, filter: heroFilter }}
        className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 pb-16"
      >
        <AnimatePresence mode="wait">
          {step === "hero" ? (
            <motion.div
              key="hero"
              custom={direction}
              variants={STEP_VARIANTS}
              // Skip entrance animation on first render — whileInView handles reveals
              initial={heroHasLeft.current ? "enter" : false}
              animate="center"
              exit="exit"
              className="w-full flex justify-center"
            >
              <HeroEntry onCreateClick={handleCreateClick} onJoinClick={handleJoinClick} />
            </motion.div>
          ) : (
            <CreateForm
              key="create"
              form={form}
              setForm={setForm}
              onBack={handleBackFromCreate}
              onSubmit={handleCreate}
              loading={loading}
              error={error}
              direction={direction}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════
          SCENES 3–5 — Feature capability scenes
      ══════════════════════════════════════════════════════════════════ */}
      <SceneSection
        index={0}
        eyebrow="Real-time sync"
        headline="Everyone hears the same beat."
        body="The host controls the queue. Every guest's audio starts at the exact same moment — no latency, no drift, no one three seconds behind."
        visual={<DJController />}
        align="left"
        accent="#FF9700"
      />

      <SceneSection
        index={1}
        eyebrow="Fire voting"
        headline="The crowd decides what matters."
        body="One fire vote per track, per listener. Anonymous, real-time, and ruthless. The best song rises. Mediocrity fades. No algorithm involved."
        visual={<VoteStack />}
        align="right"
        accent="#ea580c"
      />

      <SceneSection
        index={2}
        eyebrow="Winner reveal"
        headline="One song takes the crown."
        body="When the last track fades, the rankings are sealed — fire votes first, then replays, then how long each track held the room. One winner. Cinematic."
        visual={<WinnerOrb />}
        align="left"
        accent="#f59e0b"
      />

      {/* ══════════════════════════════════════════════════════════════════
          SCENE 7 — Metrics strip
      ══════════════════════════════════════════════════════════════════ */}
      <MetricsStrip />

      {/* ══════════════════════════════════════════════════════════════════
          SCENE 8 — Final cinematic CTA
      ══════════════════════════════════════════════════════════════════ */}
      <FinalCTA onCreateClick={handleCreateClick} onJoinClick={handleJoinClick} />
    </motion.div>
  );
}
