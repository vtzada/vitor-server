import type { HttpMethod } from "@/lib/server-store";
import { DecodeText } from "../ui/DecodeText";

export function SectionHeader({
  method,
  path,
  title,
  ghostId,
  children,
}: {
  method: HttpMethod;
  path: string;
  title: string;
  ghostId?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-10 max-w-2xl" data-reveal-section>
      <p className="font-mono text-xs tracking-wide text-muted">
        <span className={method === "GET" ? "text-cyan" : "text-amber"}>
          {method}
        </span>{" "}
        {path}
      </p>
      <h2
        className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-5xl"
        data-ghost={ghostId}
      >
        <DecodeText text={title} ghostId={ghostId} />
      </h2>
      {children && <p className="mt-3 text-muted">{children}</p>}
    </div>
  );
}
