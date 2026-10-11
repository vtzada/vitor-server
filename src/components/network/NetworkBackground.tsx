"use client";

import { useEffect, useRef } from "react";
import { onPacket } from "@/lib/server-store";

// Fundo vivo: uma malha de nós com tráfego constante. O cursor é um cliente
// conectado à rede, e cada clique dispara pacotes a partir dele.

interface Node {
  x: number;
  y: number;
  r: number;
  hub?: string;
  links: number[];
  heat: number;
}

interface Packet {
  path: number[];
  hop: number;
  t: number;
  speed: number;
  color: string;
  size: number;
  /** Origem livre (cursor) antes do primeiro nó. */
  from?: { x: number; y: number };
}

const HUBS = [
  { name: "gateway", fx: 0.5, fy: 0.16 },
  { name: "auth", fx: 0.2, fy: 0.34 },
  { name: "kafka", fx: 0.82, fy: 0.42 },
  { name: "postgres", fx: 0.14, fy: 0.8 },
  { name: "services", fx: 0.62, fy: 0.78 },
];

const COLORS = {
  ok: "57,255,136",
  info: "34,211,238",
  warn: "251,191,36",
  err: "255,62,108",
  violet: "167,139,250",
};

function colorFor(status: number) {
  if (status === 418) return COLORS.violet;
  if (status === 404 || status === 429) return COLORS.warn;
  if (status >= 400) return COLORS.err;
  return COLORS.ok;
}

