"use client";

import { useEffect, useRef, useState } from "react";
import { useServer } from "@/lib/server-store";

const GLYPHS = "0123456789abcdef{}[]<>/=#$%&*";

/**
 * Texto que chega "como pacote": embaralha em hex e decodifica quando entra na tela.
 * `ghostId` permite que o fantasma do GhostWriter reescreva esse texto.
 */
export function DecodeText({
  text,
  ghostId,
  className,
}: {
  text: string;
  ghostId?: string;
  className?: string;
}) {
  const ghost = useServer((s) =>
    ghostId && s.ghost?.target === ghostId ? s.ghost.text : null,
  );
  const target = ghost ?? text;
  const [shown, setShown] = useState(text);
  const [seen, setSeen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!seen) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const start = performance.now();
    const duration = reduced ? 0 : 700;
    let raf = 0;
    const tick = (now: number) => {
      const p = duration ? Math.min(1, (now - start) / duration) : 1;
      const fixed = Math.floor(p * target.length);
      let out = target.slice(0, fixed);
      for (let i = fixed; i < target.length; i++) {
        out +=
          target[i] === " "
            ? " "
            : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      setShown(out);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, target]);

  return (
    <span
      ref={ref}
      className={`${className ?? ""} ${ghost ? "text-violet glow" : ""}`}
      aria-label={target}
    >
      <span aria-hidden>{shown}</span>
    </span>
  );
}
