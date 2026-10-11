# vitor-server

Portfólio do Vitor Theodoro. O site é um servidor rodando: cada clique vira uma requisição HTTP que atravessa gateway, filtro JWT, serviço, banco e Kafka na tela.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- GSAP para animações
- React Three Fiber instalado para o mapa 3D de arquitetura (próxima etapa)
- Deploy pensado para a Vercel

## Rodando

```bash
npm install
npm run dev
```

## Onde fica cada coisa

| Caminho | O quê |
| --- | --- |
| `src/lib/content.ts` | Perfil e projetos (microsserviços). Editar textos aqui. |
| `src/lib/bugs.ts` | Catálogo dos 13 easter eggs. |
| `src/lib/server-store.ts` | Estado global: fila de requisições, access log, bugs encontrados. `sendRequest()` e `findBug()`. |
| `src/components/boot/` | Intro de boot estilo Spring Boot (Esc pula, uma vez por sessão). |
| `src/components/request/` | Painel com o pacote viajando pelas camadas. |
| `src/components/hud/` | Barra superior, contador de bugs e toasts. |
| `src/components/sections/` | Hero, mapa de serviços, `GET /api/vitor` e `POST /contact`. |
| `src/app/api/vitor/route.ts` | Endpoint real consumido pela seção "Sobre". |

## Easter eggs prontos

7 de 13: SQL injection no contato (403), `/teapot` (418), qualquer rota inexistente (404), Konami code (crash + stack trace), pular o boot, spam de cliques (429) e `/actuator/health`.

Faltam: fantasma do GhostWriter, JWT escondido no código-fonte, replay de eventos Kafka, modo manutenção, café e sudo.
