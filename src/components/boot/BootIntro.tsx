"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { findBug, markBooted } from "@/lib/server-store";
import { services } from "@/lib/content";

const SEEN_KEY = "vitor-server:booted";

const BANNER = String.raw`
 __     __ _  _
 \ \   / /(_)| |_  ___   _ __
  \ \ / / | || __|/ _ \ | '__|
   \ V /  | || |_| (_) || |
    \_/   |_| \__|\___/ |_|
 ======================================
 :: vitor-server ::          (v2026.10)`;

const LOGS: [level: "INFO" | "WARN", logger: string, msg: string][] = [
  [
    "INFO",
    "d.v.VitorApplication",
    "Starting VitorApplication using Java 21 with PID 1337",
  ],
  [
    "INFO",
    "d.v.VitorApplication",
    'No active profile set, falling back to 1 default profile: "portfolio"',
  ],
  [
    "INFO",
    "o.s.b.w.e.tomcat.TomcatWebServer",
    "Tomcat initialized with port 8080 (http)",
  ],
  [
    "INFO",
    "com.zaxxer.hikari.HikariDataSource",
    "HikariPool-1 - Start completed.",
  ],
  [
    "INFO",
    "o.f.core.internal.command.DbMigrate",
    'Successfully applied 4 migrations to schema "projetos"',
  ],
  [
    "INFO",
    "o.a.k.c.c.internals.ConsumerCoordinator",
    "Subscribed to topic(s): visitor-events",
  ],
  [
    "INFO",
    "d.v.security.JwtAuthenticationFilter",
    "Filter chain configured: gateway -> jwt -> service",
  ],
  [
    "INFO",
    "d.v.registry.ServiceRegistry",
    `Registered ${services.length} services: ${services.map((s) => s.name).join(", ")}`,
  ],
  [
    "WARN",
    "d.v.bugs.BugTracker",
    "13 known bugs in production. Nobody fixed them. On purpose.",
  ],
  ["INFO", "d.v.VitorApplication", "Started VitorApplication in 1.337 seconds"],
];

function timestamp() {
  return new Date().toISOString().replace("Z", "").slice(0, 23);
}

/**
 * Intro de boot do Spring Boot. Aparece uma vez por sessão; Esc, clique ou o
 * botão pulam. Pular antes do fim conta como bug "boot-skip".
 */
export const BOOT_SEEN_SCRIPT = `try{if(sessionStorage.getItem("${SEEN_KEY}")==="1")document.documentElement.dataset.booted="1"}catch(e){}`;

export function BootIntro() {
  const [visible, setVisible] = useState(true);
  // Um timestamp por linha já impressa, gerado no momento em que a linha aparece.
  const [stamps, setStamps] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      // sem sessionStorage: mostra o boot sempre
    }
    // Quem já viu o boot nesta sessão: o script inline do layout já escondeu o overlay.
    if (seen) {
      markBooted();
      return;
    }

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const step = reduced ? 40 : 230;
    const timers = LOGS.map((_, i) =>
      setTimeout(
        () => setStamps((prev) => [...prev, timestamp()]),
        500 + i * step,
      ),
    );
    const done = setTimeout(() => close(false), 500 + LOGS.length * step + 900);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  function close(skipped: boolean) {
    if (closing.current) return;
    closing.current = true;
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // ignora
    }
    // Libera a página já no início da cortina, para o hero entrar enquanto ela sobe.
    markBooted();
    const finish = () => {
      setVisible(false);
      if (skipped) findBug("boot-skip");
    };
    if (!rootRef.current) return finish();
    gsap.to(rootRef.current, {
      clipPath: "inset(0 0 100% 0)",
      duration: 0.6,
      ease: "power3.inOut",
      onComplete: finish,
    });
  }

  if (!visible) return null;

  return (
    <div
      ref={rootRef}
      data-boot-overlay
      role="dialog"
      aria-label="Inicializando o servidor"
      onClick={() => close(true)}
      className="scanlines fixed inset-0 z-[100] flex cursor-pointer flex-col overflow-hidden bg-bg px-4 py-6 font-mono text-[11px] leading-relaxed sm:px-10 sm:text-sm"
      style={{ clipPath: "inset(0 0 0 0)" }}
    >
      <pre className="glow text-spring">{BANNER}</pre>
      <div className="mt-4 space-y-0.5">
        {LOGS.slice(0, stamps.length).map(([level, logger, msg], i) => (
          <div key={i} className="break-words">
            <span className="text-muted">{stamps[i]}</span>{" "}
            <span className={level === "WARN" ? "text-amber" : "text-neon"}>
              {level.padStart(5)}
            </span>{" "}
            <span className="text-violet">1 ---</span>{" "}
            <span className="text-muted">[main]</span>{" "}
            <span className="text-cyan">{logger}</span>{" "}
            <span className="text-muted">:</span> {msg}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          close(true);
        }}
        className="mt-auto self-end rounded border border-line px-3 py-1.5 text-muted transition hover:border-neon hover:text-neon"
      >
        [Esc] pular boot
      </button>
    </div>
  );
}
