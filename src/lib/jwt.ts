// Token "esquecido" no <head> da página (easter egg jwt-secret).
export const LEAKED_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ2aXNpdGFudGUiLCJyb2xlIjoiUk9PVCIsImJ1ZyI6Imp3dC1zZWNyZXQiLCJpYXQiOjE3NjAxNDA4MDAsIm1zZyI6IlZvY8OqIGxldSBvIDxoZWFkPi4gUmVzcGVpdG8uIn0.ZXN0ZS1zZWdyZWRvLW5hby1lLXNlZ3JlZG8";

function decodePart(part: string): unknown {
  const b64 = part
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(part.length / 4) * 4, "=");
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

/** Decodifica header e payload de um JWT qualquer (sem validar assinatura). */
export function decodeJwt(
  token: string,
): { header: unknown; payload: Record<string, unknown> } | null {
  const parts = token.trim().split(".");
  if (parts.length !== 3) return null;
  try {
    return {
      header: decodePart(parts[0]),
      payload: decodePart(parts[1]) as Record<string, unknown>,
    };
  } catch {
    return null;
  }
}
