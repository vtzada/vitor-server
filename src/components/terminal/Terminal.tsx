"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { profile, services } from "@/lib/content";
import { decodeJwt } from "@/lib/jwt";
import { playKey } from "@/lib/sound";
import {
  emitPacket,
  findBug,
  replayLog,
  sendRequest,
  setDark,
  useServer,
} from "@/lib/server-store";
import { JsonView } from "../ui/JsonView";

interface Entry {
  id: number;
  input?: string;
  output?: ReactNode;
}

const PROMPT = "visitante@vitor-server:~$";

const COMMANDS = [
  "help",
  "whoami",
  "neofetch",
  "ls",
  "cat sobre.txt",
  "curl /api/vitor",
  "open aceleraflix",
  "goto services",
  "jwt decode",
  "kafka replay",
  "lights off",
  "history",
  "clear",
];

const CHIPS = ["help", "neofetch", "curl /api/vitor", "ls -a"];

const NEOFETCH = String.raw`   ___    vitor@server
  |_  |   ---------------
    | |   OS: SpringBoot Linux x86_64
    | |   Host: Unisinos ADS
/\__/ /   Kernel: Java 21
\____/    Shell: zsh + muito café
          Stack: Spring, JPA, Kafka, Docker
          Uptime: desde o primeiro "Hello World"`;

const COFFEE = String.raw`     ( (
      ) )
   ........
   |      |]
   \      /
    '----'`;

