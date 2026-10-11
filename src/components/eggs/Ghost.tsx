"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { findBug, setGhost, useServer } from "@/lib/server-store";

// O fantasminha do GhostWriter atravessa a tela de tempos em tempos e
// reescreve o título que estiver à vista. Clicar nele conta como bug.

const REWRITES: Record<string, string> = {
  "title-services": "Mapa de assombração",
  "title-about": "Sobre o fantasma",
  "title-contact": "Fale com o além",
  "title-hero": "Boo.",
};

function visibleTarget() {
  const ids = Object.keys(REWRITES).filter((id) => {
    const el = document.querySelector(`[data-ghost="${id}"]`);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.top > 60 && r.bottom < window.innerHeight - 40;
  });
  return ids[Math.floor(Math.random() * ids.length)];
}

export function Ghost() {
  const booted = useServer((s) => s.booted);
  const [flying, setFlying] = useState(false);
  const [caught, setCaught] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!booted) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = (delay: number) => {
      timer = setTimeout(() => setFlying(true), delay);
    };
    schedule(14000);
    const onLand = () => schedule(35000 + Math.random() * 35000);
    window.addEventListener("ghost:landed", onLand);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("ghost:landed", onLand);
    };
  }, [booted]);

  useEffect(() => {
    const el = ref.current;
    if (!flying || !el) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ltr = Math.random() < 0.5;
    const y = h * (0.25 + Math.random() * 0.45);
    const target = visibleTarget();
    let restore: ReturnType<typeof setTimeout> | undefined;

    const tl = gsap.timeline({
      onComplete: () => {
        setFlying(false);
        setCaught(false);
        window.dispatchEvent(new Event("ghost:landed"));
      },
    });
    tl.set(el, { x: ltr ? -80 : w + 20, y, opacity: 0, scaleX: ltr ? 1 : -1 });
    tl.to(el, { opacity: 0.9, duration: 0.4 });
    tl.to(el, { x: ltr ? w + 20 : -80, duration: 7, ease: "none" }, 0);
    tl.to(
      el,
      { y: y - 40, duration: 1.2, yoyo: true, repeat: 5, ease: "sine.inOut" },
      0,
    );
    tl.call(
      () => {
        if (!target) return;
        setGhost({ target, text: REWRITES[target] });
        restore = setTimeout(() => setGhost(null), 4500);
      },
      undefined,
      2.6,
    );

    return () => {
      tl.kill();
      if (restore) clearTimeout(restore);
    };
  }, [flying]);

  if (!flying) return null;

  return (
    <button
      ref={ref}
      type="button"
      aria-label="Fantasma do GhostWriter"
      onClick={() => {
        setCaught(true);
        findBug("ghost");
        setGhost(null);
        gsap.to(ref.current, {
          scale: 2,
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
        });
      }}
      className="fixed top-0 left-0 z-[60] cursor-pointer"
      style={{ opacity: 0 }}
    >
      <svg
        width="46"
        height="52"
        viewBox="0 0 46 52"
        className="drop-shadow-[0_0_14px_rgba(167,139,250,0.9)]"
      >
        <path
          d="M23 2C11 2 3 11 3 23v27l7-6 6 6 7-6 7 6 6-6 7 6V23C43 11 35 2 23 2z"
          fill="rgba(230,225,255,0.92)"
        />
        <circle cx="16" cy="22" r="3.2" fill="#05070b" />
        <circle cx="30" cy="22" r="3.2" fill="#05070b" />
        <ellipse cx="23" cy="32" rx="4" ry={caught ? 5 : 2.4} fill="#05070b" />
      </svg>
      {caught && (
        <span className="absolute -top-5 left-8 font-mono text-xs text-violet">
          boo!
        </span>
      )}
    </button>
  );
}
