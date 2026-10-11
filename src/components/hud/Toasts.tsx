"use client";

import { useServer } from "@/lib/server-store";

export function Toasts() {
  const toasts = useServer((s) => s.toasts);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 top-24 z-50 sm:inset-x-auto sm:top-auto sm:bottom-4 sm:left-4 flex flex-col gap-2 [&>*:not(:last-child)]:hidden sm:[&>*]:!block font-mono text-xs"
    >
      {toasts.slice(-3).map((t) => (
        <div
          key={t.id}
          className="rounded-lg border border-error/60 bg-panel/95 px-3 py-2 shadow-[0_0_30px_-10px_var(--color-error)]"
        >
          <div className="text-error">{t.title}</div>
          <div className="text-fg">{t.body}</div>
        </div>
      ))}
    </div>
  );
}
