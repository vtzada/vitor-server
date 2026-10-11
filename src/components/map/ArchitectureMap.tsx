"use client";

import { createContext, useContext, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { services } from "@/lib/content";

// Mapa 3D de arquitetura: visitante → gateway → filtro JWT → serviços → Postgres/Kafka.
// Pacotes circulam o tempo todo; clicar num serviço manda uma requisição até ele.

type Vec = [number, number, number];

const INFRA: Record<string, Vec> = {
  client: [0, 2.9, 0],
  gateway: [0, 1.9, 0],
  jwt: [0, 0.95, 0],
  postgres: [-1.4, -1.55, 0],
  kafka: [1.4, -1.55, 0],
};

const SERVICE_POS: Record<string, Vec> = Object.fromEntries(
  services.map((s, i) => {
    const a = (i / services.length) * Math.PI * 2 + Math.PI / 4;
    return [s.id, [Math.cos(a) * 2.5, -0.1, Math.sin(a) * 2.5] as Vec];
  }),
);

const COLORS = {
  neon: "#39ff88",
  cyan: "#22d3ee",
  amber: "#fbbf24",
  violet: "#a78bfa",
  line: "#2a3a52",
};

function pathTo(serviceId: string, sink: "postgres" | "kafka"): Vec[] {
  return [
    INFRA.client,
    INFRA.gateway,
    INFRA.jwt,
    SERVICE_POS[serviceId],
    INFRA[sink],
  ];
}

function randomPath(): Vec[] {
  const svc = services[Math.floor(Math.random() * services.length)].id;
  return pathTo(svc, Math.random() < 0.5 ? "postgres" : "kafka");
}

// Pacotes de fundo, sorteados uma vez quando o módulo carrega.
const AMBIENT = Array.from({ length: 9 }, (_, i) => ({
  key: i,
  path: randomPath(),
  delay: i * 0.45,
  speed: 1.1 + Math.random() * 0.6,
}));

/** Um pacote percorrendo uma polilinha. Quando chega, chama onDone ou recomeça. */
function Packet({
  initialPath,
  color,
  speed,
  size = 0.06,
  delay = 0,
  onDone,
}: {
  initialPath: Vec[];
  color: string;
  speed: number;
  size?: number;
  delay?: number;
  onDone?: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const state = useRef({ path: initialPath, seg: 0, t: -delay });
  const a = useMemo(() => new THREE.Vector3(), []);
  const b = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const s = state.current;
    const mesh = ref.current;
    if (!mesh) return;
    s.t += dt * speed;
    if (s.t < 0) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;
    while (s.t >= 1) {
      s.t -= 1;
      s.seg += 1;
      if (s.seg >= s.path.length - 1) {
        if (onDone) {
          mesh.visible = false;
          onDone();
          s.t = -Infinity;
          return;
        }
        s.path = randomPath();
        s.seg = 0;
      }
    }
    a.set(...s.path[s.seg]);
    b.set(...s.path[s.seg + 1]);
    mesh.position.lerpVectors(a, b, s.t);
  });

  return (
    <mesh ref={ref} visible={false}>
      <sphereGeometry args={[size, 12, 12]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

// Os rótulos HTML só montam depois que o canvas existe; antes disso o primeiro <Html> se perdia.
const LabelsReady = createContext(false);

function Label({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  const ready = useContext(LabelsReady);
  if (!ready) return null;
  return (
    <Html
      center
      distanceFactor={7}
      position={[0, 0.42, 0]}
      style={{ pointerEvents: "none" }}
    >
      <div
        className={`rounded border px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap backdrop-blur ${
          active
            ? "border-neon bg-neon/15 text-neon"
            : "border-line bg-bg/70 text-muted"
        }`}
      >
        {children}
      </div>
    </Html>
  );
}

function InfraNode({
  name,
  position,
  color,
  shape,
}: {
  name: string;
  position: Vec;
  color: string;
  shape: "octa" | "torus" | "cyl" | "box" | "sphere";
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.6;
  });
  return (
    <group position={position}>
      <mesh ref={ref}>
        {shape === "octa" && <octahedronGeometry args={[0.24]} />}
        {shape === "torus" && <torusGeometry args={[0.18, 0.05, 12, 32]} />}
        {shape === "cyl" && <cylinderGeometry args={[0.2, 0.2, 0.3, 24]} />}
        {shape === "box" && <boxGeometry args={[0.32, 0.22, 0.22]} />}
        {shape === "sphere" && <sphereGeometry args={[0.14, 16, 16]} />}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.7}
          wireframe={shape !== "sphere"}
        />
      </mesh>
      <Label>{name}</Label>
    </group>
  );
}

function ServiceNode({
  id,
  name,
  active,
  onSelect,
}: {
  id: string;
  name: string;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    g.rotation.y += dt * (active ? 1.6 : 0.5);
    const target = active || hover ? 1.35 : 1;
    g.scale.lerp(new THREE.Vector3(target, target, target), 0.12);
    g.position.y = Math.sin(state.clock.elapsedTime * 1.4 + id.length) * 0.05;
  });
  const color = active ? COLORS.neon : COLORS.cyan;
  return (
    <group position={SERVICE_POS[id]}>
      <group
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "";
        }}
      >
        <mesh>
          <icosahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.6}
            wireframe
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        {/* área de clique maior que o desenho */}
        <mesh visible={false}>
          <sphereGeometry args={[0.5, 8, 8]} />
        </mesh>
      </group>
      <Label active={active}>
        {name} <span className="text-neon">● UP</span>
      </Label>
    </group>
  );
}

