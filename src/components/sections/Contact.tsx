"use client";

import { useState } from "react";
import { findBug, sendRequest } from "@/lib/server-store";
import { JsonView } from "../ui/JsonView";
import { SectionHeader } from "./SectionHeader";

const TEMPLATE = `{
  "nome": "",
  "email": "",
  "mensagem": ""
}`;

const SQLI =
  /('|")\s*(or|and)\s+\S+\s*=\s*\S+|--|;\s*drop\s+table|union\s+select/i;

interface Result {
  status: number;
  statusText: string;
  body: unknown;
}

/** Validação local do body. O envio real de e-mail entra numa próxima etapa. */
function handle(raw: string): Result {
  if (SQLI.test(raw)) {
    return {
      status: 403,
      statusText: "Forbidden",
      body: {
        error: "Forbidden",
        message: "Boa tentativa. Aqui é PreparedStatement.",
        bug: "found",
      },
    };
  }
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return {
      status: 400,
      statusText: "Bad Request",
      body: { error: "JSON malformado", hint: "confere as vírgulas" },
    };
  }
  const missing = ["nome", "email", "mensagem"].filter(
    (k) => !String(body[k] ?? "").trim(),
  );
  if (missing.length) {
    return {
      status: 422,
      statusText: "Unprocessable Entity",
      body: {
        error: "Validation failed",
        fields: missing.map((f) => ({
          field: f,
          message: "must not be blank",
        })),
      },
    };
  }
  if (!/^\S+@\S+\.\S+$/.test(String(body.email))) {
    return {
      status: 422,
      statusText: "Unprocessable Entity",
      body: {
        error: "Validation failed",
        fields: [
          { field: "email", message: "must be a well-formed email address" },
        ],
      },
    };
  }
  return {
    status: 202,
    statusText: "Accepted",
    body: {
      status: "queued",
      topic: "contact-messages",
      message: `Valeu, ${body.nome}! Mensagem na fila.`,
    },
  };
}

export function Contact() {
  const [raw, setRaw] = useState(TEMPLATE);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    const res = handle(raw);
    await sendRequest("POST", "/contact", res.status);
    if (res.status === 403) findBug("sql-injection");
    setResult(res);
    setLoading(false);
  }

  const ok = result && result.status < 300;

  return (
    <section
      id="contact"
      className="relative z-10 mx-auto max-w-6xl px-4 pt-28 pb-40"
    >
      <SectionHeader
        method="POST"
        path="/contact"
        title="Contato"
        ghostId="title-contact"
      >
        Monte o body e mande a requisição. Se preferir o caminho tradicional,
        tem o{" "}
        <a
          href="https://www.linkedin.com/in/vitortheodoro/"
          target="_blank"
          rel="noreferrer"
          className="text-cyan hover:underline"
        >
          LinkedIn
        </a>
        .
      </SectionHeader>

      <div
        data-reveal-section
        className="grid overflow-hidden rounded-lg border border-line bg-panel font-mono text-xs sm:text-sm lg:grid-cols-2"
      >
        <div className="border-b border-line lg:border-r lg:border-b-0">
          <div className="flex items-center gap-2 border-b border-line p-2">
            <span className="rounded bg-amber/10 px-2 py-1 text-amber">
              POST
            </span>
            <span className="min-w-0 flex-1 truncate rounded bg-bg px-2 py-1">
              /contact
            </span>
            <button
              type="button"
              onClick={send}
              disabled={loading}
              className="rounded bg-neon px-3 py-1 font-semibold text-bg transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
          <div className="border-b border-line px-3 py-1.5 text-[11px] text-muted">
            Body · raw · JSON
          </div>
          <label htmlFor="contact-body" className="sr-only">
            Corpo da requisição em JSON
          </label>
          <textarea
            id="contact-body"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            spellCheck={false}
            rows={9}
            className="block w-full resize-y bg-transparent p-4 text-fg outline-none"
          />
        </div>
        <div>
          <div className="flex gap-4 border-b border-line px-3 py-[13px] text-[11px] text-muted">
            {result ? (
              <span>
                Status{" "}
                <span className={ok ? "text-neon" : "text-error"}>
                  {result.status} {result.statusText}
                </span>
              </span>
            ) : (
              <span>Response</span>
            )}
          </div>
          <div className="p-4">
            {result ? (
              <JsonView value={result.body} />
            ) : (
              <span className="text-muted">
                Envie a requisição para ver a resposta.
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
