# Segurança — Distac (referência Prottus)

Documento **obrigatório** deste projeto-base. Em novos clientes, mantenha o mesmo nível (adapte o domínio, não baixe a barra).

Metodologia geral: [`docs/prottus/metodologia.md`](../prottus/metodologia.md).  
Testes: [`../../tests/README.md`](../../tests/README.md).

---

## 1. Princípios

1. **Defesa em profundidade** — API valida; banco reforça (triggers); testes comprovam.
2. **Secrets fora do git** — só `.env` local / vault em produção.
3. **Mínimo privilégio** — JWT curto; rotas autenticadas; cookies httpOnly.
4. **Dados sensíveis nunca em claro na auditoria / logs** — anonimizar ou omitir.
5. **Login sem credenciais pré-preenchidas** na UI.

---

## 2. Autenticação (JWT)

| Item | Implementação Distac |
|------|----------------------|
| Onde fica o token | Cookie **`httpOnly`** (`access_token`, `refresh_token`) — **não** `localStorage` |
| SameSite | `lax` |
| Secure | `true` quando `NODE_ENV=production` |
| Access | ~15m (`JWT_ACCESS_EXPIRES`) |
| Refresh | ~7d; renovado em `/api/auth/refresh` |
| Secrets | `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` **obrigatórios** (sem fallback fraco) |
| FE | `credentials: 'include'`; estado React só com perfil (`id`, `email`, `name`) |

### Limitações conscientes (protótipo → endurecer em prod)

| Risco | Mitigação atual | Próximo passo em prod |
|-------|-----------------|------------------------|
| Refresh roubado | Expira; usuário inactive bloqueia | Store/revogação de refresh no banco |
| CSRF | SameSite=lax + CORS restrito | Token CSRF se necessário |
| Secrets de dev | Aviso se contém `change-in-prod` | Secrets fortes + rotação |

---

## 3. Proteção da API

| Controle | Detalhe |
|----------|---------|
| Helmet | Headers (ex.: `x-content-type-options: nosniff`) |
| Rate limit global | 300 req/min (Throttler) |
| Rate limit login | 10/min → **429** |
| Rate limit refresh | 20/min |
| CORS | `CORS_ORIGIN` (ex.: `http://localhost:5173`) + credentials |
| ValidationPipe | whitelist + forbidNonWhitelisted |
| Auth guard | **Global** `JwtAuthGuard` (Zero Trust); só `@Public()` em health + login/refresh/logout |
| Health | `/api/health` sem throttle e sem JWT |

---

## 4. Banco — integridade e auditoria

Ver [`database/info/triggers.md`](../../database/info/triggers.md).

| Camada | Função |
|--------|--------|
| BEFORE | Regras (qty, preço, cliente ativo, pedido cancelado) |
| AFTER (itens) | Recalcula `orders.total` |
| AFTER (DML) | Grava `audit_log` |

### Anonimização / omissão de sensíveis

| Dado | Tratamento |
|------|------------|
| `user.password_hash` | **Omitido** do JSON em `audit_log` (`to_jsonb(...) - 'password_hash'`) |
| Tokens JWT | Só em cookie httpOnly; não persistidos em tabela neste protótipo |
| Senhas | bcrypt; nunca em log de aplicação |
| `.env` | gitignored |

**Regra para novos projetos:** ao auditar tabelas com PII/segredos (CPF, cartão, token, hash), **omitir ou mascarar** no trigger/`audit_log` e documentar a lista de campos aqui.

---

## 5. Frontend

- Sem senha/e-mail seed nos inputs de login.
- Sem JWT em `localStorage` / `sessionStorage`.
- Erros de API sem vazar stack/secrets ao usuário.

---

## 6. Checklist rápido (Gate / PR)

- [ ] Secrets só em env
- [ ] Cookies httpOnly; Secure em prod
- [ ] Rate limit no login
- [ ] Rotas de negócio autenticadas
- [ ] Auditoria sem hashes/senhas
- [ ] `node tests/load/run-node.mjs` (ou equivalente) passou no ambiente local
- [ ] Sem credenciais reais no README de produção (seed só em local)

---

## 7. Arquivos-chave no código

| Área | Caminho |
|------|---------|
| Cookies / login | `backend/src/auth/auth.controller.ts` |
| JWT strategy / guard | `jwt.strategy.ts` · `jwt-auth.guard.ts` (APP_GUARD) |
| Rotas públicas | `@Public()` em `common/public.decorator.ts` |
| Helmet / CORS | `backend/src/main.ts` |
| Throttler + JWT global | `backend/src/app.module.ts` |
| Triggers + audit | `database/sql/03-triggers.sql` |
| Cliente HTTP | `frontend/src/lib/api.ts` |
