"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { emitPacket } from "@/lib/server-store";

// Depois do boot, o navegador do visitante "abre a conexão" com o servidor:
// three-way handshake TCP + TLS, com os pacotes indo e voltando na tela.

const STEPS: { label: string; dir: 1 | -1; color: string }[] = [
  { label: "SYN", dir: 1, color: "text-cyan" },
  { label: "SYN-ACK", dir: -1, color: "text-neon" },
  { label: "ACK", dir: 1, color: "text-cyan" },
  { label: "TLS 1.3 ClientHello", dir: 1, color: "text-violet" },
  { label: "ServerHello + cert", dir: -1, color: "text-violet" },
];

function clientName() {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua)
    ? "edge"
    : /Firefox\//.test(ua)
      ? "firefox"
      : /Chrome\//.test(ua)
        ? "chrome"
        : /Safari\//.test(ua)
          ? "safari"
          : "browser";
  const os = /Android/.test(ua)
    ? "android"
    : /iPhone|iPad/.test(ua)
      ? "ios"
      : /Mac OS/.test(ua)
        ? "macos"
        : /Windows/.test(ua)
          ? "windows"
          : /Linux/.test(ua)
            ? "linux"
            : "?";
  return `${browser}@${os}`;
}

export function Handshake({ onDone }: { onDone: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const packetRef = useRef<HTMLSpanElement>(null);
  const [client, setClient] = useState("você");
  const [step, setStep] = useState(-1);
  const [port, setPort] = useState(49152);

  useEffect(() => {
    const root = rootRef.current;
    const packet = packetRef.current;
    if (!root || !packet) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const tl = gsap.timeline({ onComplete: onDone });
    tl.call(() => {
      setClient(clientName());
      // Porta efêmera, como o sistema operacional escolheria.
      setPort(49152 + Math.floor(Math.random() * 16000));
    });
    tl.fromTo(
      root,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" },
    );
    STEPS.forEach((s, i) => {
      tl.call(() => setStep(i));
      tl.fromTo(
        packet,
        { left: s.dir === 1 ? "0%" : "100%", opacity: 1 },
        {
          left: s.dir === 1 ? "100%" : "0%",
          duration: reduced ? 0.05 : 0.32,
          ease: "power1.inOut",
        },
      );
      tl.call(() => emitPacket({ status: 200 }));
    });
    tl.call(() => setStep(STEPS.length));
    tl.set(packet, { opacity: 0 });
    tl.to(root, { opacity: 0, y: -10, duration: 0.4, delay: 1.1 });
    return () => {
      tl.kill();
    };
  }, [onDone]);

  const established = step >= STEPS.length;
  const current = STEPS[Math.max(0, Math.min(step, STEPS.length - 1))];

  return (
    <div
      ref={rootRef}
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex justify-center px-4 opacity-0"
    >
      <div className="w-full max-w-md rounded-lg border border-line bg-panel/90 px-4 py-3 font-mono text-[11px] shadow-[0_0_40px_-16px_var(--color-neon)] backdrop-blur sm:text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-cyan">
            {client}
            <span className="text-muted">:{port}</span>
          </span>
          <span className="text-neon">
            vitor-server<span className="text-muted">:443</span>
          </span>
        </div>
        <div className="relative my-2 h-px bg-line">
          <span
            ref={packetRef}
            className={`absolute -top-1 size-2 -translate-x-1/2 rounded-full bg-current shadow-[0_0_10px_currentColor] ${current.color}`}
          />
        </div>
        <div className="text-center">
          {established ? (
            <span className="text-neon">
              ● conexão estabelecida · keep-alive
            </span>
          ) : step >= 0 ? (
            <span className={current.color}>
              {current.dir === 1 ? "→" : "←"} {current.label}
            </span>
          ) : (
            <span className="text-muted">abrindo conexão...</span>
          )}
        </div>
      </div>
    </div>
  );
}
