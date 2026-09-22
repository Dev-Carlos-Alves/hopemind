# Análise técnica — Distac

**Atualizado:** 2026-07-30  
**Estado:** base web Prottus rodável, com domínio em inglês e UI de negócio em português.

## Resumo

O Distac é um monólito modular: SPA React/Vite, API NestJS e PostgreSQL via Prisma. A persistência usa `users`, `clients`, `products`, `orders`, `order_items` e `audit_log`; controllers e rotas usam o prefixo `/api`.

| Área | Decisão |
|---|---|
| API | NestJS com ValidationPipe, `/api` e Swagger em `/api/docs` |
| Sessão | JWT access/refresh em cookies httpOnly |
| Borda | Helmet, CORS restrito, Throttler e `JwtAuthGuard` global (`APP_GUARD`) |
| Dados | Prisma para modelo/migrations; Postgres para integridade e auditoria |
| UI | Hub, `AppShell`, `FilterBar`, `DataTable`, `Modal` e `StatusToggle` |
| Escala inicial | Paginação, dashboard via summary e testes de carga |

## Arquitetura e módulos

```text
React SPA :5173 → /api → NestJS :3000 → Prisma → PostgreSQL
```

`Auth`, `Users`, `Clients`, `Products`, `Orders`, `Dashboard` e health são módulos explícitos. O frontend apresenta `/login`, Hub (`/`), `/clientes`, `/produtos`, `/pedidos` e `/usuarios`. O backend oferece os recursos correspondentes em inglês, como `/api/clients` e `/api/orders`.

## Segurança e integridade

- Helmet é aplicado antes das rotas; CSP é mantida em produção e flexibilizada somente no desenvolvimento para o Swagger.
- Todas as rotas são protegidas pelo guard JWT global, com exceções declaradas por `@Public()`.
- Tokens não são enviados ao JavaScript nem persistidos em localStorage.
- O banco registra DML em `audit_log`, omitindo `password_hash`.
- Triggers `fn_order_*` validam itens, bloqueiam alterações inválidas em pedidos cancelados e recalculam `orders.total`. A API não é dona desse cálculo.

## Qualidade e operação

`backend/stress/` é a suíte primária de carga: smoke, leitura, pedidos, mixed, login e heavy. `tests/load` continua documentado quando presente como suite complementar. A documentação de código fica em `docs/projeto/codigo/` e deve ser regenerada quando a lista anotada deixar de refletir os fontes.

## Trade-offs conscientes

Não há Docker, RBAC fino, cache/fila ou sessões revogáveis no servidor. Essas capacidades só devem ser adicionadas com requisito e evidência de carga; não se deve reduzir paginação, auditoria, triggers ou a postura de cookies para simplificar um clone.

Veja também [`seguranca.md`](seguranca.md), [`escalabilidade.md`](escalabilidade.md), [`fluxo-aplicacao.md`](fluxo-aplicacao.md) e [`database/info/triggers.md`](../../database/info/triggers.md).
