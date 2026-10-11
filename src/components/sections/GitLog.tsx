"use client";

import { useState } from "react";
import { emitPacket } from "@/lib/server-store";

// A trajetória do Vitor contada como histórico de commits.
// Datas vêm dos repositórios públicos no GitHub (mês do último push).

interface Commit {
  date: string;
  type: "init" | "feat" | "chore" | "merge";
  msg: string;
  detail: string;
  tags?: string[];
  branch?: "main" | "unisinos";
}

const COMMITS: Commit[] = [
  {
    date: "2026-10",
    type: "feat",
    msg: "AceleraFlix e GhostWriter no ar",
    detail:
      "Dois produtos completos em produção: backend Spring Boot com JWT + refresh token, RBAC e front publicado na Vercel.",
    tags: ["HEAD -> main", "v1.0"],
  },
  {
    date: "2026-10",
    type: "feat",
    msg: "mensageria com Kafka e RabbitMQ",
    detail:
      "btg-orders e notificacoes-rabbitmq: processamento assíncrono de pedidos e notificações orientadas a eventos.",
  },
  {
    date: "2026-09",
    type: "feat",
    msg: "PayMe e desafio PicPay simplificado",
    detail:
      "Controle financeiro com saldo consistente a cada transação e transferências entre usuários com regras de negócio de verdade.",
  },
  {
    date: "2026-08",
    type: "feat",
    msg: "check-in com Mercado Pago e QR Code",
    detail:
      "Venda de ingressos com webhook validado, reserva de estoque e check-in na portaria. Testes com Testcontainers.",
  },
  {
    date: "2026-07",
    type: "feat",
    msg: "APIs REST com Spring Boot",
    detail:
      "payflow-api, todolist-api e spring-boot-restful-api: camadas bem separadas, validação e documentação com Swagger.",
  },
  {
    date: "2026-03",
    type: "merge",
    msg: "Merge branch 'unisinos' into main",
    detail:
      "Análise e Desenvolvimento de Sistemas na Unisinos, com a teoria entrando direto nos projetos.",
    branch: "unisinos",
  },
  {
    date: "2025-02",
    type: "chore",
    msg: "primeiro portfólio e estudos de front",
    detail:
      "HTML, CSS e The Odin Project. Foi aqui que ficou claro que a graça estava no backend.",
  },
  {
    date: "2024-10",
    type: "init",
    msg: "Initial commit: hello-world",
    detail: "O primeiro repositório. Todo mundo começa em algum lugar.",
    tags: ["v0.0.1"],
  },
];

// Hash curto determinístico, para o log parecer um git log de verdade.
function shortHash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++)
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

const TYPE_COLOR: Record<Commit["type"], string> = {
  init: "text-violet",
  feat: "text-neon",
  chore: "text-muted",
  merge: "text-cyan",
};

export function GitLog() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel font-mono text-xs sm:text-[13px]">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2 text-muted">
        <span className="text-neon">$</span> git log --graph --oneline vitor
      </div>
      <ol className="max-h-[560px] overflow-y-auto py-2">
        {COMMITS.map((c, i) => {
          const hash = shortHash(c.msg);
          const expanded = open === i;
          return (
            <li key={hash}>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => {
                  setOpen(expanded ? null : i);
                  emitPacket({ status: 200 });
                }}
                className={`group flex w-full gap-3 px-3 py-1.5 text-left transition hover:bg-panel-2 ${expanded ? "bg-panel-2" : ""}`}
              >
                <span
                  className="relative w-6 shrink-0 text-center select-none"
                  aria-hidden
                >
                  <span
                    className={
                      c.branch === "unisinos" ? "text-cyan" : "text-neon"
                    }
                  >
                    {c.type === "merge" ? "*─╮" : "*"}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-amber">{hash}</span>{" "}
                  {c.tags?.map((t) => (
                    <span key={t} className="mr-1 text-cyan">
                      ({t})
                    </span>
                  ))}
                  <span className={TYPE_COLOR[c.type]}>{c.type}:</span>{" "}
                  <span className="text-fg group-hover:text-neon">{c.msg}</span>
                  <span className="ml-2 text-muted">{c.date}</span>
                </span>
              </button>
              {expanded && (
                <div className="ml-12 border-l border-line py-2 pr-4 pl-4 text-fg/80">
                  <p className="text-muted">
                    commit {hash}
                    {hash.split("").reverse().join("")}
                  </p>
                  <p className="text-muted">
                    Author: Vitor Theodoro &lt;github.com/vtzada&gt;
                  </p>
                  <p className="mt-2 font-sans text-sm leading-relaxed">
                    {c.detail}
                  </p>
                </div>
              )}
              {i < COMMITS.length - 1 && (
                <span
                  aria-hidden
                  className="ml-[22px] block h-2 w-px bg-neon/40"
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
