"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { findBug, sendRequest } from "@/lib/server-store";
import { statusColor } from "../request/RequestPipeline";

/** Página de "resposta HTTP" usada pelos easter eggs de rota (/teapot, 404, health). */
export function StatusPage({
  status,
  reason,
  path,
  bugId,
  children,
}: {
  status: number;
  reason: string;
  path: string;
  bugId: string;
  children: ReactNode;
}) {
  useEffect(() => {
    sendRequest("GET", path, status).then(() => findBug(bugId));
  }, [path, status, bugId]);

  return (
    <main className="relative flex min-h-svh items-center justify-center px-4 pt-24 pb-32 font-mono">
      <div className="bg-grid pointer-events-none absolute inset-0" />
      <div className="relative max-w-xl text-center">
        <p
          className="glow text-7xl font-bold sm:text-9xl"
          style={{ color: statusColor(status) }}
        >
          {status}
        </p>
        <p className="mt-2 text-lg text-fg">{reason}</p>
        <div className="mt-6 text-sm text-muted">{children}</div>
        <Link
          href="/"
          className="mt-10 inline-block rounded border border-line px-4 py-2 text-sm text-fg hover:border-neon hover:text-neon"
        >
          GET / (voltar)
        </Link>
      </div>
    </main>
  );
}
