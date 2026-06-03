import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { MusicNote, Users, Timer, ArrowRight, Sparkle } from "@phosphor-icons/react";
import { createParty } from "../lib/api";

const FADE_UP = {
  hidden: { opacity: 0, y: 32, filter: "blur(8px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] },
  }),
};

export default function Home() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"hero" | "create">("hero");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    partyName: "",
    hostName: "",
    maxSongs: 20,
    maxDuration: 60,
  });

  async function handleCreate() {
    if (!form.partyName.trim() || !form.hostName.trim()) {
      setError("Fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { party, participant } = await createParty({
        name: form.partyName,
        hostName: form.hostName,
        maxSongs: form.maxSongs,
        maxDuration: form.maxDuration,
      });
      localStorage.setItem("participantId", participant.id);
      localStorage.setItem("partyCode", party.code);
      navigate(`/party/${party.code}`);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden px-4">
      {/* Ambient background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="glow-pulse absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="glow-pulse absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-purple-500/8 blur-[100px]" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-violet-900/5 blur-[160px]" />
      </div>

      {step === "hero" ? (
        <motion.div
          key="hero"
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, y: -20, filter: "blur(8px)", transition: { duration: 0.4 } }}
          className="flex flex-col items-center text-center max-w-2xl w-full"
        >
          {/* Logo mark */}
          <motion.div custom={0} variants={FADE_UP} className="mb-10">
            <div className="relative inline-flex">
              <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 p-1.5 float">
                <div
                  className="w-full h-full rounded-[calc(2rem-0.375rem)] flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed22, #a78bfa11)",
                    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15)",
                  }}
                >
                  <MusicNote weight="fill" className="text-accent" size={36} />
                </div>
              </div>
              <div className="absolute -inset-3 rounded-[2.5rem] bg-violet-500/10 blur-xl" />
            </div>
          </motion.div>

          {/* Eyebrow */}
          <motion.div custom={1} variants={FADE_UP}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] font-medium text-white/50 mb-6">
              <Sparkle weight="fill" size={10} className="text-accent" />
              Real-time listening parties
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            custom={2}
            variants={FADE_UP}
            className="text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.0] mb-6"
          >
            Music is better{" "}
            <span
              className="italic"
              style={{
                background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              together
            </span>
          </motion.h1>

          <motion.p
            custom={3}
            variants={FADE_UP}
            className="text-lg text-white/40 max-w-[52ch] leading-relaxed mb-12"
          >
            Create a party, invite your crew, add songs to the queue, and let the crowd pick the winner.
          </motion.p>

          {/* CTAs */}
          <motion.div custom={4} variants={FADE_UP} className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            <button
              onClick={() => setStep("create")}
              className="group relative flex-1 flex items-center justify-center gap-3 rounded-full bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-violet-500 active:scale-[0.98]"
              style={{ boxShadow: "0 0 40px rgba(124, 58, 237, 0.4)" }}
            >
              Create a Party
              <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-px">
                <ArrowRight size={12} weight="bold" />
              </span>
            </button>
            <button
              onClick={() => navigate("/join")}
              className="flex-1 flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white/70 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/8 hover:text-white active:scale-[0.98]"
            >
              <Users size={15} />
              Join a Party
            </button>
          </motion.div>

          {/* Feature pills */}
          <motion.div custom={5} variants={FADE_UP} className="flex flex-wrap justify-center gap-2 mt-12">
            {["Real-time sync", "Blind voting", "30s previews", "Live queue", "Winner reveal"].map((f) => (
              <span key={f} className="rounded-full border border-white/8 bg-white/3 px-3 py-1 text-[11px] text-white/30 font-medium">
                {f}
              </span>
            ))}
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="create"
          initial={{ opacity: 0, y: 32, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] } }}
          exit={{ opacity: 0, y: -20, filter: "blur(8px)", transition: { duration: 0.3 } }}
          className="w-full max-w-md"
        >
          {/* Card outer shell */}
          <div
            className="rounded-[2rem] border border-white/10 p-1.5"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            {/* Card inner */}
            <div
              className="rounded-[calc(2rem-0.375rem)] p-8"
              style={{
                background: "rgba(10,10,15,0.9)",
                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)",
              }}
            >
              {/* Back */}
              <button
                onClick={() => setStep("hero")}
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
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
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
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                    style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)" }}
                  />
                </div>

                {/* Config row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <MusicNote size={11} />
                      Max Songs
                    </label>
                    <select
                      value={form.maxSongs}
                      onChange={(e) => setForm({ ...form, maxSongs: Number(e.target.value) })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all duration-200"
                    >
                      {[10, 20, 30, 50].map((n) => <option key={n} value={n} className="bg-neutral-900">{n} songs</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Timer size={11} />
                      Duration
                    </label>
                    <select
                      value={form.maxDuration}
                      onChange={(e) => setForm({ ...form, maxDuration: Number(e.target.value) })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all duration-200"
                    >
                      {[30, 60, 90, 120].map((n) => <option key={n} value={n} className="bg-neutral-900">{n} min</option>)}
                    </select>
                  </div>
                </div>

                {error && (
                  <p className="text-red-400/80 text-xs text-center">{error}</p>
                )}

                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="group w-full flex items-center justify-center gap-3 rounded-full bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-violet-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  style={{ boxShadow: "0 0 40px rgba(124, 58, 237, 0.35)" }}
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
      )}
    </div>
  );
}
