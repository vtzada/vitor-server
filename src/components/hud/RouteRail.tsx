"use client";

import { useEffect, useState } from "react";
import { sendRequest } from "@/lib/server-store";

const HOPS = [
  { id: "home", path: "/", ms: 1 },
  { id: "services", path: "/services", ms: 12 },
  { id: "about", path: "/api/vitor", ms: 23 },
  { id: "contact", path: "/contact", ms: 31 },
];

/** Traceroute lateral: mostra em que "hop" da página o visitante está. */
export function RouteRail() {
  const [active, setActive] = useState("home");

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    HOPS.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const activeIndex = HOPS.findIndex((h) => h.id === active);

  return (
    <nav
      aria-label="Rota atual"
      className="fixed top-1/2 left-4 z-20 hidden -translate-y-1/2 font-mono text-[10px] 2xl:block"
    >
      <p className="mb-3 text-muted">traceroute vitor.dev</p>
      <ol className="relative space-y-4 border-l border-line pl-4">
        {HOPS.map((hop, i) => {
          const on = i <= activeIndex;
          return (
            <li key={hop.id} className="relative">
              <span
                className={`absolute top-1 -left-[21px] size-2 rounded-full border transition ${
                  i === activeIndex
                    ? "border-neon bg-neon shadow-[0_0_10px_var(--color-neon)]"
                    : on
                      ? "border-neon/60 bg-neon/30"
                      : "border-muted bg-bg"
                }`}
              />
              <a
                href={`#${hop.id}`}
                onClick={() =>
                  sendRequest(hop.id === "contact" ? "POST" : "GET", hop.path)
                }
                className={`block transition ${i === activeIndex ? "text-fg" : "text-muted hover:text-fg"}`}
              >
                {i + 1} {hop.path}
                <span className="ml-2 text-muted">
                  {on ? `${hop.ms}ms` : "* * *"}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
