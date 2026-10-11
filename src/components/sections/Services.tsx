"use client";

import { useState } from "react";
import { services } from "@/lib/content";
import { sendRequest } from "@/lib/server-store";
import { SectionHeader } from "./SectionHeader";

/**
 * Projetos como microsserviços. Por enquanto é a versão 2D do mapa;
 * a versão 3D (React Three Fiber) entra aqui na próxima etapa.
 */
export function Services() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section id="services" className="relative mx-auto max-w-6xl px-4 py-28">
      <SectionHeader method="GET" path="/services" title="Mapa de arquitetura">
        Cada projeto é um microsserviço atrás do mesmo gateway. Clique num
        serviço para checar o health e ver os endpoints.
      </SectionHeader>

      <div className="mx-auto mb-6 w-fit rounded border border-cyan/50 bg-cyan/5 px-4 py-2 font-mono text-xs text-cyan">
        api-gateway :8080
      </div>
      <div className="mx-auto mb-6 hidden h-6 w-3/4 border-x border-t border-line md:block" />

      <ul className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((svc) => {
          const open = openId === svc.id;
          return (
            <li
              key={svc.id}
              className={`flex flex-col rounded-lg border bg-panel transition ${
                open ? "border-neon" : "border-line hover:border-spring/60"
              }`}
            >
              <button
                type="button"
                aria-expanded={open}
                onClick={() => {
                  setOpenId(open ? null : svc.id);
                  if (!open) sendRequest("GET", `/services/${svc.id}/health`);
                }}
                className="flex flex-1 flex-col p-4 text-left"
              >
                <span className="flex w-full items-center justify-between font-mono text-xs">
                  <span className="text-fg">{svc.name}</span>
                  <span className="flex items-center gap-1.5 text-neon">
                    <span className="size-1.5 rounded-full bg-neon" />
                    {svc.status}
                  </span>
                </span>
                <span className="mt-1 font-mono text-[11px] text-muted">
                  :{svc.port}
                </span>
                <span className="mt-3 text-sm text-fg/80">
                  {svc.description}
                </span>
                <span className="mt-3 flex flex-wrap gap-1.5">
                  {svc.stack.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-[10px] text-muted"
                    >
                      {t}
                    </span>
                  ))}
                </span>
              </button>
              {open && (
                <div className="mx-4 mb-4 border-t border-line pt-3 font-mono text-[11px]">
                  <ul className="space-y-1">
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
                  <div className="mt-3 flex gap-3 text-xs">
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
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
