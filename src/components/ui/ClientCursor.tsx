"use client";

import { useEffect, useRef } from "react";

/** Anel que segue o mouse: o visitante é o "client" da rede. Só em ponteiro fino. */
export function ClientCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const ring = ringRef.current;
    if (!fine || reduced || !ring) return;

    const pos = { x: -100, y: -100 };
    const cur = { x: -100, y: -100 };
    let hover = false;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      const t = e.target as Element | null;
      hover = !!t?.closest(
        "a, button, input, textarea, [role=button], canvas[data-map]",
      );
      if (labelRef.current) {
        const method = t?.closest("[data-method]")?.getAttribute("data-method");
        labelRef.current.textContent = method ?? "client";
      }
    };
    const onDown = () => {
      ring.dataset.down = "1";
      setTimeout(() => (ring.dataset.down = "0"), 160);
    };

    const loop = () => {
      cur.x += (pos.x - cur.x) * 0.22;
      cur.y += (pos.y - cur.y) * 0.22;
      ring.style.transform = `translate(${cur.x}px, ${cur.y}px)`;
      ring.dataset.hover = hover ? "1" : "0";
      raf = requestAnimationFrame(loop);
    };
    ring.style.display = "block";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <div
      ref={ringRef}
      aria-hidden
      className="client-cursor pointer-events-none fixed top-0 left-0 z-[80] hidden"
    >
      <div className="client-cursor__ring" />
      <span ref={labelRef} className="client-cursor__label">
        client
      </span>
    </div>
  );
}
