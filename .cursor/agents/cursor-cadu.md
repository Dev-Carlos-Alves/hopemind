# Cursor — Cadu

**Repositório:** HopeMind — plataforma de match paciente ↔ psicólogo (SafeMindLive)
**Última atualização:** 2026-09-22
**Local:** `.cursor/agents/cursor-cadu.md`

---

## Estado atual (snapshot)

| Item | Valor |
|------|-------|
| Produto | HopeMind (acadêmico) |
| Stack | React+Vite+TS · NestJS · Prisma · PostgreSQL (Supabase) · JWT httpOnly |
| Match | Algoritmo `hm-match-1.0.0` conforme documento de requisitos, com testes |
| UI | Design system próprio estilo Apple, claro/escuro, PWA |
| Segurança | Rate limit, DTOs, IDOR corrigido, refresh token, CRP obrigatório |
| Docs | `docs/projeto/` reescrito para o HopeMind (antes: template Distac) |

---

## Histórico de sessões

### 2026-07-23 / 24 — Base herdada
Projeto iniciado a partir da base web Distac/Prottus (scaffold, auth, CRUDs, skills). Docs e regras do agente ainda descreviam o Distac.

### 2026-09-22 — Revisão geral (Claude)
- Segurança: IDOR em matches e agendamento, rate limit inativo, DTOs sem efeito, CRP inventado, token no corpo do login
- Rebrand visual estilo Apple com paleta do logo
- Motor de match implementado a partir do docx de requisitos
- Docs e `.cursor/` trocados do Distac para o HopeMind

---

## Pendências

- Validar perguntas e pesos com psicólogo(a); protocolo clínico dos `safety_alerts`
- Match dinâmico pós-início (seção 10 do documento)
- Homologação/produção: HTTPS, CI, revogação de refresh token, LGPD

## Como atualizar

Append no Histórico. Manter snapshot atualizado.
