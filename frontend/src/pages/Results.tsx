import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Crown, Fire, MusicNote, Trophy, ArrowRight } from "@phosphor-icons/react";
import type { RankedItem } from "../lib/types";

// ─── Confetti particle ────────────────────────────────────────────────────────

function ConfettiPiece({ delay, x, color }: { delay: number; x: number; color: string }) {
  return (
    <motion.div
      className="fixed pointer-events-none w-2 h-2 rounded-sm"
      style={{ left: `${x}%`, top: -8, background: color, zIndex: 100 }}
      initial={{ y: 0, rotate: 0, opacity: 1 }}
      animate={{
        y: window.innerHeight + 20,
        rotate: 720 + Math.random() * 360,
        opacity: [1, 1, 1, 0],
        x: (Math.random() - 0.5) * 200,
      }}
      transition={{ duration: 3 + Math.random() * 2, delay, ease: "linear" }}
    />
  );
}

function Confetti({ active }: { active: boolean }) {
  const pieces = useRef(
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      delay: Math.random() * 2,
      x: Math.random() * 100,
      color: ["#a78bfa", "#f59e0b", "#f472b6", "#34d399", "#60a5fa", "#fb923c"][Math.floor(Math.random() * 6)],
    }))
  );

  if (!active) return null;
  return (
    <>
      {pieces.current.map((p) => (
        <ConfettiPiece key={p.id} delay={p.delay} x={p.x} color={p.color} />
      ))}
    </>
  );
}

// ─── Winner Card ──────────────────────────────────────────────────────────────

function WinnerCard({ item }: { item: RankedItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.9, ease: [0.32, 0.72, 0, 1] } }}
      className="relative w-full max-w-sm mx-auto"
    >
      {/* Crown */}
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.5 }}
        animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: 0.5, duration: 0.6, type: "spring", stiffness: 200 } }}
        className="absolute -top-8 left-1/2 -translate-x-1/2 z-20"
      >
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "radial-gradient(circle, #f59e0b33, transparent)" }}>
          <Crown size={32} weight="fill" className="text-yellow-400 drop-shadow-[0_0_16px_rgba(245,158,11,0.8)]" />
        </div>
      </motion.div>

      {/* Card glow */}
      <div className="absolute inset-0 rounded-[2rem] blur-2xl opacity-40" style={{ background: "linear-gradient(135deg, #7c3aed, #f59e0b)" }} />

      {/* Outer shell */}
      <div className="relative rounded-[2rem] p-[2px]" style={{ background: "linear-gradient(135deg, #a78bfa, #f59e0b)" }}>
        <div className="rounded-[calc(2rem-2px)] overflow-hidden" style={{ background: "rgba(8,8,12,0.95)" }}>
          {/* Album art background */}
          {item.albumArt && (
            <div
              className="absolute inset-0 opacity-25"
              style={{ backgroundImage: `url(${item.albumArt})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(30px) saturate(1.5)" }}
            />
          )}
          <div className="relative z-10 p-8 pt-10 text-center">
            {item.albumArt ? (
              <div className="mx-auto w-32 h-32 rounded-[1.5rem] border-2 border-white/20 overflow-hidden mb-6 shadow-[0_0_40px_rgba(167,139,250,0.3)]">
                <img src={item.albumArt} alt={item.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="mx-auto w-32 h-32 rounded-[1.5rem] bg-white/5 flex items-center justify-center mb-6">
                <MusicNote size={40} className="text-white/20" />
              </div>
            )}
            <h2 className="text-3xl font-extrabold tracking-tight mb-1 leading-tight">{item.title}</h2>
            <p className="text-white/50 mb-5">{item.artist}</p>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-orange-500/30 bg-orange-500/15 px-5 py-2.5">
              <Fire size={18} weight="fill" className="text-orange-400" />
              <span className="text-lg font-bold text-orange-300">{item.voteCount}</span>
              <span className="text-orange-400/60 text-sm">fire votes</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Leaderboard Row ──────────────────────────────────────────────────────────

function LeaderboardRow({ item, rank, delay }: { item: RankedItem; rank: number; delay: number }) {
  const medals = ["🥈", "🥉"];

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0, transition: { delay, duration: 0.5, ease: [0.32, 0.72, 0, 1] } }}
      className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/3 px-4 py-3.5 hover:bg-white/5 transition-colors duration-200"
    >
      <span className="text-xl w-7 text-center flex-shrink-0">{medals[rank - 2] ?? `#${rank}`}</span>
      {item.albumArt ? (
        <img src={item.albumArt} alt={item.title} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
          <MusicNote size={14} className="text-white/20" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{item.title}</p>
        <p className="text-xs text-white/40 truncate">{item.artist}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Fire size={13} weight="fill" className="text-orange-400/60" />
        <span className="text-sm font-bold text-white/60">{item.voteCount}</span>
      </div>
    </motion.div>
  );
}

// ─── Results Page ─────────────────────────────────────────────────────────────

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  useParams<{ code: string }>();

  const results: RankedItem[] = location.state?.results ?? [];
  const [revealed, setRevealed] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const winner = results[0];
  const rest = results.slice(1);

  useEffect(() => {
    const t1 = setTimeout(() => setRevealed(true), 600);
    const t2 = setTimeout(() => setShowLeaderboard(true), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!winner) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-white/30 mb-4">No results available</p>
          <button onClick={() => navigate("/")} className="text-violet-400 text-sm hover:text-violet-300 transition-colors">
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden pb-16">
      {/* Confetti */}
      <Confetti active={revealed} />

      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 60%)" }} />
        <div className="glow-pulse absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-600/6 blur-[120px]" />
        <div className="glow-pulse absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-yellow-500/5 blur-[100px]" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 pt-16 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] } }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 mb-6">
            <Trophy size={14} className="text-yellow-400" weight="fill" />
            <span className="text-xs uppercase tracking-widest font-semibold text-yellow-400">Party Over</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-none mb-3">
            The crowd{" "}
            <span className="italic" style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              has spoken
            </span>
          </h1>
          <p className="text-white/35 text-lg">Here's what the fire votes decided</p>
        </motion.div>

        {/* Winner reveal */}
        <AnimatePresence>
          {revealed && (
            <div className="w-full mb-12 px-4">
              <WinnerCard item={winner} />
            </div>
          )}
        </AnimatePresence>

        {/* Leaderboard */}
        <AnimatePresence>
          {showLeaderboard && rest.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] } }}
              className="w-full"
            >
              <p className="text-xs text-white/30 uppercase tracking-widest font-medium mb-3 flex items-center gap-2">
                <Fire size={11} weight="fill" className="text-orange-400/50" />
                Full Rankings
              </p>
              <div className="space-y-2">
                {rest.map((item, i) => (
                  <LeaderboardRow key={item.id} item={item} rank={i + 2} delay={i * 0.08} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        {showLeaderboard && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { delay: rest.length * 0.08 + 0.3, duration: 0.5 } }}
            className="mt-12"
          >
            <button
              onClick={() => navigate("/")}
              className="group flex items-center gap-3 rounded-full bg-violet-600 px-8 py-4 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-violet-500 active:scale-[0.98]"
              style={{ boxShadow: "0 0 40px rgba(124, 58, 237, 0.4)" }}
            >
              Throw Another Party
              <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-px">
                <ArrowRight size={12} weight="bold" />
              </span>
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
