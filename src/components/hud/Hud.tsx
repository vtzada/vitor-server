"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { bugs, TOTAL_BUGS } from "@/lib/bugs";
import {
  resetBugs,
  sendRequest,
  setDark,
  useServer,
  type HttpMethod,
} from "@/lib/server-store";
import { isSoundOn, onSoundChange, setSound } from "@/lib/sound";

const NAV: { method: HttpMethod; path: string; href: string; label: string }[] =
  [
    { method: "GET", path: "/", href: "/#home", label: "home" },
    { method: "GET", path: "/services", href: "/#services", label: "serviços" },
    { method: "GET", path: "/api/vitor", href: "/#about", label: "sobre" },
    { method: "POST", path: "/contact", href: "/#contact", label: "contato" },
  ];

function useUptime() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(
      () => setSeconds(Math.floor((Date.now() - start) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m${String(s).padStart(2, "0")}s`;
}

export function Hud() {
  const uptime = useUptime();
  const requests = useServer((s) => s.log.length);

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-line bg-bg/80 font-mono text-xs backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <StatusLed />
        <Link
          href="/#home"
          onClick={() => sendRequest("GET", "/")}
          className="flex items-center gap-2 text-fg"
        >
          vitor-server<span className="text-muted">:8080</span>
        </Link>

        <nav className="ml-4 hidden gap-1 md:flex" aria-label="Seções">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => sendRequest(item.method, item.path)}
              className="rounded px-2 py-1 text-muted transition hover:bg-panel-2 hover:text-fg"
            >
              <span
                className={item.method === "GET" ? "text-cyan" : "text-amber"}
              >
                {item.method}
              </span>{" "}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-muted sm:inline">
            uptime <span className="text-fg">{uptime}</span> · reqs{" "}
            <span className="text-fg">{requests}</span>
          </span>
          <SoundToggle />
          <BugCounter />
        </div>
      </div>
      <nav
        className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden"
        aria-label="Seções"
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => sendRequest(item.method, item.path)}
            className="shrink-0 rounded border border-line px-2 py-1 text-muted"
          >
            <span
              className={item.method === "GET" ? "text-cyan" : "text-amber"}
            >
              {item.method}
            </span>{" "}
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

/** LED de status. Cinco cliques seguidos "derrubam a energia" (modo manutenção). */
function StatusLed() {
  const dark = useServer((s) => s.dark);
  const clicks = useRef<number[]>([]);
  return (
    <button
      type="button"
      aria-label="Status do servidor"
      onClick={() => {
        const now = Date.now();
        clicks.current = [...clicks.current.filter((t) => now - t < 2000), now];
        if (clicks.current.length >= 5) {
          clicks.current = [];
          setDark(!dark);
        }
      }}
      className="relative -m-2 flex p-2"
    >
      <span className="relative flex size-2">
        <span
          className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 ${dark ? "bg-amber" : "bg-neon"}`}
        />
        <span
          className={`relative inline-flex size-2 rounded-full ${dark ? "bg-amber" : "bg-neon"}`}
        />
      </span>
    </button>
  );
}

function SoundToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => onSoundChange(setOn), []);

  return (
    <button
      type="button"
      onClick={() => setSound(!isSoundOn())}
      aria-pressed={on}
      title={on ? "Desligar sons do servidor" : "Ligar sons do servidor"}
      className={`grid h-[26px] place-items-center rounded border px-2 transition ${on ? "border-neon/60 text-neon" : "border-line text-muted hover:text-fg"}`}
    >
      <svg
        viewBox="0 0 16 16"
        className="size-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path d="M2 6h3l4-3v10l-4-3H2z" fill="currentColor" stroke="none" />
        {on ? (
          <path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.5a6 6 0 0 1 0 9" />
        ) : (
          <path d="M11 6l4 4M15 6l-4 4" />
        )}
      </svg>
      <span className="sr-only">{on ? "som ligado" : "som desligado"}</span>
    </button>
  );
}

function BugCounter() {
  const found = useServer((s) => s.found);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="rounded border border-line px-2 py-1 text-muted transition hover:border-error hover:text-fg"
      >
        🐞 <span className="hidden sm:inline">bugs encontrados</span>{" "}
        <span className={found.length ? "text-error" : "text-fg"}>
          {found.length}/{TOTAL_BUGS}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[min(92vw,340px)] rounded-lg border border-line bg-panel p-3 shadow-xl">
          <p className="mb-2 text-muted">
            Issues abertas em produção. Ninguém corrigiu. De propósito.
          </p>
          <ul className="max-h-[60vh] space-y-1.5 overflow-y-auto">
            {bugs.map((bug, i) => {
              const ok = found.includes(bug.id);
              return (
                <li key={bug.id} className="flex gap-2">
                  <span className="text-muted">
                    #{String(i + 1).padStart(2, "0")}
                  </span>
                  {ok ? (
                    <span className="text-neon">{bug.title}</span>
                  ) : (
                    <span className="text-muted">
                      ??? <span className="opacity-70">({bug.hint})</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {found.length > 0 && (
            <button
              type="button"
              onClick={resetBugs}
              className="mt-3 text-muted underline hover:text-error"
            >
              git reset --hard
            </button>
          )}
        </div>
      )}
    </div>
  );
}
