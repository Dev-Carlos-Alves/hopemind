---
name: hopemind-dev
description: Subir, resetar e testar o HopeMind localmente (Supabase + NestJS + Vite), e checklist para mudar o questionário ou o algoritmo de match.
---

# HopeMind — desenvolvimento local

## Subir
1. `backend/.env` com `DATABASE_URL` e `DIRECT_URL` do Supabase (ver database/README.md).
2. `.env.example` → `.env` e `backend/.env` (ajustar `DATABASE_URL`).
3. `npm run install:all`
4. `npm run setup` (primeira vez) ou `npm run db:reset` (apaga e recria com dados demo)
5. `npm run dev` → web `http://localhost:5173`, API `http://localhost:3000/api`, Swagger `/api/docs`

Contas demo (senha `hopemind123`): `paciente@hopemind.local`, `rafael@hopemind.local` (+ camila, felipe, juliana, beatriz, thiago, roberto).

## Verificar antes de concluir
- `npm test` (regras do match)
- `cd backend && npx tsc --noEmit` e `cd frontend && npx tsc --noEmit`
- Abrir as telas afetadas em claro, escuro e largura de celular

## Mudar o questionário
1. Editar `backend/src/triage/questionnaire/patient.ts` ou `psychologist.ts`
2. Subir `version`
3. Se a pergunta entra no score, mapear em `scoreComponents` (`match-engine.ts`) e cobrir em `match-engine.spec.ts`
4. Atualizar o seed (as respostas demo passam pela mesma validação e quebram se ficarem inválidas)
5. Registrar a decisão em `docs/projeto/requisitos/algoritmo-de-match.md`

## Mudar pesos ou regras do match
1. `WEIGHTS` / `hardFilter` / `band` em `match-engine.ts`
2. Subir `ALGORITHM_VERSION`
3. Atualizar os testes e o texto "Como calculamos" em `frontend/src/pages/MatchesPage.tsx` (e a lista de fatores em `HomePage.tsx`)