function Scene({
  selected,
  onSelect,
  bursts,
  onBurstDone,
}: Props & { bursts: Burst[]; onBurstDone: (key: number) => void }) {
  const edges = useMemo(() => {
    const list: [Vec, Vec][] = [
      [INFRA.client, INFRA.gateway],
      [INFRA.gateway, INFRA.jwt],
    ];
    services.forEach((s) => {
      list.push([INFRA.jwt, SERVICE_POS[s.id]]);
      list.push([SERVICE_POS[s.id], INFRA.postgres]);
      list.push([SERVICE_POS[s.id], INFRA.kafka]);
    });
    return list;
  }, []);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 4, 4]} intensity={20} color={COLORS.cyan} />

      {edges.map(([a, b], i) => {
        const hot =
          selected &&
          (a === SERVICE_POS[selected] || b === SERVICE_POS[selected]);
        return (
          <Line
            key={i}
            points={[a, b]}
            color={hot ? COLORS.neon : COLORS.line}
            lineWidth={hot ? 1.6 : 1}
            transparent
            opacity={hot ? 0.9 : 0.6}
          />
        );
      })}

      <InfraNode
        name="api-gateway"
        position={INFRA.gateway}
        color={COLORS.cyan}
        shape="octa"
      />
      <InfraNode
        name="jwt-filter"
        position={INFRA.jwt}
        color={COLORS.amber}
        shape="torus"
      />
      <InfraNode
        name="postgres"
        position={INFRA.postgres}
        color={COLORS.cyan}
        shape="cyl"
      />
      <InfraNode
        name="kafka"
        position={INFRA.kafka}
        color={COLORS.amber}
        shape="box"
      />

      <InfraNode
        name="você"
        position={INFRA.client}
        color={COLORS.violet}
        shape="sphere"
      />
      {services.map((s) => (
        <ServiceNode
          key={s.id}
          id={s.id}
          name={s.name}
          active={selected === s.id}
          onSelect={onSelect}
        />
      ))}

      {AMBIENT.map((p) => (
        <Packet
          key={p.key}
          initialPath={p.path}
          color={COLORS.cyan}
          speed={p.speed}
          delay={p.delay}
        />
      ))}
      {bursts.map((b) => (
        <Packet
          key={b.key}
          initialPath={pathTo(b.id, "kafka")}
          color={COLORS.neon}
          speed={2.6}
          size={0.09}
          onDone={() => onBurstDone(b.key)}
        />
      ))}
    </>
  );
}

export interface Burst {
  key: number;
  id: string;
}

interface Props {
  selected: string | null;
  onSelect: (id: string) => void;
}

export default function ArchitectureMap({
  selected,
  onSelect,
  bursts,
  onBurstDone,
  active,
}: Props & {
  bursts: Burst[];
  onBurstDone: (key: number) => void;
  active: boolean;
}) {
  const [labelsReady, setLabelsReady] = useState(false);
  const coarse = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches,
    [],
  );

  return (
    <Canvas
      data-map
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.5]}
      camera={{ position: [0, 1.1, 9.4], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={() => setLabelsReady(true)}
    >
      <LabelsReady.Provider value={labelsReady}>
        <group position={[0, -0.55, 0]}>
          <Scene
            selected={selected}
            onSelect={onSelect}
            bursts={bursts}
            onBurstDone={onBurstDone}
          />
        </group>
      </LabelsReady.Provider>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={!coarse}
        autoRotate
        autoRotateSpeed={0.5}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.8}
      />
    </Canvas>
  );
}
