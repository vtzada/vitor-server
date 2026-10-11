"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { services } from "@/lib/content";
import { sendRequest } from "@/lib/server-store";
import type { Burst } from "../map/ArchitectureMap";
import { LivePreview } from "../map/LivePreview";
import { SectionHeader } from "./SectionHeader";

const ArchitectureMap = dynamic(() => import("../map/ArchitectureMap"), {
  ssr: false,
  loading: () => <MapPlaceholder />,
});

function MapPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center font-mono text-xs text-muted">
      <span className="caret">carregando topologia</span>
    </div>
  );
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Projetos como microsserviços num mapa 3D de arquitetura. */
export function Services() {
  const [selected, setSelected] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const burstKey = useRef(0);

  // Só carrega o 3D quando a seção se aproxima, e só anima enquanto está na tela.
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setWebgl(hasWebGL());
          setNear(true);
        }
        setVisible(entry.isIntersecting);
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function select(id: string) {
    setSelected(id);
    setPreviewId(id);
    setBursts((b) => [...b, { key: burstKey.current++, id }]);
    sendRequest("GET", `/services/${id}/health`);
  }

  const svc = services.find((s) => s.id === selected);
  const preview = services.find((s) => s.id === previewId);

  return (
    <section
      id="services"
      className="relative z-10 mx-auto max-w-6xl px-4 py-28"
    >
      <SectionHeader
        method="GET"
        path="/services"
        title="Mapa de arquitetura"
        ghostId="title-services"
      >
        Cada projeto é um microsserviço atrás do mesmo gateway. Arraste para
        girar e clique num serviço para mandar uma requisição até ele.
      </SectionHeader>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div
          ref={mapRef}
          className="relative isolate h-[380px] overflow-hidden rounded-lg border border-line bg-panel/40 sm:h-[520px]"
        >
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
          {near && webgl && (
            <ArchitectureMap
              selected={selected}
              onSelect={select}
              bursts={bursts}
              onBurstDone={(key) =>
                setBursts((b) => b.filter((x) => x.key !== key))
              }
              active={visible}
            />
          )}
          {near && !webgl && (
            <div className="flex h-full items-center justify-center p-6 text-center font-mono text-xs text-muted">
              Seu navegador não liberou WebGL, então o mapa 3D ficou de fora. Os
              serviços estão listados ao lado.
            </div>
          )}
          <p className="pointer-events-none absolute bottom-3 left-3 font-mono text-[10px] text-muted">
            {services.length} serviços · 1 gateway · eventos no kafka
          </p>
          {preview && (
            // Os rótulos do drei usam z-index altíssimo; o preview fica acima deles.
            <div
              className="absolute right-3 bottom-3 hidden w-[44%] max-w-[340px] sm:block"
              style={{ zIndex: 16777272 }}
            >
              <LivePreview
                service={preview}
                onClose={() => setPreviewId(null)}
              />
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-3">
          <ul className="grid grid-cols-2 gap-2 font-mono text-xs lg:grid-cols-1">
            {services.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  data-method="GET"
                  onClick={() => select(s.id)}
                  aria-pressed={selected === s.id}
                  className={`flex w-full items-center justify-between rounded border px-3 py-2 text-left transition ${
                    selected === s.id
                      ? "border-neon bg-neon/10 text-neon"
                      : "border-line bg-panel text-fg hover:border-spring/60"
                  }`}
                >
                  <span className="truncate">{s.name}</span>
                  <span className="ml-2 text-[10px] text-muted">:{s.port}</span>
                </button>
              </li>
            ))}
          </ul>

          {preview && (
            <div className="sm:hidden">
              <LivePreview
                service={preview}
                onClose={() => setPreviewId(null)}
              />
            </div>
          )}
          <div
            className="flex-1 rounded-lg border border-line bg-panel p-4"
            aria-live="polite"
          >
            {svc ? (
              <>
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-fg">{svc.name}</span>
                  <span className="flex items-center gap-1.5 text-neon">
                    <span className="size-1.5 rounded-full bg-neon" />{" "}
                    {svc.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-fg/85">{svc.description}</p>
                <p className="mt-3 flex flex-wrap gap-1.5">
                  {svc.stack.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-[10px] text-muted"
                    >
                      {t}
                    </span>
                  ))}
                </p>
                <ul className="mt-4 space-y-1 border-t border-line pt-3 font-mono text-[11px]">
                  {svc.endpoints.map((ep) => {
                    const [m, ...p] = ep.split(" ");
                    return (
                      <li key={ep}>
                        <span
                          className={m === "GET" ? "text-cyan" : "text-amber"}
                        >
                          {m}
                        </span>{" "}
                        {p.join(" ")}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-4 flex gap-3 font-mono text-xs">
                  {svc.liveUrl && (
                    <a
                      href={svc.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-neon hover:underline"
                    >
                      abrir app ↗
                    </a>
                  )}
                  {svc.repoUrl && (
                    <a
                      href={svc.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted hover:text-fg"
                    >
                      código ↗
                    </a>
                  )}
                </div>
              </>
            ) : (
              <p className="font-mono text-xs leading-relaxed text-muted">
                <span className="text-cyan">GET</span> /services/{"{id}"}/health
                <br />
                Escolha um serviço no mapa ou na lista para ver endpoints, stack
                e o app no ar.
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
