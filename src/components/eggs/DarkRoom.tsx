"use client";

import { useEffect, useRef } from "react";
import { setDark, useServer } from "@/lib/server-store";

/** Modo manutenção: a página apaga e só a "lanterna" do cursor ilumina. */
export function DarkRoom() {
  const dark = useServer((s) => s.dark);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dark) return;
    const el = ref.current;
    const move = (x: number, y: number) => {
      el?.style.setProperty("--x", `${x}px`);
      el?.style.setProperty("--y", `${y}px`);
    };
    move(window.innerWidth / 2, window.innerHeight / 2);
    const onMove = (e: PointerEvent) => move(e.clientX, e.clientY);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
    };
  }, [dark]);

  if (!dark) return null;

  return (
    <>
      <div
        ref={ref}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[70]"
        style={{
          background:
            "radial-gradient(circle 150px at var(--x) var(--y), transparent 0, transparent 55%, rgba(0,0,0,0.97) 100%)",
        }}
      />
      <button
        type="button"
        onClick={() => setDark(false)}
        className="fixed bottom-28 left-1/2 z-[71] -translate-x-1/2 rounded border border-amber/60 bg-bg px-3 py-1.5 font-mono text-xs text-amber sm:bottom-6"
      >
        ⚠ modo manutenção · acender as luzes
      </button>
    </>
  );
}
