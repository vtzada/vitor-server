"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { Service } from "@/lib/content";

// Janela "picture-in-picture" com o app do serviço rodando de verdade (iframe).
// Serviços sem app no ar mostram um terminal com o clone do repositório.

const FRAME_W = 1280;
const FRAME_H = 800;

export function LivePreview({
  service,
  onClose,
}: {
  service: Service;
  onClose: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const loaded = loadedFor === service.id;

  // Escala o iframe (renderizado em 1280x800) para caber na janela.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const ro = new ResizeObserver(([entry]) =>
      setScale(entry.contentRect.width / FRAME_W),
    );
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    gsap.fromTo(
      el,
      { y: 20, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.6)" },
    );
  }, [service.id]);

  const host = service.liveUrl
    ? new URL(service.liveUrl).host
    : `github.com/vtzada/${service.repoUrl?.split("/").pop()}`;

  return (
    <div
      ref={rootRef}
      className="overflow-hidden rounded-lg border border-neon/50 bg-bg shadow-[0_0_50px_-12px_var(--color-neon)]"
    >
      <div className="flex items-center gap-2 border-b border-line bg-panel px-2 py-1.5 font-mono text-[10px]">
        <span className="size-2 rounded-full bg-error/70" />
        <span className="size-2 rounded-full bg-amber/70" />
        <span className="size-2 rounded-full bg-neon/70" />
        <span className="ml-1 min-w-0 flex-1 truncate rounded bg-bg px-2 py-0.5 text-muted">
          <span className="text-neon">https://</span>
          {host}
        </span>
        <a
          href={service.liveUrl ?? service.repoUrl}
          target="_blank"
          rel="noreferrer"
          className="text-muted hover:text-neon"
          aria-label="Abrir em nova aba"
        >
          ↗
        </a>
        <button
          type="button"
          onClick={onClose}
          className="text-muted hover:text-error"
          aria-label="Fechar preview"
        >
          ✕
        </button>
      </div>

      <div
        ref={boxRef}
        className="relative aspect-[16/10] w-full overflow-hidden bg-bg"
      >
        {service.liveUrl ? (
          <>
            <iframe
              key={service.id}
              src={service.liveUrl}
              title={`Preview ao vivo de ${service.name}`}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              onLoad={() => setLoadedFor(service.id)}
              className="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
              style={{
                width: FRAME_W,
                height: FRAME_H,
                transform: `scale(${scale})`,
              }}
              tabIndex={-1}
            />
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-muted">
                <span className="caret">GET {host}</span>
              </div>
            )}
            <a
              href={service.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-bg/70 to-transparent p-2 font-mono text-[10px] text-neon opacity-0 transition hover:opacity-100"
            >
              abrir {host} ↗
            </a>
          </>
        ) : (
          <pre className="h-full overflow-hidden p-3 font-mono text-[10px] leading-relaxed text-fg">
            <span className="text-muted">$</span> git clone {service.repoUrl}
            {"\n"}
            <span className="text-muted">
              Cloning into &apos;{service.repoUrl?.split("/").pop()}&apos;...
            </span>
            {"\n"}
            <span className="text-muted">$</span> ./mvnw spring-boot:run{"\n"}
            <span className="text-neon"> :: Spring Boot ::</span>
            {"\n"}
            <span className="text-cyan">INFO</span> Started {service.name} on
            port {service.port}
            {"\n\n"}
            <span className="text-muted">
              # sem deploy público: o código está no GitHub ↗
            </span>
          </pre>
        )}
      </div>
    </div>
  );
}
