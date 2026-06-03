/**
 * MusicVisualizer — animated audio-spectrum background using Canvas 2D.
 *
 * Reference techniques adapted (without WebGPU/Three.js):
 *  - Per-column frequency via layered sine waves (same math as GLSL version)
 *  - Cellular dot matrix: per-cell brightness seeded deterministically
 *  - Cap glow via radial gradient at bar peak (equiv. to depth-edge bloom)
 *  - ctx.globalCompositeOperation = "lighter" → additive blending = free bloom
 *
 * Why Canvas 2D instead of Three.js:
 *  - No white flash before WebGL context initializes
 *  - No 897 KB lazy chunk — canvas is built-in
 *  - No WebGL context limits, works everywhere
 *  - Same visual result for a 2D shader-like effect
 */

import { useRef, useEffect } from "react";

// Linear interpolation
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// Deterministic per-cell brightness (like reference's cellBrightness / mx_cell_noise)
function cellBrightness(col: number, row: number): number {
  return 0.45 + Math.abs(Math.sin(col * 13.7 + row * 7.3)) * 0.55;
}

interface Props {
  className?: string;
}

export function MusicVisualizer({ className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const startMs = performance.now();
    let animId: number;
    let mouseX = 0.5;
    let running = true;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX / window.innerWidth;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    // Resize canvas resolution to match CSS size × device pixel ratio
    function resize() {
      const c = canvasRef.current;
      if (!c) return;
      const pr = window.devicePixelRatio || 1;
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (w > 0 && h > 0) {
        c.width  = w * pr;
        c.height = h * pr;
      }
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const NUM_BARS = 54;
    const DOT_ROWS = 14;

    function frame() {
      if (!running) return;
      // Re-assert non-null inside closure so TypeScript is happy
      const c2  = canvasRef.current;
      const ctx2 = c2?.getContext("2d");
      if (!c2 || !ctx2) { animId = requestAnimationFrame(frame); return; }

      const t  = (performance.now() - startMs) / 1000;
      const W  = c2.width;
      const H  = c2.height;

      // Don't draw if canvas isn't sized yet
      if (W === 0 || H === 0) {
        animId = requestAnimationFrame(frame);
        return;
      }

      // Fade in over first 1.8 s
      const globalOp = Math.min(1.0, t / 1.8);

      ctx2.clearRect(0, 0, W, H);
      // "lighter" = additive blending — overlapping oranges glow brighter (free bloom)
      ctx2.globalCompositeOperation = "lighter";

      const barW = W / NUM_BARS;
      const dotR = barW * 0.20; // smaller dots = less visual weight

      for (let i = 0; i < NUM_BARS; i++) {
        // Multi-layered sine waves per bar column — same math as the GLSL shader
        const freq =
          0.42
          + Math.sin(i * 0.21 + t * 1.35) * 0.15
          + Math.sin(i * 0.54 + t * 0.76) * 0.11
          + Math.sin(i * 1.07 + t * 2.08) * 0.07
          + Math.sin(i * 0.09 + t * 0.42) * 0.07;

        // Mouse proximity lift (interactive)
        const mDist  = Math.abs(mouseX - i / NUM_BARS);
        const mBoost = Math.max(0, 0.18 - mDist * 2.0);
        const barFreq = Math.min(0.92, Math.max(0.04, freq + mBoost));

        const barPx  = barFreq * H;          // bar height in pixels
        const barTop = H - barPx;            // y of bar top edge
        const barX   = i * barW;

        // ── Dot matrix on bar body ────────────────────────────────────────
        for (let row = 0; row < DOT_ROWS; row++) {
          // Dot center, bottom-up
          const dotCY = H - ((row + 0.5) / DOT_ROWS) * H;
          if (dotCY < barTop) continue;     // above bar — not active

          const dotCX   = barX + barW * 0.5;
          const posFrac = (dotCY - barTop) / barPx;   // 0=cap, 1=base
          const tColor  = 1.0 - posFrac;              // 0=base, 1=cap

          // Nero Party palette: deep charcoal-orange → #FF9700 → bright gold
          let r: number, g: number, b: number;
          if (tColor < 0.55) {
            const p = tColor / 0.55;
            r = lerp(90,  255, p);
            g = lerp(26,  151, p);
            b = 0;
          } else {
            const p = (tColor - 0.55) / 0.45;
            r = 255;
            g = lerp(151, 222, p);
            b = lerp(0,   80,  p);
          }

          // Deterministic per-cell brightness (no flicker between frames)
          const bright = cellBrightness(i, row);
          const alpha  = bright * 0.22 * globalOp; // reduced — ambient, not dominant

          ctx2.fillStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha.toFixed(3)})`;
          ctx2.beginPath();
          ctx2.arc(dotCX, dotCY, dotR, 0, Math.PI * 2);
          ctx2.fill();
        }

        // ── Cap glow — radial gradient at bar top (reference's edge bloom) ─
        const gx = barX + barW / 2;
        const gy = barTop;
        const gr = barW * 2.2;
        const glow = ctx2.createRadialGradient(gx, gy, 0, gx, gy, gr);
        glow.addColorStop(0,   `rgba(255,222,77,${(0.14 * globalOp).toFixed(3)})`);
        glow.addColorStop(0.4, `rgba(255,151,0,${(0.05 * globalOp).toFixed(3)})`);
        glow.addColorStop(1,   "rgba(255,80,0,0)");
        ctx2.fillStyle = glow;
        ctx2.fillRect(barX, gy - gr, barW, gr * 2);
      }

      ctx2.globalCompositeOperation = "source-over"; // restore default
      animId = requestAnimationFrame(frame);
    }

    frame();

    return () => {
      running = false;
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMove);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none select-none ${className}`}
      style={{ display: "block" }}
    />
  );
}
