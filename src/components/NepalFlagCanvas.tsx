"use client";

import { useEffect, useRef } from "react";

/**
 * OPMCM-style wind-blown Nepal flag, ported verbatim from reference/script.js
 * (the same inline copy used on every app page, e.g. shop.html's own
 * <script> block) — same constants, same per-strip cloth-fold math, same
 * IntersectionObserver/visibilitychange/reduced-motion handling. Do not
 * "simplify" the animation math; it's intentionally hand-tuned.
 */
export default function NepalFlagCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const WIDTH = 450;
    const HEIGHT = 600;
    const FLAG_W = 330;
    const FLAG_H = 441;
    const PAD_X = 60;
    const PAD_Y = 78;

    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="110" height="147" viewBox="0 0 110 147">
        <path d="M 0.00,0.00 L 110.00,68.88 L 32.22,68.88 L 110.00,146.67 L 0.00,146.67 Z"
              fill="#B80F2F" stroke="#001F5B" stroke-width="3.5" stroke-linejoin="round"/>

        <g transform="translate(27.50,43.05)">
            <path d="M 22.27,-4.58 L 21.52,-4.79 L 20.33,-2.42 L 15.70,3.07 L 12.48,5.11 L 11.18,4.57 L 10.86,2.96 L 12.80,1.99 L 13.23,0.48 L 10.00,-0.05 L 10.21,-1.45 L 11.93,-4.36 L 7.74,-3.72 L 7.95,-7.81 L 6.34,-7.48 L 4.18,-5.87 L 2.89,-10.06 L 0.52,-7.05 L -0.23,-7.16 L -2.17,-9.74 L -3.78,-5.98 L -6.69,-7.81 L -7.98,-7.92 L -7.33,-7.59 L -7.33,-3.72 L -9.38,-3.61 L -11.10,-4.25 L -9.81,-0.05 L -13.04,0.59 L -12.93,1.56 L -10.89,3.18 L -11.64,5.33 L -13.04,5.00 L -15.62,3.07 L -18.43,0.16 L -20.90,-3.61 L -21.55,-3.61 L -20.68,1.77 L -17.99,6.51 L -14.87,9.95 L -10.24,13.30 L -3.46,15.34 L 1.93,15.56 L 9.89,13.73 L 14.74,10.39 L 20.23,3.50 L 22.16,-2.42 Z"
                  fill="#FFFFFF"/>
        </g>

        <path d="M 27.50,131.32 L 23.64,122.20 L 15.73,128.16 L 16.94,118.33 L 7.11,119.55 L 13.08,111.64 L 3.96,107.78 L 13.08,103.91 L 7.11,96.01 L 16.94,97.22 L 15.73,87.39 L 23.64,93.35 L 27.50,84.24 L 31.36,93.35 L 39.27,87.39 L 38.06,97.22 L 47.89,96.01 L 41.92,103.91 L 51.04,107.78 L 41.92,111.64 L 47.89,119.55 L 38.06,118.33 L 39.27,128.16 L 31.36,122.20 Z"
              fill="#FFFFFF"/>
    </svg>`;

    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = WIDTH;
    sourceCanvas.height = HEIGHT;
    const sourceCtx = sourceCanvas.getContext("2d", { alpha: true });
    if (!sourceCtx) return;
    sourceCtx.imageSmoothingEnabled = false;

    let rafId: number | null = null;
    let inView = true;
    let cancelled = false;

    function drawFlag(time: number) {
      if (!ctx) return;
      const t = time * 0.001;
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.save();
      ctx.translate(PAD_X, PAD_Y);

      const strip = 3;
      for (let x = 0; x < FLAG_W; x += strip) {
        const u = x / FLAG_W;
        const strength = Math.pow(u, 1.45);
        const wave1 = Math.sin(u * Math.PI * 1.55 - t * 4.0);
        const wave2 = Math.sin(u * Math.PI * 3.1 - t * 4.0 + 1.15);
        const yWave = strength * (wave1 * 34 + wave2 * 8);
        const xWave = strength * Math.sin(u * Math.PI * 1.35 - t * 3.0 + 0.55) * 15;
        const slope =
          Math.cos(u * Math.PI * 1.55 - t * 4.0) * strength * 0.16 +
          Math.cos(u * Math.PI * 3.1 - t * 4.0 + 1.15) * strength * 0.035;
        const sourceWidth = Math.min(strip + 1, FLAG_W - x);

        ctx.save();
        ctx.translate(x + xWave, yWave);
        ctx.transform(1, slope, 0, 1, 0, 0);
        ctx.drawImage(
          sourceCanvas,
          PAD_X + x,
          0,
          sourceWidth,
          HEIGHT,
          -0.5,
          0,
          sourceWidth + 1,
          HEIGHT,
        );
        ctx.restore();
      }

      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = "source-atop";
      ctx.globalAlpha = 0.075;
      const shadeGradient = ctx.createLinearGradient(PAD_X, 0, PAD_X + FLAG_W, 0);
      shadeGradient.addColorStop(0, "rgba(0,0,0,0)");
      shadeGradient.addColorStop(0.35, "rgba(0,0,0,0.18)");
      shadeGradient.addColorStop(0.52, "rgba(255,255,255,0.10)");
      shadeGradient.addColorStop(0.72, "rgba(0,0,0,0.15)");
      shadeGradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = shadeGradient;
      ctx.fillRect(PAD_X, PAD_Y, FLAG_W, FLAG_H);
      ctx.restore();
    }

    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function renderLoop(time: number) {
      drawFlag(time);
      rafId = requestAnimationFrame(renderLoop);
    }

    function play() {
      if (rafId !== null || reduceMotionQuery.matches) return;
      rafId = requestAnimationFrame(renderLoop);
    }

    function pause() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    function startAnimation() {
      if (reduceMotionQuery.matches) {
        drawFlag(0);
      } else {
        play();
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries[0].isIntersecting;
        if (inView && !document.hidden) {
          play();
        } else {
          pause();
        }
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    function onVisibilityChange() {
      if (document.hidden) {
        pause();
      } else if (inView) {
        play();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    function onReduceMotionChange(e: MediaQueryListEvent) {
      if (e.matches) {
        pause();
        drawFlag(0);
      } else if (inView) {
        play();
      }
    }
    reduceMotionQuery.addEventListener("change", onReduceMotionChange);

    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (cancelled) return;
      sourceCtx.clearRect(0, 0, WIDTH, HEIGHT);
      sourceCtx.drawImage(img, PAD_X, PAD_Y, FLAG_W, FLAG_H);
      startAnimation();
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

    return () => {
      cancelled = true;
      pause();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reduceMotionQuery.removeEventListener("change", onReduceMotionChange);
    };
  }, []);

  return <canvas ref={canvasRef} id="navNepalFlag" className="nav-nepal-flag" width={450} height={600} />;
}
