"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  completeRequest,
  useServer,
  type HttpRequest,
} from "@/lib/server-store";

const STAGES = ["client", "gateway", "jwt", "service", "db", "kafka"] as const;

// Até onde o pacote chega antes de voltar, conforme o status da resposta.
function stopIndex(status: number) {
  if (status === 429) return 1; // barrado no gateway (rate limit)
  if (status === 401 || status === 403) return 2; // barrado no filtro JWT
  if (status >= 400) return 3; // o serviço respondeu com erro
  return STAGES.length - 1;
}

export function statusColor(status: number) {
  if (status === 418) return "var(--color-violet)";
  if (status >= 500) return "var(--color-error)";
  if (status === 404 || status === 429) return "var(--color-amber)";
  if (status >= 400) return "var(--color-error)";
  return "var(--color-neon)";
}

/**
 * Painel fixo que mostra cada requisição viajando pelas camadas do backend
 * e o access log logo abaixo. Processa a fila do store uma por vez.
 */
export function RequestPipeline() {
  const current = useServer((s) => s.queue[0]);
  const log = useServer((s) => s.log);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number>(-1);
  const trackRef = useRef<HTMLDivElement>(null);
  const packetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!current) return;
    const packet = packetRef.current;
    const track = trackRef.current;
    if (!packet || !track) return completeRequest(current.id);

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const stop = stopIndex(current.status);
    const pct = (i: number) => `${(i / (STAGES.length - 1)) * 100}%`;
    const hop = reduced ? 0.01 : 0.14;
    const color = statusColor(current.status);

    const tl = gsap.timeline({ onComplete: () => completeRequest(current.id) });
    tl.set(packet, {
      left: pct(0),
      opacity: 1,
      backgroundColor: "var(--color-cyan)",
      scale: 1,
    });
    for (let i = 1; i <= stop; i++) {
      tl.to(packet, {
        left: pct(i),
        duration: hop,
        ease: "power1.inOut",
        onStart: () => setActive(i),
      });
    }
    tl.to(packet, { backgroundColor: color, scale: 1.6, duration: hop }, ">");
    tl.to(packet, {
      left: pct(0),
      scale: 1,
      duration: hop * 2.2,
      ease: "power2.in",
      onStart: () => setActive(-1),
    });
    tl.to(packet, { opacity: 0, duration: reduced ? 0.01 : 0.2 });

    return () => {
      tl.kill();
    };
  }, [current]);

  const last = log[0];

  return (
    <aside
      aria-label="Requisições ao servidor"
      className="fixed inset-x-2 bottom-2 z-40 rounded-lg border border-line bg-panel/90 font-mono text-[11px] shadow-[0_0_40px_-12px_rgba(57,255,136,0.25)] backdrop-blur sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[400px] sm:text-xs"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-3 pt-2 text-left text-muted"
      >
        <span>
          {current ? (
            <>
              <span className="text-cyan">{current.method}</span> {current.path}
            </>
          ) : last ? (
            <LogLine req={last} />
          ) : (
            "aguardando requisições..."
          )}
        </span>
        <span className="shrink-0">{open ? "▾ log" : "▸ log"}</span>
      </button>

      <div ref={trackRef} className="relative mx-5 my-3 h-6">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
        {STAGES.map((stage, i) => (
          <div
            key={stage}
            className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: `${(i / (STAGES.length - 1)) * 100}%` }}
          >
            <span
              className={`block size-2.5 rounded-full border transition-colors ${
                active === i
                  ? "border-neon bg-neon shadow-[0_0_10px_var(--color-neon)]"
                  : "border-muted bg-bg"
              }`}
            />
            <span
              className={`absolute top-3.5 text-[9px] ${active === i ? "text-neon" : "text-muted"}`}
            >
              {stage}
            </span>
          </div>
        ))}
        <div
          ref={packetRef}
          className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 shadow-[0_0_12px_currentColor]"
        />
      </div>

      {open && (
        <ol className="mt-3 max-h-48 overflow-y-auto border-t border-line px-3 py-2">
          {log.length === 0 && <li className="text-muted">log vazio</li>}
          {log.map((req) => (
            <li key={req.id}>
              <LogLine req={req} />
            </li>
          ))}
        </ol>
      )}
      {!open && <div className="h-2" />}
    </aside>
  );
}

function LogLine({ req }: { req: HttpRequest }) {
  return (
    <span>
      <span className="text-cyan">{req.method}</span> {req.path}{" "}
      <span style={{ color: statusColor(req.status) }}>{req.status}</span>{" "}
      <span className="text-muted">{req.durationMs ?? 0}ms</span>
    </span>
  );
}
