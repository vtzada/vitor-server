"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { profile } from "@/lib/content";
import { sendRequest, useServer } from "@/lib/server-store";

export function Hero() {
  const booted = useServer((s) => s.booted);
  const rootRef = useRef<HTMLElement>(null);

  // Entra em cena só depois do boot, para o boot não "spoilar" a página.
  useEffect(() => {
    if (!booted || !rootRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-reveal]", {
        y: 24,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power3.out",
      });
    }, rootRef);
    return () => ctx.revert();
  }, [booted]);

  return (
    <section
      ref={rootRef}
      id="home"
      className="relative flex min-h-svh items-center overflow-hidden pt-28 pb-24"
    >
      <div className="bg-grid pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <p data-reveal className="font-mono text-sm text-neon">
            HTTP/1.1 200 OK
          </p>
          <h1
            data-reveal
            className="mt-3 text-5xl font-bold tracking-tight text-fg sm:text-7xl"
          >
            {profile.name.split(" ")[0]}
            <span className="text-spring">.</span>
            <br />
            <span className="text-muted">
              {profile.name.split(" ").slice(1).join(" ")}
            </span>
          </h1>
          <p data-reveal className="mt-6 max-w-xl text-lg text-fg/80">
            {profile.role}. Este site é um servidor rodando: cada clique vira
            uma requisição que você vê atravessar o backend. E tem 13 bugs em
            produção esperando alguém achar.
          </p>
          <div
            data-reveal
            className="mt-8 flex flex-wrap gap-3 font-mono text-sm"
          >
            <Link
              href="#services"
              onClick={() => sendRequest("GET", "/services")}
              className="rounded border border-neon bg-neon/10 px-4 py-2.5 text-neon transition hover:bg-neon/20"
            >
              GET /services
            </Link>
            <Link
              href="#contact"
              onClick={() => sendRequest("POST", "/contact")}
              className="rounded border border-line px-4 py-2.5 text-fg transition hover:border-amber hover:text-amber"
            >
              POST /contact
            </Link>
          </div>
        </div>

        <div
          data-reveal
          className="rounded-lg border border-line bg-panel font-mono text-xs sm:text-sm"
        >
          <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
            <span className="size-2.5 rounded-full bg-error/70" />
            <span className="size-2.5 rounded-full bg-amber/70" />
            <span className="size-2.5 rounded-full bg-neon/70" />
            <span className="ml-2 text-muted">bash</span>
          </div>
          <pre className="overflow-x-auto p-4 leading-relaxed">
            <span className="text-muted">$</span> curl -i https://vitor.dev
            {"\n"}
            <span className="text-neon">HTTP/1.1 200 OK</span>
            {"\n"}
            <span className="text-cyan">Content-Type</span>: application/json
            {"\n"}
            <span className="text-cyan">X-Stack</span>: Java, Spring Boot, Kafka
            {"\n"}
            <span className="text-cyan">X-Education</span>:{" "}
            {profile.education.institution}
            {"\n"}
            <span className="text-cyan">X-Bugs-Known</span>: 13{"\n"}
            <span className="text-cyan">X-Hint</span>: tente navegar para
            /teapot{"\n\n"}
            <span className="caret text-muted">$</span>
          </pre>
        </div>
      </div>
    </section>
  );
}
