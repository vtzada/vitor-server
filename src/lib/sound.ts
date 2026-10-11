"use client";

// Sons do servidor sintetizados com Web Audio (sem arquivos de áudio).
// Desligado por padrão; a escolha fica salva no navegador.

const KEY = "vitor-server:sound";
let ctx: AudioContext | null = null;
let enabled = false;
let lastBlip = 0;
const listeners = new Set<(on: boolean) => void>();

export function loadSoundPref() {
  try {
    enabled = localStorage.getItem(KEY) === "1";
  } catch {
    enabled = false;
  }
  listeners.forEach((l) => l(enabled));
}

export function isSoundOn() {
  return enabled;
}

export function onSoundChange(listener: (on: boolean) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setSound(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    // ignora
  }
  listeners.forEach((l) => l(on));
  if (on) tone(660, 0.08, "sine", 0.05);
}

function audio() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  slideTo?: number,
) {
  if (!enabled) return;
  const a = audio();
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, a.currentTime);
  if (slideTo)
    osc.frequency.exponentialRampToValueAtTime(
      slideTo,
      a.currentTime + duration,
    );
  gain.gain.setValueAtTime(volume, a.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + duration);
  osc.connect(gain).connect(a.destination);
  osc.start();
  osc.stop(a.currentTime + duration);
}

/** Som de uma resposta HTTP: agudo para 2xx, grave e áspero para erro. */
export function playStatus(status: number) {
  const now = performance.now();
  if (now - lastBlip < 70) return;
  lastBlip = now;
  if (status === 418) tone(520, 0.25, "triangle", 0.05, 1040);
  else if (status >= 400) tone(180, 0.18, "sawtooth", 0.035, 110);
  else tone(880, 0.06, "sine", 0.04, 1320);
}

/** Tecla do terminal. */
export function playKey() {
  tone(1800 + Math.random() * 400, 0.015, "square", 0.012);
}
