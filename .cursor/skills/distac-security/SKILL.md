---
name: distac-security
description: >-
  Applies Distac/Prottus security standards (JWT httpOnly cookies, Helmet,
  throttler, ValidationPipe, audit anonymization, no localStorage tokens).
  Use when changing auth, cookies, CORS, rate limits, login UI, audit_log,
  secrets, or reviewing security.
---

# Distac — segurança (não negociar)

## Obrigatório neste projeto

| Controle | Fato |
|----------|------|
| Tokens | Cookies `access_token` / `refresh_token`, **httpOnly**, `SameSite=lax`, `Secure` em prod |
| FE | `credentials: 'include'`; perfil só no Context — **nunca** localStorage |
| Secrets | `JWT_*` obrigatórios; sem fallback fraco; `.env` gitignored |
| Helmet | `main.ts` |
| Rate limit | Global 300/min; login 10/min; refresh 20/min; health skip |
| DTO | ValidationPipe whitelist + forbidNonWhitelisted |
| CRUD | `JwtAuthGuard` **global**; só `@Public()` em health/login/refresh/logout |
| Senha | bcrypt cost 10; login UI **sem** pré-preencher |
| Audit | `password_hash` omitido no JSON |

## Ao alterar auth

1. Ler `backend/src/auth/auth.controller.ts` + `jwt.strategy.ts` + `jwt-auth.guard.ts` + `frontend/src/lib/api.ts`
2. Manter refresh via cookie; FE já retenta em 401
3. Não devolver access/refresh no body JSON
4. Novo endpoint público **só** com `@Public()` + justificativa em `seguranca.md` / `ARQUITETURA-WEB.md`
5. Atualizar `docs/projeto/seguranca.md` se mudar contrato

## Checklist PR

- [ ] Sem secret no git
- [ ] Sem token no localStorage
- [ ] Rotas de negócio autenticadas (guard global)
- [ ] Login ainda rate-limited
- [ ] `node tests/load/run-node.mjs smoke` passou

## Doc

`docs/projeto/seguranca.md` · `docs/projeto/ARQUITETURA-WEB.md` · `docs/projeto/DOMINIO-TECNICO.md` §6