export function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    let nodes: Node[] = [];
    let packets: Packet[] = [];
    const mouse = { x: -9999, y: -9999, active: false };
    let raf = 0;
    let last = performance.now();
    let spawnAcc = 0;

    function build() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(Math.min(70, Math.max(22, (w * h) / 26000)));
      nodes = HUBS.map((hub) => ({
        x: hub.fx * w,
        y: hub.fy * h,
        r: 3.2,
        hub: hub.name,
        links: [],
        heat: 0,
      }));
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 1.2 + Math.random() * 1.2,
          links: [],
          heat: 0,
        });
      }
      // Cada nó liga aos 3 vizinhos mais próximos (grafo não direcionado).
      nodes.forEach((n, i) => {
        const near = nodes
          .map((m, j) => ({ j, d: (m.x - n.x) ** 2 + (m.y - n.y) ** 2 }))
          .filter((o) => o.j !== i)
          .sort((a, b) => a.d - b.d)
          .slice(0, 3);
        near.forEach(({ j }) => {
          if (!n.links.includes(j)) n.links.push(j);
          if (!nodes[j].links.includes(i)) nodes[j].links.push(i);
        });
      });
      packets = [];
    }

    // Caminho mais curto (BFS) entre dois nós.
    function route(from: number, to: number): number[] {
      const prev = new Map<number, number>([[from, -1]]);
      const q = [from];
      while (q.length) {
        const cur = q.shift()!;
        if (cur === to) break;
        for (const nx of nodes[cur].links) {
          if (!prev.has(nx)) {
            prev.set(nx, cur);
            q.push(nx);
          }
        }
      }
      if (!prev.has(to)) return [from];
      const path: number[] = [];
      for (let c = to; c !== -1; c = prev.get(c)!) path.unshift(c);
      return path;
    }

    function nearest(x: number, y: number) {
      let best = 0;
      let bd = Infinity;
      nodes.forEach((n, i) => {
        const d = (n.x - x) ** 2 + (n.y - y) ** 2;
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      return best;
    }

    function randomNode() {
      return Math.floor(Math.random() * nodes.length);
    }

    function spawn(
      path: number[],
      color: string,
      speed: number,
      size: number,
      from?: Packet["from"],
    ) {
      if (path.length < 2 && !from) return;
      packets.push({
        path,
        hop: from ? -1 : 0,
        t: 0,
        speed,
        color,
        size,
        from,
      });
      if (packets.length > 160) packets.shift();
    }

    function ambient() {
      const a = randomNode();
      const b =
        Math.random() < 0.4
          ? Math.floor(Math.random() * HUBS.length)
          : randomNode();
      spawn(
        route(a, b),
        Math.random() < 0.7 ? COLORS.info : COLORS.ok,
        0.9 + Math.random() * 0.8,
        1.6,
      );
    }

    // Requisição do site: sai de um nó qualquer, passa pelo gateway e chega nos serviços.
    function request(status: number, x?: number, y?: number) {
      const start =
        x !== undefined && y !== undefined ? nearest(x, y) : randomNode();
      const gateway = 0;
      const target = status >= 400 && status !== 404 ? 1 : 4; // erros morrem no auth
      const path = [
        ...route(start, gateway),
        ...route(gateway, target).slice(1),
      ];
      const from = x !== undefined && y !== undefined ? { x, y } : undefined;
      spawn(path, colorFor(status), 2.2, 2.6, from);
    }

    function point(p: Packet) {
      const a = p.hop === -1 ? p.from! : nodes[p.path[p.hop]];
      const b = nodes[p.path[p.hop + 1] ?? p.path[0]];
      return { x: a.x + (b.x - a.x) * p.t, y: a.y + (b.y - a.y) * p.t, a, b };
    }

    function draw(dt: number) {
      ctx!.clearRect(0, 0, w, h);

      // Arestas
      ctx!.lineWidth = 1;
      nodes.forEach((n, i) => {
        n.links.forEach((j) => {
          if (j < i) return;
          const m = nodes[j];
          const heat = Math.max(n.heat, m.heat);
          ctx!.strokeStyle = `rgba(${COLORS.info},${0.05 + heat * 0.25})`;
          ctx!.beginPath();
          ctx!.moveTo(n.x, n.y);
          ctx!.lineTo(m.x, m.y);
          ctx!.stroke();
        });
      });

      // Cursor como cliente: conecta aos nós próximos.
      if (mouse.active) {
        nodes.forEach((n) => {
          const d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
          if (d < 170) {
            ctx!.strokeStyle = `rgba(${COLORS.ok},${(1 - d / 170) * 0.35})`;
            ctx!.beginPath();
            ctx!.moveTo(mouse.x, mouse.y);
            ctx!.lineTo(n.x, n.y);
            ctx!.stroke();
            n.heat = Math.max(n.heat, (1 - d / 170) * 0.6);
          }
        });
      }

      // Pacotes
      packets = packets.filter((p) => {
        const seg = point(p);
        const len = Math.max(
          30,
          Math.hypot(seg.b.x - seg.a.x, seg.b.y - seg.a.y),
        );
        p.t += (dt * p.speed * 260) / len;
        if (p.t >= 1) {
          p.hop += 1;
          p.t = 0;
          const arrived = nodes[p.path[p.hop]];
          if (arrived) arrived.heat = 1;
          if (p.hop >= p.path.length - 1) return false;
        }
        const { x, y } = point(p);
        ctx!.fillStyle = `rgba(${p.color},0.95)`;
        ctx!.shadowColor = `rgba(${p.color},0.9)`;
        ctx!.shadowBlur = 10;
        ctx!.beginPath();
        ctx!.arc(x, y, p.size, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.shadowBlur = 0;
        return true;
      });

      // Nós
      nodes.forEach((n) => {
        n.heat = Math.max(0, n.heat - dt * 0.9);
        const glow = n.hub ? 0.55 + n.heat * 0.45 : 0.18 + n.heat * 0.7;
        ctx!.fillStyle = `rgba(${n.hub ? COLORS.ok : COLORS.info},${glow})`;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r + n.heat * 1.5, 0, Math.PI * 2);
        ctx!.fill();
        if (n.hub) {
          ctx!.font = "10px ui-monospace, monospace";
          ctx!.fillStyle = `rgba(125,138,160,${0.45 + n.heat * 0.5})`;
          ctx!.fillText(n.hub, n.x + 8, n.y + 3);
        }
      });
    }

    function loop(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      spawnAcc += dt;
      if (spawnAcc > 0.35) {
        spawnAcc = 0;
        ambient();
      }
      draw(dt);
      raf = requestAnimationFrame(loop);
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
    };
    const onDown = (e: PointerEvent) => {
      // Cada clique é um cliente mandando pacotes para dentro da rede.
      for (let i = 0; i < 3; i++)
        setTimeout(() => request(200, e.clientX, e.clientY), i * 90);
    };
    // No celular a barra de endereço muda a altura ao rolar: só reconstrói em mudança real.
    const onResize = () => {
      if (window.innerWidth !== w || Math.abs(window.innerHeight - h) > 150)
        build();
    };
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    build();
    const off = onPacket((e) => request(e.status, e.x, e.y));
    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    if (reduced) draw(0);
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      off();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
