"use client";

import { useEffect, type ReactNode } from "react";
import { hydrateBugs } from "@/lib/server-store";
import { Hud } from "./hud/Hud";
import { Toasts } from "./hud/Toasts";
import { RequestPipeline } from "./request/RequestPipeline";
import { KonamiCrash } from "./eggs/KonamiCrash";

/** Casca global: HUD, painel de requisições, toasts e listeners de easter eggs. */
export function ServerShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    hydrateBugs();
  }, []);

  return (
    <>
      <Hud />
      {children}
      <RequestPipeline />
      <Toasts />
      <KonamiCrash />
    </>
  );
}
