import type { HttpMethod } from "@/lib/server-store";

export function SectionHeader({
  method,
  path,
  title,
  children,
}: {
  method: HttpMethod;
  path: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="font-mono text-xs tracking-wide text-muted">
        <span className={method === "GET" ? "text-cyan" : "text-amber"}>
          {method}
        </span>{" "}
        {path}
      </p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        {title}
      </h2>
      {children && <p className="mt-3 text-muted">{children}</p>}
    </div>
  );
}
