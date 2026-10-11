"use client";

import { useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { hydrateBugs, onPacket } from "@/lib/server-store";
import { loadSoundPref, playStatus } from "@/lib/sound";
import { Hud } from "./hud/Hud";
import { RouteRail } from "./hud/RouteRail";
import { Toasts } from "./hud/Toasts";
import { RequestPipeline } from "./request/RequestPipeline";
import { NetworkBackground } from "./network/NetworkBackground";
import { ClientCursor } from "./ui/ClientCursor";
import { DarkRoom } from "./eggs/DarkRoom";
import { Ghost } from "./eggs/Ghost";
import { KonamiCrash } from "./eggs/KonamiCrash";

/** Casca global: rede de fundo, HUD, painel de requisições e os easter eggs. */
export function ServerShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    hydrateBugs();
    loadSoundPref();
    const offSound = onPacket((e) => playStatus(e.status));
    // Recado para quem abre o DevTools.
    console.log(
      "%cvitor-server%c\nAbriu o console? Então você é dos nossos.\nTem um token esquecido no <head>. O terminal sabe decodificar JWT.",
      "color:#39ff88;font:bold 16px monospace",
      "color:#7d8aa0;font:12px monospace",
    );
    return offSound;
  }, []);

  // Blocos marcados com data-reveal-section entram em cena ao rolar.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      ScrollTrigger.batch("[data-reveal-section]", {
        start: "top 85%",
        once: true,
        onEnter: (els) =>
          gsap.fromTo(
            els,
            { y: 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              stagger: 0.1,
              ease: "power3.out",
            },
          ),
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <>
      <NetworkBackground />
      <Hud />
      <RouteRail />
      {children}
      <RequestPipeline />
      <Toasts />
      <Ghost />
      <DarkRoom />
      <KonamiCrash />
      <ClientCursor />
    </>
  );
}
