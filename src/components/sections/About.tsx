"use client";

import { useEffect, useRef, useState } from "react";
import { sendRequest } from "@/lib/server-store";
import { JsonView } from "../ui/JsonView";
import { GitLog } from "./GitLog";
import { SectionHeader } from "./SectionHeader";

/** "Sobre" é um GET /api/vitor de verdade, disparado ao entrar na tela. */
export function About() {
  const [data, setData] = useState<unknown>(null);
  const [meta, setMeta] = useState<{ status: number; ms: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const fired = useRef(false);

  async function send() {
    setLoading(true);
    const visible = sendRequest("GET", "/api/vitor");
    const t0 = performance.now();
    const res = await fetch("/api/vitor");
    const json = await res.json();
    const ms = Math.round(performance.now() - t0);
    // A resposta só aparece quando o pacote animado volta ao cliente.
    await visible;
    setData(json);
    setMeta({ status: res.status, ms });
    setLoading(false);
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired.current) {
          fired.current = true;
          send();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="about"
      className="relative z-10 mx-auto max-w-6xl px-4 pt-28 pb-12"
    >
      <SectionHeader
        method="GET"
        path="/api/vitor"
        title="Sobre mim"
        ghostId="title-about"
      >
        Em vez de um parágrafo, um endpoint e um histórico de commits. A
        resposta da esquerda vem de uma rota real deste site.
      </SectionHeader>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div
          data-reveal-section
          className="min-w-0 overflow-hidden rounded-lg border border-line bg-panel font-mono text-xs sm:text-sm"
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-line p-2">
            <span className="rounded bg-cyan/10 px-2 py-1 text-cyan">GET</span>
            <span className="min-w-0 flex-1 truncate rounded bg-bg px-2 py-1 text-fg">
              /api/vitor
            </span>
            <button
              type="button"
              onClick={send}
              disabled={loading}
              className="rounded bg-neon px-3 py-1 font-semibold text-bg transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
          <div className="flex gap-4 border-b border-line px-3 py-1.5 text-[11px] text-muted">
            {meta ? (
              <>
                <span>
                  Status <span className="text-neon">{meta.status} OK</span>
                </span>
                <span>Time {meta.ms}ms</span>
              </>
            ) : (
              <span>aguardando envio</span>
            )}
          </div>
          <div className="max-h-[520px] overflow-auto p-4">
            {data ? (
              <JsonView value={data} />
            ) : (
              <span className="caret text-muted" />
            )}
          </div>
        </div>
        <div data-reveal-section className="min-w-0">
          <GitLog />
        </div>
      </div>
    </section>
  );
}
