import { motion } from "motion/react";
import { Plus, Users } from "@phosphor-icons/react";
import { MotionText } from "./MotionText";
import { PremiumButton } from "./PremiumButton";

interface Props {
  onCreateClick: () => void;
  onJoinClick: () => void;
}

/**
 * Cinematic closing CTA section.
 * Full-viewport atmospheric composition. Text headline uses MotionText reveal.
 * Two action buttons. Intentionally minimal — let the moment breathe.
 */
export function FinalCTA({ onCreateClick, onJoinClick }: Props) {
  return (
    <section className="relative min-h-[90dvh] flex flex-col items-center justify-center px-6 py-28 overflow-hidden">

      {/* Layered atmospheric background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Radial warm wash */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 65%, rgba(255,151,0,0.07), transparent 55%)" }} />
        {/* Ambient orbs */}
        <div
          className="glow-pulse absolute rounded-full"
          style={{ width: 500, height: 500, top: "15%", left: "15%", background: "rgba(255,151,0,0.04)", filter: "blur(120px)" }}
        />
        <div
          className="glow-pulse absolute rounded-full"
          style={{ width: 400, height: 400, bottom: "10%", right: "10%", background: "rgba(201,101,0,0.04)", filter: "blur(100px)", animationDelay: "1.6s" }}
        />
      </div>

      {/* Top hairline */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent)" }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">

        {/* Eyebrow pill */}
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.94 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-[10px] uppercase tracking-[0.28em] font-semibold text-white/35">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF9700]/70 flicker" />
            The party is ready
          </span>
        </motion.div>

        {/* Headline — two lines, clip-path reveal */}
        <div className="mb-12">
          <MotionText
            as="h2"
            className="block text-5xl sm:text-6xl lg:text-[4.5rem] font-extrabold tracking-[-0.025em] leading-[1.0]"
            stagger={0.06}
            delay={0.08}
          >
            Ready to drop
          </MotionText>
          {/* Italic gradient line */}
          <div style={{ overflow: "hidden", paddingBottom: "0.06em" }}>
            <motion.span
              className="block text-5xl sm:text-6xl lg:text-[4.5rem] font-extrabold tracking-[-0.025em] leading-[1.0] italic text-shimmer"
              style={{
                background: "linear-gradient(90deg, #FF9700, #ffb340, #c96500, #FF9700)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
              }}
              initial={{ y: "115%", opacity: 0 }}
              whileInView={{ y: "0%", opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 + 4 * 0.06, duration: 0.88, ease: [0.16, 1, 0.3, 1] }}
            >
              the beat?
            </motion.span>
          </div>
        </div>

        {/* Sub-copy */}
        <motion.p
          className="text-[0.95rem] text-white/28 max-w-[44ch] leading-[1.8] mb-12"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Create a room in 10 seconds. Share a 6-digit code. Let the music — and the crowd — decide the rest.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <PremiumButton onClick={onCreateClick}>
            <Plus size={13} weight="bold" />
            Create a Party
          </PremiumButton>
          <PremiumButton variant="ghost" onClick={onJoinClick}>
            <Users size={13} />
            Join a Party
          </PremiumButton>
        </motion.div>
      </div>
    </section>
  );
}
