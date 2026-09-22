---
name: distac-tech-lead-context
description: >-
  Loads Distac tech-lead domain context: stack rationale, request lifecycle,
  security/scale talking points, and code map for meetings. Use when the user
  asks how the architecture works, why a technology was chosen, onboarding
  developers, or preparing for a technical meeting.
---

# Distac — contexto tech lead

## Fonte canônica

Ler e seguir: `docs/projeto/DOMINIO-TECNICO.md`

Complementos: `docs/projeto/seguranca.md` · `docs/projeto/escalabilidade.md` · `docs/projeto/FLUXO-APLICACAO.md`

## Cola (não inventar fora disso)

- Stack: React+Vite+TS · NestJS · Prisma · PostgreSQL · JWT cookie httpOnly  
- Sem Docker neste padrão; Postgres local  
- Tokens **não** no localStorage  
- Heavy com muitos 429 = rate limit ok  
- 4 tabelas de negócio + `user` + `audit_log`  
- Base Prottus = este repo  

## Mapa rápido pergunta → arquivo

| Pergunta | Arquivo |
|----------|---------|
| Cookie setado? | `backend/src/auth/auth.controller.ts` |
| JWT lido? | `backend/src/auth/jwt.strategy.ts` |
| Helmet/CORS? | `backend/src/main.ts` |
| Throttler? | `backend/src/app.module.ts` |
| Paginação? | `backend/src/common/pagination.ts` |
| FE credentials? | `frontend/src/lib/api.ts` |
| Fluxo completo (modelo)? | `docs/projeto/FLUXO-APLICACAO.md` |
| Schema? | `backend/prisma/schema.prisma` |
| Triggers? | `database/sql/03-triggers.sql` |
| Testes 3 níveis? | `tests/load/run-node.mjs` |

## Ao onboarding

1. Domínio técnico  
2. Subir local (`distac-local-run`)  
3. Rodar `smoke` (`distac-load-tests`)  
4. Critério de aptidão no final de `DOMINIO-TECNICO.md`
