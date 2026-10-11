// Conteúdo do portfólio. Tudo que é texto "sobre o Vitor" mora aqui.

export const profile = {
  name: "Vitor Theodoro",
  handle: "vtzada",
  role: "Backend Software Engineer",
  location: "Rio Grande do Sul, BR",
  education: {
    course: "Análise e Desenvolvimento de Sistemas",
    institution: "Unisinos",
  },
  summary:
    "Construo serviços backend e APIs REST com Java e Spring Boot, do design à implementação, com foco em sistemas confiáveis e fáceis de evoluir.",
  stack: {
    languages: ["Java", "TypeScript", "Python"],
    frameworks: ["Spring Boot", "Spring Security", "Spring Data JPA", "React"],
    data: ["PostgreSQL", "MySQL", "Flyway", "JPA/Hibernate"],
    messaging: ["Apache Kafka", "RabbitMQ"],
    testing: ["JUnit", "Mockito", "Testcontainers"],
    infra: ["Docker", "Maven", "Gradle"],
  },
  practices: ["Clean Architecture", "SOLID", "Clean Code", "JWT + RBAC"],
  currentlyExploring: [
    "Arquitetura orientada a eventos",
    "Sistemas distribuídos",
    "IA com Java",
  ],
  links: {
    github: "https://github.com/vtzada",
    linkedin: "https://www.linkedin.com/in/vitortheodoro/",
  },
} as const;

export type ServiceStatus = "UP" | "DEGRADED" | "DOWN";

export interface Service {
  id: string;
  name: string;
  port: number;
  status: ServiceStatus;
  description: string;
  stack: string[];
  endpoints: string[];
  liveUrl?: string;
  repoUrl?: string;
}

// Projetos como microsserviços no mapa de arquitetura.
export const services: Service[] = [
  {
    id: "aceleraflix",
    name: "aceleraflix-service",
    port: 8081,
    status: "UP",
    description:
      "Streaming de vídeos educacionais de tecnologia curados do YouTube, organizados por categoria e tag, sem feed aleatório.",
    stack: ["Java 21", "Spring Boot", "PostgreSQL", "JWT + refresh", "Flyway"],
    endpoints: [
      "GET /videos",
      "POST /auth/login",
      "POST /editors/requests",
      "PATCH /admin/editors/{id}",
    ],
    liveUrl: "https://aceleraflix.vercel.app/",
    repoUrl: "https://github.com/vtzada/AceleraFlix",
  },
  {
    id: "ghostwriter",
    name: "ghostwriter-service",
    port: 8082,
    status: "UP",
    // TODO: revisar a descrição com o Vitor.
    description:
      "Projeto no ar com backend próprio. Descrição detalhada a definir.",
    stack: ["Java", "Spring Boot", "React"],
    endpoints: ["POST /drafts", "GET /drafts/{id}"],
    liveUrl: "https://useghostwriter.vercel.app/",
  },
  {
    id: "checkin",
    name: "checkin-service",
    port: 8083,
    status: "UP",
    description:
      "Gestão de eventos com convite e venda direta via Mercado Pago, convergindo num check-in por QR Code na portaria.",
    stack: ["Java", "Spring Boot", "JWT + RBAC", "Mercado Pago", "QR Code"],
    endpoints: [
      "POST /events",
      "POST /orders",
      "POST /webhooks/mercadopago",
      "POST /checkin/{qr}",
    ],
    repoUrl: "https://github.com/vtzada/sistema-de-checkin",
  },
  {
    id: "payme",
    name: "payme-service",
    port: 8084,
    status: "UP",
    description:
      "Controle financeiro pessoal: contas, categorias, receitas, despesas e transferências com saldo sempre atualizado.",
    stack: ["Java 21", "Spring Boot 3", "PostgreSQL 16", "JWT", "Docker"],
    endpoints: [
      "GET /accounts",
      "POST /transactions",
      "POST /transfers",
      "GET /categories",
    ],
    repoUrl: "https://github.com/vtzada/payme",
  },
];
