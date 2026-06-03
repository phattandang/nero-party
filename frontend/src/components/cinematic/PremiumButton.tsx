import { useRef, useCallback } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  icon?: boolean;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}

/**
 * Premium CTA button with magnetic pull and shimmer-sweep hover effect.
 * Primary: orange fill with glow. Ghost: translucent with border.
 */
export function PremiumButton({
  children,
  onClick,
  variant = "primary",
  icon = true,
  disabled = false,
  className = "",
  type = "button",
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);

  const onMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el || disabled) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.22;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.22;
    el.style.transform = `translate(${dx}px, ${dy}px)`;
    el.style.transition = "transform 0.08s linear";
  }, [disabled]);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate(0, 0)";
    el.style.transition = "transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)";
  }, []);

  const base = "group relative flex items-center gap-3 rounded-full text-sm font-semibold overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed";

  if (variant === "ghost") {
    return (
      <motion.button
        ref={ref}
        type={type}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onClick={onClick}
        disabled={disabled}
        whileTap={{ scale: 0.96 }}
        className={`${base} border border-white/12 bg-white/[0.04] px-7 py-4 text-white/60 transition-colors duration-300 hover:bg-white/8 hover:text-white hover:border-white/20 ${className}`}
      >
        {children}
        {icon && (
          <span className="w-6 h-6 rounded-full bg-white/8 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-px flex-shrink-0">
            <ArrowRight size={11} weight="bold" />
          </span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.96 }}
      className={`${base} bg-[#FF9700] px-7 py-4 text-white ${className}`}
      style={{ boxShadow: "0 0 48px rgba(255,151,0,0.38), 0 2px 12px rgba(0,0,0,0.25)" }}
    >
      {/* Shimmer sweep on hover */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-white/20"
        style={{ skewX: "-20deg" }}
        initial={false}
        whileHover={{ translateX: "250%" }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      />
      <span className="relative z-10 flex items-center gap-3">
        {children}
        {icon && (
          <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-px flex-shrink-0">
            <ArrowRight size={11} weight="bold" />
          </span>
        )}
      </span>
    </motion.button>
  );
}
