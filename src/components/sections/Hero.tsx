"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { TOTAL_BUGS } from "@/lib/bugs";
import { profile, services } from "@/lib/content";
import { sendRequest, useServer } from "@/lib/server-store";
import { Terminal } from "../terminal/Terminal";
import { DecodeText } from "../ui/DecodeText";

export function Hero() {
  const booted = useServer((s) => s.booted);
  const requests = useServer((s) => s.log.length);
  const found = useServer((s) => s.found.length);
  const rootRef = useRef<HTMLElement>(null);
  const [first, ...rest] = profile.name.split(" ");

  // Entra em cena só depois do boot, para o boot não "spoilar" a página.
  useEffect(() => {
    if (!booted || !rootRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-reveal]", {
        y: 28,
        opacity: 0,
        duration: 0.8,
        stagger: 0.09,
        ease: "power3.out",
      });
    }, rootRef);
    return () => ctx.revert();
  }, [booted]);

  return (
    <section
      ref={rootRef}
      id="home"
      className="relative z-10 flex min-h-svh items-center pt-32 pb-24"
    >
      <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center">
        <div>
          <p data-reveal className="font-mono text-sm text-neon">
            HTTP/1.1 200 OK <span className="text-muted">· {profile.role}</span>
          </p>
          <h1
            data-reveal
            className="mt-3 text-6xl leading-[0.95] font-bold tracking-tight text-fg sm:text-8xl"
            data-ghost="title-hero"
          >
            {booted ? (
              <DecodeText text={`${first}.`} ghostId="title-hero" />
            ) : (
              `${first}.`
            )}
            <br />
            <span className="text-muted">{rest.join(" ")}</span>
          </h1>
          <p data-reveal className="mt-6 max-w-xl text-lg text-fg/80">
            Backend é invisível. Aqui não: este site é um servidor rodando, e
            cada clique vira uma requisição que você vê atravessar a rede. Tem{" "}
            {TOTAL_BUGS} bugs em produção esperando alguém achar.
          </p>
          <div
            data-reveal
            className="mt-8 flex flex-wrap gap-3 font-mono text-sm"
          >
            <Link
              href="#services"
              data-method="GET"
              onClick={() => sendRequest("GET", "/services")}
              className="rounded border border-neon bg-neon/10 px-4 py-2.5 text-neon shadow-[0_0_30px_-8px_var(--color-neon)] transition hover:bg-neon/20"
            >
              GET /services
            </Link>
            <Link
              href="#contact"
              data-method="POST"
              onClick={() => sendRequest("POST", "/contact")}
              className="rounded border border-line bg-bg/60 px-4 py-2.5 text-fg transition hover:border-amber hover:text-amber"
            >
              POST /contact
            </Link>
          </div>
          <dl
            data-reveal
            className="mt-10 grid max-w-md grid-cols-3 gap-4 font-mono text-xs"
          >
            <div>
              <dt className="text-muted">serviços</dt>
              <dd className="mt-1 text-xl text-neon">{services.length} UP</dd>
            </div>
            <div>
              <dt className="text-muted">requisições</dt>
              <dd className="mt-1 text-xl text-fg">{requests}</dd>
            </div>
            <div>
              <dt className="text-muted">bugs achados</dt>
              <dd className="mt-1 text-xl text-error">
                {found}/{TOTAL_BUGS}
              </dd>
            </div>
          </dl>
        </div>

        <div data-reveal className="min-w-0">
          <Terminal />
        </div>
      </div>
      <a
        href="#services"
        onClick={() => sendRequest("GET", "/services")}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 font-mono text-[10px] text-muted transition hover:text-neon sm:block"
      >
        ↓ role para seguir o pacote
      </a>
    </section>
  );
}
