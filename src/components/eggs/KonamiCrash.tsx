"use client";

import { useEffect, useState } from "react";
import { findBug } from "@/lib/server-store";

const SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

const TRACE = `Exception in thread "main" java.lang.IllegalStateException: Konami code detected in production
\tat dev.vitor.security.KonamiFilter.doFilterInternal(KonamiFilter.java:42)
\tat org.springframework.web.filter.OncePerRequestFilter.doFilter(OncePerRequestFilter.java:116)
\tat dev.vitor.gateway.VisitorGateway.route(VisitorGateway.java:1337)
\tat dev.vitor.VitorApplication.main(VitorApplication.java:7)
Caused by: java.lang.OutOfMemoryError: Too many easter eggs in heap space
\t... 13 more`;

/** ↑↑↓↓←→←→BA derruba o servidor e mostra a stack trace até o restart. */
export function KonamiCrash() {
  const [crashed, setCrashed] = useState(false);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    let pos = 0;
    const onKey = (e: KeyboardEvent) => {
      const expected = SEQUENCE[pos];
      pos =
        e.key.toLowerCase() === expected.toLowerCase()
          ? pos + 1
          : e.key === SEQUENCE[0]
            ? 1
            : 0;
      if (pos === SEQUENCE.length) {
        pos = 0;
        setCrashed(true);
        findBug("konami");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!crashed) return;
    const r = setTimeout(() => setRestarting(true), 3200);
    const done = setTimeout(() => {
      setCrashed(false);
      setRestarting(false);
    }, 5200);
    return () => {
      clearTimeout(r);
      clearTimeout(done);
    };
  }, [crashed]);

  if (!crashed) return null;

  return (
    <div
      role="alert"
      className="scanlines fixed inset-0 z-[90] overflow-auto bg-[#12040a] p-4 font-mono text-xs text-error sm:p-10 sm:text-sm"
    >
      <p className="glow mb-4 text-lg font-bold sm:text-2xl">
        500 INTERNAL SERVER ERROR
      </p>
      <pre className="whitespace-pre-wrap">{TRACE}</pre>
      <p className="mt-6 text-fg">
        {restarting ? (
          <span className="caret text-neon">
            Restarting VitorApplication...
          </span>
        ) : (
          <span className="text-muted">
            Application stopped. Aguardando o supervisor...
          </span>
        )}
      </p>
    </div>
  );
}
