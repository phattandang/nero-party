import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, MotionValue, AnimatePresence } from "motion/react";
import { MusicNote, Users, Timer, ArrowRight, Sparkle, Queue, Fire, Trophy } from "@phosphor-icons/react";
import { createParty } from "../lib/api";
import SplitText from "../components/SplitText";
import { useMouseParallax } from "../hooks/useMouseParallax";
import { useMagnetic } from "../hooks/useMagnetic";

// ─── Deterministic waveform bar data (no Math.random to avoid render jitter) ──
const WAVEFORM_BARS = Array.from({ length: 52 }, (_, i) => ({
  id: i,
  heightPct: 12 + ((i * 17 + i * i * 3) % 58),
  opacity: 0.025 + ((i * 7) % 9) * 0.007,
  duration: 0.55 + ((i * 13) % 9) * 0.085,
  delay: ((i * 11) % 11) * 0.08,
}));

// ─── Concentric sonar rings ───────────────────────────────────────────────────
function ConcentricRings() {
  const sizes = [280, 420, 580, 740];
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {sizes.map((size, i) => (
        <div
          key={size}
          className="absolute rounded-full border border-white/[0.05] sonar"
          style={{
            width: size,
            height: size,
            animationDelay: `${i * 1.1}s`,
            animationDuration: `${4.5 + i * 0.6}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Full-width background waveform ──────────────────────────────────────────
function LargeWaveform() {
  return (
    <div className="absolute inset-x-0 bottom-0 flex items-end gap-[2px] px-0 h-[55%] pointer-events-none">
      {WAVEFORM_BARS.map((bar) => (
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
  );
}

// ─── Scroll indicator (traveling light on a line) ────────────────────────────
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
          style={{
            height: 28,
            background: "linear-gradient(to bottom, transparent, #FF9700 50%, transparent)",
          }}
          animate={{ y: ["-100%", "250%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear", repeatDelay: 0.1 }}
        />
      </div>
      <span className="text-[9px] uppercase tracking-[0.45em] text-white/20 font-medium">
        Scroll
      </span>
    </motion.div>
  );
}

// ─── Horizontal marquee strip ─────────────────────────────────────────────────
function MarqueeStrip() {
  const items = ["LISTEN", "VOTE", "REAL-TIME SYNC", "PARTY", "WIN THE NIGHT", "30s PREVIEWS", "LIVE QUEUE"];
  const repeated = [...items, ...items]; // doubled for seamless loop
  return (
    <div
      className="absolute left-0 right-0 overflow-hidden border-y border-white/[0.06]"
      style={{ bottom: "13%" }}
    >
      <div className="marquee-h flex items-center whitespace-nowrap" style={{ width: "max-content" }}>
        {repeated.map((item, i) => (
          <span key={i} className="inline-flex items-center">
            <span className="px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.3em] text-white/20">
              {item}
            </span>
            <span className="text-[#FF9700]/30 text-[10px]">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Transition zone — animated bridge between intro and hero ────────────────

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
  { icon: Queue,   label: "Live Queue",     delay: 0.1  },
  { icon: Fire,    label: "Blind Voting",   delay: 0.2  },
  { icon: Trophy,  label: "Winner Reveal",  delay: 0.3  },
];

function TransitionZone() {
  return (
    <div className="relative overflow-hidden" style={{ minHeight: "40dvh", paddingTop: "6dvh", paddingBottom: "6dvh" }}>
      {/* Floating music notes */}
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

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-8 px-4">
        {/* Glowing divider line */}
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

        {/* Feature pills row */}
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

        {/* Down-arrow scroll cue */}
        <motion.div
          className="flex flex-col items-center gap-1.5"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <span className="text-[9px] uppercase tracking-[0.45em] text-white/15 font-medium">
            Start your session
          </span>
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

// ─── Hero content (step=hero) ─────────────────────────────────────────────────
function HeroContent({
  onCreateClick,
  onJoinClick,
}: {
  onCreateClick: () => void;
  onJoinClick: () => void;
}) {
  const primaryMag = useMagnetic<HTMLButtonElement>(0.28);
  const secondaryMag = useMagnetic<HTMLButtonElement>(0.22);

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
              style={{
                background: "linear-gradient(135deg, #c9650022, #FF970011)",
                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15)",
              }}
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
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] font-medium text-white/50 mb-6">
          <Sparkle weight="fill" size={10} className="text-accent flicker" />
          Real-time listening parties
        </span>
      </motion.div>

      {/* Headline — SplitText word-by-word reveal */}
      <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
        <SplitText text="Music is better" initialDelay={0.2} wordDelay={0.08} />
        {" "}
        <motion.span
          initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + 3 * 0.08, duration: 0.65, ease: [0.32, 0.72, 0, 1] }}
          className="italic inline-block text-shimmer"
          style={{
            background: "linear-gradient(90deg, #FF9700, #ffb340, #c96500, #FF9700)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          together
        </motion.span>
      </h1>

      <motion.p
        initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true }}
        transition={{ delay: 0.45, duration: 0.65, ease: [0.32, 0.72, 0, 1] }}
        className="text-lg text-white/40 max-w-[52ch] leading-relaxed mb-12"
      >
        Create a party, invite your crew, add songs to the queue, and let the crowd pick the winner.
      </motion.p>

      {/* CTAs with magnetic effect */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.55, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-sm"
      >
        <button
          ref={primaryMag.ref}
          onMouseMove={primaryMag.onMouseMove}
          onMouseLeave={primaryMag.onMouseLeave}
          onClick={onCreateClick}
          className="group relative flex-1 flex items-center justify-center gap-3 rounded-full bg-[#FF9700] px-6 py-3.5 text-sm font-semibold text-white"
          style={{ boxShadow: "0 0 40px rgba(255, 151, 0, 0.4)" }}
        >
          Create a Party
          <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-px">
            <ArrowRight size={12} weight="bold" />
          </span>
        </button>
        <button
          ref={secondaryMag.ref}
          onMouseMove={secondaryMag.onMouseMove}
          onMouseLeave={secondaryMag.onMouseLeave}
          onClick={onJoinClick}
          className="flex-1 flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white/70 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/8 hover:text-white"
        >
          <Users size={15} />
          Join a Party
        </button>
      </motion.div>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="flex flex-wrap justify-center gap-2 mt-12"
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

// ─── Create form (step=create) ────────────────────────────────────────────────
function CreateForm({
  form,
  setForm,
  onBack,
  onSubmit,
  loading,
  error,
}: {
  form: { partyName: string; hostName: string; maxSongs: number; maxDuration: number };
  setForm: (f: typeof form) => void;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  error: string;
}) {
  return (
    <motion.div
      key="create"
      initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] } }}
      exit={{ opacity: 0, y: -20, filter: "blur(8px)", transition: { duration: 0.3 } }}
      className="w-full max-w-md"
    >
      <div className="rounded-[2rem] border border-white/10 p-1.5" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div className="rounded-[calc(2rem-0.375rem)] p-8" style={{ background: "rgba(10,10,15,0.9)", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)" }}>
          <button
            onClick={onBack}
            className="text-white/30 hover:text-white/60 text-xs font-medium mb-6 flex items-center gap-1.5 transition-colors duration-200"
          >
            ← Back
          </button>

          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] font-medium text-white/40 mb-3">
              New Party
            </span>
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
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#e07600]/50 focus:border-[#e07600]/50 transition-all duration-200"
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
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#e07600]/50 focus:border-[#e07600]/50 transition-all duration-200"
                style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MusicNote size={11} /> Max Songs
                </label>
                <select
                  value={form.maxSongs}
                  onChange={(e) => setForm({ ...form, maxSongs: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#e07600]/50 transition-all duration-200"
                >
                  {[10, 20, 30, 50].map((n) => <option key={n} value={n} className="bg-neutral-900">{n} songs</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Timer size={11} /> Duration
                </label>
                <select
                  value={form.maxDuration}
                  onChange={(e) => setForm({ ...form, maxDuration: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#e07600]/50 transition-all duration-200"
                >
                  {[30, 60, 90, 120].map((n) => <option key={n} value={n} className="bg-neutral-900">{n} min</option>)}
                </select>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400/80 text-xs text-center"
              >
                {error}
              </motion.p>
            )}

            <button
              onClick={onSubmit}
              disabled={loading}
              className="group w-full flex items-center justify-center gap-3 rounded-full bg-[#FF9700] px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#e07600] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ boxShadow: "0 0 40px rgba(255, 151, 0, 0.35)" }}
            >
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  Launch Party
                  <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-px">
                    <ArrowRight size={12} weight="bold" />
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"hero" | "create">("hero");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ partyName: "", hostName: "", maxSongs: 20, maxDuration: 60 });

  // ── Scroll-driven transforms ──────────────────────────────────────────────
  const { scrollY } = useScroll();

  // Smooth the raw scroll value slightly so transforms don't stutter
  const smoothY = useSpring(scrollY, { stiffness: 120, damping: 28, mass: 0.6 });

  // Intro section exits: fades, blurs, and lifts as user scrolls down
  const introOpacity = useTransform(smoothY, [0, 520], [1, 0]);
  const introY        = useTransform(smoothY, [0, 520], [0, -60]);
  const introBlurVal  = useTransform(smoothY, [0, 440], [0, 18]);
  const introFilter   = useTransform(introBlurVal, (v) => `blur(${v}px)`);

  // Headline words split apart horizontally (obys-style reveal)
  const negroX  = useTransform(smoothY, [60, 480], [0, -100]);
  const partyX  = useTransform(smoothY, [60, 480], [0, 100]);

  // Scroll cue vanishes after first scroll interaction
  const scrollCueOpacity = useTransform(smoothY, [0, 180], [1, 0]);

  // Hero section enters from below as intro exits
  const heroOpacity = useTransform(smoothY, [340, 700], [0, 1]);
  const heroY       = useTransform(smoothY, [340, 700], [64, 0]);
  const heroFilter  = useTransform(smoothY, [340, 650], ["blur(14px)", "blur(0px)"]);

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.35 } }}
      exit={{ opacity: 0, y: -20, filter: "blur(8px)", transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] } }}
      className="relative"
    >
      {/* ── Fixed ambient background orbs (parallax) ───────────────────────── */}
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

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1 — Cinematic intro (plain 100dvh — no sticky, no blank gap)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="h-[100dvh] overflow-hidden intro-fade-bottom relative">
        <motion.div
            style={{ opacity: introOpacity, y: introY, filter: introFilter }}
            className="relative h-full flex flex-col"
          >
            {/* Top bar */}
            <div className="absolute top-0 inset-x-0 flex items-center justify-between px-6 sm:px-10 h-14 z-10">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,151,0,0.15)", border: "1px solid rgba(255,151,0,0.2)" }}
                >
                  <MusicNote weight="fill" size={13} className="text-[#FF9700]" />
                </div>
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/50">
                  Nero Party
                </span>
              </div>
              <div className="flex items-center gap-5 text-[10px] uppercase tracking-[0.2em] text-white/20 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF9700] flicker" />
                  Live
                </span>
                <span className="hidden sm:block">Real-time sync</span>
                <span>2026</span>
              </div>
            </div>

            {/* Left vertical label */}
            <div className="absolute left-5 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] uppercase tracking-[0.45em] text-white/12 font-medium whitespace-nowrap hidden md:block">
              [ Music Party ]
            </div>
            {/* Right vertical label */}
            <div className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-[9px] uppercase tracking-[0.45em] text-white/12 font-medium whitespace-nowrap hidden md:block">
              Sync — Vote — Win
            </div>

            {/* Sonar rings (behind headline) */}
            <ConcentricRings />

            {/* Background waveform */}
            <LargeWaveform />

            {/* ── CENTER HEADLINE ────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10">

              {/* Small eyebrow */}
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.6, ease: [0.32, 0.72, 0, 1] } }}
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-white/25 font-medium mb-6"
              >
                <span
                  className="w-4 h-px"
                  style={{ background: "rgba(255,151,0,0.4)" }}
                />
                Est. 2026
                <span
                  className="w-4 h-px"
                  style={{ background: "rgba(255,151,0,0.4)" }}
                />
              </motion.span>

              {/* NERO — outline (stroke) text, splits LEFT on scroll */}
              <div className="overflow-hidden">
                <motion.div
                  style={{ x: negroX }}
                  initial={{ y: 80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1, transition: { delay: 0.05, duration: 0.9, ease: [0.32, 0.72, 0, 1] } }}
                >
                  <span
                    className="text-outline block font-extrabold leading-[0.88] tracking-tighter select-none"
                    style={{ fontSize: "clamp(72px, 18vw, 260px)" }}
                  >
                    NERO
                  </span>
                </motion.div>
              </div>

              {/* PARTY — filled white text, splits RIGHT on scroll */}
              <div className="overflow-hidden">
                <motion.div
                  style={{ x: partyX }}
                  initial={{ y: 80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1, transition: { delay: 0.18, duration: 0.9, ease: [0.32, 0.72, 0, 1] } }}
                >
                  <span
                    className="block font-extrabold leading-[0.88] tracking-tighter text-white select-none"
                    style={{ fontSize: "clamp(72px, 18vw, 260px)" }}
                  >
                    PARTY
                  </span>
                </motion.div>
              </div>

              {/* Sub-label below headline */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.55, duration: 0.8 } }}
                className="text-white/18 text-xs sm:text-sm font-medium tracking-[0.15em] uppercase mt-6"
              >
                Music is better together
              </motion.p>
            </div>

            {/* Marquee strip */}
            <MarqueeStrip />

            {/* Scroll indicator */}
            <ScrollIndicator opacity={scrollCueOpacity} />
          </motion.div>
      </div>
      {/* ═══ end SECTION 1 ══════════════════════════════════════════════════ */}

      {/* ── Animated transition zone between intro and hero ─────────────── */}
      <TransitionZone />

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2 — Hero (existing create/join UI)
          Fades + slides in as section 1 exits
      ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        style={{ opacity: heroOpacity, y: heroY, filter: heroFilter }}
        className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 pb-16"
      >
        <AnimatePresence mode="wait">
          {step === "hero" ? (
            <motion.div key="hero" className="w-full flex justify-center">
              <HeroContent
                onCreateClick={() => setStep("create")}
                onJoinClick={() => navigate("/join")}
              />
            </motion.div>
          ) : (
            <CreateForm
              key="create"
              form={form}
              setForm={setForm}
              onBack={() => setStep("hero")}
              onSubmit={handleCreate}
              loading={loading}
              error={error}
            />
          )}
        </AnimatePresence>
      </motion.div>
      {/* ═══ end SECTION 2 ══════════════════════════════════════════════════ */}
    </motion.div>
  );
}
