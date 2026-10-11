// Catálogo dos easter eggs. O contador "bugs encontrados" lê daqui.
// `hint` aparece na lista para quem ainda não achou o bug.

export interface Bug {
  id: string;
  title: string;
  hint: string;
}

export const bugs: Bug[] = [
  {
    id: "sql-injection",
    title: "403: boa tentativa",
    hint: "O formulário de contato confia demais no input?",
  },
  {
    id: "teapot",
    title: "418 I'm a teapot",
    hint: "Nem todo servidor serve café.",
  },
  {
    id: "lost-packet",
    title: "404: pacote perdido",
    hint: "Peça uma rota que não existe.",
  },
  {
    id: "ghost",
    title: "Fantasma no título",
    hint: "Alguém está reescrevendo as coisas por aqui.",
  },
  { id: "konami", title: "Servidor derrubado", hint: "↑ ↑ ↓ ↓ ..." },
  {
    id: "jwt-secret",
    title: "Token vazado",
    hint: "Leia o código-fonte com atenção.",
  },
  {
    id: "boot-skip",
    title: "Apressadinho",
    hint: "Nem todo mundo espera o boot terminar.",
  },
  {
    id: "spam-click",
    title: "429 Too Many Requests",
    hint: "Rate limiting existe por um motivo.",
  },
  {
    id: "health",
    title: "Health check",
    hint: "Todo serviço tem um /actuator.",
  },
  {
    id: "kafka-replay",
    title: "Replay de eventos",
    hint: "Kafka nunca esquece.",
  },
  {
    id: "dark-room",
    title: "Modo manutenção",
    hint: "O que acontece se as luzes se apagarem?",
  },
  {
    id: "coffee",
    title: "Java de verdade",
    hint: "Todo dev Java precisa de uma coisa.",
  },
  { id: "root", title: "sudo", hint: "Quem é o admin aqui?" },
];

export const TOTAL_BUGS = bugs.length;
