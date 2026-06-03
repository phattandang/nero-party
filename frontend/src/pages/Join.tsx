import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Hash } from "@phosphor-icons/react";
import { joinParty } from "../lib/api";

export default function Join() {
  const navigate = useNavigate();
  const { code: urlCode } = useParams<{ code?: string }>();
  const [code, setCode] = useState(urlCode || "");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin() {
    if (!code.trim() || !name.trim()) {
      setError("Enter the party code and your name");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { party, participant } = await joinParty(code.trim(), name.trim());
      localStorage.setItem("participantId", participant.id);
      localStorage.setItem("partyCode", party.code);
      navigate(`/party/${party.code}`);
    } catch {
      setError("Party not found or has already ended");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="glow-pulse absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#FF9700]/8 blur-[120px]" />
        <div className="glow-pulse absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-fuchsia-500/6 blur-[100px]" style={{ animationDelay: "1s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] } }}
        className="w-full max-w-sm"
      >
        <div className="rounded-[2rem] border border-white/10 p-1.5" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="rounded-[calc(2rem-0.375rem)] p-8" style={{ background: "rgba(10,10,15,0.95)", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)" }}>
            <button
              onClick={() => navigate("/")}
              className="text-white/30 hover:text-white/60 text-xs font-medium mb-6 flex items-center gap-1.5 transition-colors duration-200"
            >
              ← Back
            </button>

            <div className="mb-8">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] font-medium text-white/40 mb-3">
                Join Party
              </span>
              <h2 className="text-3xl font-bold tracking-tight">Get in the room</h2>
              <p className="text-white/40 text-sm mt-1.5">Enter the code your host shared with you</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Hash size={11} />
                  Party Code
                </label>
                <input
                  type="text"
                  placeholder="ABC123"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#e07600]/50 focus:border-[#e07600]/50 transition-all duration-200 font-mono tracking-widest uppercase"
                  style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)" }}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 block">Your Name</label>
                <input
                  type="text"
                  placeholder="Your display name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#e07600]/50 focus:border-[#e07600]/50 transition-all duration-200"
                  style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)" }}
                />
              </div>

              {error && <p className="text-red-400/80 text-xs text-center">{error}</p>}

              <button
                onClick={handleJoin}
                disabled={loading}
                className="group w-full flex items-center justify-center gap-3 rounded-full bg-[#FF9700] px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#e07600] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                style={{ boxShadow: "0 0 40px rgba(255, 151, 0, 0.35)" }}
              >
                {loading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    Join Party
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
    </div>
  );
}
