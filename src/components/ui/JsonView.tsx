// Renderiza JSON com realce de sintaxe, sem biblioteca.

const INDENT = "  ";

export function JsonView({ value }: { value: unknown }) {
  return (
    <pre className="leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
      {render(value, 0)}
    </pre>
  );
}

function render(value: unknown, depth: number): React.ReactNode {
  const pad = INDENT.repeat(depth + 1);
  const close = INDENT.repeat(depth);

  if (value === null) return <span className="text-violet">null</span>;
  if (typeof value === "string")
    return <span className="text-amber">&quot;{value}&quot;</span>;
  if (typeof value === "number" || typeof value === "boolean")
    return <span className="text-violet">{String(value)}</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return (
      <>
        {"[\n"}
        {value.map((v, i) => (
          <span key={i}>
            {pad}
            {render(v, depth + 1)}
            {i < value.length - 1 ? ",\n" : "\n"}
          </span>
        ))}
        {close}]
      </>
    );
  }

  const entries = Object.entries(value as Record<string, unknown>);
  return (
    <>
      {"{\n"}
      {entries.map(([k, v], i) => (
        <span key={k}>
          {pad}
          <span className="text-cyan">&quot;{k}&quot;</span>:{" "}
          {render(v, depth + 1)}
          {i < entries.length - 1 ? ",\n" : "\n"}
        </span>
      ))}
      {close}
      {"}"}
    </>
  );
}
