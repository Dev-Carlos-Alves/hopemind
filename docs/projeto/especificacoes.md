# Especificações técnicas — HopeMind

| Item | Definição |
|---|---|
| Front | React 18, Vite 4, TypeScript, React Router 6, axios — CSS próprio ([design-system.md](design-system.md)) |
| API | NestJS 10, class-validator, Swagger em `/api/docs` |
| Banco | MariaDB / MySQL 3306, Prisma 5 (`db push` em desenvolvimento) |
| Testes | Jest + ts-jest (`npm test`) — regras do algoritmo de match |
| Execução local | `npm run dev` (API 3000 + web 5173, proxy `/api`) |
| Variáveis | `.env.example` — `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (obrigatórias), `CORS_ORIGIN` |

## Comandos

| Comando | Faz |
|---|---|
| `npm run install:all` | Instala raiz, backend e frontend |
| `npm run setup` | Aplica o schema e roda o seed |
| `npm run db:reset` | Apaga e recria o banco de desenvolvimento com os dados demo |
| `npm run dev` | Sobe API e web |
| `npm test` | Testes do backend |
| `npm run build` | Build de produção dos dois apps |

## Validação antes de entregar

1. `npm test`
2. `npx tsc --noEmit` em `backend/` e `frontend/`
3. Conferência funcional no navegador (claro, escuro e celular)
