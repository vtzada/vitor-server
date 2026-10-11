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

## Easter eggs

Os 13 estão implementados. Spoilers:

| Bug | Como achar |
| --- | --- |
| 403 boa tentativa | SQL injection no body do `POST /contact` |
| 418 I'm a teapot | abrir `/teapot` |
| 404 pacote perdido | qualquer rota inexistente |
| Fantasma no título | clicar no fantasma do GhostWriter quando ele atravessar a tela |
| Servidor derrubado | Konami code (↑↑↓↓←→←→BA) |
| Token vazado | decodificar o JWT do `<meta name="x-debug-token">` com `jwt decode` no terminal |
| Apressadinho | pular o boot com Esc |
| 429 Too Many Requests | clicar rápido demais na navegação |
| Health check | abrir `/actuator/health` |
| Replay de eventos | `kafka replay` no terminal |
| Modo manutenção | `lights off` no terminal ou 5 cliques no LED do topo |
| Java de verdade | `coffee` no terminal |
| sudo | `sudo` no terminal |

## Peças imersivas

- `src/components/network/NetworkBackground.tsx`: rede viva em canvas 2D no fundo. Cada clique e cada requisição vira pacote.
- `src/components/terminal/Terminal.tsx`: terminal digitável do hero (histórico, Tab, comandos escondidos).
- `src/components/map/ArchitectureMap.tsx`: mapa 3D com React Three Fiber, carregado só quando a seção se aproxima.
- `src/components/ui/DecodeText.tsx`: títulos que chegam "decodificando" de hex.