function Line({
  children,
  tone = "fg",
}: {
  children: ReactNode;
  tone?: "fg" | "muted" | "neon" | "error" | "amber" | "cyan";
}) {
  const cls = {
    fg: "text-fg",
    muted: "text-muted",
    neon: "text-neon",
    error: "text-error",
    amber: "text-amber",
    cyan: "text-cyan",
  }[tone];
  return (
    <div className={`whitespace-pre-wrap [overflow-wrap:anywhere] ${cls}`}>
      {children}
    </div>
  );
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

/** Terminal digitável do hero. Vários easter eggs moram aqui. */
export function Terminal() {
  const booted = useServer((s) => s.booted);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const nextId = useRef(1);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const introDone = useRef(false);

  function push(entry: Omit<Entry, "id">) {
    setEntries((prev) =>
      [...prev, { ...entry, id: nextId.current++ }].slice(-60),
    );
  }

  async function run(raw: string) {
    const cmd = raw.trim();
    if (!cmd) {
      push({ input: "" });
      return;
    }
    setHistory((h) => [...h, cmd]);
    setCursor(-1);
    const [name, ...args] = cmd.split(/\s+/);
    const arg = args.join(" ");
    let status = 200;
    let out: ReactNode = null;

    switch (name.toLowerCase()) {
      case "help":
        out = (
          <>
            <Line tone="muted">comandos disponíveis:</Line>
            <Line>
              {[
                ["whoami", "quem é você (e quem sou eu)"],
                ["neofetch", "info do sistema"],
                ["ls [-a]", "lista arquivos"],
                ["cat <arquivo>", "lê um arquivo"],
                ["curl <rota>", "faz uma requisição de verdade"],
                ["open <serviço>", "abre um projeto"],
                ["goto <seção>", "services, about, contact"],
                ["jwt decode <token>", "decodifica um JWT"],
                ["clear / history", "o de sempre"],
              ]
                .map(([c, d]) => `  ${c.padEnd(20)} ${d}`)
                .join("\n")}
            </Line>
            <Line tone="muted">
              tem mais comandos escondidos. backend que se preza não documenta
              tudo.
            </Line>
          </>
        );
        break;
      case "whoami":
        out = (
          <Line>
            visitante (uid=1000). O dono daqui é o{" "}
            <span className="text-neon">{profile.name}</span>,{" "}
            {profile.role.toLowerCase()} com Java e Spring.
          </Line>
        );
        break;
      case "neofetch":
        out = <Line tone="neon">{NEOFETCH}</Line>;
        break;
      case "ls":
        out =
          args.includes("-a") || args.includes("-la") ? (
            <Line>
              <span className="text-muted">. .. </span>
              <span className="text-amber">.env</span>
              {"  "}sobre.txt{"  "}contato.http{"  "}
              <span className="text-cyan">services/</span>
              {"  "}
              <span className="text-error">segredos/</span>
            </Line>
          ) : arg.startsWith("services") ? (
            <Line tone="cyan">{services.map((s) => s.id).join("  ")}</Line>
          ) : (
            <Line>
              sobre.txt{"  "}contato.http{"  "}
              <span className="text-cyan">services/</span>
            </Line>
          );
        break;
      case "cat":
        if (arg === ".env") {
          out = (
            <>
              <Line tone="amber">JWT_SECRET=************</Line>
              <Line tone="muted">
                # o segredo tá protegido. já o token que alguém esqueceu no{" "}
                {"<head>"}...
              </Line>
            </>
          );
        } else if (arg === "sobre.txt") {
          out = <Line>{profile.summary}</Line>;
        } else if (arg === "contato.http") {
          out = (
            <Line>
              POST /contact HTTP/1.1{"\n"}Content-Type: application/json{"\n\n"}
              <span className="text-muted">
                # role até o fim da página ou digite: goto contact
              </span>
            </Line>
          );
        } else if (arg.startsWith("segredos")) {
          status = 403;
          out = <Line tone="error">cat: {arg}: Permission denied</Line>;
        } else {
          status = 404;
          out = (
            <Line tone="error">cat: {arg || "?"}: arquivo não encontrado</Line>
          );
        }
        break;
      case "cd":
        if (arg.startsWith("segredos")) {
          status = 403;
          out = (
            <Line tone="error">
              cd: segredos: Permission denied (talvez com sudo?)
            </Line>
          );
        } else {
          out = (
            <Line tone="muted">aqui tudo é rota. tenta: goto services</Line>
          );
        }
        break;
      case "goto": {
        const map: Record<string, string> = {
          services: "services",
          servicos: "services",
          about: "about",
          sobre: "about",
          contact: "contact",
          contato: "contact",
          home: "home",
        };
        const id = map[arg.toLowerCase()];
        if (id) {
          scrollToSection(id);
          out = <Line tone="muted">roteando para /{id}...</Line>;
        } else {
          status = 404;
          out = (
            <Line tone="error">
              goto: rota desconhecida. opções: services, about, contact
            </Line>
          );
        }
        break;
      }
      case "open": {
        const svc = services.find(
          (s) => s.id === arg.toLowerCase() || s.name === arg.toLowerCase(),
        );
        if (svc) {
          window.open(svc.liveUrl ?? svc.repoUrl, "_blank", "noopener");
          out = <Line tone="neon">abrindo {svc.name}...</Line>;
        } else {
          status = 404;
          out = (
            <Line tone="error">
              open: serviço não encontrado. tente:{" "}
              {services.map((s) => s.id).join(", ")}
            </Line>
          );
        }
        break;
      }
      case "curl": {
        const path = args.find((a) => a.startsWith("/")) ?? "/";
        if (path === "/api/vitor") {
          const [res] = await Promise.all([
            fetch("/api/vitor"),
            sendRequest("GET", path),
          ]);
          const json = await res.json();
          out = (
            <>
              <Line tone="neon">HTTP/1.1 {res.status} OK</Line>
              <JsonView
                value={{
                  name: json.name,
                  role: json.role,
                  education: json.education,
                  stack: json.stack.frameworks,
                  coffee: json.coffee,
                }}
              />
            </>
          );
        } else if (path === "/teapot") {
          status = 418;
          sendRequest("GET", path, 418);
          out = (
            <Line tone="cyan">
              HTTP/1.1 418 I&apos;m a teapot (abre essa rota no navegador)
            </Line>
          );
        } else if (path === "/actuator/health") {
          sendRequest("GET", path);
          out = (
            <Line tone="neon">{`{"status":"UP"}  (tem mais detalhe em ${path} no navegador)`}</Line>
          );
        } else {
          status = 404;
          sendRequest("GET", path, 404);
          out = <Line tone="amber">HTTP/1.1 404 Not Found</Line>;
        }
        break;
      }
      case "jwt": {
        const token = args.filter((a) => a !== "decode").join("");
        const decoded = token ? decodeJwt(token) : null;
        if (!decoded) {
          status = 400;
          out = (
            <Line tone="error">
              uso: jwt decode &lt;token&gt; (tem um perdido nesta página...)
            </Line>
          );
        } else {
          out = (
            <>
              <Line tone="muted">header</Line>
              <JsonView value={decoded.header} />
              <Line tone="muted">payload</Line>
              <JsonView value={decoded.payload} />
            </>
          );
          if (decoded.payload.bug === "jwt-secret") findBug("jwt-secret");
        }
        break;
      }
      case "kafka":
      case "kafka-console-consumer": {
        if (arg.includes("replay") || arg.includes("--from-beginning")) {
          const n = replayLog();
          out = (
            <Line tone="neon">
              reprocessando {n} eventos do tópico visitor-events... Kafka nunca
              esquece.
            </Line>
          );
        } else {
          out = <Line tone="muted">uso: kafka replay</Line>;
        }
        break;
      }
      case "lights":
        if (arg === "off") {
          setDark(true);
          out = (
            <Line tone="amber">
              luzes apagadas. modo manutenção ativado. (lights on para voltar)
            </Line>
          );
        } else {
          setDark(false);
          out = <Line tone="neon">luzes acesas.</Line>;
        }
        break;
      case "shutdown":
        setDark(true);
        out = (
          <Line tone="amber">
            shutdown agendado... brincadeira, só apaguei as luzes.
          </Line>
        );
        break;
      case "sudo":
      case "su":
        status = 403;
        findBug("root");
        out = (
          <>
            <Line tone="error">
              visitante is not in the sudoers file. This incident will be
              reported.
            </Line>
            <Line tone="muted">
              o único admin aqui é o Vitor. e ele já foi notificado (mentira).
            </Line>
          </>
        );
        break;
      case "coffee":
      case "brew":
        findBug("coffee");
        out = (
          <>
            <Line tone="amber">{COFFEE}</Line>
            <Line>Java carregado. Produtividade do Vitor +200%.</Line>
          </>
        );
        break;
      case "java":
        if (arg.includes("cafe") || arg.includes("coffee")) {
          findBug("coffee");
          out = <Line tone="amber">{COFFEE}</Line>;
        } else {
          out = (
            <Line>
              openjdk version &quot;21&quot; 2023-09-19 LTS{"\n"}
              <span className="text-muted">
                dica: todo dev Java precisa de um coffee.
              </span>
            </Line>
          );
        }
        break;
      case "rm":
        status = 403;
        out = (
          <Line tone="error">
            rm: permission denied. isso não é um bug, é uma feature.
          </Line>
        );
        break;
      case "exit":
      case "logout":
        out = (
          <Line tone="muted">
            não tem saída. você está dentro do servidor agora.
          </Line>
        );
        break;
      case "date":
        out = <Line>{new Date().toString()}</Line>;
        break;
      case "echo":
        out = <Line>{arg}</Line>;
        break;
      case "history":
        out = (
          <Line tone="muted">
            {[...history, cmd]
              .map((h, i) => `${String(i + 1).padStart(4)}  ${h}`)
              .join("\n")}
          </Line>
        );
        break;
      case "clear":
        setEntries([]);
        emitPacket({ status: 200 });
        return;
      default:
        status = 404;
        out = (
          <Line tone="error">
            {name}: comando não encontrado. digite{" "}
            <span className="text-fg">help</span>
          </Line>
        );
    }

    emitPacket({ status });
    push({ input: cmd, output: out });
  }

  // Depois do boot, o terminal "digita" um comando sozinho para mostrar que está vivo.
  useEffect(() => {
    if (!booted || introDone.current) return;
    introDone.current = true;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const text = "whoami";
    if (reduced) {
      const t = setTimeout(() => run(text), 0);
      return () => clearTimeout(t);
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setValue(text.slice(0, i));
      if (i === text.length) {
        clearInterval(id);
        setTimeout(() => {
          setValue("");
          run(text);
        }, 350);
      }
    }, 90);
    return () => clearInterval(id);
    // run depende só de estado lido no momento; o efeito roda uma vez após o boot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booted]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      run(value);
      setValue("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const next = cursor === -1 ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(next);
      setValue(history[next]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (cursor === -1) return;
      const next = cursor + 1;
      if (next >= history.length) {
        setCursor(-1);
        setValue("");
      } else {
        setCursor(next);
        setValue(history[next]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const match = COMMANDS.find((c) => c.startsWith(value) && c !== value);
      if (match) setValue(match);
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setEntries([]);
    }
  }

  return (
    <div
      className="flex h-[380px] flex-col overflow-hidden rounded-lg border border-line bg-panel/90 font-mono text-xs shadow-[0_0_60px_-20px_rgba(57,255,136,0.35)] backdrop-blur sm:h-[420px] sm:text-[13px]"
      onClick={() => inputRef.current?.focus({ preventScroll: true })}
    >
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
        <span className="size-2.5 rounded-full bg-error/70" />
        <span className="size-2.5 rounded-full bg-amber/70" />
        <span className="size-2.5 rounded-full bg-neon/70" />
        <span className="ml-2 text-muted">ssh visitante@vitor-server</span>
      </div>
      <div
        ref={bodyRef}
        className="flex-1 space-y-2 overflow-y-auto p-4 leading-relaxed"
      >
        <Line tone="muted">
          Bem-vindo ao vitor-server. Este terminal é de verdade.{"\n"}Digite{" "}
          <span className="text-neon">help</span> para começar.
        </Line>
        {entries.map((e) => (
          <div key={e.id}>
            {e.input !== undefined && (
              <div className="break-all">
                <span className="text-neon">{PROMPT}</span> {e.input}
              </div>
            )}
            {e.output}
          </div>
        ))}
        <label className="flex items-center gap-2">
          <span className="shrink-0 text-neon">{PROMPT}</span>
          <span className="sr-only">Comando</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              playKey();
            }}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            enterKeyHint="send"
            className="min-w-0 flex-1 bg-transparent text-fg caret-neon outline-none"
          />
        </label>
      </div>
      <div className="flex gap-2 overflow-x-auto border-t border-line px-3 py-2">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              run(c);
            }}
            className="shrink-0 rounded border border-line px-2 py-0.5 text-muted transition hover:border-neon hover:text-neon"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
