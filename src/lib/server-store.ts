"use client";

import { useSyncExternalStore } from "react";
import { TOTAL_BUGS, bugs } from "./bugs";

// Estado global do "servidor": requisições em voo, access log e bugs encontrados.
// Store mínimo com useSyncExternalStore, sem dependência extra.

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface HttpRequest {
  id: number;
  method: HttpMethod;
  path: string;
  status: number;
  startedAt: number;
  durationMs?: number;
}

export interface Toast {
  id: number;
  title: string;
  body: string;
}

interface ServerState {
  queue: HttpRequest[];
  log: HttpRequest[];
  found: string[];
  toasts: Toast[];
  booted: boolean;
  /** Texto que o fantasma do GhostWriter está reescrevendo agora. */
  ghost: { target: string; text: string } | null;
  /** Modo manutenção: luzes apagadas, só a lanterna do cursor. */
  dark: boolean;
}

/** Evento para o fundo de rede desenhar um pacote quando uma requisição sai. */
export interface PacketEvent {
  status: number;
  x?: number;
  y?: number;
}

const STORAGE_KEY = "vitor-server:bugs";
const LOG_LIMIT = 40;
const RATE_WINDOW_MS = 3000;
const RATE_LIMIT = 10;

const initialServerState: ServerState = {
  queue: [],
  log: [],
  found: [],
  toasts: [],
  booted: false,
  ghost: null,
  dark: false,
};
let state = initialServerState;
const listeners = new Set<() => void>();
const packetListeners = new Set<(e: PacketEvent) => void>();
const pending = new Map<number, (req: HttpRequest) => void>();
let nextId = 1;
let recent: number[] = [];

function emit(next: Partial<ServerState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useServer<T>(selector: (s: ServerState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(initialServerState),
  );
}

export function onPacket(listener: (e: PacketEvent) => void) {
  packetListeners.add(listener);
  return () => {
    packetListeners.delete(listener);
  };
}

export function emitPacket(e: PacketEvent) {
  packetListeners.forEach((l) => l(e));
}

export function setGhost(ghost: ServerState["ghost"]) {
  emit({ ghost });
}

export function setDark(dark: boolean) {
  emit({ dark });
  if (dark) findBug("dark-room");
}

/** Kafka nunca esquece: reenvia as últimas requisições do access log. */
export function replayLog(limit = 8) {
  const events = state.log.slice(0, limit).reverse();
  events.forEach((req, i) =>
    setTimeout(() => sendRequest(req.method, req.path, req.status), i * 180),
  );
  findBug("kafka-replay");
  return events.length;
}

export function hydrateBugs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const ids = JSON.parse(raw) as string[];
    emit({ found: ids.filter((id) => bugs.some((b) => b.id === id)) });
  } catch {
    // localStorage indisponível: o contador só não persiste.
  }
}

export function markBooted() {
  emit({ booted: true });
}

export function findBug(id: string) {
  const bug = bugs.find((b) => b.id === id);
  if (!bug || state.found.includes(id)) return;
  const found = [...state.found, id];
  emit({ found });
  toast(`BUG ${found.length}/${TOTAL_BUGS} encontrado`, bug.title);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
  } catch {
    // ignora
  }
}

export function resetBugs() {
  emit({ found: [] });
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignora
  }
}

export function toast(title: string, body: string) {
  const t = { id: nextId++, title, body };
  emit({ toasts: [...state.toasts, t] });
  setTimeout(
    () => emit({ toasts: state.toasts.filter((x) => x.id !== t.id) }),
    4200,
  );
}

/**
 * Dispara uma requisição visível: entra na fila, o RequestPipeline anima o pacote
 * passando pelas camadas e a promise resolve quando a resposta "volta".
 */
export function sendRequest(
  method: HttpMethod,
  path: string,
  status = 200,
): Promise<HttpRequest> {
  const now = Date.now();
  recent = [...recent.filter((t) => now - t < RATE_WINDOW_MS), now];
  const limited = recent.length > RATE_LIMIT;
  if (limited) findBug("spam-click");

  const req: HttpRequest = {
    id: nextId++,
    method,
    path,
    status: limited ? 429 : status,
    startedAt: now,
  };
  emit({ queue: [...state.queue, req] });
  emitPacket({ status: req.status });
  return new Promise((resolve) => pending.set(req.id, resolve));
}

/** Chamado pelo RequestPipeline quando a animação da requisição termina. */
export function completeRequest(id: number) {
  const req = state.queue.find((r) => r.id === id);
  if (!req) return;
  const done = { ...req, durationMs: Date.now() - req.startedAt };
  emit({
    queue: state.queue.filter((r) => r.id !== id),
    log: [done, ...state.log].slice(0, LOG_LIMIT),
  });
  pending.get(id)?.(done);
  pending.delete(id);
}
